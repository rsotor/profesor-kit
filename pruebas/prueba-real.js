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
//   node pruebas/prueba-real.js --asistente codex   # con el adaptador de otro asistente (issue #45)
//   node pruebas/prueba-real.js --volcar /tmp/volcado   # guarda el stream crudo de cada llamada
//
// Con Claude Code, guarda el resultado en pruebas/curso-ejemplo/resultado/ (sustituye el anterior entero);
// con otro asistente, en pruebas/curso-ejemplo/resultado-<id>-<sistema>/. Borra siempre la carpeta temporal,
// también si algo falla.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { borrar, montarCurso, comprobarJson } = require('./lib/montaje');
// "vault", no "v": este fichero ya usa `v` como nombre local para el resultado de validaciones (p.ej. en
// pasoExamenReferencia) — con el mismo nombre para el vault del kit, uno de los dos taparía al otro.
const vault = require('../.kit/herramientas/lib/vault');
const { lanzadorPara, claudeCode } = require('./lib/asistentes');
const p = require('./lib/pasos');

const RAIZ_KIT = path.resolve(__dirname, '..');
const EJEMPLO = path.join(__dirname, 'curso-ejemplo');
const RESULTADO = path.join(EJEMPLO, 'resultado');
const LIMITE_POR_DEFECTO_MS = 20 * 60 * 1000;   // 20 min por llamada al asistente: una clase densa puede tardar
// Con Claude, la ruta de siempre (la leen cambio-grande.js, datosDelCurso, eslint, CONTRIBUTING, la plantilla
// de PR); con otro asistente, una carpeta aparte, por id y sistema operativo, para no pisar la de Claude.
const NOMBRE_SISTEMA = { darwin: 'macos', win32: 'windows', linux: 'linux' };
function rutaResultado(asistente, plataforma = process.platform) {
  if (!asistente || asistente === 'claude-code') return RESULTADO;
  return path.join(EJEMPLO, `resultado-${asistente}-${NOMBRE_SISTEMA[plataforma] || plataforma}`);
}

function leerJson(f) { return JSON.parse(fs.readFileSync(f, 'utf8')); }

