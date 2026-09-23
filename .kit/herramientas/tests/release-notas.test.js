'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { notasDe, cli } = require('../../../.github/release-notas');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const CHANGELOG = '# Cambios\n\nIntro.\n\n## 2.0.0\n- Dos.\n- **Si ya tenías tu curso:** algo.\n\n## 1.0.0\n- Uno.\n';

test('las notas de una release son la sección de esa versión del CHANGELOG, y nada más', () => {
  assert.equal(notasDe(CHANGELOG, '2.0.0'), '- Dos.\n- **Si ya tenías tu curso:** algo.');
  assert.equal(notasDe(CHANGELOG, '1.0.0'), '- Uno.');
  assert.equal(notasDe(CHANGELOG, '3.0.0'), null);
});

test('cli: imprime las notas de la versión actual del kit (VERSION y CHANGELOG van a la par)', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  t.mock.method(console, 'error', () => {});
  const version = fs.readFileSync(path.join(RAIZ, '.kit', 'VERSION'), 'utf8').trim();
  assert.equal(cli([version], RAIZ), 0);
  assert.ok(lineas.join('\n').trim().length > 0);
  assert.equal(cli(['0.0.0'], RAIZ), 1);
  assert.equal(cli([], RAIZ), 2);
});
