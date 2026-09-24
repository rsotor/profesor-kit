'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { organizar, unidadDe, cli } = require('../organizar');
const { comprobar } = require('../comprobar');
const { cursoTemporal, escribir } = require('./ayuda');

const ESTRUCTURA = { 'config/estructura.json': JSON.stringify({ unidades: [
  { prefijo: '01', carpeta: 'modulo-01-conceptos' },
  { prefijo: '01-02', carpeta: 'modulo-01-conceptos/1.2-medidores' },
  { prefijo: '02', carpeta: 'modulo-02-finanzas-personales' },
] }) };
const en = (raiz, rel) => path.join(raiz, 'estudio', ...rel.split('/'));
const leer = (raiz, rel) => fs.readFileSync(en(raiz, rel), 'utf8');

test('gana el prefijo más largo; sin coincidencia, ninguna unidad', () => {
  const e = JSON.parse(ESTRUCTURA['config/estructura.json']);
  assert.equal(unidadDe('01-02-04-van-y-tir.md', e).carpeta, 'modulo-01-conceptos/1.2-medidores');
  assert.equal(unidadDe('01-01-02-mente.md', e).carpeta, 'modulo-01-conceptos');
  assert.equal(unidadDe('010-otra.md', e), null);
  assert.equal(unidadDe('extra.md', e), null);
});

test('mueve sesiones, flashcards, ejercicios y exámenes a la carpeta de su unidad; conceptos y _index no se tocan', () => {
  const raiz = cursoTemporal({ ...ESTRUCTURA,
    'estudio/sesiones/01-02-04-van-y-tir.md': '---\ntipo: sesion\n---\n[[alfa]] · [[flashcards/01-02-04-van-y-tir]] · [[ejercicios/01-02-04-van-y-tir#1|papel]]\n',
    'estudio/flashcards/01-02-04-van-y-tir.md': '---\ntipo: flashcards\n---\nx\n',
    'estudio/ejercicios/01-02-04-van-y-tir.md': '---\ntipo: ejercicio\n---\nx\n',
    'estudio/ejercicios/extra.md': 'suelto\n',
    'estudio/examenes/2026-01-01-01-02.md': 'examen\n',
    'estudio/mapa-del-curso.md': '# Mapa\n\n- [[s01-intro]]\n- [[sesiones/01-02-04-van-y-tir]]\n',
  });
  const r = organizar({ raiz });
  assert.deepEqual(Object.keys(r.movidos).sort(), ['ejercicios/01-02-04-van-y-tir.md', 'flashcards/01-02-04-van-y-tir.md', 'sesiones/01-02-04-van-y-tir.md']);
  assert.ok(fs.existsSync(en(raiz, 'sesiones/modulo-01-conceptos/1.2-medidores/01-02-04-van-y-tir.md')));
  assert.ok(fs.existsSync(en(raiz, 'conceptos/alfa.md')) && fs.existsSync(en(raiz, 'conceptos/_index.md')));
  assert.deepEqual(r.sinUnidad.sort(), ['ejercicios/extra.md', 'examenes/2026-01-01-01-02.md', 'sesiones/s01-intro.md']);
  // los enlaces con ruta se reescriben; los de solo nombre no hace falta
  assert.match(leer(raiz, 'sesiones/modulo-01-conceptos/1.2-medidores/01-02-04-van-y-tir.md'), /\[\[flashcards\/modulo-01-conceptos\/1\.2-medidores\/01-02-04-van-y-tir\]\] · \[\[ejercicios\/modulo-01-conceptos\/1\.2-medidores\/01-02-04-van-y-tir#1\|papel\]\]/);
  assert.match(leer(raiz, 'mapa-del-curso.md'), /\[\[sesiones\/modulo-01-conceptos\/1\.2-medidores\/01-02-04-van-y-tir\]\]/);
  assert.deepEqual(comprobar(raiz).errores, []);
});

test('un ejercicio HTML movido sigue enlazado desde su concepto y sigue encontrando la nota de vuelta', () => {
  const raiz = cursoTemporal({ ...ESTRUCTURA,
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nejercicio: 01-01-02-alfa\n---\n→ [jugar](../ejercicios/01-01-02-alfa.html)\n',
    'estudio/ejercicios/01-01-02-alfa.html': '<a href="../conceptos/alfa.md">volver</a>\n',
  });
  organizar({ raiz });
  assert.match(leer(raiz, 'conceptos/alfa.md'), /\]\(\.\.\/ejercicios\/modulo-01-conceptos\/01-01-02-alfa\.html\)/);
  assert.match(leer(raiz, 'ejercicios/modulo-01-conceptos/01-01-02-alfa.html'), /href="\.\.\/\.\.\/conceptos\/alfa\.md"/);
  assert.deepEqual(comprobar(raiz).errores, []);
});

test('es idempotente, recoloca si la estructura cambia, y nunca pisa un fichero', () => {
  const raiz = cursoTemporal({ ...ESTRUCTURA, 'estudio/sesiones/02-01-intro.md': '---\ntipo: sesion\n---\nx\n', 'estudio/mapa-del-curso.md': '[[02-01-intro]] [[s01-intro]]' });
  assert.equal(Object.keys(organizar({ raiz }).movidos).length, 1);
  assert.equal(Object.keys(organizar({ raiz }).movidos).length, 0);
  escribir(raiz, { 'config/estructura.json': JSON.stringify({ unidades: [{ prefijo: '02', carpeta: 'segundo' }] }) });
  assert.deepEqual(organizar({ raiz }).movidos, { 'sesiones/modulo-02-finanzas-personales/02-01-intro.md': 'sesiones/segundo/02-01-intro.md' });
  assert.ok(!fs.existsSync(en(raiz, 'sesiones/modulo-02-finanzas-personales')), 'la carpeta vacía desaparece');
  escribir(raiz, { 'estudio/sesiones/02-01-intro.md': 'otro con el mismo nombre' });
  assert.throws(() => organizar({ raiz }), /no se pisa/);
});

test('sin estructura no hace nada; una estructura mal formada se rechaza', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  assert.equal(cli([], cursoTemporal()), 0);
  assert.match(lineas.join('\n'), /No hay config\/estructura\.json/);
  assert.equal(cli([], cursoTemporal({ 'config/estructura.json': JSON.stringify({ unidades: [{ prefijo: '01', carpeta: '../fuera' }] }) })), 1);
  assert.match(lineas.join('\n'), /No se ha podido organizar/);
  const raiz = cursoTemporal({ ...ESTRUCTURA, 'estudio/sesiones/01-01-x.md': 'x' });
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /Colocados 1 fichero/);
});