// Sondear sin gastar CPU mientras se espera a que termine algo en segundo plano.
function dormir(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }
function preparar(ctx, ...args) {
  const r = spawnSync(process.execPath, [path.join(ctx.destino, '.kit', 'herramientas', 'preparar.js'), ...args], { cwd: ctx.destino, encoding: 'utf8', env: entornoDeAlumno() });
  return { ok: !r.error && r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// El adaptador del LLM que use el curso montado (issue #45): `config/adaptador-llm.json` si el curso lo
// escribió, si no `.kit/adaptadores/<llm>.json` (vault del propio kit del curso montado). Sin ninguno de los
// dos, `adaptador` sale null: quien llama decide cómo avisar (nunca gastar lanzando un asistente a ciegas).
function adaptadorDelCurso(destino) {
  const ajustes = leerJson(path.join(destino, 'config', 'ajustes.json'));
  const llm = ajustes.llm || 'claude-code';
  return { llm, adaptador: vault.leerAdaptador(destino, llm) };
}

// El modelo recomendado del adaptador. Sin uno propio: 'sonnet' si el curso usa Claude Code (como siempre,
// issue #39 H09), o sin adaptador ninguno (para no romper un curso con un `llm` desconocido); con cualquier
// otro asistente ya identificado (Codex, sin modelo_recomendado hoy) se deja sin modelo: el suyo por defecto.
function modeloRecomendado(destino) {
  const { llm, adaptador } = adaptadorDelCurso(destino);
  if (adaptador && adaptador.modelo_recomendado) return adaptador.modelo_recomendado.id || adaptador.modelo_recomendado.modelo;
  return llm === 'claude-code' || !adaptador ? 'sonnet' : null;
}

// argsClaude, entornoDeAlumno, leerSalidaClaude: movidos a pruebas/lib/asistentes/claude-code.js (issue #45).
// Se reexportan aquí, byte a byte, para que nada de lo que ya los usaba (tests incluidos) tenga que cambiar.
const { argsClaude, entornoDeAlumno, leerSalidaClaude } = claudeCode;

// Las denegaciones del paso que se está ejecutando: invocarAsistente las apunta aquí y ejecutarPaso se las lleva.
let denegacionesDelPaso = [];

// Un nombre de fichero legible para --volcar: el stream crudo de cada llamada (obligatorio en la primera
// medición con un asistente nuevo, para poder revisar a mano qué llegó de verdad).
let contadorVolcado = 0;
function volcarSiHaceFalta(dir, etiqueta, texto) {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  const nombreFichero = `${String(++contadorVolcado).padStart(3, '0')}-${etiqueta.replace(/[^\w-]+/g, '_').slice(0, 60)}.txt`;
  fs.writeFileSync(path.join(dir, nombreFichero), texto);
}

// Lanza el asistente del adaptador del curso (issue #45): con Claude Code, exactamente lo que hacía
// invocarClaude (mismos args, mismo entorno, prompt como argumento); con otros, argsTarea decide cómo (Codex:
// prompt por stdin, con permisos de escritura ya aceptados por permisos.js en el curso montado).
// `lanzador.comoEjecutar` resuelve el ejecutable de verdad (en Windows, un `.cmd` de npm no se puede lanzar
// tal cual: preparar.js#comoLanzar), con `windowsVerbatimArguments` cuando toca.
function invocarAsistente({ lanzador, adaptador, prompt, modelo, cwd, limiteMs, volcarDir, etiquetaVolcado }) {
  const inicio = Date.now();
  const plan = lanzador.comoEjecutar(lanzador.argsTarea({ prompt, modelo, cwd, adaptador }));
  if (plan.error) {
    return { ok: false, duracionMs: Date.now() - inicio, codigo: null, agotado: false, denegaciones: [], salida: `no se pudo preparar el lanzamiento: ${plan.error}` };
  }
  // Las mismas opciones que invocarClaude antes de los lanzadores, con el entorno del lanzador (sin él, el
  // asistente heredaría las variables de la sesión que lanza la prueba) y, si hay, el prompt por stdin.
  const r = spawnSync(plan.ejecutable, plan.args, {
    cwd, encoding: 'utf8', timeout: limiteMs, maxBuffer: 64 * 1024 * 1024, env: lanzador.entorno(),
    input: plan.entrada, windowsVerbatimArguments: plan.literal === true,
  });
  const duracionMs = Date.now() - inicio;
  const agotado = !!(r.error && r.error.code === 'ETIMEDOUT');
  // El proceso no llegó ni a arrancar (comando no encontrado, sin permiso...): antes se leía un stdout vacío
  // y salía un fallo sin explicación; ahora se dice qué pasó.
  const noArranco = !!(r.error && !agotado);
  const { texto, denegaciones } = lanzador.leerSalida(r.stdout);
  denegacionesDelPaso.push(...denegaciones);
  volcarSiHaceFalta(volcarDir, etiquetaVolcado || 'paso', String(r.stdout || ''));
  return {
    ok: !agotado && !noArranco && r.status === 0, duracionMs, codigo: r.status, agotado, denegaciones,
    salida: noArranco ? `no arrancó: ${r.error.message}` : [texto, (r.stderr || '').trim()].filter(Boolean).join('\n'),
  };
}

// Envuelve cada paso: si algo revienta (el LLM no encontró lo que esperaba, un fichero no existe…), se
// anota como fallo de ESE paso y la prueba sigue con los demás. Nunca deja de escribir el resumen.
function ejecutarPaso(pasos, nombre, fn) {
  const inicio = Date.now();
  denegacionesDelPaso = [];
  try {
    const r = fn() || {};
    pasos.push({ paso: nombre, duracionMs: Date.now() - inicio, ok: r.ok === null ? null : r.ok !== false, detalle: r.detalle || 'ok', salidaLlm: r.salidaLlm, denegaciones: denegacionesDelPaso });
  } catch (error) {
    pasos.push({ paso: nombre, duracionMs: Date.now() - inicio, ok: false, detalle: `error: ${error.message}`, denegaciones: denegacionesDelPaso });
  }
  avisarPaso(pasos[pasos.length - 1]);
}

// Lo que comparten todos los pasos que llaman al asistente: su lanzador, adaptador, modelo, cwd, límite de
// tiempo y carpeta de volcado salen siempre de `ctx` (ejecutar() los deja puestos).
function invocar(ctx, prompt, etiqueta) {
  return invocarAsistente({
    lanzador: ctx.lanzador, adaptador: ctx.adaptador, prompt, modelo: ctx.modelo, cwd: ctx.destino, limiteMs: ctx.limiteMs,
    volcarDir: ctx.volcarDir, etiquetaVolcado: etiqueta,
  });
}

// Cada paso, en cuanto acaba: un fallo se ve en el minuto en que pasa, no al final de una prueba de 20.
function lineaDePaso(paso) {
  const icono = paso.ok === null ? '⏭️ ' : paso.ok ? '✅' : '❌';
  const denegados = (paso.denegaciones || []).length;
  return `  ${icono} ${paso.paso} (${(paso.duracionMs / 1000).toFixed(0)} s) — ${paso.detalle}${denegados ? ` · ${denegados} permiso(s) denegado(s)` : ''}`;
}
function avisarPaso(paso) {
  if (!process.env.NODE_TEST_CONTEXT) console.log(lineaDePaso(paso));
}

const PROMPT_COMUN = 'No me preguntes nada: si dudas, toma la opción más conservadora y déjala como TODO o FALTA INFO. Al terminar, guarda.';

function promptSesion(clase) {
  const ficheros = clase.ficheros.map(f => `estudio/inbox/${f}`).join(' y ');
  return `He dejado los apuntes de la clase en ${ficheros}. Procésalos siguiendo la skill /sesion (son la misma clase: ${clase.tema}). ${PROMPT_COMUN}`;
}

function pasoSesion(ctx, clase) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const r = invocar(ctx, promptSesion(clase), `sesion-${clase.id}`);
  return { ok: r.ok, detalle: r.ok ? `${ctx.lanzador.nombre} terminó (código ${r.codigo})` : `${ctx.lanzador.nombre} falló (código ${r.codigo}${r.agotado ? ', tiempo agotado' : ''})`, salidaLlm: r.salida };
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
  const r = invocar(ctx,
    `Tengo dudas: he dejado un par de comentarios con el marcador de dudas en mis notas (en ${tocado.concepto || 'un concepto'} y en ${tocado.sesion || 'una sesión'}), y he marcado una casilla "estudiada" a mi manera. Resuélvelas siguiendo la skill /dudas. ${PROMPT_COMUN}`,
    'dudas');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
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
  const r = invocar(ctx, `Ponme un ejercicio del concepto ${slug}, siguiendo la skill /ejercicio. ${PROMPT_COMUN}`, 'ejercicio');
  return { ok: r.ok, detalle: r.ok ? `ejercicio pedido sobre "${slug}" (código ${r.codigo})` : `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
}

// El fichero del test de autoevaluación del centro que ya trae pruebas/curso-ejemplo/estudio/inbox/
// (montarCurso lo copia entero desde el principio: no hace falta dejarlo caer a mitad de prueba).
const REFERENCIA_CENTRO = 'test-autoevaluacion-modulo-1.md';

// Un paso antes de generar el examen: el alumno deja en el inbox el test de autoevaluación del centro
// para que los exámenes del profesor se parezcan (decisión del mantenedor, 2026-09-24: "Examen de
// referencia del centro" en la skill /examen). La comprobación es en disco, sin LLM: config/examenes.json
// sigue siendo JSON válido y coherente con lo que ese test declara (número de opciones, si resta y el
// aprobado), sin valores inventados que el test no dé.
function pasoExamenReferencia(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const origen = path.join(ctx.datosCurso, 'estudio', 'inbox', REFERENCIA_CENTRO);
  const r = invocar(ctx,
    `Te dejo en estudio/inbox/${REFERENCIA_CENTRO} el test de autoevaluación del módulo 1 del centro. `
      + 'Quiero que mis próximos exámenes se parezcan a este en formato: sigue "Examen de referencia del '
      + `centro" de la skill /examen y ajusta config/examenes.json a lo que declara, sin inventar nada que no diga. ${PROMPT_COMUN}`,
    'examen-referencia');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
  const v = p.referenciaCoherente(ctx.destino, fs.readFileSync(origen, 'utf8'));
  if (v.ok) ctx.referenciaCentro = true;
  return { ok: v.ok, detalle: v.detalle, salidaLlm: v.ok ? undefined : r.salida };
}

function pasoExamenGenerar(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const prompt = ctx.referenciaCentro
    ? `Hazme el examen del ${examenModulo.titulo.toLowerCase()}, siguiendo la skill /examen. Ya sabes qué `
      + 'test de referencia del centro te dejé: reutiliza algunas de sus preguntas, literales y marcadas '
      + `como del centro, tal como pide la sección "Examen de referencia del centro". ${PROMPT_COMUN}`
    : `Hazme el examen del ${examenModulo.titulo.toLowerCase()}, siguiendo la skill /examen. ${PROMPT_COMUN}`;
  const r = invocar(ctx, prompt, 'examen-generar');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
  const fichero = p.examenMasReciente(ctx.destino);
  if (!fichero) return { ok: false, detalle: `${ctx.lanzador.nombre} terminó pero no hay ningún examen en estudio/examenes/`, salidaLlm: r.salida };
  ctx.ficheroExamen = fichero;
  // El examen tiene que respetar el formato fijado en config/examenes.json (nº de opciones por pregunta,
  // según su propia clave): lo que el paso de la referencia del centro tenía que dejar listo antes.
  const formato = p.formatoDeOpciones(ctx.destino, fichero);
  let ok = formato.ok;
  let detalle = `examen escrito: ${path.relative(ctx.destino, fichero)} · ${formato.detalle}`;
  // Con una referencia del centro de por medio, el examen tiene que traer alguna de sus preguntas, literal
  // y marcada, sin pasar de la mitad, con la respuesta de la clave coincidiendo con la del centro.
  if (ctx.referenciaCentro) {
    const referencia = fs.readFileSync(path.join(ctx.datosCurso, 'estudio', 'inbox', REFERENCIA_CENTRO), 'utf8');
    const literales = p.preguntasLiteralesDelCentro(ctx.destino, fichero, referencia);
    ok = ok && literales.ok;
    detalle += ` · ${literales.detalle}`;
  }
  return { ok, detalle, salidaLlm: r.salida };
}

// examen v1 (tipo test): la clave vive fuera de la bóveda, así que un alumno simulado con LLM no puede verla
// — no hay nada que "contestar como lo haría este alumno" que se pueda medir. Se marcan las casillas con un
// patrón determinista (pruebas/lib/pasos.js#contestarExamenTest), leyendo la clave real, para poder calcular
// de antemano la nota exacta que `examen.js --corregir` tiene que sacar y comprobarla luego sin margen.
function pasoExamenContestar(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen generado: no hay nada que contestar' };
  const r = p.contestarExamenTest(ctx.destino, ctx.ficheroExamen);
  if (!r.ok) return r;
  ctx.contestacion = r;
  return { ok: true, detalle: `${r.total} preguntas marcadas con un patrón conocido (nota esperada: ${String(r.notaEsperada).replace('.', ',')}): ${r.aciertos} aciertos, ${r.fallos} fallos, ${r.blancos} en blanco` };
}

function pasoExamenCorregir(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen generado: se omite la corrección' };
  const progresoAntes = fs.readFileSync(path.join(ctx.destino, 'estudio', 'progreso.md'), 'utf8');
  const r = invocar(ctx,
    `He terminado el examen del ${examenModulo.titulo.toLowerCase()}. Corrígelo siguiendo la skill /examen (usa node .kit/herramientas/examen.js --corregir). ${PROMPT_COMUN}`,
    'examen-corregir');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló al corregir (código ${r.codigo})`, salidaLlm: r.salida };
  const v = p.verificarCorreccionTest(ctx.destino, ctx.ficheroExamen, ctx.contestacion);
  const progresoDespues = fs.readFileSync(path.join(ctx.destino, 'estudio', 'progreso.md'), 'utf8');
  const progresoMovido = progresoAntes !== progresoDespues;
  return { ok: v.ok && progresoMovido, detalle: `${v.detalle} · progreso.md movido: ${progresoMovido ? 'sí' : 'no'}`, salidaLlm: r.salida };
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
  const r = invocar(ctx,
    `He terminado el test ${path.basename(fichero)}. Corrígelo siguiendo la skill /examen (lee mis respuestas de la propia nota). ${PROMPT_COMUN}`,
    'examen-oraculo');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló al corregir el test fijo (código ${r.codigo})`, salidaLlm: r.salida };
  const c = p.compararVeredictos(esperado, p.leerVeredictos(fs.readFileSync(fichero, 'utf8')));
  ctx.correccion = c;
  return { ok: c.bien === c.total, detalle: `corrección: ${c.bien}/${c.total} veredictos como se esperaban${c.fallos.length ? ` · ${c.fallos.join(' · ')}` : ''}`, salidaLlm: c.fallos.length ? r.salida : undefined };
}

