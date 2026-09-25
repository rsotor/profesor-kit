'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { comprobar } = require('./comprobar');
const { anotarEnDiario, subirSiProcede } = require('./guardar');
const { CARPETA_ALUMNO } = require('./lib/vault');

// Commits que no son un guardado del alumno: los pone actualizar.js o guardar.js --traer, no una skill con el
// alumno delante. "Deshacer lo último" no es la herramienta para volver atrás una actualización del kit, ni
// para deshacer lo que se acaba de traer de otro sitio (revisión de la 0.27, grave 2): eso movería el curso a
// un estado que ni existió aquí ni existe ya en GitHub, y en los dos sitios a la vez si además se sube.
const NO_ES_GUARDADO_DEL_ALUMNO = /^(kit: actualizado a |guardado antes de actualizar a |guardado antes de traer|traer: )/;
const ES_DESHACER = /^deshacer: /;

// Un avance rápido (`git merge --ff-only`, lo único que hace --traer cuando solo estaba detrás) no crea un
// commit nuevo: HEAD se mueve sin más, con el mensaje del commit que sea que trajera (de otro sitio, no de
// aquí, y sin ningún prefijo reconocible: puede ser "sesion(3): tema" tal cual). No hay mensaje que mirar
// para reconocerlo: se ve en el reflog, que sí registra el movimiento. AncladO al formato exacto de git
// (revisión de la 0.27, segunda ronda, baja 1): sin anclar, un guardado normal cuyo ASUNTO mencionase la
// palabra "fast-forward" como texto (el reflog de un commit normal repite su mensaje: "commit: sesion(4):
// qué es un fast-forward en redes") se leería como si fuera el propio mecanismo de git.
function fueAvanceRapidoDeTraer(raiz) {
  const r = g.intentarGit(raiz, ['reflog', '-1', '--format=%gs', 'HEAD']);
  return r.ok && /^merge .*: Fast-forward$/.test(r.stdout.trim());
}

function ultimoCommit(raiz) {
  const [sha, ...resto] = g.git(raiz, ['log', '-1', '--format=%H%n%s']).split('\n');
  return { sha, mensaje: resto.join('\n') };
}

// Qué ficheros toca el commit que se va a deshacer, con la ruta como la ve el alumno en Obsidian
// (sin `estudio/` delante) y en llano.
const ETIQUETA = { A: 'nuevo', M: 'cambiado', D: 'borrado', R: 'renombrado', C: 'copiado' };
// Un merge (juntar una preparación) no tiene un único "antes": se compara con su primer padre, que es el curso
// principal tal como estaba (issue #39, H06).
const esMerge = (raiz, sha) => g.git(raiz, ['rev-list', '--parents', '-n', '1', sha]).trim().split(/\s+/).length > 2;
function ficherosAfectados(raiz, sha) {
  const salida = esMerge(raiz, sha)
    ? g.git(raiz, ['diff', '--name-status', `${sha}^1`, sha])
    : g.git(raiz, ['show', '--name-status', '--format=', sha]);
  return salida.split('\n').filter(Boolean).map(linea => {
    const partes = linea.split('\t');
    const letra = partes[0][0];
    let ruta = partes[partes.length - 1];
    if (ruta.startsWith(`${CARPETA_ALUMNO}/`)) ruta = ruta.slice(CARPETA_ALUMNO.length + 1);
    return `${ruta} (${ETIQUETA[letra] || 'cambiado'})`;
  });
}

