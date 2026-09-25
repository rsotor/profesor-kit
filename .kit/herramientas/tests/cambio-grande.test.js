'use strict';
// Prueba .github/cambio-grande.js desde aquí (mismo patrón que release-notas.test.js con otro script
// de .github/): así entra en el `npm test` normal del repo sin montar infraestructura aparte.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { evaluar, cli, ficherosCambiados, TOCA_COMPORTAMIENTO, RESUMEN } = require('../../../.github/cambio-grande');

// Un resumen de una prueba real que salió entera bien (la línea que escribe prueba-real.js#markdownResumen).
const BUENO = '# Prueba real\n\nResultado: 15/15 pasos bien · corrección 6/6 · commit abc1234\n';

test('evaluar: PR que no toca skills/AGENTS.md/plantillas no necesita el resumen', () => {
  const r = evaluar(['.kit/herramientas/comprobar.js', 'docs/arquitectura.md']);
  assert.deepEqual(r, { ok: true, tocaComportamiento: false, tocaResumen: false, resumenReal: false, completo: false, alDia: true });
});

test('evaluar: toca una skill y NO trae el resumen → falla', () => {
  const r = evaluar(['.kit/skills/sesion/SKILL.md']);
  assert.deepEqual(r, { ok: false, tocaComportamiento: true, tocaResumen: false, resumenReal: false, completo: false, alDia: true });
});

test('evaluar: toca AGENTS.md pero SÍ trae el resumen → pasa', () => {
  const r = evaluar(['AGENTS.md', RESUMEN], BUENO);
  assert.deepEqual(r, { ok: true, tocaComportamiento: true, tocaResumen: true, resumenReal: true, completo: true, alDia: true });
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

test('evaluar: un RESUMEN.md hecho con --sin-llm no cuenta como prueba real', () => {
  const deMentira = '# Prueba real\n\n> **Modo `--sin-llm`: no se ha ejecutado ningún LLM real.**\n';
  const r = evaluar(['.kit/skills/sesion/SKILL.md', RESUMEN], deMentira);
  assert.deepEqual([r.ok, r.tocaResumen, r.resumenReal], [false, true, false]);
  assert.equal(evaluar(['.kit/skills/sesion/SKILL.md', RESUMEN], BUENO).ok, true);
});

test('evaluar: un resumen real pero anterior al último cambio de skill no cuenta', () => {
  const r = evaluar(['.kit/skills/sesion/SKILL.md', RESUMEN], BUENO, false);
  assert.deepEqual([r.ok, r.resumenReal, r.alDia], [false, true, false]);
});

test('resumenAlDia: mira el orden de los commits del PR, no solo que el resumen esté', () => {
  const { resumenAlDia } = require('../../../.github/cambio-grande');
  const { temporal, escribir, git } = require('./ayuda');
  const repo = temporal('kit-');
  git(repo, 'init', '-q', '-b', 'main');
  for (const [k, val] of [['user.name', 'T'], ['user.email', 't@e.com'], ['commit.gpgsign', 'false']]) git(repo, 'config', k, val);
  const commit = (ficheros, msg) => { escribir(repo, ficheros); git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', msg); };
  commit({ 'README.md': 'x' }, 'base');
  git(repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  commit({ '.kit/skills/sesion/SKILL.md': 'v1' }, 'skill');
  assert.equal(resumenAlDia('main', repo).alDia, false, 'cambio sin prueba');
  commit({ [RESUMEN]: '# Prueba real\n' }, 'prueba');
  assert.equal(resumenAlDia('main', repo).alDia, true, 'prueba después del cambio');
  commit({ 'AGENTS.md': 'otra regla' }, 'otro cambio');
  assert.equal(resumenAlDia('main', repo).alDia, false, 'un cambio posterior deja la prueba vieja');
});

// issue #39, H08: un resumen vacío, o de una prueba con algún paso mal o con la corrección por debajo de 6/6, no pasa.
test('evaluar: el resumen tiene que decir que todo salió bien, con la corrección entera', () => {
  const con = linea => evaluar(['AGENTS.md', RESUMEN], `# Prueba real\n\n${linea}\n`);
  assert.equal(evaluar(['AGENTS.md', RESUMEN], '').ok, false, 'vacío');
  assert.equal(con('Modelo: sonnet').ok, false, 'sin la línea de resultado');
  assert.equal(con('Resultado: 14/15 pasos bien · corrección 6/6 · commit abc1234').ok, false, 'un paso mal');
  assert.equal(con('Resultado: 15/15 pasos bien · corrección 5/6 · commit abc1234').ok, false, 'corrección incompleta');
  assert.equal(con('Resultado: 15/15 pasos bien · corrección 0/0 · commit abc1234').ok, false, 'sin corrección');
  assert.equal(con('Resultado: 15/15 pasos bien · corrección 6/6 · commit abc1234').ok, true);
});

// prueba-real.js --desde (repetir desde un paso, con la copia del anterior): aunque salga entera bien, un
// resumen reanudado nunca cuenta como prueba real completa para el PR — markdownResumen mete "(desde ...)" a
// propósito, justo para que esta línea deje de encajar con el formato que exige la barrera.
test('evaluar: un resumen reanudado con --desde no cuenta, aunque todos los pasos y la corrección salgan bien', () => {
  const reanudado = '# Prueba real\n\nResultado: 15/15 pasos bien (desde "/dudas") · corrección 6/6 · commit abc1234\n';
  const r = evaluar(['AGENTS.md', RESUMEN], reanudado);
  assert.deepEqual([r.ok, r.completo], [false, false]);
});
