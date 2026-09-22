'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { prepararCurso } = require('../preparar-curso');
const { cursoTemporal, iniciarGit, git } = require('./ayuda');

const MOTOR = { '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 3, ficheros: ['.kit'] }) };

test('borra docs y .github, y crea ajustes con la version_datos del motor', () => {
  const raiz = cursoTemporal({ ...MOTOR, 'docs/spec.md': 'x', '.github/ISSUE_TEMPLATE/f.md': 'x', 'README.md': '# profesor-kit\n\ndel kit', 'CONTRIBUTING.md': 'del kit', '.githooks/pre-push': 'del kit',
    '.kit/plantillas/readme-del-curso.md': '# {{NOMBRE_DEL_CURSO}}\n\n{{DE_QUE_VA}}\n\n{{TEMARIO}}\n\n{{ESTADO}}\n\n`{{ATAJO}}`\n' });
  fs.rmSync(path.join(raiz, 'config', 'ajustes.json'));
  const r = prepararCurso({ raiz, subir: false });
  assert.deepEqual(r.borrado.sort(), ['.githooks', '.github', 'CONTRIBUTING.md', 'docs'].sort());
  assert.equal(r.readmeCreado, true);
  const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
  assert.match(readme, /^# Mi curso/);
  assert.doesNotMatch(readme, /\{\{/);
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

test('el README del curso lleva su nombre, y uno ya escrito por el alumno no se pisa', () => {
  const plantilla = { '.kit/plantillas/readme-del-curso.md': '# {{NOMBRE_DEL_CURSO}}\n{{DE_QUE_VA}}{{TEMARIO}}{{ESTADO}}{{ATAJO}}' };
  const raiz = cursoTemporal({ ...MOTOR, ...plantilla, 'README.md': '# profesor-kit\n' });
  prepararCurso({ raiz, subir: false, nombre: 'Historia del Arte' });
  assert.match(fs.readFileSync(path.join(raiz, 'README.md'), 'utf8'), /^# Historia del Arte/);
  fs.writeFileSync(path.join(raiz, 'README.md'), '# Mi curso, ya rellenado por el profesor\n');
  assert.equal(prepararCurso({ raiz, subir: false, nombre: 'Otro' }).readmeCreado, false);
  assert.match(fs.readFileSync(path.join(raiz, 'README.md'), 'utf8'), /ya rellenado/);
});
