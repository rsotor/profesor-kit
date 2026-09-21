'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { guardar } = require('../guardar');
const { cursoTemporal, escribir, iniciarGit, git } = require('./ayuda');

function conOrigen(raiz) {
  const remoto = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-remoto-'));
  git(remoto, 'init', '-q', '--bare', '-b', 'main');
  git(raiz, 'remote', 'add', 'origin', remoto);
  git(raiz, 'push', '-q', '-u', 'origin', 'main');
  return remoto;
}
const ajustes = subir => JSON.stringify({ subir_a_github: subir, version_datos: 1 });

test('guarda en local y no sube si subir_a_github es false', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(false) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'formulario.md': '# Formulario\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.equal(git(raiz, 'log', '-1', '--format=%s'), 'sesion(s02): prueba');
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('sube cuando subir_a_github es true', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'formulario.md': '# Formulario\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.subido, true);
  assert.equal(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('con errores no guarda', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto]]\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, false);
  assert.equal(r.motivo, 'errores');
  assert.equal(git(raiz, 'log', '--format=%s').split('\n').length, 1);
});

test('con permitirErrores guarda, pero un secreto nunca se sube', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'inbox/x.txt': 'ghp_' + 'a1B2'.repeat(9) });
  const r = guardar({ raiz, mensaje: 'copia', permitirErrores: true });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /secreto/);
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('sin cambios no crea commit', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.deepEqual([guardar({ raiz, mensaje: 'x' }).guardado, guardar({ raiz, mensaje: 'x' }).motivo], [false, 'sin-cambios']);
});

test('sin remoto guarda en local y lo dice', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  escribir(raiz, { 'formulario.md': '# F\n\nx\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /remoto/);
});
