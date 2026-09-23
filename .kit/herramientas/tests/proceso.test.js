'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ejecutar, motivoDe, explicar } = require('../lib/proceso');

// issue #33: en un entorno restringido (sandbox), un proceso que ni llega a arrancar dejaba `stdout` y
// `stderr` vacíos, y el mensaje final se quedaba en blanco (o peor, imprimía "undefined"/"null" si algo
// concatenaba esos campos sin protegerlos). `ejecutar()` es el único sitio que lanza un proceso externo
// (git, gh, node, powershell) y clasifica por qué falló, para que nadie más tenga que adivinarlo.

test('ejecutar: un comando que no existe se clasifica como "no-existe" y no deja la salida vacía', () => {
  const r = ejecutar('este-comando-no-existe-de-verdad-9x', []);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'no-existe');
  assert.ok(r.salida.length > 0, 'la salida nunca se queda en blanco');
  assert.doesNotMatch(r.salida, /^(undefined|null)$/);
});

test('ejecutar: un comando real que sale bien da ok, motivo "ok" y el stdout sin mezclar', () => {
  const r = ejecutar(process.execPath, ['-e', 'console.log("hola")']);
  assert.equal(r.ok, true);
  assert.equal(r.motivo, 'ok');
  assert.equal(r.stdout.trim(), 'hola');
});

test('ejecutar: un comando que arranca pero sale con error da motivo "fallo" y conserva stderr', () => {
  const r = ejecutar(process.execPath, ['-e', 'console.error("boom"); process.exit(1)']);
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'fallo');
  assert.match(r.salida, /boom/);
});

test('motivoDe: clasifica EACCES/EPERM/EIO como "permiso" y ENOENT como "no-existe"', () => {
  for (const codigo of ['EACCES', 'EPERM', 'EIO']) {
    assert.equal(motivoDe({ error: { code: codigo }, status: null }), 'permiso');
  }
  assert.equal(motivoDe({ error: { code: 'ENOENT' }, status: null }), 'no-existe');
  assert.equal(motivoDe({ error: null, status: 0 }), 'ok');
  assert.equal(motivoDe({ error: null, status: 1 }), 'fallo');
});

test('explicar: da un mensaje concreto para cada motivo, nunca vacío ni "undefined"', () => {
  assert.match(explicar({ motivo: 'no-existe', comando: 'foo', salida: '' }), /no encuentro el comando "foo"/);
  assert.match(explicar({ motivo: 'permiso', comando: 'foo', salida: '' }), /entorno restringido/);
  assert.equal(explicar({ motivo: 'fallo', comando: 'foo', salida: 'boom' }), 'boom');
  assert.match(explicar({ motivo: 'fallo', comando: 'foo', salida: '' }), /ha fallado sin más detalle/);
});
