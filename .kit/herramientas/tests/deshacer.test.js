'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { deshacer, cli } = require('../deshacer');
const { guardar } = require('../guardar');
const g = require('../lib/git');
const { cursoTemporal, escribir, iniciarGit, git } = require('./ayuda');

const en = (raiz, rel) => path.join(raiz, ...rel.split('/'));

test('deshace el último guardado: el contenido vuelve a como estaba, con revert (nunca reset)', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const antes = fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  assert.notEqual(fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8'), antes);
  const previos = git(raiz, 'log', '--format=%H').split('\n').length;

  const r = deshacer({ raiz });
  assert.equal(r.deshecho, true);
  assert.equal(r.mensaje, 'sesion(s02): prueba');
  assert.equal(fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8'), antes);
  assert.ok(r.ficheros.some(f => f.includes('mapa-del-curso.md')));
  assert.ok(!r.ficheros.some(f => f.startsWith('estudio/')), 'las rutas no llevan estudio/ delante');
  assert.equal(git(raiz, 'log', '--format=%H').split('\n').length, previos + 1, 'crea un commit nuevo, no reescribe historia');
  assert.equal(git(raiz, 'log', '-1', '--format=%s'), 'deshacer: sesion(s02): prueba');
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

test('deja constancia en config/diario.md, dentro del mismo commit', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba', hoy: '2026-03-01' });
  deshacer({ raiz, hoy: '2026-03-02' });
  assert.match(
    fs.readFileSync(en(raiz, 'config/diario.md'), 'utf8'),
    /- 2026-03-02 · deshacer: sesion\(s02\): prueba\n$/,
  );
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

test('con cambios sin guardar, no hace nada y lo explica', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  const cabeza = git(raiz, 'rev-parse', 'HEAD');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nsin guardar\n' });

  const r = deshacer({ raiz });
  assert.equal(r.deshecho, false);
  assert.equal(r.motivo, 'cambios-sin-guardar');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), cabeza);
  assert.match(fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8'), /sin guardar/);
});

test('se niega si lo último no es un guardado del alumno, sino del kit', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'kit: actualizado a 0.22.0' });
  const cabeza = git(raiz, 'rev-parse', 'HEAD');

  const r = deshacer({ raiz });
  assert.equal(r.deshecho, false);
  assert.equal(r.motivo, 'no-es-guardado');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), cabeza, 'no toca nada');

  const raiz2 = cursoTemporal();
  iniciarGit(raiz2);
  escribir(raiz2, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz: raiz2, mensaje: 'guardado antes de actualizar a 0.22.0' });
  assert.equal(deshacer({ raiz: raiz2 }).motivo, 'no-es-guardado');
});

test('deshacer un deshacer es rehacer: se permite', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  const conElCambio = fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8');
  deshacer({ raiz });
  assert.notEqual(fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8'), conElCambio);

  const r = deshacer({ raiz });
  assert.equal(r.deshecho, true);
  assert.equal(fs.readFileSync(en(raiz, 'estudio/mapa-del-curso.md'), 'utf8'), conElCambio, 'vuelve el cambio: es rehacer');
});

test('--ver enseña qué se desharía sin tocar nada', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  const cabeza = git(raiz, 'rev-parse', 'HEAD');
  const estado = git(raiz, 'status', '--porcelain');

  const r = deshacer({ raiz, ver: true });
  assert.equal(r.deshecho, false);
  assert.equal(r.ver, true);
  assert.equal(r.mensaje, 'sesion(s02): prueba');
  assert.ok(r.ficheros.some(f => f.includes('mapa-del-curso.md')));
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), cabeza, 'no crea ningún commit');
  assert.equal(git(raiz, 'status', '--porcelain'), estado, 'no toca el árbol de trabajo');
});

test('un conflicto al revertir (raro) aborta, no cambia nada y lo explica', t => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  const cabeza = git(raiz, 'rev-parse', 'HEAD');
  const estado = git(raiz, 'status', '--porcelain');

  let abortado = false;
  const original = g.intentarGit;
  t.mock.method(g, 'intentarGit', (r, args) => {
    if (args[0] === 'revert' && args.includes('--no-commit')) return { ok: false, salida: 'conflicto simulado' };
    if (args[0] === 'revert' && args.includes('--abort')) { abortado = true; return { ok: true, salida: '' }; }
    return original(r, args);
  });

  const r = deshacer({ raiz });
  assert.equal(r.deshecho, false);
  assert.equal(r.motivo, 'conflicto');
  assert.ok(abortado, 'aborta el revert a medias');
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), cabeza, 'no ha cambiado nada');
  assert.equal(git(raiz, 'status', '--porcelain'), estado);
});

test('sin commits que deshacer, lo dice y no falla', () => {
  const raiz = cursoTemporal();
  git(raiz, 'init', '-q', '-b', 'main');   // repo git, pero sin ningún guardado todavía
  const r = deshacer({ raiz });
  assert.equal(r.deshecho, false);
  assert.equal(r.motivo, 'sin-commits');
});

test('fuera de un repositorio git, lo dice y no falla', () => {
  const raiz = cursoTemporal();
  const r = deshacer({ raiz });
  assert.equal(r.deshecho, false);
  assert.equal(r.motivo, 'sin-repo');
});

test('cli: --ver no toca nada; sin --ver deshace, sube si procede y no deja nada sin guardar', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ subir_a_github: true, version_datos: 1 }) });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  const cabeza = git(raiz, 'rev-parse', 'HEAD');

  assert.equal(cli(['--ver'], raiz), 0);
  assert.match(lineas.join('\n'), /Esto deshace: sesion\(s02\): prueba/);
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), cabeza);

  lineas.length = 0;
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /Deshecho: sesion\(s02\): prueba/);
  assert.match(lineas.join('\n'), /No se ha subido: no hay remoto configurado/);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});
