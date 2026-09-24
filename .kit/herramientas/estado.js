'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const indice = require('./lib/indice');
const perfil = require('./lib/perfil');
const { comprobar } = require('./comprobar');

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
function senalAvisos(revision, avisos, hoy = new Date().toISOString().slice(0, 10)) {
  const antes = revision && Number.isInteger(revision.avisos) ? revision.avisos : 0;
  const desde = revision && revision.fecha ? ` desde el ${revision.fecha}` : '';
  if (avisos - antes >= AVISOS_DE_MAS) {
    const cuando = revision && revision.fecha ? ` (del ${revision.fecha})` : '';
    return { tipo: 'avisos-acumulados', detalle: `${avisos} avisos, ${avisos - antes} más que en la última revisión${cuando}` };
  }
  const dias = revision && revision.fecha ? (Date.parse(hoy) - Date.parse(revision.fecha)) / 86400000 : 0;
  if (avisos > 0 && dias >= DIAS_SIN_REVISAR) return { tipo: 'avisos-acumulados', detalle: `${avisos} avisos sin revisar${desde}` };
  return null;
}

function calcularEstado(raiz) {
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
    senales: [...perfil.senales(raiz), senalAvisos(leerRevision(raiz), comprobar(raiz).avisos.length)].filter(Boolean),
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

module.exports = { materialNuevo, pidVivo, leerPreparaciones, calcularEstado, imprimir, cli, senalAvisos };
