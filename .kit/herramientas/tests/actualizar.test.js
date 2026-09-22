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
  for (const r of [raiz, origen]) fs.rmSync(path.join(r, '.kit', 'herramientas', 'migraciones'), { recursive: true, force: true });
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
  const datosAntes = leer(raiz, 'estudio/conceptos/alfa.md');
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, true);
  assert.deepEqual([r.de, r.a], ['1.0.0', '2.0.0']);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v2');
  assert.ok(!fs.existsSync(path.join(raiz, 'VIEJO.md')));
  assert.equal(leer(raiz, '.claude/skills/nueva/SKILL.md'), 'skill nueva');
  assert.equal(leer(raiz, 'estudio/conceptos/alfa.md'), datosAntes);
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
    const f = require('node:path').join(raiz, 'estudio/formulario.md');
    require('node:fs').appendFileSync(f, 'migrado-${n}\\n');
  } };`;
  const { raiz, origen } = montar({
    motorNuevo: { version_datos: 3 },
    extraOrigen: { '.kit/herramientas/migraciones/003-tres.js': migracion(3), '.kit/herramientas/migraciones/002-dos.js': migracion(2) },
  });
  const r = actualizar({ raiz, origen });
  assert.deepEqual(r.migraciones, [2, 3]);
  assert.match(leer(raiz, 'estudio/formulario.md'), /migrado-2\nmigrado-3\n$/);
  assert.equal(JSON.parse(leer(raiz, 'config/ajustes.json')).version_datos, 3);
});

test('si una migración rompe el curso, revierte y el alumno sigue como estaba', () => {
  const rompe = `module.exports = { descripcion: 'rompe', migrar(raiz) {
    require('node:fs').writeFileSync(require('node:path').join(raiz, 'estudio/progreso.md'), '# vacío\\n');
  } };`;
  const { raiz, origen } = montar({ motorNuevo: { version_datos: 2 }, extraOrigen: { '.kit/herramientas/migraciones/002-rompe.js': rompe } });
  const progresoAntes = leer(raiz, 'estudio/progreso.md');
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, false);
  assert.equal(r.motivo, 'revertido');
  assert.equal(leer(raiz, 'estudio/progreso.md'), progresoAntes);
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
  escribir(raiz, { 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto]]\n' });
  assert.equal(actualizar({ raiz, origen }).actualizado, true);
});

test('rechaza un motor que pretende tocar datos del alumno', () => {
  for (const mala of ['estudio', 'estudio/conceptos', 'estudio/progreso.md', 'config/alumno.md', '../fuera']) {
    const { raiz, origen } = montar({ motorNuevo: { ficheros: ['AGENTS.md', mala] } });
    assert.throws(() => actualizar({ raiz, origen }), /motor/i);
    assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
  }
});

// Regresión de un fallo visto solo en Windows. Allí, copiar un fichero conserva su fecha y la fecha de
// creación no cambia al sobrescribirlo: si el fichero nuevo pesa lo mismo que el viejo, git lo da por no
// modificado y `reset --hard` no lo restaura. Aquí se fabrica esa situación en cualquier sistema.
test('restaurar reescribe también los ficheros que git cree intactos (misma fecha y mismo tamaño)', t => {
  const { restaurar } = require('../actualizar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  git(raiz, 'config', 'core.trustctime', 'false');              // como en Windows
  const fichero = path.join(raiz, 'AGENTS.md');
  const fecha = new Date('2020-01-01T00:00:00Z');
  fs.writeFileSync(fichero, 'reglas v1');
  fs.utimesSync(fichero, fecha, fecha);
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'v1');
  const sha = git(raiz, 'rev-parse', 'HEAD');

  fs.writeFileSync(fichero, 'reglas v2');                        // mismo tamaño…
  fs.utimesSync(fichero, fecha, fecha);                          // …y misma fecha
  if (git(raiz, 'status', '--porcelain') !== '') return t.skip('este sistema detecta el cambio igualmente: no hay trampa que probar');

  git(raiz, 'reset', '-q', '--hard', sha);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v2', 'la trampa: un reset normal NO lo restaura');

  restaurar(raiz, sha);
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
  assert.equal(leer(raiz, 'estudio/conceptos/alfa.md').includes('# Alfa'), true);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

// La primera migración real: un curso de formato 1 (sin README) pasa a formato 2 con la portada creada.
test('migración 002: un curso sin README gana su portada con nombre y atajo, y no pisa una que exista', () => {
  const m = require('../migraciones/002-readme-del-curso');
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ nombre_curso: 'Historia del Arte', atajo: 'historia' }) });
  fs.rmSync(path.join(raiz, 'README.md'));
  fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true });
  m.migrar(raiz);
  const readme = leer(raiz, 'README.md');
  assert.match(readme, /^# Historia del Arte/);
  assert.match(readme, /`historia`/);
  assert.doesNotMatch(readme, /\{\{/);
  fs.writeFileSync(path.join(raiz, 'README.md'), 'mío');
  m.migrar(raiz);
  assert.equal(leer(raiz, 'README.md'), 'mío');
});

test('migración 003: cada sesión gana estudiada: false, sin duplicar ni tocar el resto, y es idempotente', () => {
  const m = require('../migraciones/003-casilla-estudiada');
  const raiz = cursoTemporal({
    'estudio/sesiones/m1/01-01-uno.md': '---\ntipo: sesion\nclases: [1.1]\n---\n# Uno\n',
    'estudio/sesiones/m1/01-01-dos.md': '---\ntipo: sesion\nestudiada: true\n---\n# Dos\n',
    'estudio/sesiones/m1/01-01-crlf.md': '---\r\ntipo: sesion\r\n---\r\n# Tres\r\n',
    'estudio/sesiones/m1/01-01-sin-fm.md': '# Cuatro\n',
  });
  fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true });
  m.migrar(raiz);
  m.migrar(raiz);
  const s = rel => leer(raiz, `estudio/sesiones/m1/${rel}`);
  assert.equal(s('01-01-uno.md'), '---\ntipo: sesion\nclases: [1.1]\nestudiada: false\n---\n# Uno\n');
  assert.equal(s('01-01-dos.md'), '---\ntipo: sesion\nestudiada: true\n---\n# Dos\n');
  assert.equal(s('01-01-crlf.md'), '---\r\ntipo: sesion\r\nestudiada: false\r\n---\r\n# Tres\r\n');
  assert.equal(s('01-01-sin-fm.md'), '---\nestudiada: false\n---\n# Cuatro\n');

  const app = JSON.parse(leer(raiz, 'estudio/.obsidian/app.json'));
  assert.equal(app.alwaysUpdateLinks, true);
});

test('migración 003: un app.json previo con promptDelete lo conserva y añade lo que falta', () => {
  const m = require('../migraciones/003-casilla-estudiada');
  const raiz = cursoTemporal({ 'estudio/.obsidian/app.json': JSON.stringify({ promptDelete: true }) });
  fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true });
  m.migrar(raiz);
  const app = JSON.parse(leer(raiz, 'estudio/.obsidian/app.json'));
  assert.equal(app.promptDelete, true);
  assert.equal(app.alwaysUpdateLinks, true);
});
