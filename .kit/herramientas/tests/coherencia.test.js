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

// Codex lee como mucho 32 KiB de AGENTS.md, contando también las instrucciones globales del usuario, y corta lo que
// sobra sin avisar (diagnóstico de skills, 2026-09-24). Lo de uso raro va a .kit/guias/ y AGENTS.md solo lo nombra.
test('AGENTS.md cabe con margen en lo que lee Codex (24 KB), y cada guía que nombra existe', () => {
  // Con saltos de línea de Unix: en Windows git lo saca con CRLF y cada línea sumaría un byte (CI del 2026-09-25).
  const agents = Buffer.from(fs.readFileSync(path.join(KIT, '..', 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n'));
  assert.ok(agents.length <= 24 * 1024, `AGENTS.md pesa ${agents.length} bytes: mueve a .kit/guias/ lo que no se usa en cada sesión`);
  for (const [, guia] of agents.toString('utf8').matchAll(/`\.kit\/guias\/([\w-]+\.md)`/g)) {
    assert.ok(fs.existsSync(path.join(KIT, 'guias', guia)), `AGENTS.md nombra .kit/guias/${guia}, que no existe`);
  }
});

// Una skill se carga entera cada vez que se usa, junto a AGENTS.md. Tras adelgazarlas (0.26.0) la mayor ronda los
// 16 KB: 18 KB deja margen sin que vuelvan a crecer sin darnos cuenta.
test('cada skill cabe en 18 KB', () => {
  const skills = path.join(KIT, 'skills');
  for (const nombre of fs.readdirSync(skills)) {
    const fichero = path.join(skills, nombre, 'SKILL.md');
    if (!fs.existsSync(fichero)) continue;
    const bytes = Buffer.byteLength(fs.readFileSync(fichero, 'utf8').replace(/\r\n/g, '\n'));
    assert.ok(bytes <= 18 * 1024, `/${nombre} pesa ${bytes} bytes: recorta lo repetido o mueve a .kit/guias/ lo que abra una herramienta`);
  }
});
