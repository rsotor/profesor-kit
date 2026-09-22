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

test('cada guardado deja su línea en config/diario.md, dentro del mismo commit; sin cambios, no escribe nada', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const diario = path.join(raiz, 'config', 'diario.md');
  escribir(raiz, { 'estudio/formulario.md': '# F\n\nuno\n' });
  guardar({ raiz, mensaje: 'sesion(s02): tema', hoy: '2026-03-01' });
  assert.match(fs.readFileSync(diario, 'utf8'), /^# Diario del curso[\s\S]*- 2026-03-01 · sesion\(s02\): tema\n$/);
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'el diario va en el commit');
  guardar({ raiz, mensaje: 'nada', hoy: '2026-03-02' });
  assert.doesNotMatch(fs.readFileSync(diario, 'utf8'), /nada/);
  escribir(raiz, { 'estudio/formulario.md': '# F\n\ndos\n' });
  guardar({ raiz, mensaje: 'dudas: 1 resuelta', hoy: '2026-03-02' });
  assert.match(fs.readFileSync(diario, 'utf8'), /sesion\(s02\): tema\n- 2026-03-02 · dudas: 1 resuelta\n$/);
});

test('el diario respeta lo que el profesor escribió a mano (una línea "en curso")', () => {
  const raiz = cursoTemporal({ 'config/diario.md': '# Diario del curso\n\n- 2026-03-01 · en curso: procesando la clase 3\n' });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/formulario.md': '# F\n\nx\n' });
  guardar({ raiz, mensaje: 'sesion(s03): tema', hoy: '2026-03-01' });
  assert.match(fs.readFileSync(path.join(raiz, 'config', 'diario.md'), 'utf8'), /en curso: procesando la clase 3\n- 2026-03-01 · sesion\(s03\): tema\n$/);
});

test('al guardar se reúne la auditoría del material de todas las sesiones, por bloque; la plantilla vacía no cuenta', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n[[alfa]]\n\n## Auditoría del material\n\n- El Excel usa un 10 % y el PDF un 9 %.\n- La hoja 2 está vacía.\n\n## Para pensarlo despacio\n\nx\n',
    'estudio/sesiones/s02-tema.md': '---\ntipo: sesion\nbloque: 2\n---\n[[alfa]]\n\n## Auditoría del material\n\n<Discrepancias entre los ficheros de la clase, errores detectados y qué falta.>\n',
    'estudio/mapa-del-curso.md': '[[s01-intro]] [[s02-tema]]',
  });
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  const a = fs.readFileSync(path.join(raiz, 'estudio', 'auditoria-del-material.md'), 'utf8');
  assert.match(a, /## Bloque 1\n\n### \[\[sesiones\/s01-intro\]\]\n\n- El Excel usa un 10 % y el PDF un 9 %\.\n- La hoja 2 está vacía\./);
  assert.doesNotMatch(a, /Bloque 2|Discrepancias entre/);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});
