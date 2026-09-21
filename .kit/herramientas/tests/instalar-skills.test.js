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