function pasoRepaso(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const antes = new Set(p.repasosGenerados(ctx.destino));
  const r = invocar(ctx, `Hazme un repaso visual del ${examenModulo.titulo.toLowerCase()}, siguiendo la skill /repaso. ${PROMPT_COMUN}`, 'repaso');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
  const despues = p.repasosGenerados(ctx.destino).filter(f => !antes.has(f));
  return {
    ok: despues.length > 0,
    detalle: despues.length ? `repaso generado: ${despues.map(f => path.relative(ctx.destino, f)).join(', ')}` : `${ctx.lanzador.nombre} terminó pero no hay ningún .html nuevo en estudio/repasos/`,
    salidaLlm: r.salida,
  };
}

// Cómo quedó mi-perfil.md y qué señales da estado.js, con el motor del propio curso montado.
function resumenPerfil(destino) {
  try {
    return calcularResumenPerfil(destino);
  } catch (error) {
    // Al final de una prueba de una hora, un fallo aquí no puede dejarla sin RESUMEN.md.
    return { existe: false, conContenido: 0, total: 0, senales: [`no se pudo calcular: ${error.message}`] };
  }
}

function calcularResumenPerfil(destino) {
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

function markdownResumen({ fecha, version, modelo, sinLlm, pasos, informe, conteos, perfil, correccion, commit, asistente = 'claude-code' }) {
  const l = [];
  l.push('# Resultado de la prueba real del profesor', '');
  if (sinLlm) l.push('> **Modo `--sin-llm`: no se ha ejecutado ningún LLM real.** Solo se ha montado el curso y probado', '> el propio ejecutor. Ejecuta `npm run prueba-real` (sin ese flag) para una prueba de verdad.', '');
  l.push(`- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo || 'el suyo por defecto'}`, `- **Asistente:** ${asistente}`, '');
  // Línea fija que lee .github/cambio-grande.js: no se cambia su forma sin cambiar allí la expresión.
  const hechos = pasos.filter(x => x.ok !== null);
  const c = correccion || { bien: 0, total: 0 };
  l.push(`Resultado: ${hechos.filter(x => x.ok).length}/${hechos.length} pasos bien · corrección ${c.bien}/${c.total} · commit ${commit || 'desconocido'}`, '');
  const denegados = pasos.flatMap(x => (x.denegaciones || []).map(d => ({ paso: x.paso, ...d })));
  l.push(`Permisos denegados: ${denegados.length}`, '');

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

  // Cada permiso denegado es un paso que el profesor quiso hacer a mano y no pudo: con un alumno delante, una petición.
  l.push('## Permisos denegados', '');
  if (!denegados.length) l.push('- Ninguno.');
  for (const d of denegados) l.push(`- **${d.paso}** · ${d.herramienta}: \`${String(d.detalle).replace(/`/g, "'").replace(/\s+/g, ' ')}\``);
  l.push('');

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

