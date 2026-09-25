'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const indice = require('./lib/indice');
const perfil = require('./lib/perfil');
const { comprobar } = require('./comprobar');
const g = require('./lib/git');

// La foto del curso al abrir (plan 0.22, §3.1): lo que el arranque necesita para confirmar con el alumno
// si toca estudiar lo ya preparado, esperar a que se prepare lo nuevo, o repasar mientras se prepara.
// Todo sale de disco: nadie rellena esto a mano, y es solo una sugerencia — el profesor la confirma siempre.
// Y las señales de que algo no funciona (`lib/perfil.js`), para que el profesor no tenga que acordarse de buscarlas.

// "Material nuevo" (plan §2): un fichero de estudio/inbox/ que ninguna sesión cita en su `fuente:`.
// Se compara por nombre de fichero, no por ruta completa: `fuente:` se escribe sin `estudio/` delante
// (AGENTS.md), y comparar solo el nombre es más tolerante a cómo cada sesión lo anotó.
function materialNuevo(raiz) {
  const base = v.baseAlumno(raiz);
  const ficheros = v.recorrer(path.join(base, 'inbox'), n => !n.startsWith('.'));
  const citados = new Set();
  for (const abs of v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_'))) {
    const fm = v.leerFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    const fuentes = Array.isArray(fm.fuente) ? fm.fuente : (fm.fuente ? [String(fm.fuente)] : []);
    for (const f of fuentes) citados.add(path.posix.basename(v.aPosix(f)));
  }
  return ficheros
    .map(abs => v.aPosix(path.relative(base, abs)))
    .filter(rel => !citados.has(path.posix.basename(rel)))
    .sort();
}

// true si el proceso sigue vivo. EPERM significa que existe pero no es nuestro (también cuenta como vivo);
// cualquier otro error (típicamente ESRCH) significa que ya no existe.
function pidVivo(pid) {
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

// Lee `.preparacion/<id>/estado.json` (contrato fijo: id, ficheros, pid, inicio, fin, resultado, rama).
// Si el `resultado` dice "en-curso" pero el proceso ya no existe, se reporta "interrumpida" (plan §5.2):
// el ordenador se apagó o se durmió a medio preparar, y el arranque siguiente tiene que saberlo.
function leerPreparaciones(raiz) {
  const dir = path.join(raiz, '.preparacion');
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const id of fs.readdirSync(dir).sort()) {
    const f = path.join(dir, id, 'estado.json');
    if (!fs.existsSync(f)) continue;
    let bruto;
    try { bruto = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    const inicio = new Date(bruto.inicio);
    const minutos = Number.isNaN(inicio.getTime()) ? null : Math.max(0, Math.round((Date.now() - inicio.getTime()) / 60000));
    const resultado = bruto.resultado === 'en-curso' && !pidVivo(bruto.pid) ? 'interrumpida' : bruto.resultado;
    salida.push({ id: bruto.id || id, ficheros: Array.isArray(bruto.ficheros) ? bruto.ficheros : [], resultado, minutos });
  }
  return salida;
}

// El caso sugerido (tabla del plan §2): 1 si no hay material nuevo; si lo hay, 3 cuando queda algo por
// estudiar de lo ya preparado o algo en 🔁 (atrasado), y 2 en el resto (al día).
// Avisos que crecen (plan 0.23.0, tarea 12): no bloquean, pero se revisan cada cierto tiempo. Señal si hay al menos
// 10 más que en la última revisión (`comprobar.js --revisado`), o si han pasado 30 días desde ella y sigue habiendo.
const AVISOS_DE_MAS = 10;
const DIAS_SIN_REVISAR = 30;
function leerRevision(raiz) {
  try { return JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'revision-avisos.json'), 'utf8')); } catch { return null; }
}
// Sin ninguna revisión, cuenta desde el primer guardado del curso (`inicio`): un curso que nunca se revisa también
// acaba avisando, aunque sus avisos no crezcan de golpe.
function senalAvisos(revision, avisos, hoy = new Date().toISOString().slice(0, 10), inicio = null) {
  if (!revision && inicio) revision = { fecha: inicio, avisos: 0, desdeElInicio: true };
  const antes = revision && Number.isInteger(revision.avisos) ? revision.avisos : 0;
  const desde = revision && revision.fecha ? ` desde el ${revision.fecha}` : '';
  if (avisos - antes >= AVISOS_DE_MAS) {
    const cuando = revision && revision.fecha && !revision.desdeElInicio ? ` (del ${revision.fecha})` : '';
    return { tipo: 'avisos-acumulados', detalle: `${avisos} avisos, ${avisos - antes} más que en la última revisión${cuando}` };
  }
  const dias = revision && revision.fecha ? (Date.parse(hoy) - Date.parse(revision.fecha)) / 86400000 : 0;
  if (avisos > 0 && dias >= DIAS_SIN_REVISAR) return { tipo: 'avisos-acumulados', detalle: `${avisos} avisos sin revisar${desde}` };
  return null;
}

