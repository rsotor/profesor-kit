'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { instalarSkills } = require('../instalar-skills');
const { cursoTemporal, escribir } = require('./ayuda');

const skill = nombre => ({ [`.kit/skills/${nombre}/SKILL.md`]: `---\nname: ${nombre}\n---\n` });

test('copia las skills y escribe el manifiesto', () => {
  const raiz = cursoTemporal({ ...skill('sesion'), ...skill('dudas') });
  const r = instalarSkills({ raiz });
  assert.deepEqual(r.instaladas, ['dudas', 'sesion']);
  assert.ok(fs.existsSync(path.join(raiz, '.claude', 'skills', 'sesion', 'SKILL.md')));
});

test('al reinstalar actualiza el contenido y retira las que el kit ya no trae', () => {
  const raiz = cursoTemporal({ ...skill('sesion'), ...skill('vieja') });
  instalarSkills({ raiz });
  fs.rmSync(path.join(raiz, '.kit', 'skills', 'vieja'), { recursive: true });
  escribir(raiz, { '.kit/skills/sesion/SKILL.md': 'v2' });
  const r = instalarSkills({ raiz });
  assert.deepEqual(r.retiradas, ['vieja']);
  assert.ok(!fs.existsSync(path.join(raiz, '.claude', 'skills', 'vieja')));
  assert.equal(fs.readFileSync(path.join(raiz, '.claude', 'skills', 'sesion', 'SKILL.md'), 'utf8'), 'v2');
});

test('no toca las skills propias del alumno', () => {
  const raiz = cursoTemporal({ ...skill('sesion'), '.claude/skills/mia/SKILL.md': 'mía' });
  instalarSkills({ raiz });
  instalarSkills({ raiz });
  assert.equal(fs.readFileSync(path.join(raiz, '.claude', 'skills', 'mia', 'SKILL.md'), 'utf8'), 'mía');
});

test('acepta otro destino', () => {
  const raiz = cursoTemporal(skill('sesion'));
  instalarSkills({ raiz, destino: '.agents/skills' });
  assert.ok(fs.existsSync(path.join(raiz, '.agents', 'skills', 'sesion', 'SKILL.md')));
});

test('cli: sin --destino, lo toma del adaptador del LLM del curso', () => {
  const { cli } = require('../instalar-skills');
  const raiz = cursoTemporal({ ...skill('sesion'),
    'config/ajustes.json': JSON.stringify({ llm: 'codex-cli' }),
    '.kit/adaptadores/codex-cli.json': JSON.stringify({ comando: 'codex', skills: '.codex/skills' }) });
  cli([], raiz);
  assert.ok(fs.existsSync(path.join(raiz, '.codex', 'skills', 'sesion', 'SKILL.md')));
});

test('cli: --destino explícito gana siempre al adaptador', () => {
  const { cli } = require('../instalar-skills');
  const raiz = cursoTemporal({ ...skill('sesion'),
    '.kit/adaptadores/claude-code.json': JSON.stringify({ comando: 'claude', skills: '.claude/skills' }) });
  cli(['--destino', '.agents/skills'], raiz);
  assert.ok(fs.existsSync(path.join(raiz, '.agents', 'skills', 'sesion', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(raiz, '.claude', 'skills', 'sesion', 'SKILL.md')));
});

test('cli: sin adaptador ni --destino, cae en el destino por defecto (Claude Code)', () => {
  const { cli } = require('../instalar-skills');
  const raiz = cursoTemporal(skill('sesion'));
  cli([], raiz);
  assert.ok(fs.existsSync(path.join(raiz, '.claude', 'skills', 'sesion', 'SKILL.md')));
});