function ejecutar({
  sinLlm, modelo: modeloArg, limiteMs, trabajo = RAIZ_KIT, datosCurso = EJEMPLO, asistente, resultadoDir = rutaResultado(asistente), volcarDir,
}) {
  const clases = leerJson(path.join(datosCurso, 'clases.json'));
  const nombre = leerJson(path.join(datosCurso, 'config', 'ajustes.json')).nombre_curso;
  const { destino, motor } = montarCurso({ trabajo, datosCurso, nombre, llm: asistente });
  try {
    const { llm, adaptador } = adaptadorDelCurso(destino);
    if (!adaptador) throw new Error(`el curso usa \`${llm}\` y no tiene adaptador`);
    const lanzador = lanzadorPara(adaptador);
    const modelo = modeloArg || modeloRecomendado(destino);
    const ctx = { destino, sinLlm, modelo, limiteMs, datosCurso, lanzador, adaptador, volcarDir };
    const pasos = [];

    // El caso de verdad con choques posibles (plan 0.22, §4): las clases del módulo del examen, en
    // primer plano; la que no hace falta para ese examen (de otro módulo), en segundo plano — en
    // paralelo con dudas, ejercicio y el examen. Al final se junta y sigue como si nada.
    const prefijoExamen = clases.examen_modulo.prefijo;
    const clasesModuloDelExamen = clases.clases.filter(c => c.id.startsWith(prefijoExamen));
    const clasesEnSegundoPlano = clases.clases.filter(c => !c.id.startsWith(prefijoExamen));
    const [claseEnSegundoPlano, ...otrasEnSegundoPlano] = clasesEnSegundoPlano;

    for (const clase of clasesModuloDelExamen) {
      const ficheroProgreso = path.join(destino, 'estudio', 'progreso.md');
      const progresoAntes = fs.existsSync(ficheroProgreso) ? fs.readFileSync(ficheroProgreso, 'utf8') : '';
      ejecutarPaso(pasos, `/sesion ${clase.id}`, () => pasoSesion(ctx, clase));
      if (clase.trampa && !sinLlm) {
        ejecutarPaso(pasos, `material con órdenes (${clase.id})`, () => p.comprobarTrampa(destino, { id: clase.id, concepto: clase.trampa.concepto, progresoAntes }));
      }
    }
    if (claseEnSegundoPlano) ejecutarPaso(pasos, `preparar.js --lanzar ${claseEnSegundoPlano.id}`, () => pasoPrepararEnSegundoPlano(ctx, claseEnSegundoPlano));
    ejecutarPaso(pasos, '/dudas', () => pasoDudas(ctx));
    ejecutarPaso(pasos, '/ejercicio', () => pasoEjercicio(ctx));
    ejecutarPaso(pasos, '/examen (referencia del centro)', () => pasoExamenReferencia(ctx));
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
      modelo, sinLlm, pasos, informe, conteos, perfil, correccion: ctx.correccion, asistente: llm,
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
  const volcarDir = valor('--volcar');
  // Sin --asistente, el llm del curso de ejemplo: con Claude Code nada cambia (issue #45).
  const asistente = valor('--asistente') || leerJson(path.join(EJEMPLO, 'config', 'ajustes.json')).llm || 'claude-code';
  const ficheroAdaptador = path.join(RAIZ_KIT, '.kit', 'adaptadores', `${asistente}.json`);
  if (!fs.existsSync(ficheroAdaptador)) { console.error(`el curso usa \`${asistente}\` y no tiene adaptador`); return 1; }
  const lanzador = lanzadorPara(leerJson(ficheroAdaptador));

  if (!sinLlm) {
    const chequeo = lanzador.comprobar();
    if (!chequeo.ok) { console.error(chequeo.mensaje); return 1; }
  }

  const resultadoDir = rutaResultado(asistente);
  const { pasos, informe } = ejecutar({ sinLlm, modelo, limiteMs, asistente, resultadoDir, volcarDir });
  console.log(`Resultado en ${path.relative(RAIZ_KIT, resultadoDir)}/RESUMEN.md`);
  const denegados = pasos.reduce((n, x) => n + (x.denegaciones || []).length, 0);
  console.log(`${pasos.filter(x => x.ok).length}/${pasos.filter(x => x.ok !== null).length} pasos bien · ${denegados} permiso(s) denegado(s)`);
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

module.exports = {
  ejecutar, cli, modeloRecomendado, adaptadorDelCurso, rutaResultado, markdownResumen, agruparPorRegla,
  argsClaude, entornoDeAlumno, leerSalidaClaude, lineaDePaso, invocarAsistente,
};