// La señal de avisos es accesoria: si comprobar revienta por algo raro del curso (una carpeta llamada "x.md"), el
// arranque sigue sin ella; el caso sugerido y las preparaciones son lo que importa (revisión de la 0.23.0).
function senalDeAvisos(raiz) {
  try {
    const primero = g.intentarGit(raiz, ['log', '--max-parents=0', '--format=%cs']);
    const inicio = primero.ok ? (primero.stdout.trim().split(/\r?\n/).pop() || '').slice(0, 10) || null : null;
    return senalAvisos(leerRevision(raiz), comprobar(raiz).avisos.length, undefined, inicio);
  } catch {
    return null;
  }
}

// El curso vive en más de un sitio (el Mac del alumno, un asistente en la nube: plan 0.27, B). Antes de
// trabajar sobre uno atrasado (lo que crea el lío), un `git fetch` rápido dice si el otro sitio ha guardado
// algo que aquí no se ha traído, o si aquí hay guardados que allí no se han subido. Nunca bloquea: sin
// remoto, sin red o si el fetch tarda más de `timeoutMs`, no dice nada (ver `guardar.js --traer`, que sí
// hace el trabajo de traer y mezclar). `ejecutarFetch` se inyecta en los tests: así no hay que esperar de
// verdad a un timeout de red para probar "sin red" o "tarda demasiado".
const TIMEOUT_FETCH_MS = 8000;
// El repo del kit, para no ofrecer nunca "sincronizar" con él (revisión de la 0.27, media 7). Un curso a medio
// reparar puede no tener motor.json: entonces no hay con qué comparar, y no bloquea la señal por eso.
function repoDelKit(raiz) {
  try { return v.leerMotor(raiz).repo; } catch { return null; }
}
function senalSincronizacion(raiz, { ejecutarFetch = args => g.intentarGitRed(raiz, args, { timeoutMs: TIMEOUT_FETCH_MS }) } = {}) {
  try {
    if (!g.esRepo(raiz)) return null;
    const url = g.urlOrigen(raiz);
    if (!url || g.esUrlDelKit(url, repoDelKit(raiz))) return null;
    const rRama = g.intentarGit(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
    if (!rRama.ok) return null;
    const rama = rRama.stdout.trim();
    // 'HEAD' es detached (no debería pasar en un curso normal); una copia de preparación en segundo plano
    // (rama `preparacion/<id>`) es de preparar.js --juntar, no de esto.
    if (!rama || rama === 'HEAD' || rama.startsWith('preparacion/')) return null;

    const fetch = ejecutarFetch(['fetch', '-q', 'origin', rama]);
    if (!fetch.ok) return null;   // sin red, timeout o la rama todavía no existe en el remoto: no se dice nada
    if (!g.intentarGit(raiz, ['rev-parse', '--verify', `refs/remotes/origin/${rama}`]).ok) return null;

    const contar = rango => { const n = parseInt(g.intentarGit(raiz, ['rev-list', '--count', rango]).stdout.trim(), 10); return Number.isFinite(n) ? n : 0; };
    const detras = contar(`HEAD..origin/${rama}`);
    // "Sin subir" solo importa si el curso de verdad quiere publicar (revisión, baja): sin subir_a_github, unos
    // commits locales sin subir no son ningún problema que resolver, así que no cuentan para la señal.
    const publica = v.leerAjustes(raiz).subir_a_github === true;
    const delante = publica ? contar(`origin/${rama}..HEAD`) : 0;
    if (!detras && !delante) return null;

    const sinGuardar = g.hayCambios(raiz) ? ' (además, hay cambios sin guardar aquí)' : '';
    if (detras && delante) {
      return { tipo: 'curso-sin-sincronizar', detalle: `el curso y GitHub han cambiado cada uno por su lado (${delante} tuyo${delante === 1 ? '' : 's'} sin subir, `
        + `${detras} desde otro sitio sin traer): tráelos con node .kit/herramientas/guardar.js --traer${sinGuardar}` };
    }
    if (detras) {
      return { tipo: 'curso-sin-sincronizar', detalle: `hay cambios hechos desde otro sitio (${detras} guardado${detras === 1 ? '' : 's'}): `
        + `tráelos antes de seguir con node .kit/herramientas/guardar.js --traer${sinGuardar}` };
    }
    return { tipo: 'curso-sin-sincronizar', detalle: `hay ${delante} guardado${delante === 1 ? '' : 's'} sin subir a GitHub${sinGuardar}` };
  } catch {
    return null;
  }
}

function calcularEstado(raiz, { ejecutarFetch } = {}) {
  const preparaciones = leerPreparaciones(raiz);
  // Lo que ya está en una preparación en marcha o terminada (sin juntar todavía) no es material nuevo: si lo
  // fuera, el profesor ofrecería prepararlo otra vez (visto en la prueba real de la 0.22).
  const enPreparacion = new Set(preparaciones.filter(p => p.resultado === 'en-curso' || p.resultado === 'terminada')
    .flatMap(p => (p.ficheros || []).map(f => path.posix.basename(v.aPosix(String(f))))));
  const nuevos = materialNuevo(raiz).filter(rel => !enPreparacion.has(path.posix.basename(rel)));
  const sesiones = indice.leerSesiones(raiz).sort(indice.compararSesiones);
  const progreso = indice.leerProgreso(raiz);
  const siguiente = sesiones.find(s => !s.estudiada) || null;
  const preparadasSinEstudiar = sesiones.filter(s => !s.estudiada).map(s => s.id);
  const enRepaso = sesiones.filter(s => indice.estadoProfesor(s.conceptos, progreso).marca === 'repasar').map(s => s.id);
  const atrasado = preparadasSinEstudiar.length > 0 || enRepaso.length > 0;
  const caso = nuevos.length === 0 ? 1 : (atrasado ? 3 : 2);
  return {
    materialNuevo: nuevos,
    siguienteSesion: siguiente ? siguiente.id : null,
    preparadasSinEstudiar,
    enRepaso,
    preparaciones,
    caso,
    // La sincronización va la primera (AGENTS.md, plan 0.27): trabajar sobre un curso atrasado es lo que crea
    // el lío, antes que cualquier otra cosa que ver con este alumno.
    senales: [senalSincronizacion(raiz, { ejecutarFetch }), ...perfil.senales(raiz), senalDeAvisos(raiz)].filter(Boolean),
  };
}

function imprimir(estado) {
  const l = [];
  l.push(`Caso sugerido: ${estado.caso}`);
  l.push(estado.materialNuevo.length ? `Material nuevo: ${estado.materialNuevo.join(', ')}` : 'Material nuevo: ninguno');
  l.push(estado.siguienteSesion ? `Siguiente sesión sin estudiar: ${estado.siguienteSesion}` : 'Siguiente sesión sin estudiar: ninguna');
  l.push(estado.preparadasSinEstudiar.length ? `Preparadas sin estudiar: ${estado.preparadasSinEstudiar.join(', ')}` : 'Preparadas sin estudiar: ninguna');
  l.push(estado.enRepaso.length ? `En repaso (🔁): ${estado.enRepaso.join(', ')}` : 'En repaso (🔁): ninguna');
  if (estado.preparaciones.length) {
    for (const p of estado.preparaciones) {
      const detalle = p.resultado === 'en-curso' ? `en curso (${p.minutos === null ? '?' : p.minutos} min)` : p.resultado;
      l.push(`Preparación ${p.id}: ${detalle} (${p.ficheros.join(', ') || 'sin ficheros'})`);
    }
  } else {
    l.push('Preparaciones: ninguna');
  }
  if (estado.senales.length) for (const s of estado.senales) l.push(`Señal (${s.tipo}): ${s.detalle}`);
  else l.push('Señales: ninguna');
  console.log(l.join('\n'));
}

function cli(args, raizPorDefecto) {
  const i = args.indexOf('--raiz');
  const raiz = i >= 0 ? path.resolve(args[i + 1]) : raizPorDefecto;
  const estado = calcularEstado(raiz);
  if (args.includes('--json')) console.log(JSON.stringify(estado));
  else imprimir(estado);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'estado.js');

module.exports = { materialNuevo, pidVivo, leerPreparaciones, calcularEstado, imprimir, cli, senalAvisos, senalSincronizacion };
