'use strict';
// La prueba real del profesor: monta un curso de verdad a partir de pruebas/curso-ejemplo/ y le hace
// pasar, con el LLM de verdad (claude, en modo no interactivo), por las cinco skills de trabajo en
// orden, como lo haría un alumno de principio a fin — y, de paso, por una preparación en segundo plano
// (`preparar.js`) en paralelo con el examen: el caso de verdad con choques posibles (plan 0.22, §4). Se
// ejecuta en el Mac del mantenedor, con su suscripción — nunca en el CI. Ver CONTRIBUTING.md, "Prueba
// real del profesor".
//
//   node pruebas/prueba-real.js                 # de verdad, con claude
//   node pruebas/prueba-real.js --sin-llm       # solo monta y prueba el propio ejecutor, sin gastar cuota
//   node pruebas/prueba-real.js --modelo opus   # otro modelo que el recomendado del adaptador
//
// Guarda el resultado en pruebas/curso-ejemplo/resultado/ (sustituye el anterior entero) y borra
// siempre la carpeta temporal, también si algo falla.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { borrar, montarCurso, comprobarJson, carpetaTemporal } = require('./lib/montaje');
const p = require('./lib/pasos');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const RESULTADO = path.join(EJEMPLO, 'resultado');
const LIMITE_POR_DEFECTO_MS = 20 * 60 * 1000;   // 20 min por llamada a claude: una clase densa puede tardar

function leerJson(f) { return JSON.parse(fs.readFileSync(f, 'utf8')); }

