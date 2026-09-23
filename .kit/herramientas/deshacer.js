'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { comprobar } = require('./comprobar');
const { anotarEnDiario, subirSiProcede } = require('./guardar');
const { CARPETA_ALUMNO } = require('./lib/vault');

// Commits que no son un guardado del alumno: los pone actualizar.js, no una skill con el alumno delante.
// "Deshacer lo último" no es la herramienta para volver atrás una actualización del kit.
const NO_ES_GUARDADO_DEL_ALUMNO = /^(kit: actualizado a |guardado antes de actualizar a )/;
const ES_DESHACER = /^deshacer: /;

function ultimoCommit(raiz) {
  const [sha, ...resto] = g.git(raiz, ['log', '-1', '--format=%H%n%s']).split('\n');
  return { sha, mensaje: resto.join('\n') };
}

// Qué ficheros toca el commit que se va a deshacer, con la ruta como la ve el alumno en Obsidian
// (sin `estudio/` delante) y en llano.
const ETIQUETA = { A: 'nuevo', M: 'cambiado', D: 'borrado', R: 'renombrado', C: 'copiado' };
function ficherosAfectados(raiz, sha) {
  const salida = g.git(raiz, ['show', '--name-status', '--format=', sha]);
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

  const { sha, mensaje } = ultimoCommit(raiz);
  // Deshacer un deshacer es rehacer: se permite, es un guardado del alumno como cualquier otro revert.
  if (!ES_DESHACER.test(mensaje) && NO_ES_GUARDADO_DEL_ALUMNO.test(mensaje)) {
    return { deshecho: false, motivo: 'no-es-guardado', mensaje };
  }

  const ficheros = ficherosAfectados(raiz, sha);
  if (ver) return { deshecho: false, ver: true, motivo: 'vista-previa', mensaje, ficheros };

  const revert = g.intentarGit(raiz, ['revert', '--no-commit', 'HEAD']);
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
  'sin-repo': 'Esta carpeta no es un repositorio git.',
  'sin-commits': 'Todavía no hay nada guardado que deshacer.',
  'cambios-sin-guardar': 'Hay cambios sin guardar: deshacer ahora los perdería o los mezclaría con lo que se '
    + 'deshace. Guárdalos primero (guardar.js) o descártalos, y decide con el alumno.',
  'no-es-guardado': 'Lo último no es un guardado del alumno, es del kit: para volver atrás una actualización '
    + 'hay que pedirlo aparte, "deshacer lo último" no es la herramienta.',
  'conflicto': 'No se ha podido deshacer: al revertir hay un conflicto con cambios posteriores. No ha cambiado nada.',
};

function cli(args, raiz) {
  const ver = args.includes('--ver');
  const r = deshacer({ raiz, ver });
  if (!r.deshecho && !r.ver) { console.log(EXPLICACION[r.motivo]); return r.motivo === 'sin-repo' || r.motivo === 'sin-commits' ? 0 : 1; }
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