test('un ejercicio nombrado por concepto hereda la unidad de su sesión; y comprobar avisa de lo que queda suelto', () => {
  const raiz = cursoTemporal({ ...ESTRUCTURA,
    'estudio/ejercicios/van-o-tir.md': '---\ntipo: ejercicio\nsesion: 01-02-04-van-y-tir\n---\nx\n',
    'estudio/sesiones/01-02-04-van-y-tir.md': '---\ntipo: sesion\n---\n[[alfa]]\n',
    'estudio/mapa-del-curso.md': '[[s01-intro]] [[01-02-04-van-y-tir]]',
  });
  assert.deepEqual(comprobar(raiz).avisos.filter(a => a.regla === 'sin-unidad').map(a => a.fichero).sort(), ['sesiones/01-02-04-van-y-tir.md', 'sesiones/s01-intro.md']);
  organizar({ raiz });
  assert.ok(fs.existsSync(en(raiz, 'ejercicios/modulo-01-conceptos/1.2-medidores/van-o-tir.md')));
  assert.deepEqual(comprobar(raiz).avisos.filter(a => a.regla === 'sin-unidad').map(a => a.fichero), ['sesiones/s01-intro.md']);
});

test('un fichero sin prefijo se coloca por quién lo enlaza: si es una sola unidad, va ahí; si son varias o ninguna, se queda', () => {
  const raiz = cursoTemporal({ ...ESTRUCTURA,
    'estudio/sesiones/01-02-04-van-y-tir.md': '---\ntipo: sesion\n---\n[[alfa]]\n',
    'estudio/sesiones/02-01-intro.md': '---\ntipo: sesion\n---\n[[alfa]]\n',
    'estudio/ejercicios/01-02-04-van-y-tir.md': '# A mano\n\n→ [Interactivo](van-o-tir.html) · [[ejercicios/sharpe]]\n',
    'estudio/ejercicios/02-01-intro.md': '# A mano\n\n[[ejercicios/sharpe]]\n',
    'estudio/ejercicios/van-o-tir.html': '<p>x</p>',
    'estudio/ejercicios/sharpe.md': 'lo enlazan dos unidades\n',
    'estudio/ejercicios/nadie.html': '<p>nadie me enlaza</p>',
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n[jugar](../ejercicios/nadie.html)\n',
    'estudio/examenes/2026-01-01-bloque-1.md': '---\ntipo: examen\nunidad: 01-02\n---\nx\n',
    'estudio/mapa-del-curso.md': '[[s01-intro]] [[01-02-04-van-y-tir]] [[02-01-intro]]',
  });
  const r = organizar({ raiz });
  assert.ok(fs.existsSync(en(raiz, 'ejercicios/modulo-01-conceptos/1.2-medidores/van-o-tir.html')), 'lo enlaza solo la unidad 01-02');
  assert.ok(fs.existsSync(en(raiz, 'examenes/modulo-01-conceptos/1.2-medidores/2026-01-01-bloque-1.md')), 'por su frontmatter unidad:');
  assert.deepEqual(r.sinUnidad.sort(), ['ejercicios/nadie.html', 'ejercicios/sharpe.md', 'sesiones/s01-intro.md']);
  assert.match(leer(raiz, 'ejercicios/modulo-01-conceptos/1.2-medidores/01-02-04-van-y-tir.md'), /\(van-o-tir\.html\)/, 'mismo directorio: el enlace relativo no cambia');
  assert.deepEqual(comprobar(raiz).errores, []);
});

// issue #39, H02: una carpeta de unidad que sale de su sitio, también con separadores de Windows, no se acepta.
test('estructura: una carpeta con "..", "\\" o ".git" no es válida', () => {
  const { leerEstructura } = require('../organizar');
  for (const carpeta of ['..\\fuera', 'a\\..\\..\\fuera', '../fuera', '.git', 'C:/x']) {
    const raiz = cursoTemporal({ 'config/estructura.json': JSON.stringify({ unidades: [{ prefijo: '01', carpeta }] }) });
    assert.throws(() => leerEstructura(raiz), /unidad no válida/, carpeta);
  }
});
