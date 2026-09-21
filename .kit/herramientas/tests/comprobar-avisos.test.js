'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { comprobar } = require('../comprobar');
const { cursoTemporal } = require('./ayuda');

const avisos = (raiz, regla) => comprobar(raiz).avisos.filter(a => a.regla === regla);

test('los marcadores de duda son aviso, no error, y se cuentan también en inbox', () => {
  const raiz = cursoTemporal({
    'conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n@@ no lo pillo\n\n`@@` documentado no cuenta\n',
    'inbox/apuntes.md': 'texto @@ otra duda\n',
  });
  const informe = comprobar(raiz);
  assert.equal(informe.errores.length, 0);
  assert.equal(avisos(raiz, 'duda-pendiente').length, 2);
});

test('el marcador se lee de config/profesor.md', () => {
  const raiz = cursoTemporal({
    'config/profesor.md': '---\nmarcador_dudas: "??"\n---\n',
    'conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n?? duda\n@@ esto ya no es marcador\n',
  });
  assert.equal(avisos(raiz, 'duda-pendiente').length, 1);
});

test('TODO y FALTA INFO son avisos distintos', () => {
  const raiz = cursoTemporal({
    'conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\n**TODO:** preguntar\n\n⚠️ **FALTA INFO:** la tabla\n',
  });
  assert.equal(avisos(raiz, 'todo').length, 1);
  assert.equal(avisos(raiz, 'falta-info').length, 1);
});

test('patrón prohibido de ajustes.json es error', () => {
  const raiz = cursoTemporal({
    'config/ajustes.json': JSON.stringify({ patrones_prohibidos: [{ patron: 'siglo [IVXLC]+\\b(?! [ad]\\. ?C\\.)', mensaje: 'siglo sin a. C. / d. C.' }] }),
    'conceptos/alfa.md': '---\ntipo: concepto\nalias: []\n---\nOcurrió en el siglo IV y poco más.\n',
  });
  const e = comprobar(raiz).errores.filter(x => x.regla === 'patron-prohibido');
  assert.equal(e.length, 1);
  assert.match(e[0].detalle, /línea 5/);
});

test('un patrón mal escrito no rompe la herramienta: es aviso', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ patrones_prohibidos: [{ patron: '(', mensaje: 'x' }] }) });
  assert.equal(avisos(raiz, 'patron-invalido').length, 1);
});

test('concepto que nadie enlaza es huérfano', () => {
  const raiz = cursoTemporal({ 'sesiones/s01-intro.md': '---\ntipo: sesion\n---\nsin enlaces\n' });
  assert.equal(avisos(raiz, 'huerfano').length, 1);
});

test('slugs que comparten palabra larga son posible duplicado', () => {
  const raiz = cursoTemporal({
    'conceptos/duracion-modificada.md': '---\ntipo: concepto\nalias: []\n---\n',
    'conceptos/duracion-efectiva.md': '---\ntipo: concepto\nalias: []\n---\n',
  });
  assert.equal(avisos(raiz, 'posible-duplicado').length, 1);
});
