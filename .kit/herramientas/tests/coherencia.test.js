'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const KIT = path.resolve(__dirname, '..', '..');

test('version_datos del motor = migración más alta (un cambio de formato sin migración no se publica)', () => {
  const motor = JSON.parse(fs.readFileSync(path.join(KIT, 'motor.json'), 'utf8'));
  const numeros = fs.readdirSync(path.join(KIT, 'herramientas', 'migraciones'))
    .filter(n => /^\d+-.+\.js$/.test(n)).map(n => parseInt(n, 10));
  assert.equal(motor.version_datos, Math.max(1, ...numeros));
});

test('cada migración cumple el contrato', () => {
  const dir = path.join(KIT, 'herramientas', 'migraciones');
  for (const n of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const m = require(path.join(dir, n));
    assert.equal(typeof m.descripcion, 'string', n);
    assert.equal(typeof m.migrar, 'function', n);
  }
});

test('la versión del CHANGELOG coincide con VERSION', () => {
  const version = fs.readFileSync(path.join(KIT, 'VERSION'), 'utf8').trim();
  assert.match(fs.readFileSync(path.join(KIT, 'CHANGELOG.md'), 'utf8'), new RegExp(`^## ${version.replace(/\./g, '\\.')}$`, 'm'));
});
