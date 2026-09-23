'use strict';
const { ejecutar, explicar } = require('./proceso');

function intentarGit(raiz, args) {
  return ejecutar('git', args, { cwd: raiz });
}

function git(raiz, args) {
  const r = intentarGit(raiz, args);
  if (!r.ok) throw new Error(`git ${args[0]} falló: ${explicar(r)}`);
  return r.salida;
}

const esRepo = raiz => intentarGit(raiz, ['rev-parse', '--is-inside-work-tree']).ok;
const hayCambios = raiz => git(raiz, ['status', '--porcelain']) !== '';
const shaActual = raiz => git(raiz, ['rev-parse', 'HEAD']);
// La rama en la que está HEAD ahora mismo: 'preparacion/<id>' en una copia de trabajo de preparar.js,
// o 'HEAD' si está en detached HEAD (no debería pasar en un curso normal).
const ramaActual = raiz => git(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
// `git var` decide como decide `git commit`: una identidad vacía (user.name= en el global de una máquina con
// varias cuentas) hace que `git config` responda pero el commit falle.
const tieneIdentidad = raiz =>
  intentarGit(raiz, ['var', 'GIT_AUTHOR_IDENT']).ok && intentarGit(raiz, ['var', 'GIT_COMMITTER_IDENT']).ok;

function urlOrigen(raiz) {
  const r = intentarGit(raiz, ['remote', 'get-url', 'origin']);
  return r.ok ? r.salida : null;
}

module.exports = { git, intentarGit, esRepo, hayCambios, shaActual, ramaActual, tieneIdentidad, urlOrigen };
