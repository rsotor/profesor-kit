'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { reparar, cli } = require('../reparar');
const { comprobar } = require('../comprobar');
const { cursoTemporal, escribir, iniciarGit } = require('./ayuda');

const MOTOR = { '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros: ['AGENTS.md', '.kit'] }), 'AGENTS.md': 'reglas' };
const en = (raiz, rel) => path.join(raiz, ...rel.split('/'));
const ausentes = raiz => comprobar(raiz).errores.filter(e => e.regla === 'pieza-ausente').map(e => e.fichero);

test('comprobar avisa de cada pieza que falta, y en un curso entero no avisa de ninguna', () => {
  const raiz = cursoTemporal(MOTOR);
  assert.deepEqual(ausentes(raiz), []);
  fs.rmSync(en(raiz, 'AGENTS.md'));
  fs.rmSync(en(raiz, 'estudio/conceptos'), { recursive: true });
  fs.rmSync(en(raiz, 'estudio/progreso.md'));
  assert.deepEqual(ausentes(raiz).sort(), ['AGENTS.md', 'estudio/conceptos', 'estudio/conceptos/_index.md', 'estudio/progreso.md']);
});

test('recupera de git lo borrado: motor, carpeta con sus notas y fichero vivo', () => {
  const raiz = cursoTemporal(MOTOR);
  iniciarGit(raiz);
  const nota = fs.readFileSync(en(raiz, 'estudio/conceptos/alfa.md'), 'utf8');
  fs.rmSync(en(raiz, 'AGENTS.md'));
  fs.rmSync(en(raiz, 'estudio/conceptos'), { recursive: true });
  const r = reparar(raiz);
  assert.deepEqual(r.restaurados.sort(), ['AGENTS.md', 'estudio/conceptos']);
  assert.equal(fs.readFileSync(en(raiz, 'estudio/conceptos/alfa.md'), 'utf8'), nota);
  assert.deepEqual(comprobar(raiz).errores, []);
});

test('un fichero movido a la raíz vuelve a su sitio con lo último que tenía escrito', () => {
  const raiz = cursoTemporal(MOTOR);
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| [[alfa]] | ✅ |\n\nlo último, sin guardar\n' });
  fs.renameSync(en(raiz, 'estudio/progreso.md'), en(raiz, 'progreso.md'));
  assert.deepEqual(reparar(raiz).devueltos, ['estudio/progreso.md']);
  assert.match(fs.readFileSync(en(raiz, 'estudio/progreso.md'), 'utf8'), /lo último, sin guardar/);
  assert.ok(!fs.existsSync(en(raiz, 'progreso.md')));
});

test('una carpeta vacía que git no guarda se crea de nuevo; y nunca se pisa nada que exista', () => {
  const raiz = cursoTemporal(MOTOR);
  fs.rmSync(en(raiz, 'estudio/repasos'), { recursive: true });
  const antes = fs.readFileSync(en(raiz, 'estudio/conceptos/alfa.md'), 'utf8');
  assert.deepEqual(reparar(raiz).recreadas, ['estudio/repasos']);
  assert.ok(fs.existsSync(en(raiz, 'estudio/repasos/.gitkeep')));
  assert.equal(fs.readFileSync(en(raiz, 'estudio/conceptos/alfa.md'), 'utf8'), antes);
  assert.deepEqual(reparar(raiz), { devueltos: [], restaurados: [], recreadas: [], sinArreglo: [] });
});

test('cli: lo cuenta en llano, y sale con 1 si algo no tiene arreglo', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = cursoTemporal(MOTOR);
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /No faltaba nada/);
  fs.rmSync(en(raiz, 'estudio/repasos'), { recursive: true });
  fs.renameSync(en(raiz, 'estudio/formulario.md'), en(raiz, 'formulario.md'));
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /Devuelto a su sitio.*formulario\.md/);
  assert.match(lineas.join('\n'), /Carpeta creada de nuevo.*repasos/);
  fs.rmSync(en(raiz, 'AGENTS.md'));                       // sin git no hay de dónde recuperarlo
  assert.equal(cli([], raiz), 1);
  assert.match(lineas.join('\n'), /No he podido recuperar: AGENTS\.md/);
});

test('la guía de uso solo se echa en falta cuando la configuración está completa', () => {
  const sinConfigurar = cursoTemporal(MOTOR);
  assert.ok(!ausentes(sinConfigurar).includes('estudio/como-usar-tu-profesor.md'));
  const configurado = cursoTemporal({ ...MOTOR, 'config/ajustes.json': JSON.stringify({ configuracion: { curso: true, estilo: true, nivel: true } }) });
  assert.deepEqual(ausentes(configurado), ['estudio/como-usar-tu-profesor.md']);
  escribir(configurado, { 'estudio/como-usar-tu-profesor.md': '# Cómo usar tu profesor\n' });
  assert.deepEqual(ausentes(configurado), []);
});
