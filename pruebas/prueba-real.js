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
const os = require('node:os');
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

// --sin-llm no ejecuta ningún LLM: su RESUMEN no vale como prueba y no puede pisar el de la última prueba real,
// que va en el repo (lo lee .github/cambio-grande.js). Va a una carpeta temporal.
function carpetaDeResultado({ sinLlm, asistente }) {
  return sinLlm ? fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-real-sin-llm-')) : rutaResultado(asistente);
}

// --- Repetir desde un paso (--desde), con la copia que guardó el paso anterior --------------------------
//
// Cada carpeta de pruebas/prueba-real-pasos-XXXX/ se llama "<NN>-<paso>" (guardarCopiaDelPaso), en el mismo
// orden en el que se ejecutaron: el paso anterior a uno en la posición N (0-based) de la lista de pasos es
// siempre la carpeta "N" (1-based) — sin tener que reconstruir el slug del nombre para encontrarla.
class PasoDesconocidoError extends Error {
  constructor(nombre, validos) { super(`paso desconocido: "${nombre}"`); this.validos = validos; }
}
class SinCopiasError extends Error {}

const PREFIJO_COPIAS = 'prueba-real-pasos-';

// La carpeta prueba-real-pasos-XXXX/ más reciente de `base` (por defecto, el temporal del sistema): lo que usa
// --desde cuando no se le da --copias. Sin ninguna, null (quien llama decide cómo avisar).
function carpetaCopiasMasReciente(base = os.tmpdir()) {
  let candidatas;
  try { candidatas = fs.readdirSync(base).filter(n => n.startsWith(PREFIJO_COPIAS)); } catch { return null; }
  if (!candidatas.length) return null;
  candidatas.sort((a, b) => fs.statSync(path.join(base, b)).mtimeMs - fs.statSync(path.join(base, a)).mtimeMs);
  return path.join(base, candidatas[0]);
}

function carpetaDelPasoNumero(copiasDir, numero) {
  const prefijo = `${String(numero).padStart(2, '0')}-`;
  const encontrada = fs.readdirSync(copiasDir).find(n => n.startsWith(prefijo));
  return encontrada ? path.join(copiasDir, encontrada) : null;
}

