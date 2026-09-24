'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { actualizar } = require('../actualizar');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

const KIT_REAL = path.resolve(__dirname, '..', '..');   // la carpeta .kit de este repo

// Un curso en "v1" y una carpeta "origen" en "v2": los dos con las herramientas reales de este repo.
function montar({ extraCurso = {}, extraOrigen = {}, motorNuevo = {} } = {}) {
  const motor = (version_datos, ficheros) => JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos, ficheros });
  const raiz = cursoTemporal({ 'AGENTS.md': 'reglas v1', 'VIEJO.md': 'se retira en v2', ...extraCurso });
  fs.cpSync(KIT_REAL, path.join(raiz, '.kit'), { recursive: true });
  escribir(raiz, { '.kit/VERSION': '1.0.0', '.kit/motor.json': motor(1, ['AGENTS.md', 'VIEJO.md', '.kit']), '.gitignore': '.claude/skills/\n' });
  iniciarGit(raiz);

  const origen = temporal('kit-origen-');
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
    const f = require('node:path').join(raiz, 'estudio/mapa-del-curso.md');
    require('node:fs').appendFileSync(f, 'migrado-${n}\\n');
  } };`;
  const { raiz, origen } = montar({
    motorNuevo: { version_datos: 3 },
    extraOrigen: { '.kit/herramientas/migraciones/003-tres.js': migracion(3), '.kit/herramientas/migraciones/002-dos.js': migracion(2) },
  });
  const r = actualizar({ raiz, origen });
  assert.deepEqual(r.migraciones, [2, 3]);
  assert.match(leer(raiz, 'estudio/mapa-del-curso.md'), /migrado-2\nmigrado-3\n$/);
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

test('.kit/adaptadores/ viaja con el motor; config/adaptador-llm.json (local, del alumno) no se toca', () => {
  const v = require('../lib/vault');
  const local = JSON.stringify({ comando: 'codex-beta', skills: '.mi-carpeta/skills' });
  const { raiz, origen } = montar({ extraCurso: { 'config/adaptador-llm.json': local } });
  assert.ok(fs.existsSync(path.join(origen, '.kit', 'adaptadores', 'claude-code.json')), 'el kit real trae el adaptador de Claude Code');
  assert.equal(actualizar({ raiz, origen }).actualizado, true);
  assert.equal(leer(raiz, '.kit/adaptadores/claude-code.json'), leer(origen, '.kit/adaptadores/claude-code.json'));
  assert.equal(leer(raiz, 'config/adaptador-llm.json'), local);
  assert.deepEqual(v.leerAdaptador(raiz, 'claude-code'), JSON.parse(local), 'el local sigue mandando tras actualizar');
});

// issue #33: instalar-skills.js se niega, con razón, a adivinar el destino de un LLM sin adaptador (ver
// instalar-skills.test.js). Que actualizar.js lo reinstale automáticamente tras cada actualización no
// puede tirar abajo toda la actualización por eso: avisa y sigue.
test('sin adaptador para un LLM que no es Claude Code, la actualización avisa y sigue (no revierte)', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const { raiz, origen } = montar({
    extraCurso: { 'config/ajustes.json': JSON.stringify({ subir_a_github: false, llm: 'un-llm-sin-adaptador', version_datos: 1 }) },
  });
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, true);
  assert.match(lineas.join('\n'), /Aviso: no hay adaptador para "un-llm-sin-adaptador"/);
  assert.ok(!fs.existsSync(path.join(raiz, '.claude', 'skills', 'nueva')));
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

test('migración 004: un formulario.md o un ejercicios/_index.md escritos a mano se conservan con otro nombre; y es idempotente', () => {
  const m = require('../migraciones/004-formulario-y-ejercicios-generados');
  const raiz = cursoTemporal({
    'estudio/formulario.md': '# Formulario\n\n> Todas las fórmulas del curso, por bloque.\n',
    'estudio/ejercicios/_index.md': '# Índice de ejercicios\n\n| Ejercicio | Practica | De | Lo que se descubre |\n|---|---|---|---|\n',
  });
  m.migrar(raiz);
  m.migrar(raiz);   // idempotente: la segunda vuelta no encuentra nada que conservar (ya se conservó)
  assert.equal(leer(raiz, 'estudio/formulario-anterior.md'), '# Formulario\n\n> Todas las fórmulas del curso, por bloque.\n');
  assert.equal(leer(raiz, 'estudio/ejercicios/_index-anterior.md'), '# Índice de ejercicios\n\n| Ejercicio | Practica | De | Lo que se descubre |\n|---|---|---|---|\n');
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', 'formulario.md')), 'guardar.js lo escribirá de nuevo, generado');
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', 'ejercicios', '_index.md')));
});

test('migración 004: si el contenido ya es justo el que generaría el kit, no conserva nada', () => {
  const m = require('../migraciones/004-formulario-y-ejercicios-generados');
  const raiz = cursoTemporal();   // cursoTemporal ya deja formulario.md y ejercicios/_index.md recién generados
  m.migrar(raiz);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', 'formulario-anterior.md')));
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', 'ejercicios', '_index-anterior.md')));
});

// Lo único que la actualización promete es no tocar nunca lo del alumno. Si no puede guardar antes (git sin
// identidad), no puede prometer la vuelta atrás: entonces no empieza. Antes, `git clean -fd` borraba lo que
// nunca llegó a guardarse.
test('si no puede guardar antes de actualizar, no toca nada y lo que no estaba guardado sigue ahí', () => {
  const lanza = `module.exports = { descripcion: 'lanza', migrar() { throw new Error('pum'); } };`;
  const { raiz, origen } = montar({ motorNuevo: { version_datos: 2 }, extraOrigen: { '.kit/herramientas/migraciones/002-lanza.js': lanza } });
  git(raiz, 'config', '--unset', 'user.name');
  git(raiz, 'config', '--unset', 'user.email');
  git(raiz, 'config', 'user.useConfigOnly', 'true');   // que git no se invente una identidad con el nombre de la máquina
  escribir(raiz, { 'estudio/inbox/clase-07.md': 'apuntes sin guardar todavía' });
  const r = actualizar({ raiz, origen });
  assert.equal(r.actualizado, false);
  assert.equal(r.motivo, 'sin-guardar');
  assert.match(r.detalle, /sin-identidad/);
  assert.equal(leer(raiz, 'estudio/inbox/clase-07.md'), 'apuntes sin guardar todavía');
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
});

test('.gitignore: al actualizar se añaden las reglas del kit que falten y no se pisa ninguna del alumno', () => {
  const { actualizar: act, fusionarGitignore } = require('../actualizar');
  const { raiz, origen } = montar({
    extraOrigen: { '.gitignore': '# del kit\n.claude/skills/\n.codex/skills/\n.env\n' },
    motorNuevo: { ficheros: ['AGENTS.md', '.gitignore', '.kit'] },
  });
  escribir(raiz, { '.gitignore': '# mío\n.claude/skills/\nmis-borradores/\n' });   // el alumno (u otro LLM) añadió lo suyo
  assert.equal(act({ raiz, origen }).actualizado, true);
  const texto = leer(raiz, '.gitignore');
  assert.match(texto, /^# mío\n\.claude\/skills\/\nmis-borradores\/\n/);
  assert.match(texto, /# Reglas del kit añadidas al actualizar a la 2\.0\.0\n\.codex\/skills\/\n\.env\n$/);
  assert.equal((texto.match(/\.claude\/skills\//g) || []).length, 1, 'lo que ya estaba no se repite');
  assert.equal(fusionarGitignore('a\nb\n', 'b\n# c\na\n', '9'), 'a\nb\n', 'sin nada que añadir, no se toca');
  assert.equal(fusionarGitignore('a\r\nb\r\n', 'c\n', '9'), 'a\r\nb\r\n\r\n# Reglas del kit añadidas al actualizar a la 9\r\nc\r\n', 'respeta el fin de línea');
});

test('la versión publicada es la última release (etiqueta vX.Y.Z), y se descarga esa etiqueta, no main', () => {
  const { etiquetaPublicada, versionPublicada, descargar } = require('../actualizar');
  const llamadas = [];
  const gh = respuestas => args => { llamadas.push(args); return respuestas(args); };
  const conRelease = gh(args => args[0] === 'api' ? { ok: true, salida: 'v0.20.0' } : { ok: true, salida: '' });
  assert.equal(etiquetaPublicada('rsotor/profesor-kit', conRelease), 'v0.20.0');
  assert.equal(versionPublicada('rsotor/profesor-kit', conRelease), '0.20.0');
  const tmp = descargar('rsotor/profesor-kit', conRelease);
  assert.ok(fs.existsSync(tmp));
  fs.rmSync(tmp, { recursive: true, force: true });
  const clon = llamadas.find(a => a[0] === 'repo');
  assert.deepEqual(clon.slice(0, 3), ['repo', 'clone', 'rsotor/profesor-kit']);
  assert.ok(clon.includes('--branch') && clon[clon.indexOf('--branch') + 1] === 'v0.20.0');

  assert.equal(etiquetaPublicada('x/y', gh(() => ({ ok: false, salida: 'HTTP 404' }))), null, 'sin release o sin red: null');
  assert.equal(etiquetaPublicada('x/y', gh(() => ({ ok: true, salida: 'main' }))), null, 'solo vale una etiqueta de versión');
  assert.throws(() => descargar('x/y', gh(() => ({ ok: false, salida: '' }))), /última versión publicada/);
});

test('con un posible secreto en el curso no actualiza ni hace el commit previo: primero hay que quitarlo', () => {
  const { raiz, origen } = montar();
  const token = 'ghp_' + 'a1B2'.repeat(9);
  escribir(raiz, { 'estudio/inbox/notas.txt': `mi token es ${token}\n` });
  const commits = git(raiz, 'rev-list', '--count', 'HEAD');
  const r = actualizar({ raiz, origen });
  assert.deepEqual([r.actualizado, r.motivo], [false, 'secreto']);
  assert.match(r.detalle, /estudio\/inbox\/notas\.txt/);
  assert.doesNotMatch(r.detalle, /ghp_/, 'nunca enseña el secreto');
  assert.equal(git(raiz, 'rev-list', '--count', 'HEAD'), commits, 'no hay commit previo');
  assert.equal(leer(raiz, 'AGENTS.md'), 'reglas v1');
});

// Regresión encontrada por `npm run prueba-actualizar` (0.20 → 0.21): la migración la ejecuta el actualizar.js
// viejo, con sus piezas viejas en memoria; un require normal recibía el lib/indice.js viejo, sin `tituloDe`.
test('migración 004: funciona aunque en memoria estén las piezas de la versión vieja', () => {
  const rutaIndice = require.resolve('../lib/indice');
  const antes = require.cache[rutaIndice];
  require.cache[rutaIndice] = { id: rutaIndice, filename: rutaIndice, loaded: true, exports: {} };   // un indice.js "viejo", sin tituloDe
  try {
    const raiz = cursoTemporal({ 'estudio/formulario.md': '# Formulario a mano\n\nalgo mío\n' });
    const m = require('../migraciones/004-formulario-y-ejercicios-generados');
    assert.doesNotThrow(() => m.migrar(raiz));
    assert.ok(fs.existsSync(path.join(raiz, 'estudio', 'formulario-anterior.md')));
  } finally {
    if (antes) require.cache[rutaIndice] = antes; else delete require.cache[rutaIndice];
  }
});

// issue #39, H02: el motor tampoco acepta separadores de Windows, .git ni las carpetas del alumno en mayúsculas.
test('validarMotor: rechaza "\\", ".git" y datos del alumno escritos con otras mayúsculas', () => {
  const { validarMotor } = require('../actualizar');
  for (const f of ['estudio\\notas', '..\\fuera', '.', '.git', '.git/hooks/x', 'CONFIG', 'Estudio/x']) {
    assert.throws(() => validarMotor([f]), /no válida|datos del alumno/, f);
  }
  assert.doesNotThrow(() => validarMotor(['AGENTS.md', '.kit', '.claude/settings.json']));
});
