'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { actualizar } = require('../actualizar');
const { cursoTemporal, escribir, iniciarGit, git } = require('./ayuda');

const KIT_REAL = path.resolve(__dirname, '..', '..');   // la carpeta .kit de este repo

// Un curso en "v1" y una carpeta "origen" en "v2": los dos con las herramientas reales de este repo.
function montar({ extraCurso = {}, extraOrigen = {}, motorNuevo = {} } = {}) {
  const motor = (version_datos, ficheros) => JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos, ficheros });
  const raiz = cursoTemporal({ 'AGENTS.md': 'reglas v1', 'VIEJO.md': 'se retira en v2', ...extraCurso });
  fs.cpSync(KIT_REAL, path.join(raiz, '.kit'), { recursive: true });
  escribir(raiz, { '.kit/VERSION': '1.0.0', '.kit/motor.json': motor(1, ['AGENTS.md', 'VIEJO.md', '.kit']), '.gitignore': '.claude/skills/\n' });
  iniciarGit(raiz);

  const origen = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-origen-'));
  fs.cpSync(KIT_REAL, path.join(origen, '.kit'), { recursive: true });
  escribir(origen, {
    'AGENTS.md': 'reglas v2',
    '.kit/VERSION': '2.0.0',
    '.kit/motor.json': motor(motorNuevo.version_datos ?? 1, motorNuevo.ficheros ?? ['AGENTS.md', '.kit']),
    '.kit/skills/nueva/SKILL.md': 'skill nueva',
    ...extraOrigen,
  });
  return { raiz, origen };
}
const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8');

test('reemplaza el motor, retira lo que sobra, reinstala skills y no toca los datos', () => {
  const { raiz, origen } = montar();
  const datosAntes = leer(raiz, 'conceptos/alfa.md');
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, true);
  assert.deepEqual([r.de, r.a], ['1.0.0', '2.0.0']);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v2');
  assert.ok(!fs.existsSync(path.join(raiz, 'VIEJO.md')));
  assert.equal(leer(raiz, '.claude/skills/nueva/SKILL.md'), 'skill nueva');
  assert.equal(leer(raiz, 'conceptos/alfa.md'), datosAntes);
  assert.equal(git(raiz, 'log', '-1', '--format=%s'), 'kit: actualizado a 2.0.0');
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

test('misma versión: no hace nada', () => {
  const { raiz, origen } = montar({ extraOrigen: { '.kit/VERSION': '1.0.0' } });
  assert.equal(actualizar({ raiz, origen }).motivo, 'al-dia');
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
});

test('ejecuta las migraciones pendientes en orden y sube version_datos', () => {
  const migracion = n => `module.exports = { descripcion: 'm${n}', migrar(raiz) {
    const f = require('node:path').join(raiz, 'formulario.md');
    require('node:fs').appendFileSync(f, 'migrado-${n}\\n');
  } };`;
  const { raiz, origen } = montar({
    motorNuevo: { version_datos: 3 },
    extraOrigen: { '.kit/herramientas/migraciones/003-tres.js': migracion(3), '.kit/herramientas/migraciones/002-dos.js': migracion(2) },
  });
  const r = actualizar({ raiz, origen });
  assert.deepEqual(r.migraciones, [2, 3]);
  assert.match(leer(raiz, 'formulario.md'), /migrado-2\nmigrado-3\n$/);
  assert.equal(JSON.parse(leer(raiz, 'config/ajustes.json')).version_datos, 3);
});

test('si una migración rompe el curso, revierte y el alumno sigue como estaba', () => {
  const rompe = `module.exports = { descripcion: 'rompe', migrar(raiz) {
    require('node:fs').writeFileSync(require('node:path').join(raiz, 'progreso.md'), '# vacío\\n');
  } };`;
  const { raiz, origen } = montar({ motorNuevo: { version_datos: 2 }, extraOrigen: { '.kit/herramientas/migraciones/002-rompe.js': rompe } });
  const progresoAntes = leer(raiz, 'progreso.md');
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, false);
  assert.equal(r.motivo, 'revertido');
  assert.equal(leer(raiz, 'progreso.md'), progresoAntes);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
  assert.equal(leer(raiz, '.kit/VERSION').trim(), '1.0.0');
  assert.ok(!fs.existsSync(path.join(raiz, '.claude', 'skills', 'nueva')));
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

test('si una migración lanza una excepción, también revierte', () => {
  const lanza = `module.exports = { descripcion: 'lanza', migrar() { throw new Error('pum'); } };`;
  const { raiz, origen } = montar({ motorNuevo: { version_datos: 2 }, extraOrigen: { '.kit/herramientas/migraciones/002-lanza.js': lanza } });
  const r = actualizar({ raiz, origen });
  assert.equal(r.motivo, 'revertido');
  assert.match(r.detalle, /pum/);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
});

test('un curso que ya tenía errores se actualiza igual (no empeora)', () => {
  const { raiz, origen } = montar();
  escribir(raiz, { 'sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto]]\n' });
  assert.equal(actualizar({ raiz, origen }).actualizado, true);
});

test('rechaza un motor que pretende tocar datos del alumno', () => {
  for (const mala of ['conceptos', 'config/alumno.md', '../fuera', 'progreso.md']) {
    const { raiz, origen } = montar({ motorNuevo: { ficheros: ['AGENTS.md', mala] } });
    assert.throws(() => actualizar({ raiz, origen }), /motor/i);
    assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
  }
});