// Restaura, en la MISMA ruta que tenía (el `.git` de una preparación en segundo plano con worktree lleva
// rutas absolutas: issue del plan 0.27), la copia del paso anterior al pedido, y da los pasos ya hechos
// (marcados como de la ejecución anterior, con su commit si la copia lo trae) y desde qué índice de
// `nombresPasos` seguir. Pedir el primer paso no restaura nada: no hay uno anterior, se ejecuta desde cero.
function restaurarPasoAnterior(copiasDir, nombresPasos, desde) {
  const indiceDesde = nombresPasos.indexOf(desde);
  if (indiceDesde < 0) throw new PasoDesconocidoError(desde, nombresPasos);
  if (indiceDesde === 0) return { destino: null, pasosAnteriores: [], ctxRestaurado: {}, indiceDesde };
  if (!copiasDir || !fs.existsSync(copiasDir)) {
    throw new SinCopiasError(`No hay ninguna copia que restaurar${copiasDir ? ` en ${copiasDir}` : ''}: usa --copias <carpeta>.`);
  }
  const carpeta = carpetaDelPasoNumero(copiasDir, indiceDesde);
  if (!carpeta) throw new SinCopiasError(`No se encontró en ${copiasDir} la copia del paso anterior a "${desde}".`);
  const estado = JSON.parse(fs.readFileSync(path.join(carpeta, 'estado.json'), 'utf8'));
  // estado.destino sale de un fichero: solo se sustituye si es una carpeta de prueba del kit en el temporal.
  const tmp = fs.realpathSync(require('node:os').tmpdir());
  const padre = fs.existsSync(path.dirname(String(estado.destino))) ? fs.realpathSync(path.dirname(String(estado.destino))) : null;
  if (padre !== tmp || !path.basename(String(estado.destino)).startsWith('profesor-kit-prueba-')) {
    throw new SinCopiasError(`${estado.destino} no es una carpeta de prueba del temporal: no se sustituye nada.`);
  }
  if (fs.existsSync(estado.destino)) fs.rmSync(estado.destino, { recursive: true, force: true, maxRetries: 3 });
  fs.mkdirSync(path.dirname(estado.destino), { recursive: true });
  fs.cpSync(path.join(carpeta, 'curso'), estado.destino, { recursive: true });
  const nota = `de la ejecución anterior${estado.commit ? ` (commit ${estado.commit})` : ''}`;
  const pasosAnteriores = (estado.pasos || []).map(paso => ({ ...paso, detalle: `${paso.detalle} · ${nota}` }));
  return {
    destino: estado.destino, pasosAnteriores, indiceDesde,
    ctxRestaurado: {
      ficheroExamen: estado.ficheroExamen, ficheroExamenSegundo: estado.ficheroExamenSegundo,
      contestacion: estado.contestacion, correccion: estado.correccion, referenciaCentro: estado.referenciaCentro,
    },
  };
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
let copiasPorPaso = null;
let pasosFallidos = true;   // hasta que ejecutar() llegue al final sin fallos, el curso no se borra

// Guarda el curso tal como queda tras un paso (y lo que los pasos siguientes necesitan de ctx), en
// <copiasPorPaso>/<NN>-<paso>/. Nunca tumba la prueba: si no se puede copiar (la preparación en segundo plano
// escribiendo a la vez), se dice y se sigue.
function guardarCopiaDelPaso(ctx, pasos) {
  if (!copiasPorPaso) return;
  const n = String(pasos.length).padStart(2, '0');
  const nombre = pasos[pasos.length - 1].paso.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '');
  const dir = path.join(copiasPorPaso, `${n}-${nombre}`);
  try {
    fs.cpSync(ctx.destino, path.join(dir, 'curso'), { recursive: true });
    const estado = { destino: ctx.destino, pasos, commit: ctx.commit, ficheroExamen: ctx.ficheroExamen, ficheroExamenSegundo: ctx.ficheroExamenSegundo,
      contestacion: ctx.contestacion, correccion: ctx.correccion, referenciaCentro: ctx.referenciaCentro };
    fs.writeFileSync(path.join(dir, 'estado.json'), JSON.stringify(estado, null, 2));
  } catch (error) {
    console.log(`  (no se pudo guardar la copia tras "${pasos[pasos.length - 1].paso}": ${error.message})`);
  }
}

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

// El motor genérico de "ejecuta esta lista de pasos, a partir de los que ya había": lo usa ejecutar() con la
// lista real (clases, examen...) y lo prueban los tests con pasos falsos, sin tocar el LLM ni el disco del
// curso — la parte que sí depende de eso es `alTerminarPaso` (guardarCopiaDelPaso), que aquí es un parámetro.
function ejecutarListaDePasos(definicion, pasosPrevios, alTerminarPaso) {
  const pasos = [...pasosPrevios];
  for (const { nombre, fn } of definicion) {
    ejecutarPaso(pasos, nombre, fn);
    if (alTerminarPaso) alTerminarPaso(pasos);
  }
  return pasos;
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
// Si venimos de restaurar una copia (--desde) y la preparación se tuvo que relanzar (ctx.preparacionReparada:
// repararPreparacionSiHaceFalta), se cuenta en el propio detalle de este paso — no como un paso aparte.
function pasoJuntarPreparacion(ctx, clase) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const reparada = ctx.preparacionReparada;
  const nota = reparada ? `${reparada.motivo}: ${reparada.relanzada ? 'se relanzó antes de juntar' : `no se pudo relanzar (${reparada.detalleRelanzar})`}. ` : '';
  if (reparada && !reparada.relanzada) return { ok: false, detalle: `${nota}no se puede juntar sin la preparación en marcha` };
  const limite = Date.now() + ctx.limiteMs;
  let estado;
  for (;;) {
    const r = preparar(ctx, '--estado', '--json');
    if (!r.ok) return { ok: false, detalle: `${nota}preparar.js --estado falló: ${r.salida}` };
    estado = JSON.parse(r.salida || '[]').find(e => e.id === clase.id);
    if (estado && estado.resultadoEnCaliente !== 'en-curso') break;
    if (Date.now() > limite) return { ok: false, detalle: `${nota}la preparación de ${clase.id} no terminó a tiempo (${estado ? estado.resultadoEnCaliente : 'no se encuentra'})` };
    dormir(2000);
  }
  if (estado.resultadoEnCaliente !== 'terminada') return { ok: false, detalle: `${nota}la preparación de ${clase.id} quedó "${estado.resultadoEnCaliente}"` };
  const j = preparar(ctx, '--juntar', clase.id);
  return { ok: j.ok, detalle: `${nota}${j.ok ? `${clase.id} juntada con la rama principal` : `no se pudo juntar: ${j.salida}`}` };
}

