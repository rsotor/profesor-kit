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
  escribir(raiz, { 'estudio/formulario.md': '# Formulario\n\nnuevo\n' });
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
  escribir(raiz, { 'estudio/formulario.md': '# Formulario\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.subido, true);
  assert.equal(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('con errores no guarda', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto]]\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, false);
  assert.equal(r.motivo, 'errores');
  assert.equal(git(raiz, 'log', '--format=%s').split('\n').length, 1);
});

test('con permitirErrores guarda, pero un secreto nunca se sube', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/inbox/x.txt': 'ghp_' + 'a1B2'.repeat(9) });
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
  escribir(raiz, { 'estudio/formulario.md': '# F\n\nx\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /remoto/);
});

test('al guardar se regenera estudio/pendientes.md, por bloques, con TODO, FALTA INFO y dudas', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n[[alfa]]\n\n⚠️ **FALTA INFO:** la tabla de la diapositiva 4\n',
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nbloques: [2]\n---\n**TODO:** confirmar la fecha\n\n@@ no lo pillo\n',
    'estudio/inbox/apuntes.md': 'apuntes sueltos @@ ¿esto qué era?\n',
  });
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  const p = fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8');
  assert.match(p, /## Bloque 1 \(1\)\n\n- \[ \] \*\*Falta material del curso\*\* · \[\[sesiones\/s01-intro\]\] — la tabla de la diapositiva 4/);
  assert.match(p, /## Bloque 2 \(2\)/);
  assert.match(p, /\*\*Pendiente del profesor\*\* · \[\[conceptos\/alfa\]\] — confirmar la fecha/);
  assert.match(p, /\*\*Duda tuya sin responder\*\* · \[\[conceptos\/alfa\]\] — no lo pillo/);
  assert.match(p, /## Sin bloque \(1\)[\s\S]*\[\[inbox\/apuntes\]\] — ¿esto qué era\?/);
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'pendientes.md queda guardado en el commit');
});

test('sin nada pendiente lo dice; y las flashcards heredan el bloque de su sesión', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8'), /Nada pendiente/);
  escribir(raiz, {
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 3\n---\n[[alfa]]\n',
    'estudio/flashcards/s01-intro.md': '---\ntipo: flashcards\nsesion: s01-intro\n---\n**TODO:** pregunta 4\n',
  });
  guardar({ raiz, mensaje: 'y' });
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8'), /## Bloque 3 \(1\)[\s\S]*flashcards\/s01-intro/);
});
