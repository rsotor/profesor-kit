'use strict';
// Prueba .github/cambio-grande.js desde aquí (mismo patrón que release-notas.test.js con otro script
// de .github/): así entra en el `npm test` normal del repo sin montar infraestructura aparte.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { evaluar, cli, ficherosCambiados, TOCA_COMPORTAMIENTO, RESUMEN } = require('../../../.github/cambio-grande');

test('evaluar: PR que no toca skills/AGENTS.md/plantillas no necesita el resumen', () => {
  const r = evaluar(['.kit/herramientas/comprobar.js', 'docs/arquitectura.md']);
  assert.deepEqual(r, { ok: true, tocaComportamiento: false, tocaResumen: false });
});

test('evaluar: toca una skill y NO trae el resumen → falla', () => {
  const r = evaluar(['.kit/skills/sesion/SKILL.md']);
  assert.deepEqual(r, { ok: false, tocaComportamiento: true, tocaResumen: false });
});

test('evaluar: toca AGENTS.md pero SÍ trae el resumen → pasa', () => {
  const r = evaluar(['AGENTS.md', RESUMEN]);
  assert.deepEqual(r, { ok: true, tocaComportamiento: true, tocaResumen: true });
});

test('evaluar: toca una plantilla, sin resumen → falla', () => {
  assert.equal(evaluar(['.kit/plantillas/concepto.md']).ok, false);
});

test('evaluar: un fichero de otra carpeta que empieza igual no cuenta (AGENTS.md.bak, .kit/skillsx/)', () => {
  const r = evaluar(['AGENTS.md.bak', '.kit/skillsx/otra-cosa.js']);
  assert.equal(r.ok, true);
  assert.equal(r.tocaComportamiento, false);
});

test('TOCA_COMPORTAMIENTO: cubre skills, AGENTS.md y plantillas, y nada más', () => {
  for (const f of ['.kit/skills/dudas/SKILL.md', 'AGENTS.md', '.kit/plantillas/sesion.md']) assert.ok(TOCA_COMPORTAMIENTO(f), f);
  for (const f of ['.kit/herramientas/comprobar.js', 'CLAUDE.md', 'README.md']) assert.ok(!TOCA_COMPORTAMIENTO(f), f);
});

test('cli: sin rama base (ni argumento ni GITHUB_BASE_REF) pide uso y sale con 2', () => {
  const antes = process.env.GITHUB_BASE_REF;
  delete process.env.GITHUB_BASE_REF;
  try { assert.equal(cli([]), 2); } finally { if (antes !== undefined) process.env.GITHUB_BASE_REF = antes; }
});

test('cli: con una rama base que no existe, avisa del fallo de git y sale con 1 (no revienta)', () => {
  assert.equal(cli(['esta-rama-no-existe-de-verdad-nunca']), 1);
});

test('ficherosCambiados: contra main (si hay un origin/main local) da una lista, sin reventar', () => {
  const raiz = path.resolve(__dirname, '..', '..', '..');
  const { execFileSync } = require('node:child_process');
  const hayRef = ref => { try { execFileSync('git', ['rev-parse', '--verify', ref], { cwd: raiz, encoding: 'utf8' }); return true; } catch { return false; } };
  if (!hayRef('origin/main')) return;   // entorno sin ese remoto local: lo prueba igual cli() más arriba, contra un ref inexistente
  assert.ok(Array.isArray(ficherosCambiados('main', raiz)));
});
