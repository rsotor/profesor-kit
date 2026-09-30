'use strict';
// Prueba .github/titulo-pr.js desde aquí (mismo patrón que cambio-grande.test.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarTitulo, cli } = require('../../../.github/titulo-pr');

test('evaluarTitulo: sube la versión y el título empieza por ella → pasa', () => {
  const r = evaluarTitulo('0.28.0: repo público y macOS en el CI', '0.27.1', '0.28.0');
  assert.equal(r.ok, true);
  assert.equal(r.publica, true);
});

test('evaluarTitulo: sube la versión y el título no la dice, o dice otra → falla', () => {
  assert.equal(evaluarTitulo('docs: repo público', '0.27.1', '0.28.0').ok, false);
  assert.equal(evaluarTitulo('0.27.2: arreglo', '0.27.1', '0.28.0').ok, false);
  assert.equal(evaluarTitulo('0.28.0 sin dos puntos', '0.27.1', '0.28.0').ok, false);
  assert.equal(evaluarTitulo('0.28.0: ', '0.27.1', '0.28.0').ok, false);
});

test('evaluarTitulo: el punto de la versión no hace de comodín (0x28x0 no es 0.28.0)', () => {
  assert.equal(evaluarTitulo('0x28x0: algo', '0.27.1', '0.28.0').ok, false);
});

test('evaluarTitulo: no sube la versión y el título tiene tipo → pasa', () => {
  for (const t of ['arreglo: guardar sin identidad', 'docs: README', 'ci: macOS', 'build(deps): bump eslint', 'chore(deps): actions', 'mejora: algo que se acumula'])
    assert.equal(evaluarTitulo(t, '0.27.1', '0.27.1').ok, true, t);
});

test('evaluarTitulo: no sube la versión y el título empieza por una → falla con su motivo', () => {
  const r = evaluarTitulo('0.27.2: arreglo', '0.27.1', '0.27.1');
  assert.equal(r.ok, false);
  assert.match(r.motivo, /no sube \.kit\/VERSION/);
  assert.equal(evaluarTitulo('v0.28: algo', '0.27.1', '0.27.1').ok, false);
});

test('evaluarTitulo: sin tipo, con un tipo que no existe o vacío → falla', () => {
  for (const t of ['Seguridad: rutas', 'feat: algo', 'arreglo:sin espacio', 'arreglo algo', '', undefined])
    assert.equal(evaluarTitulo(t, '0.27.1', '0.27.1').ok, false, String(t));
});

test('cli: sin título o sin rama base pide uso y sale con 2', () => {
  assert.equal(cli([], { TITULO_PR: 'docs: x' }), 2);
  assert.equal(cli(['main'], {}), 2);
});

test('cli: con una rama base que no existe, avisa del fallo de git y sale con 1 (no revienta)', () => {
  assert.equal(cli(['esta-rama-no-existe-de-verdad-nunca'], { TITULO_PR: 'docs: x' }), 1);
});
