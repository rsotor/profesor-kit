'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepararCurso } = require('../preparar-curso');
const { cursoTemporal, iniciarGit, git } = require('./ayuda');

const MOTOR = { '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 3, ficheros: ['.kit'] }) };

test('borra docs y .github, y crea ajustes con la version_datos del motor', () => {
  const raiz = cursoTemporal({ ...MOTOR, 'docs/spec.md': 'x', '.github/ISSUE_TEMPLATE/f.md': 'x', 'README.md': 'del kit', 'CONTRIBUTING.md': 'del kit', '.githooks/pre-push': 'del kit' });
  fs.rmSync(path.join(raiz, 'config', 'ajustes.json'));
  const r = prepararCurso({ raiz, subir: false });
  assert.deepEqual(r.borrado.sort(), ['.githooks', '.github', 'CONTRIBUTING.md', 'README.md', 'docs'].sort());
  assert.ok(!fs.existsSync(path.join(raiz, 'docs')));
  const ajustes = JSON.parse(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8'));
  assert.equal(ajustes.subir_a_github, false);
  assert.equal(ajustes.version_datos, 3);
  assert.deepEqual(ajustes.configuracion, { curso: false, estilo: false, nivel: false });
});

test('no pisa unos ajustes que ya existen', () => {
  const raiz = cursoTemporal(MOTOR);
  const antes = fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8');
  assert.equal(prepararCurso({ raiz, subir: true }).ajustesCreados, false);
  assert.equal(fs.readFileSync(path.join(raiz, 'config', 'ajustes.json'), 'utf8'), antes);
});

test('elimina origin si apunta al kit, y lo respeta si apunta al curso del alumno', () => {
  const kit = cursoTemporal(MOTOR);
  iniciarGit(kit);
  git(kit, 'remote', 'add', 'origin', 'https://github.com/rsotor/profesor-kit.git');
  assert.equal(prepararCurso({ raiz: kit, subir: false }).remotoEliminado, true);
  assert.throws(() => git(kit, 'remote', 'get-url', 'origin'));

  const curso = cursoTemporal(MOTOR);
  iniciarGit(curso);
  git(curso, 'remote', 'add', 'origin', 'https://github.com/ana/curso-historia.git');
  assert.equal(prepararCurso({ raiz: curso, subir: true }).remotoEliminado, false);
  assert.equal(git(curso, 'remote', 'get-url', 'origin'), 'https://github.com/ana/curso-historia.git');
});
