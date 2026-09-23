'use strict';
const { temporal } = require('./ayuda');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Una instalación entera como la haría el profesor, pero lanzando cada herramienta como proceso real y, al
// final, ejecutando el atajo de verdad. En el CI corre en Linux y Windows, y en local en el Mac (hook de pre-push): es lo único que prueba el
// lanzador .cmd en un Windows real.
const KIT = path.resolve(__dirname, '..', '..', '..');
const WIN = process.platform === 'win32';
const casa = temporal('kit-e2e-');
const bin = path.join(casa, '.local', 'bin');
const curso = path.join(casa, 'cursos', 'curso-e2e');
fs.mkdirSync(bin, { recursive: true });

// Un "claude" de mentira: solo dice desde qué carpeta lo han abierto.
if (WIN) fs.writeFileSync(path.join(bin, 'claude.cmd'), '@echo off\r\necho profesor abierto en: %CD%\r\n');
else { fs.writeFileSync(path.join(bin, 'claude'), '#!/bin/sh\necho "profesor abierto en: $(pwd)"\n'); fs.chmodSync(path.join(bin, 'claude'), 0o755); }

const entorno = { ...process.env, HOME: casa, USERPROFILE: casa, PATH: [bin, process.env.PATH].join(path.delimiter), Path: undefined };
const ejecutar = (cmd, args, cwd = curso) => {
  const r = spawnSync(cmd, args, { cwd, env: entorno, encoding: 'utf8' });
  return { codigo: r.status, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
};
const herramienta = (nombre, ...args) => ejecutar(process.execPath, [path.join(curso, '.kit', 'herramientas', `${nombre}.js`), ...args]);
const leer = rel => fs.readFileSync(path.join(curso, ...rel.split('/')), 'utf8');

test('1. crear el curso desde la plantilla (clon del kit) y prepararlo', () => {
  const clon = ejecutar('git', ['clone', '-q', KIT, curso], casa);
  assert.equal(clon.codigo, 0, clon.salida);
  for (const [k, v] of [['user.name', 'Alumna E2E'], ['user.email', 'e2e@example.com'], ['commit.gpgsign', 'false']]) ejecutar('git', ['config', k, v]);
  const r = herramienta('preparar-curso', '--subir', 'no', '--nombre', 'Curso de extremo a extremo');
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /Curso preparado/);
  assert.match(leer('README.md'), /^# Curso de extremo a extremo/);
  assert.ok(!fs.existsSync(path.join(curso, 'docs')));
});

test('2. skills instaladas y atajo creado', () => {
  assert.match(herramienta('instalar-skills').salida, /Skills instaladas: actualizar, configurar/);
  const r = herramienta('crear-atajo', '--nombre', 'e2e');
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /escribir "e2e" en la terminal abre este curso/);
  assert.doesNotMatch(r.salida, /no está en el PATH/);
});

test('3. el atajo, ejecutado de verdad, abre el profesor dentro del curso', () => {
  const r = WIN ? ejecutar('cmd.exe', ['/c', 'e2e'], casa) : ejecutar('sh', ['-c', 'e2e'], casa);
  assert.equal(r.codigo, 0, r.salida);
  assert.ok(r.salida.includes('profesor abierto en:'), r.salida);
  assert.equal(fs.realpathSync(r.salida.split('profesor abierto en:')[1].trim()), fs.realpathSync(curso));   // en Mac, /var → /private/var
});

test('4. guardar deja commit, diario y pendientes', () => {
  const r = herramienta('guardar', 'curso: instalación');
  assert.equal(r.codigo, 0, r.salida);
  assert.match(r.salida, /Guardado en local/);
  assert.match(leer('config/diario.md'), /curso: instalación/);
  assert.match(leer('estudio/pendientes.md'), /Nada pendiente/);
  assert.equal(ejecutar('git', ['status', '--porcelain']).salida, '');
});

test('5. una sesión nueva se coloca en su unidad y comprobar la acepta', () => {
  fs.writeFileSync(path.join(curso, 'config', 'estructura.json'), JSON.stringify({ unidades: [{ prefijo: '01', carpeta: 'modulo-01' }] }));
  fs.writeFileSync(path.join(curso, 'estudio', 'sesiones', '01-01-intro.md'), '---\ntipo: sesion\nbloque: 1\n---\n# Intro\n\n**TODO:** revisar\n');
  assert.match(herramienta('organizar').salida, /Colocados 1 fichero/);
  assert.ok(fs.existsSync(path.join(curso, 'estudio', 'sesiones', 'modulo-01', '01-01-intro.md')));
  assert.equal(herramienta('comprobar').codigo, 0);
  herramienta('guardar', 'sesion(01-01): intro');
  assert.match(leer('estudio/pendientes.md'), /Bloque 1 \(1\)[\s\S]*revisar/);
  const inicio = leer('estudio/inicio.md');
  assert.match(inicio, /👉 Sigue por aquí: \[\[01-01-intro\|Intro\]\]/);
  assert.match(leer('estudio/sesiones/modulo-01/01-01-intro.md'), /\[\[inicio\|🏠 Inicio\]\]/);
  assert.equal(ejecutar('git', ['status', '--porcelain']).salida, '');
});

test('6. un despiste se repara solo', () => {
  fs.rmSync(path.join(curso, 'README.md'));
  fs.rmSync(path.join(curso, 'estudio', 'flashcards'), { recursive: true });
  assert.equal(herramienta('comprobar').codigo, 1);
  assert.match(herramienta('reparar').salida, /Recuperado de la última vez que se guardó: README\.md, estudio\/flashcards/);
  assert.equal(herramienta('comprobar').codigo, 0);
});

test('7. el diagnóstico ve bien lo que no depende de la red, y actualizar sabe que está al día', () => {
  const lista = JSON.parse(herramienta('diagnostico', '--json').salida);
  const estado = Object.fromEntries(lista.map(c => [c.id, c.ok]));
  for (const id of ['node', 'git', 'identidad-git', 'curso-preparado', 'skills', 'atajo', 'atajo-en-path', 'curso-sano']) assert.equal(estado[id], true, id);
  assert.match(herramienta('actualizar', '--ver', '--origen', KIT).salida, /Ya tienes la última versión/);
});
