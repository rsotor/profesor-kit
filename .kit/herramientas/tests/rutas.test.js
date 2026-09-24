'use strict';
// issue #39, H02: toda ruta que viene de un fichero (motor.json, el manifiesto de skills, estructura.json) se
// comprueba igual en Windows y en Mac antes de escribir o borrar nada con ella.
const test = require('node:test');
const assert = require('node:assert/strict');
const { motivoRutaNoSegura } = require('../lib/rutas');

test('rutas: las relativas normales, con /, valen', () => {
  for (const r of ['AGENTS.md', '.kit/herramientas/guardar.js', 'modulo-01/1.1-intro', '.claude/skills']) {
    assert.equal(motivoRutaNoSegura(r), null, r);
  }
});

test('rutas: salir de su sitio, rutas absolutas y separadores de Windows no valen', () => {
  const malas = ['', '.', '..', '../fuera', 'a/../../fuera', 'a/./b', 'a//b', 'a/', '/etc/x', 'C:/x', 'c:x',
    '\\\\servidor\\x', 'estudio\\notas', '..\\fuera', 'a/b:flujo', 'a\u0000b', 7, null];
  for (const r of malas) assert.notEqual(motivoRutaNoSegura(r), null, JSON.stringify(r));
});

test('rutas: .git en cualquier tramo y las carpetas protegidas, sin distinguir mayúsculas', () => {
  const protegidas = ['config', 'estudio', 'README.md'];
  for (const r of ['.git', '.GIT/config', 'a/.git/x', 'CONFIG', 'Estudio/x', 'readme.md']) {
    assert.notEqual(motivoRutaNoSegura(r, { protegidas }), null, r);
  }
  assert.equal(motivoRutaNoSegura('configuracion.md', { protegidas }), null);
});

test('rutas: un solo tramo cuando se pide (nombres de skill)', () => {
  assert.equal(motivoRutaNoSegura('sesion', { unTramo: true }), null);
  assert.notEqual(motivoRutaNoSegura('a/b', { unTramo: true }), null);
  assert.notEqual(motivoRutaNoSegura('../../victim', { unTramo: true }), null);
});