// Tras restaurar una copia (--desde): si la preparación en segundo plano se quedó "en curso" pero el proceso
// que la hacía ya no existe (interrumpida: el ordenador de la ejecución anterior ya no está), o su carpeta se
// copió a medias (estado.json ilegible), se descarta y se relanza con el mismo id y ficheros, antes de que el
// paso de juntar tenga que esperarla. Una preparación de verdad fallida (el asistente terminó, pero mal) no
// se toca aquí: eso lo dice --juntar, no se reintenta en silencio (nunca se inventa un resultado).
// `preparar`/`relanzar` son inyectables para poder probar la detección sin un curso ni un git de verdad.
function idsDePreparacion(destino) {
  const base = path.join(destino, '.preparacion');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).filter(e => e.isDirectory() && e.name !== 'descartadas').map(e => e.name);
}
function estadoCrudoDePreparacion(destino, id) {
  try { return JSON.parse(fs.readFileSync(path.join(destino, '.preparacion', id, 'estado.json'), 'utf8')); } catch { return null; }
}
function repararPreparacionSiHaceFalta(ctx, clase, { preparar: prepararLibInyectado, relanzar = () => pasoPrepararEnSegundoPlano(ctx, clase) } = {}) {
  if (!idsDePreparacion(ctx.destino).includes(clase.id)) return null;
  // `require` en lazy (no como valor por defecto del parámetro): un valor por defecto se evalúa siempre que
  // no se pase el argumento, aunque no haga falta — y el caso sin ninguna preparación (arriba) no tiene ni
  // curso montado en `ctx.destino`.
  const prepararLib = prepararLibInyectado || require(path.join(ctx.destino, '.kit', 'herramientas', 'preparar.js'));
  const estado = estadoCrudoDePreparacion(ctx.destino, clase.id);
  const aMedias = !estado;
  const interrumpida = !!estado && estado.resultado === 'en-curso' && !prepararLib.pidVivo(estado.pid);
  if (!aMedias && !interrumpida) return null;
  prepararLib.descartarCopia(ctx.destino, clase.id, { conservar: false });
  const r = relanzar();
  return {
    motivo: aMedias ? 'la copia de la preparación en segundo plano se hizo a medias' : 'el proceso que la preparaba en segundo plano ya no existía',
    relanzada: r.ok === true,
    detalleRelanzar: r.detalle,
  };
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

// Punto 3 del plan 0.26 (P5+H12): tras corregir el examen, cada casilla de progreso.md que la corrección
// movió (🟡/🔴/✅, nunca ⬜) tiene que citar de qué respuesta sale — comprobar.js ya lo vigila con
// `progreso-sin-prueba`; aquí solo se comprueba que, tras este examen, no queda ningún aviso de esos.
function pasoProgresoConPrueba(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  const avisos = comprobarJson(ctx.destino).avisos.filter(a => a.regla === 'progreso-sin-prueba');
  return {
    ok: avisos.length === 0,
    detalle: avisos.length
      ? `${avisos.length} casilla(s) de progreso.md sin citar de qué respuesta salen: ${avisos.map(a => a.detalle).join(' · ')}`
      : 'todas las casillas de progreso.md citan su prueba (comprobar.js: progreso-sin-prueba)',
  };
}

// Punto 4 del plan 0.26: un segundo examen del mismo módulo, pedido como lo pediría un alumno — sin
// decirle al asistente que reutilice nada; eso lo tiene que sacar por sí sola la skill /examen (apartado
// 3: "antes de escribir nada nuevo, reutiliza lo que el alumno falló"). La comprobación (p.verificarReutilizacionFalladas)
// es en disco, sin LLM: calcula con la misma lib que usa `examen.js --falladas` qué preguntas se fallaron
// en el primer examen y comprueba que todas reaparecen en la clave del segundo, trazadas.
function pasoExamenSegundoGenerar(ctx, examenModulo) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen anterior: no se puede pedir uno nuevo para comprobar la reutilización' };
  const r = invocar(ctx, `Otra vez el examen del ${examenModulo.titulo.toLowerCase()}. Sigue la skill /examen. ${PROMPT_COMUN}`, 'examen-segundo-generar');
  if (!r.ok) return { ok: false, detalle: `${ctx.lanzador.nombre} falló (código ${r.codigo})`, salidaLlm: r.salida };
  const v = p.verificarReutilizacionFalladas(ctx.destino, { unidad: examenModulo.prefijo, ficheroAnterior: ctx.ficheroExamen });
  if (v.ficheroNuevo) ctx.ficheroExamenSegundo = v.ficheroNuevo;
  return { ok: v.ok, detalle: v.detalle, salidaLlm: v.ok ? undefined : r.salida };
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

function markdownResumen({ fecha, version, modelo, sinLlm, pasos, informe, conteos, perfil, correccion, commit, asistente = 'claude-code', desde }) {
  const l = [];
  l.push('# Resultado de la prueba real del profesor', '');
  if (sinLlm) l.push('> **Modo `--sin-llm`: no se ha ejecutado ningún LLM real.** Solo se ha montado el curso y probado', '> el propio ejecutor. Ejecuta `npm run prueba-real` (sin ese flag) para una prueba de verdad.', '');
  if (desde) l.push(`> **Reanudada con \`--desde "${desde}"\`:** trae pasos de una ejecución anterior (marcados abajo).`, '> No cuenta como prueba real completa para el PR: hace falta una ejecución entera y seguida.', '');
  l.push(`- **Fecha:** ${fecha}`, `- **Versión del kit:** ${version}`, `- **Modelo:** ${modelo || 'el suyo por defecto'}`, `- **Asistente:** ${asistente}`, '');
  // Línea fija que lee .github/cambio-grande.js: no se cambia su forma sin cambiar allí la expresión. Con
  // --desde lleva "(desde ...)" a propósito, para que esa lectura NO la reconozca como una prueba completa.
  const hechos = pasos.filter(x => x.ok !== null);
  const c = correccion || { bien: 0, total: 0 };
  const sufijoDesde = desde ? ` (desde "${desde}")` : '';
  l.push(`Resultado: ${hechos.filter(x => x.ok).length}/${hechos.length} pasos bien${sufijoDesde} · corrección ${c.bien}/${c.total} · commit ${commit || 'desconocido'}`, '');
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

// La lista ordenada de pasos, como datos (nombre + función a ejecutar): el caso de verdad con choques
// posibles (plan 0.22, §4) — las clases del módulo del examen en primer plano, la que no hace falta para
// ese examen en segundo plano (en paralelo con dudas, ejercicio y el examen), juntada al final. Como datos,
// se puede saltar a mitad (`--desde`) sin repetir los pasos anteriores. `ctx` se lee al ejecutar cada
// función, no al construir la lista: da igual que se rellene (destino, lanzador...) después de esto.
function construirDefinicionDePasos(ctx, clases) {
  const prefijoExamen = clases.examen_modulo.prefijo;
  const clasesModuloDelExamen = clases.clases.filter(c => c.id.startsWith(prefijoExamen));
  const clasesEnSegundoPlano = clases.clases.filter(c => !c.id.startsWith(prefijoExamen));
  const [claseEnSegundoPlano, ...otrasEnSegundoPlano] = clasesEnSegundoPlano;
  const progresoAntesPorClase = {};

  const lista = [];
  for (const clase of clasesModuloDelExamen) {
    lista.push({
      nombre: `/sesion ${clase.id}`,
      fn: () => {
        const ficheroProgreso = path.join(ctx.destino, 'estudio', 'progreso.md');
        progresoAntesPorClase[clase.id] = fs.existsSync(ficheroProgreso) ? fs.readFileSync(ficheroProgreso, 'utf8') : '';
        return pasoSesion(ctx, clase);
      },
    });
    if (clase.trampa && !ctx.sinLlm) {
      lista.push({
        nombre: `material con órdenes (${clase.id})`,
        fn: () => p.comprobarTrampa(ctx.destino, { id: clase.id, concepto: clase.trampa.concepto, progresoAntes: progresoAntesPorClase[clase.id] }),
      });
    }
  }
  if (claseEnSegundoPlano) lista.push({ nombre: `preparar.js --lanzar ${claseEnSegundoPlano.id}`, fn: () => pasoPrepararEnSegundoPlano(ctx, claseEnSegundoPlano) });
  lista.push({ nombre: '/dudas', fn: () => pasoDudas(ctx) });
  lista.push({ nombre: '/ejercicio', fn: () => pasoEjercicio(ctx) });
  lista.push({ nombre: '/examen (referencia del centro)', fn: () => pasoExamenReferencia(ctx) });
  lista.push({ nombre: '/examen (generar)', fn: () => pasoExamenGenerar(ctx, clases.examen_modulo) });
  lista.push({ nombre: '/examen (contestar)', fn: () => pasoExamenContestar(ctx) });
  lista.push({ nombre: '/examen (corregir)', fn: () => pasoExamenCorregir(ctx, clases.examen_modulo) });
  lista.push({ nombre: '/examen (progreso con prueba)', fn: () => pasoProgresoConPrueba(ctx) });
  lista.push({ nombre: '/examen (otra vez, reutiliza falladas)', fn: () => pasoExamenSegundoGenerar(ctx, clases.examen_modulo) });
  lista.push({ nombre: '/examen (corrección con veredictos esperados)', fn: () => pasoCorreccionOraculo(ctx) });
  if (claseEnSegundoPlano) lista.push({ nombre: `preparar.js --juntar ${claseEnSegundoPlano.id}`, fn: () => pasoJuntarPreparacion(ctx, claseEnSegundoPlano) });
  for (const clase of otrasEnSegundoPlano) lista.push({ nombre: `/sesion ${clase.id}`, fn: () => pasoSesion(ctx, clase) });
  lista.push({ nombre: '/repaso', fn: () => pasoRepaso(ctx, clases.examen_modulo) });

  return { lista, claseEnSegundoPlano };
}

// Los nombres de la lista, sin construir sus funciones: lo que necesita cli() para validar --desde antes de
// tocar nada (ni un curso montado, ni `claude`).
function nombresDePasos(clases, sinLlm = false) {
  return construirDefinicionDePasos({ sinLlm }, clases).lista.map(d => d.nombre);
}

function ejecutar({
  sinLlm, modelo: modeloArg, limiteMs, trabajo = RAIZ_KIT, datosCurso = EJEMPLO, asistente, resultadoDir = rutaResultado(asistente),
  volcarDir, desde, copiasDir,
}) {
  if (desde && sinLlm) throw new Error('--desde no se puede combinar con --sin-llm: hace falta una ejecución real para poder continuarla.');
  const clases = leerJson(path.join(datosCurso, 'clases.json'));
  const nombre = leerJson(path.join(datosCurso, 'config', 'ajustes.json')).nombre_curso;

  const ctx = { sinLlm, datosCurso, volcarDir };
  const { lista: definicionDePasos, claseEnSegundoPlano } = construirDefinicionDePasos(ctx, clases);
  const nombresPasos = definicionDePasos.map(d => d.nombre);

  let destino, motor = null, pasosAnteriores = [], indiceDesde = 0;
  if (desde) {
    const restaurado = restaurarPasoAnterior(copiasDir, nombresPasos, desde);
    indiceDesde = restaurado.indiceDesde;
    if (restaurado.destino) { destino = restaurado.destino; pasosAnteriores = restaurado.pasosAnteriores; Object.assign(ctx, restaurado.ctxRestaurado); }
  }
  if (!destino) ({ destino, motor } = montarCurso({ trabajo, datosCurso, nombre, llm: asistente }));
  ctx.destino = destino;

  try {
    const { llm, adaptador } = adaptadorDelCurso(destino);
    if (!adaptador) throw new Error(`el curso usa \`${llm}\` y no tiene adaptador`);
    ctx.lanzador = lanzadorPara(adaptador);
    ctx.adaptador = adaptador;
    ctx.modelo = modeloArg || modeloRecomendado(destino);
    ctx.limiteMs = limiteMs;
    ctx.commit = (spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: trabajo, encoding: 'utf8' }).stdout || '').trim();

    // Una copia del curso tras cada paso nuevo (con el estado de ctx), para poder repetir desde el que
    // falle (`--desde`). Si todo pasa, se borran con el curso; si algo falla, se quedan y se dice dónde.
    pasosFallidos = true;
    copiasPorPaso = sinLlm ? null : fs.mkdtempSync(path.join(os.tmpdir(), PREFIJO_COPIAS));

    // Si venimos de restaurar y la clase en segundo plano se quedó a medias, se repara antes de que el
    // paso de juntar tenga que esperar algo que nunca va a terminar (se anota en su propio detalle).
    if (desde && claseEnSegundoPlano) ctx.preparacionReparada = repararPreparacionSiHaceFalta(ctx, claseEnSegundoPlano);

    const pasos = ejecutarListaDePasos(definicionDePasos.slice(indiceDesde), pasosAnteriores, ps => guardarCopiaDelPaso(ctx, ps));

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
      modelo: ctx.modelo, sinLlm, pasos, informe, conteos, perfil, correccion: ctx.correccion, asistente: llm, commit: ctx.commit, desde,
    });
    fs.writeFileSync(path.join(resultadoDir, 'RESUMEN.md'), resumen);

    pasosFallidos = pasos.some(x => x.ok === false);
    return { pasos, informe, motor, resultadoDir };
  } finally {
    if (!pasosFallidos) {
      borrar(destino);
      if (copiasPorPaso) borrar(copiasPorPaso);
    } else {
      console.log(`\nAlgo ha fallado: el curso de la prueba se queda en ${destino}`
        + (copiasPorPaso ? ` y la copia tras cada paso en ${copiasPorPaso}` : '') + '. Bórralos cuando ya no hagan falta.');
    }
  }
}