function comando(comando_, args) {
  const r = spawnSync(comando_, args, { encoding: 'utf8' });
  return { ok: !r.error && r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// Sondear sin gastar CPU mientras se espera a que termine algo en segundo plano.
function dormir(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function preparar(ctx, ...args) {
  const r = spawnSync(process.execPath, [path.join(ctx.destino, '.kit', 'herramientas', 'preparar.js'), ...args], { cwd: ctx.destino, encoding: 'utf8' });
  return { ok: !r.error && r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// El modelo recomendado del adaptador del LLM que use el curso montado (hoy, siempre claude-code):
// `config/adaptador-llm.json` si el curso lo escribió, si no `.kit/adaptadores/<llm>.json`.
function modeloRecomendado(destino) {
  const ajustes = leerJson(path.join(destino, 'config', 'ajustes.json'));
  const llm = ajustes.llm || 'claude-code';
  for (const ruta of [path.join(destino, 'config', 'adaptador-llm.json'), path.join(destino, '.kit', 'adaptadores', `${llm}.json`)]) {
    if (fs.existsSync(ruta)) { const a = leerJson(ruta); if (a.modelo_recomendado) return a.modelo_recomendado.modelo; }
  }
  return 'sonnet';
}

function invocarClaude({ prompt, modelo, cwd, limiteMs }) {
  const inicio = Date.now();
  const r = spawnSync('claude', ['-p', prompt, '--model', modelo, '--permission-mode', 'acceptEdits', '--permission-prompts', 'none'], {
    cwd, encoding: 'utf8', timeout: limiteMs, maxBuffer: 64 * 1024 * 1024,
  });
  const duracionMs = Date.now() - inicio;
  const agotado = !!(r.error && r.error.code === 'ETIMEDOUT');
  return {
    ok: !agotado && r.status === 0, duracionMs, codigo: r.status, agotado,
    salida: ((r.stdout || '') + (r.stderr || '')).trim(),
  };
}

// Envuelve cada paso: si algo revienta (el LLM no encontró lo que esperaba, un fichero no existe…), se
// anota como fallo de ESE paso y la prueba sigue con los demás. Nunca deja de escribir el resumen.
function ejecutarPaso(pasos, nombre, fn) {
  const inicio = Date.now();
  try {
    const r = fn() || {};
    pasos.push({ paso: nombre, duracionMs: Date.now() - inicio, ok: r.ok === null ? null : r.ok !== false, detalle: r.detalle || 'ok', salidaLlm: r.salidaLlm });
  } catch (error) {
    pasos.push({ paso: nombre, duracionMs: Date.now() - inicio, ok: false, detalle: `error: ${error.message}` });
  }
}

const PROMPT_COMUN = 'No me preguntes nada: si dudas, toma la opción más conservadora y déjala como TODO o FALTA INFO. Al terminar, guarda.';

function promptSesion(clase) {
  const ficheros = clase.ficheros.map(f => `estudio/inbox/${f}`).join(' y ');
  return `He dejado los apuntes de la clase en ${ficheros}. Procésalos siguiendo la skill /sesion (son la misma clase: ${clase.tema}). ${PROMPT_COMUN}`;
}

function pasoSesion(ctx, clase) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const r = invocarClaude({ prompt: promptSesion(clase), modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs });
  return { ok: r.ok, detalle: r.ok ? `claude terminó (código ${r.codigo})` : `claude falló (código ${r.codigo}${r.agotado ? ', tiempo agotado' : ''})`, salidaLlm: r.salida };
}

// El caso de verdad con choques posibles (plan 0.22, §4): la clase que no hace falta para el examen del
// módulo se prepara en segundo plano mientras el examen (y lo que venga antes) sigue en primer plano.
function pasoPrepararEnSegundoPlano(ctx, clase) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const r = preparar(ctx, '--lanzar', ...clase.ficheros, '--id', clase.id);
  return { ok: r.ok, detalle: r.ok ? `lanzada la preparación de ${clase.id} en segundo plano` : `no se pudo lanzar: ${r.salida}` };
}

// Espera (sondeando --estado, sin sleeps largos de un tirón) a que termine, y la junta con la principal.
function pasoJuntarPreparacion(ctx, clase) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const limite = Date.now() + ctx.limiteMs;
  let estado;
  for (;;) {
    const r = preparar(ctx, '--estado', '--json');
    if (!r.ok) return { ok: false, detalle: `preparar.js --estado falló: ${r.salida}` };
    estado = JSON.parse(r.salida || '[]').find(e => e.id === clase.id);
    if (estado && estado.resultadoEnCaliente !== 'en-curso') break;
    if (Date.now() > limite) return { ok: false, detalle: `la preparación de ${clase.id} no terminó a tiempo (${estado ? estado.resultadoEnCaliente : 'no se encuentra'})` };
    dormir(2000);
  }
  if (estado.resultadoEnCaliente !== 'terminada') return { ok: false, detalle: `la preparación de ${clase.id} quedó "${estado.resultadoEnCaliente}"` };
  const j = preparar(ctx, '--juntar', clase.id);
  return { ok: j.ok, detalle: j.ok ? `${clase.id} juntada con la rama principal` : `no se pudo juntar: ${j.salida}` };
}

function pasoDudas(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const fmProfesor = fs.readFileSync(path.join(ctx.destino, 'config', 'profesor.md'), 'utf8');
  const m = /marcador_dudas:\s*"?([^"\n]+)"?/.exec(fmProfesor);
  const marca = (m ? m[1] : '??').trim();
  const tocado = p.simularAlumnoTrasSesiones(ctx.destino, marca);
  if (!tocado) return { ok: false, detalle: 'no hay ninguna nota de concepto ni de sesión (el paso 1 no dejó nada): no se puede simular al alumno' };
  const antes = comprobarJson(ctx.destino);
  const hayDudaPendienteAntes = antes.avisos.some(a => a.regla === 'duda-pendiente');
  const hayPropiedadAntes = antes.avisos.some(a => a.regla === 'propiedad-no-estandar');
  const r = invocarClaude({
    prompt: `Tengo dudas: he dejado un par de comentarios con el marcador de dudas en mis notas (en ${tocado.concepto || 'un concepto'} y en ${tocado.sesion || 'una sesión'}), y he marcado una casilla "estudiada" a mi manera. Resuélvelas siguiendo la skill /dudas. ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  if (!r.ok) return { ok: false, detalle: `claude falló (código ${r.codigo})`, salidaLlm: r.salida };
  const quedaAlguno = p.quedaMarcador(ctx.destino, marca);
  const despues = comprobarJson(ctx.destino);
  const sigueLaPropiedad = tocado.casillaNoEstandar && despues.avisos.some(a => a.regla === 'propiedad-no-estandar' && a.fichero === tocado.sesion);
  const ok = !quedaAlguno && !sigueLaPropiedad;
  return {
    ok,
    detalle: ok
      ? `dudas resueltas antes: pendientes ${hayDudaPendienteAntes}/propiedad no estándar ${hayPropiedadAntes} → ahora sin marcadores ni propiedad no estándar`
      : `sigue habiendo algo pendiente: marcador en ${quedaAlguno || 'ninguno'}, propiedad no estándar sin resolver: ${sigueLaPropiedad}`,
    salidaLlm: r.salida,
  };
}

function pasoEjercicio(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const slug = p.conceptoConFormula(ctx.destino);
  if (!slug) return { ok: false, detalle: 'no se encontró ningún concepto con la sección "## La fórmula" rellena: no hay sobre qué pedir el ejercicio' };
  const r = invocarClaude({
    prompt: `Ponme un ejercicio del concepto ${slug}, siguiendo la skill /ejercicio. ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  return { ok: r.ok, detalle: r.ok ? `ejercicio pedido sobre "${slug}" (código ${r.codigo})` : `claude falló (código ${r.codigo})`, salidaLlm: r.salida };
}

function pasoExamenGenerar(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const r = invocarClaude({
    prompt: `Hazme el examen del ${examenModulo.titulo.toLowerCase()}, siguiendo la skill /examen. ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  if (!r.ok) return { ok: false, detalle: `claude falló (código ${r.codigo})`, salidaLlm: r.salida };
  const fichero = p.examenMasReciente(ctx.destino);
  if (!fichero) return { ok: false, detalle: 'claude terminó pero no hay ningún examen en estudio/examenes/', salidaLlm: r.salida };
  ctx.ficheroExamen = fichero;
  return { ok: true, detalle: `examen escrito: ${path.relative(ctx.destino, fichero)}`, salidaLlm: r.salida };
}

// El alumno simulado (plan 0.22, 5b.4): otra llamada sin conversación, desde una carpeta vacía (no puede abrir el
// examen con las soluciones), que recibe el examen limpio y el perfil y devuelve sus respuestas en JSON.
function pasoExamenContestar(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen generado: no hay nada que contestar' };
  const examen = p.examenSinSoluciones(fs.readFileSync(ctx.ficheroExamen, 'utf8'));
  const n = p.contarHuecos(examen);
  const perfil = fs.readFileSync(path.join(ctx.datosCurso, 'alumno', 'perfil.md'), 'utf8');
  const vacia = carpetaTemporal();
  try {
    const r = invocarClaude({ prompt: p.promptAlumnoSimulado(perfil, examen, n), modelo: ctx.modelo, cwd: vacia, limiteMs: ctx.limiteMs });
    if (!r.ok) return { ok: false, detalle: `claude falló haciendo de alumno (código ${r.codigo})`, salidaLlm: r.salida };
    const respuestas = p.leerRespuestas(r.salida);
    if (!respuestas) return { ok: false, detalle: 'el alumno simulado no devolvió el JSON de respuestas', salidaLlm: r.salida };
    const puesto = p.ponerRespuestas(ctx.ficheroExamen, respuestas);
    if (!puesto.ok) return { ok: false, detalle: `el alumno simulado dio ${puesto.respuestas} respuestas para ${puesto.huecos} preguntas`, salidaLlm: r.salida };
    return { ok: true, detalle: `${puesto.huecos} preguntas contestadas por el alumno simulado, ${puesto.enBlanco} en blanco` };
  } finally {
    borrar(vacia);
  }
}

// Fuera de aquí, el alumno simulado o la corrección no se portaron como se esperaba.
const NOTA_MIN = 3;
const NOTA_MAX = 8;

function pasoExamenCorregir(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen generado: se omite la corrección' };
  const progresoAntes = fs.readFileSync(path.join(ctx.destino, 'estudio', 'progreso.md'), 'utf8');
  const r = invocarClaude({
    prompt: `He terminado el examen del ${examenModulo.titulo.toLowerCase()}. Corrígelo siguiendo la skill /examen (lee mis respuestas de la propia nota). ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  if (!r.ok) return { ok: false, detalle: `claude falló al corregir (código ${r.codigo})`, salidaLlm: r.salida };
  const texto = fs.readFileSync(ctx.ficheroExamen, 'utf8');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  const nota = fm && /^nota:\s*([\d.,]+)\s*$/m.exec(fm[1]);
  const historico = /## Histórico de intentos/.test(texto);
  const progresoDespues = fs.readFileSync(path.join(ctx.destino, 'estudio', 'progreso.md'), 'utf8');
  const progresoMovido = progresoAntes !== progresoDespues;
  const valor = nota ? Number(nota[1].replace(',', '.')) : null;
  const enMargen = valor !== null && valor >= NOTA_MIN && valor <= NOTA_MAX;
  const ok = !!nota && historico && progresoMovido && enMargen;
  return {
    ok,
    detalle: `nota: ${nota ? nota[1] : 'no encontrada'} (margen esperado ${NOTA_MIN}-${NOTA_MAX}: ${enMargen ? 'sí' : 'no'}) · `
      + `histórico de intentos: ${historico ? 'sí' : 'no'} · progreso.md movido: ${progresoMovido ? 'sí' : 'no'}`,
    salidaLlm: r.salida,
  };
}

// La corrección, medida (issue #39, H08): un test fijo con las respuestas ya escritas y, para cada una, el veredicto
// que tendría que dar el profesor según "Cuando preguntas para medir" (AGENTS.md). Solo vale 6 de 6.
function pasoCorreccionOraculo(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const dirOraculo = path.join(ctx.datosCurso, 'oraculo');
  const esperado = JSON.parse(fs.readFileSync(path.join(dirOraculo, 'esperado.json'), 'utf8'));
  const hoy = new Date().toISOString().slice(0, 10);
  const carpeta = ctx.ficheroExamen ? path.dirname(ctx.ficheroExamen) : path.join(ctx.destino, 'estudio', 'examenes');
  fs.mkdirSync(carpeta, { recursive: true });
  const fichero = path.join(carpeta, `01-examen-${hoy}-correccion.md`);
  fs.writeFileSync(fichero, fs.readFileSync(path.join(dirOraculo, 'examen-oraculo.md'), 'utf8').replace('{{fecha}}', hoy));
  const puesto = p.ponerRespuestas(fichero, esperado.map(e => e.respuesta));
  if (!puesto.ok) return { ok: false, detalle: `el test fijo tiene ${puesto.huecos} huecos y ${puesto.respuestas} respuestas preparadas` };
  const r = invocarClaude({
    prompt: `He terminado el test ${path.basename(fichero)}. Corrígelo siguiendo la skill /examen (lee mis respuestas de la propia nota). ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  if (!r.ok) return { ok: false, detalle: `claude falló al corregir el test fijo (código ${r.codigo})`, salidaLlm: r.salida };
  const c = p.compararVeredictos(esperado, p.leerVeredictos(fs.readFileSync(fichero, 'utf8')));
  ctx.correccion = c;
  return { ok: c.bien === c.total, detalle: `corrección: ${c.bien}/${c.total} veredictos como se esperaban${c.fallos.length ? ` · ${c.fallos.join(' · ')}` : ''}`, salidaLlm: c.fallos.length ? r.salida : undefined };
}

function pasoRepaso(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const antes = new Set(p.repasosGenerados(ctx.destino));
  const r = invocarClaude({
    prompt: `Hazme un repaso visual del ${examenModulo.titulo.toLowerCase()}, siguiendo la skill /repaso. ${PROMPT_COMUN}`,
    modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
  });
  if (!r.ok) return { ok: false, detalle: `claude falló (código ${r.codigo})`, salidaLlm: r.salida };
  const despues = p.repasosGenerados(ctx.destino).filter(f => !antes.has(f));
  return {
    ok: despues.length > 0,
    detalle: despues.length ? `repaso generado: ${despues.map(f => path.relative(ctx.destino, f)).join(', ')}` : 'claude terminó pero no hay ningún .html nuevo en estudio/repasos/',
    salidaLlm: r.salida,
  };
}

// Cómo quedó mi-perfil.md y qué señales da estado.js, con el motor del propio curso montado.
function resumenPerfil(destino) {
  const f = path.join(destino, 'estudio', 'mi-perfil.md');
  const senales = require(path.join(destino, '.kit', 'herramientas', 'estado.js')).calcularEstado(destino).senales || [];
  if (!fs.existsSync(f)) return { existe: false, conContenido: 0, total: 0, senales: senales.map(s => `${s.tipo}: ${s.detalle}`) };
  const partes = fs.readFileSync(f, 'utf8').split(/^## /m).slice(1);
  return {
    existe: true, total: partes.length, conContenido: partes.filter(x => !/Todavía nada/.test(x)).length,
    senales: senales.map(s => `${s.tipo}: ${s.detalle}`),
  };
}

function contarNotas(destino, carpeta, ext) {
  const dir = path.join(destino, 'estudio', carpeta);
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  const recorrer = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const abs = path.join(d, e.name); if (e.isDirectory()) recorrer(abs); else if (ext.some(x => e.name.endsWith(x)) && !e.name.startsWith('_')) n++; } };
  recorrer(dir);
  return n;
}

function agruparPorRegla(lista) {
  const grupos = new Map();
  for (const item of lista) grupos.set(item.regla, [...(grupos.get(item.regla) || []), item]);
  return [...grupos.entries()].sort((a, b) => b[1].length - a[1].length);
}

function markdownResumen({ fecha, version, modelo, sinLlm, pasos, informe, conteos, perfil, correccion, commit }) {
  const l = [];
  l.push('# Resultado de la prueba real del profesor', '');
  if (sinLlm) l.push('> **Modo `--sin-llm`: no se ha ejecutado ningún LLM real.** Solo se ha montado el curso y probado', '> el propio ejecutor. Ejecuta `npm run prueba-real` (sin ese flag) para una prueba de verdad.', '');
  l.push(`- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo}`, '');
  // Línea fija que lee .github/cambio-grande.js: no se cambia su forma sin cambiar allí la expresión.
  const hechos = pasos.filter(x => x.ok !== null);
  const c = correccion || { bien: 0, total: 0 };
  l.push(`Resultado: ${hechos.filter(x => x.ok).length}/${hechos.length} pasos bien · corrección ${c.bien}/${c.total} · commit ${commit || 'desconocido'}`, '');

  l.push('## Pasos', '', '| Paso | Resultado | Duración | Qué se comprobó |', '|---|---|---|---|');
  for (const paso of pasos) {
    const resultado = paso.ok === null ? '⏭️ omitido' : paso.ok ? '✅ ok' : '❌ fallo';
    l.push(`| ${paso.paso} | ${resultado} | ${(paso.duracionMs / 1000).toFixed(1)} s | ${paso.detalle} |`);
  }
  l.push('');

  // Lo que respondió el asistente en los pasos que fallaron: sin esto, un fallo solo se puede adivinar.
  const fallidos = pasos.filter(x => x.ok === false && x.salidaLlm);
  if (fallidos.length) {
    l.push('## Lo que respondió el asistente en los pasos que fallaron', '');
    for (const x of fallidos) l.push(`### ${x.paso}`, '', '```text', String(x.salidaLlm).slice(-4000).replace(/```/g, "'''"), '```', '');
  }

  l.push('## Mi perfil', '');
  if (!perfil) l.push('- No calculado.', '');
  else {
    l.push(perfil.existe ? `- \`mi-perfil.md\`: ${perfil.conContenido} de ${perfil.total} secciones con contenido` : '- `mi-perfil.md`: **no existe**');
    l.push(perfil.senales.length ? `- Señales de \`estado.js\`: ${perfil.senales.join(' · ')}` : '- Señales de `estado.js`: ninguna', '');
  }

  l.push('## `comprobar.js`', '', `- **${informe.errores.length} error(es)** · **${informe.avisos.length} aviso(s)**`, '');
  if (informe.errores.length) {
    l.push('### Errores', '');
    for (const [regla, items] of agruparPorRegla(informe.errores)) l.push(`- **${regla}** (${items.length}): ${items[0].fichero} — ${items[0].detalle}${items.length > 1 ? ` (+${items.length - 1} más)` : ''}`);
    l.push('');
  }
  if (informe.avisos.length) {
    l.push('### Avisos, por regla', '');
    for (const [regla, items] of agruparPorRegla(informe.avisos)) l.push(`- **${regla}** (${items.length})`);
    l.push('');
    const pedagogicos = ['nota-larga', 'concepto-sin-ejemplo', 'sesion-incompleta', 'flashcards-fuera-de-rango', 'requiere-vacio', 'pregunta-doble'];
    const deObsidian = informe.avisos.filter(a => a.regla === 'no-se-vera-bien');
    const deLosPedagogicos = informe.avisos.filter(a => pedagogicos.includes(a.regla));
    l.push(`Atención especial: **no-se-vera-bien** (${deObsidian.length}) y **pedagógicos** (${deLosPedagogicos.length}).`, '');
  }

  l.push('## Material generado', '',
    `- Conceptos: **${conteos.conceptos}**`, `- Sesiones: **${conteos.sesiones}**`, `- Flashcards: **${conteos.flashcards}**`,
    `- Ejercicios: **${conteos.ejercicios}**`, `- Exámenes: **${conteos.examenes}**`, `- Repasos: **${conteos.repasos}**`,
    `- TODO: **${conteos.todo}** · FALTA INFO: **${conteos.faltaInfo}** · Dudas sin responder: **${conteos.dudaPendiente}**`, '');
  return l.join('\n');
}

function copiarSinExtras(origen, destino) {
  fs.mkdirSync(destino, { recursive: true });
  fs.cpSync(origen, destino, {
    recursive: true,
    filter: src => {
      const rel = path.relative(origen, src);
      const primero = rel.split(path.sep)[0];
      return primero !== '.obsidian' && primero !== 'inbox';
    },
  });
}

function ejecutar({ sinLlm, modelo: modeloArg, limiteMs, trabajo = RAIZ_KIT, datosCurso = EJEMPLO, resultadoDir = RESULTADO }) {
  const clases = leerJson(path.join(datosCurso, 'clases.json'));
  const nombre = leerJson(path.join(datosCurso, 'config', 'ajustes.json')).nombre_curso;
  const { destino, motor } = montarCurso({ trabajo, datosCurso, nombre });
  try {
    const modelo = (modeloArg || modeloRecomendado(destino)).toLowerCase();
    const ctx = { destino, sinLlm, modelo, limiteMs, datosCurso };
    const pasos = [];

    // El caso de verdad con choques posibles (plan 0.22, §4): las clases del módulo del examen, en
    // primer plano; la que no hace falta para ese examen (de otro módulo), en segundo plano — en
    // paralelo con dudas, ejercicio y el examen. Al final se junta y sigue como si nada.
    const prefijoExamen = clases.examen_modulo.prefijo;
    const clasesModuloDelExamen = clases.clases.filter(c => c.id.startsWith(prefijoExamen));
    const clasesEnSegundoPlano = clases.clases.filter(c => !c.id.startsWith(prefijoExamen));
    const [claseEnSegundoPlano, ...otrasEnSegundoPlano] = clasesEnSegundoPlano;

    for (const clase of clasesModuloDelExamen) ejecutarPaso(pasos, `/sesion ${clase.id}`, () => pasoSesion(ctx, clase));
    if (claseEnSegundoPlano) ejecutarPaso(pasos, `preparar.js --lanzar ${claseEnSegundoPlano.id}`, () => pasoPrepararEnSegundoPlano(ctx, claseEnSegundoPlano));
    ejecutarPaso(pasos, '/dudas', () => pasoDudas(ctx));
    ejecutarPaso(pasos, '/ejercicio', () => pasoEjercicio(ctx));
    ejecutarPaso(pasos, '/examen (generar)', () => pasoExamenGenerar(ctx, clases.examen_modulo));
    ejecutarPaso(pasos, '/examen (contestar)', () => pasoExamenContestar(ctx));
    ejecutarPaso(pasos, '/examen (corregir)', () => pasoExamenCorregir(ctx, clases.examen_modulo));
    ejecutarPaso(pasos, '/examen (corrección con veredictos esperados)', () => pasoCorreccionOraculo(ctx));
    if (claseEnSegundoPlano) ejecutarPaso(pasos, `preparar.js --juntar ${claseEnSegundoPlano.id}`, () => pasoJuntarPreparacion(ctx, claseEnSegundoPlano));
    for (const clase of otrasEnSegundoPlano) ejecutarPaso(pasos, `/sesion ${clase.id}`, () => pasoSesion(ctx, clase));
    ejecutarPaso(pasos, '/repaso', () => pasoRepaso(ctx, clases.examen_modulo));

    const informe = comprobarJson(destino);
    const perfil = resumenPerfil(destino);
    const conteos = {
      conceptos: contarNotas(destino, 'conceptos', ['.md']),
      sesiones: contarNotas(destino, 'sesiones', ['.md']),
      flashcards: contarNotas(destino, 'flashcards', ['.md']),
      ejercicios: contarNotas(destino, 'ejercicios', ['.md', '.html']),
      examenes: contarNotas(destino, 'examenes', ['.md']),
      repasos: p.repasosGenerados(destino).length,
      todo: informe.avisos.filter(a => a.regla === 'todo').length,
      faltaInfo: informe.avisos.filter(a => a.regla === 'falta-info').length,
      dudaPendiente: informe.avisos.filter(a => a.regla === 'duda-pendiente').length,
    };

    borrar(resultadoDir);
    copiarSinExtras(path.join(destino, 'estudio'), path.join(resultadoDir, 'estudio'));
    fs.mkdirSync(path.join(resultadoDir, 'config'), { recursive: true });
    fs.copyFileSync(path.join(destino, 'config', 'alumno.md'), path.join(resultadoDir, 'config', 'alumno.md'));
    const resumen = markdownResumen({
      fecha: new Date().toISOString().slice(0, 10), version: fs.readFileSync(path.join(destino, '.kit', 'VERSION'), 'utf8').trim(),
      modelo, sinLlm, pasos, informe, conteos, perfil, correccion: ctx.correccion,
      commit: (spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: trabajo, encoding: 'utf8' }).stdout || '').trim(),
    });
    fs.writeFileSync(path.join(resultadoDir, 'RESUMEN.md'), resumen);

    return { pasos, informe, motor, resultadoDir };
  } finally {
    borrar(destino);
  }
}

function cli(args) {
  const valor = nombre => { const i = args.indexOf(nombre); return i >= 0 ? args[i + 1] : undefined; };
  const sinLlm = args.includes('--sin-llm');
  const modelo = valor('--modelo') || null;
  const limiteMs = Number(valor('--limite-ms')) || LIMITE_POR_DEFECTO_MS;

  if (!sinLlm) {
    const disponible = comando('claude', ['--version']);
    if (!disponible.ok) { console.error('No se encuentra `claude` (o falló al arrancar). Instálalo o usa --sin-llm.\n' + disponible.salida); return 1; }
  }

  const { pasos, informe } = ejecutar({ sinLlm, modelo, limiteMs });
  console.log(`Resultado en ${path.relative(RAIZ_KIT, RESULTADO)}/RESUMEN.md`);
  for (const paso of pasos) console.log(`  ${paso.ok === null ? '⏭️ ' : paso.ok ? '✅' : '❌'} ${paso.paso} — ${paso.detalle}`);
  const fallo = pasos.some(x => x.ok === false) || informe.errores.length > 0;
  return fallo ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exit(cli(process.argv.slice(2)));
  } catch (error) {
    console.error(`prueba-real.js: fallo inesperado: ${error.stack || error.message}`);
    process.exit(1);
  }
}

module.exports = { ejecutar, cli, modeloRecomendado, markdownResumen, agruparPorRegla };