// Deshace el último guardado con `git revert`, nunca con `reset`: la historia ya subida no se reescribe.
function deshacer({ raiz, ver = false, hoy }) {
  if (!g.esRepo(raiz)) return { deshecho: false, motivo: 'sin-repo' };
  if (!g.intentarGit(raiz, ['rev-parse', 'HEAD']).ok) return { deshecho: false, motivo: 'sin-commits' };
  if (g.hayCambios(raiz)) return { deshecho: false, motivo: 'cambios-sin-guardar' };
  // Sin identidad, el commit final fallaría con el revert ya aplicado: se comprueba antes de tocar nada.
  if (!ver && !g.tieneIdentidad(raiz)) return { deshecho: false, motivo: 'sin-identidad' };

  const { sha, mensaje } = ultimoCommit(raiz);
  // El fast-forward se mira ANTES que el mensaje (revisión, baja 1): es una señal estructural (cómo se movió
  // HEAD, en el reflog), no depende de texto que alguien pueda controlar o que coincida por casualidad. Deshacer
  // un deshacer es rehacer: se permite (es un guardado del alumno como cualquier otro revert), pero solo si de
  // verdad no fue un avance rápido de --traer.
  if (fueAvanceRapidoDeTraer(raiz) || (!ES_DESHACER.test(mensaje) && NO_ES_GUARDADO_DEL_ALUMNO.test(mensaje))) {
    return { deshecho: false, motivo: 'no-es-guardado', mensaje };
  }

  const ficheros = ficherosAfectados(raiz, sha);
  if (ver) return { deshecho: false, ver: true, motivo: 'vista-previa', mensaje, ficheros };

  const revert = g.intentarGit(raiz, ['revert', '--no-commit', ...(esMerge(raiz, sha) ? ['-m', '1'] : []), 'HEAD']);
  if (!revert.ok) {
    g.intentarGit(raiz, ['revert', '--abort']);
    return { deshecho: false, motivo: 'conflicto', mensaje };
  }

  const mensajeCommit = `deshacer: ${mensaje}`;
  anotarEnDiario(raiz, mensajeCommit, hoy);
  g.git(raiz, ['add', '-A']);
  g.git(raiz, ['commit', '-q', '-m', mensajeCommit]);

  const informe = comprobar(raiz);
  return { deshecho: true, mensaje, ficheros, informe, ...subirSiProcede(raiz, informe) };
}

const EXPLICACION = {
  'sin-repo': 'La carpeta del curso no es la raíz de su propio repositorio git (no tiene uno, o está dentro de otro): no se toca nada. Ejecuta node .kit/herramientas/diagnostico.js para ver cómo arreglarlo.',
  'sin-commits': 'Todavía no hay nada guardado que deshacer.',
  'cambios-sin-guardar': 'Hay cambios sin guardar: deshacer ahora los perdería o los mezclaría con lo que se '
    + 'deshace. Guárdalos primero (guardar.js) o descártalos, y decide con el alumno.',
  'no-es-guardado': 'Lo último no es un guardado del alumno aquí: es del kit (una actualización) o de --traer '
    + '(algo que llegó de otro sitio). "Deshacer lo último" no es la herramienta para eso: pide ayuda aparte.',
  // Revisión de la 0.27, segunda ronda (baja 2): un "guardado antes de traer/actualizar" no es puro kit o puro
  // --traer — lleva DENTRO lo que el alumno tenía pendiente en ese momento, guardado junto a la marca. Deshacer
  // ese commit se llevaría también lo suyo: el mensaje genérico de arriba no lo explicaba.
  'no-es-guardado-mezclado': 'Lo último mezcla un guardado tuyo con algo del kit o de --traer: lo tuyo está ahí, '
    + 'pero junto a lo traído (o justo antes de actualizar), en el mismo guardado. Deshacerlo se llevaría también '
    + 'lo tuyo. Si algo salió mal, que te lo arregle el profesor con una nueva edición, no "deshaciendo lo último".',
  'sin-identidad': 'Git no sabe quién eres todavía: sin eso no se puede guardar el deshacer. Hay que configurar '
    + 'user.name y user.email (ver INSTALAR-AGENTE.md, paso de identidad). No ha cambiado nada.',
  'conflicto': 'No se ha podido deshacer: al revertir hay un conflicto con cambios posteriores. No ha cambiado nada.',
};

const MEZCLADO_CON_ALGO_DEL_KIT = /^(guardado antes de traer|guardado antes de actualizar a)/;

function cli(args, raiz) {
  const ver = args.includes('--ver');
  const r = deshacer({ raiz, ver });
  if (!r.deshecho && !r.ver) {
    const motivo = r.motivo === 'no-es-guardado' && MEZCLADO_CON_ALGO_DEL_KIT.test(r.mensaje || '') ? 'no-es-guardado-mezclado' : r.motivo;
    console.log(EXPLICACION[motivo]);
    return r.motivo === 'sin-repo' || r.motivo === 'sin-commits' ? 0 : 1;
  }
  if (r.ver) {
    console.log(`Esto deshace: ${r.mensaje}`);
    console.log('Volverían a como estaban:');
    for (const f of r.ficheros) console.log(`- ${f}`);
    return 0;
  }
  console.log(`Deshecho: ${r.mensaje}`);
  console.log('Han vuelto a como estaban:');
  for (const f of r.ficheros) console.log(`- ${f}`);
  console.log(r.subido ? 'Subido a GitHub.' : `No se ha subido: ${r.motivoSubida}.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'deshacer.js');

module.exports = { deshacer, cli };