// Todo lo que hay que validar de --desde antes de tocar nada (ni montar un curso, ni comprobar si hay
// `claude`): un argumento mal puesto se dice al momento, sin esperar a que arranque el resto. Aparte de
// cli(), para poder probarlo sin lanzar nada de verdad.
function validarDesde(desde, sinLlm, copiasArg) {
  if (!desde) return { ok: true, copiasDir: null };
  if (sinLlm) return { ok: false, mensaje: '--desde no se puede combinar con --sin-llm: hace falta una ejecución real para poder continuarla.' };
  const nombresValidos = nombresDePasos(leerJson(path.join(EJEMPLO, 'clases.json')), false);
  const indiceDesde = nombresValidos.indexOf(desde);
  if (indiceDesde < 0) return { ok: false, mensaje: `Paso desconocido: "${desde}". Pasos válidos:\n${nombresValidos.map(n => `  - ${n}`).join('\n')}` };
  if (indiceDesde === 0) return { ok: true, copiasDir: null };   // el primer paso: nada que restaurar, es una ejecución normal
  const copiasDir = copiasArg || carpetaCopiasMasReciente();
  if (!copiasDir || !fs.existsSync(copiasDir)) {
    return {
      ok: false,
      mensaje: `No hay ninguna copia que restaurar${copiasArg ? ` en ${copiasArg}` : ' (no se encontró ninguna carpeta prueba-real-pasos-* en el temporal)'}: indica --copias <carpeta>.`,
    };
  }
  return { ok: true, copiasDir };
}

