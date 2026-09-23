'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');

// Que el profesor escale al kit no puede depender de que "se dé cuenta": el hueco tiene que estar delante.
test('cada skill de trabajo cierra con el hueco "Del kit", y cada herramienta arranca por lib/arranque.js', () => {
  for (const s of ['sesion', 'dudas', 'examen', 'configurar']) {
    assert.match(fs.readFileSync(path.join(RAIZ, '.kit', 'skills', s, 'SKILL.md'), 'utf8'), /Del kit:\s+nada/, s);
  }
  for (const h of fs.readdirSync(path.join(RAIZ, '.kit', 'herramientas')).filter(n => n.endsWith('.js'))) {
    assert.match(fs.readFileSync(path.join(RAIZ, '.kit', 'herramientas', h), 'utf8'), /require\('\.\/lib\/arranque'\)\.arrancar\(/, h);
  }
});

test('arranque: un fallo inesperado lo dice, señala al kit y sale con 3', () => {
  const { spawnSync } = require('node:child_process');
  const r = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(path.join(RAIZ, '.kit', 'herramientas', 'lib', 'arranque.js'))}).arrancar(() => { throw new Error('pum'); }, '.', 'x.js')`], { encoding: 'utf8' });
  assert.equal(r.status, 3);
  assert.match(r.stderr, /Fallo inesperado en x\.js: pum[\s\S]*Esto es del kit, no del curso/);
});

// issue #33: en un entorno restringido (sandbox de Codex), un permiso denegado al ejecutar o escribir no
// es un fallo del kit — es del entorno del alumno, y decir "abre una issue" ahí solo confunde.
test('arranque: un permiso denegado (EACCES/EPERM/EIO) no dice que sea "del kit"', () => {
  const { spawnSync } = require('node:child_process');
  const arranqueJs = JSON.stringify(path.join(RAIZ, '.kit', 'herramientas', 'lib', 'arranque.js'));
  for (const codigo of ['EACCES', 'EPERM', 'EIO']) {
    const script = `const e = new Error('denegado'); e.code = '${codigo}'; require(${arranqueJs}).arrancar(() => { throw e; }, '.', 'x.js')`;
    const r = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    assert.equal(r.status, 3, codigo);
    assert.match(r.stderr, /entorno restringido/, codigo);
    assert.doesNotMatch(r.stderr, /Esto es del kit/, codigo);
  }
});

test('arranque: un comando o fichero inexistente (ENOENT) tampoco es "del kit"', () => {
  const { spawnSync } = require('node:child_process');
  const arranqueJs = JSON.stringify(path.join(RAIZ, '.kit', 'herramientas', 'lib', 'arranque.js'));
  const script = `const e = new Error('no encontrado'); e.code = 'ENOENT'; require(${arranqueJs}).arrancar(() => { throw e; }, '.', 'x.js')`;
  const r = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  assert.equal(r.status, 3);
  assert.match(r.stderr, /no encuentra un comando o un fichero/);
  assert.doesNotMatch(r.stderr, /Esto es del kit/);
});
