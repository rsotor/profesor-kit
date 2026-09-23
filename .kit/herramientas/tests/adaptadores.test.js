'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.resolve(__dirname, '..', '..', 'adaptadores');
const adaptadores = fs.readdirSync(DIR).filter(n => n.endsWith('.json')).map(n => [n.slice(0, -5), JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'))]);
const filas = fs.readFileSync(path.join(DIR, 'LEEME.md'), 'utf8').split(/\r?\n/)
  .map(l => /^\| `([\w-]+)` \|(.*)\|\s*$/.exec(l)).filter(Boolean).map(m => [m[1], m[2].split('|').map(c => c.trim())]);

test('cada adaptador del kit tiene los campos que usan las herramientas y su modelo recomendado', () => {
  assert.ok(adaptadores.length > 0);
  for (const [id, a] of adaptadores) {
    for (const campo of ['comando', 'skills', 'probado']) assert.ok(a[campo], `${id} sin ${campo}`);
    const m = a.modelo_recomendado;
    assert.ok(m && m.modelo && m.por_que && /^\d{4}-\d{2}-\d{2}$/.test(m.comprobado), `${id}: modelo_recomendado incompleto`);
  }
});

test('la tabla de .kit/adaptadores/LEEME.md dice lo mismo que los adaptadores (ni sobra ni falta ninguno)', () => {
  assert.deepEqual(filas.map(f => f[0]).sort(), adaptadores.map(a => a[0]).sort());
  for (const [id, [probado, modelo, porQue, comprobado]] of filas) {
    const a = Object.fromEntries(adaptadores)[id];
    assert.equal(probado, a.probado, `${id}: "Probado en"`);
    assert.equal(modelo, a.modelo_recomendado.modelo, `${id}: modelo`);
    assert.equal(porQue, a.modelo_recomendado.por_que, `${id}: por qué`);
    assert.equal(comprobado, a.modelo_recomendado.comprobado, `${id}: comprobado`);
  }
});