function cli(args) {
  const valor = nombre => { const i = args.indexOf(nombre); return i >= 0 ? args[i + 1] : undefined; };
  const sinLlm = args.includes('--sin-llm');
  const modelo = valor('--modelo') || null;
  const limiteMs = Number(valor('--limite-ms')) || LIMITE_POR_DEFECTO_MS;
  const volcarDir = valor('--volcar');
  const desde = valor('--desde') || null;
  const copiasArg = valor('--copias') || null;
  // Sin --asistente, el llm del curso de ejemplo: con Claude Code nada cambia (issue #45).
  const asistente = valor('--asistente') || leerJson(path.join(EJEMPLO, 'config', 'ajustes.json')).llm || 'claude-code';
  const ficheroAdaptador = path.join(RAIZ_KIT, '.kit', 'adaptadores', `${asistente}.json`);
  if (!fs.existsSync(ficheroAdaptador)) { console.error(`el curso usa \`${asistente}\` y no tiene adaptador`); return 1; }
  const lanzador = lanzadorPara(leerJson(ficheroAdaptador));

  const validacion = validarDesde(desde, sinLlm, copiasArg);
  if (!validacion.ok) { console.error(validacion.mensaje); return 2; }
  const copiasDir = validacion.copiasDir;

  if (!sinLlm) {
    const chequeo = lanzador.comprobar();
    if (!chequeo.ok) { console.error(chequeo.mensaje); return 1; }
  }

  const resultadoDir = carpetaDeResultado({ sinLlm, asistente });
  let pasos, informe;
  try {
    ({ pasos, informe } = ejecutar({ sinLlm, modelo, limiteMs, asistente, resultadoDir, volcarDir, desde, copiasDir }));
  } catch (error) {
    if (error instanceof PasoDesconocidoError) {
      console.error(`Paso desconocido: "${desde}". Pasos válidos:\n${error.validos.map(n => `  - ${n}`).join('\n')}`);
      return 2;
    }
    if (error instanceof SinCopiasError) { console.error(error.message); return 2; }
    throw error;
  }
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
  ejecutar, cli, modeloRecomendado, adaptadorDelCurso, rutaResultado, carpetaDeResultado, markdownResumen, agruparPorRegla,
  argsClaude, entornoDeAlumno, leerSalidaClaude, lineaDePaso, invocarAsistente,
  construirDefinicionDePasos, nombresDePasos, ejecutarListaDePasos, restaurarPasoAnterior, carpetaCopiasMasReciente,
  repararPreparacionSiHaceFalta, pasoJuntarPreparacion, validarDesde, PasoDesconocidoError, SinCopiasError,
};
