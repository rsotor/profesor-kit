'use strict';
// Lo que comparten pruebas/prueba-real.js y pruebas/prueba-actualizar.js: montar, en una carpeta
// temporal, un curso de verdad a partir del motor de una copia de trabajo del kit + los datos de
// pruebas/curso-ejemplo/. No vive en .kit/herramientas/ a propósito: no es motor, es infraestructura
// de pruebas del propio repo del kit (preparar-curso.js la borra al crear un curso).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PREFIJO_TEMPORAL = 'profesor-kit-prueba-';

// Autolimpieza: toda carpeta nacida aquí se borra al terminar el proceso, también si algo falla a
// medio camino. Mismo patrón que .kit/herramientas/tests/ayuda.js#temporal(), pero self-contained:
// pruebas/ no depende de los helpers de test del motor.
const TEMPORALES = [];
function carpetaTemporal() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), PREFIJO_TEMPORAL));
  TEMPORALES.push(dir);
  return dir;
}
function borrar(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* Windows: fichero abierto */ }
}
process.on('exit', () => { for (const dir of TEMPORALES) borrar(dir); });

function ejecutarNodo(script, args, cwd) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`node ${path.basename(script)} ${args.join(' ')} falló (código ${r.status}):\n${r.stdout || ''}${r.stderr || ''}`);
  }
  return r;
}

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} falló: ${(r.stdout || '') + (r.stderr || '')}`);
  return r.stdout;
}

// Identidad de prueba: nunca la del mantenedor, para que un commit de una carpeta temporal no acabe
// apareciendo con su nombre en ningún sitio.
function iniciarGit(destino) {
  git(destino, ['init', '-q', '-b', 'main']);
  git(destino, ['config', 'user.name', 'Prueba real del profesor']);
  git(destino, ['config', 'user.email', 'prueba-real@localhost']);
  git(destino, ['config', 'commit.gpgsign', 'false']);
  git(destino, ['add', '-A']);
  git(destino, ['commit', '-q', '-m', 'estado inicial del curso de ejemplo']);
}

function copiar(origen, destino) {
  if (fs.existsSync(origen)) fs.cpSync(origen, destino, { recursive: true });
}

// Copia los ficheros del motor (los que lista .kit/motor.json) desde `trabajo` (la copia de trabajo
// actual del kit) a `destino`. Es justo lo que sustituiría /actualizar, aplicado una vez al montar.
function copiarMotor(trabajo, destino) {
  const motor = JSON.parse(fs.readFileSync(path.join(trabajo, '.kit', 'motor.json'), 'utf8'));
  for (const f of motor.ficheros) copiar(path.join(trabajo, ...f.split('/')), path.join(destino, ...f.split('/')));
  return motor;
}

// Monta un curso de verdad en `destino`: motor de `trabajo` + `preparar-curso.js` (ajustes por
// defecto, README con huecos, ajustes de Obsidian) + los datos de `datosCurso`
// (pruebas/curso-ejemplo/: config/, estudio/, README.md), que pisan lo que dejó preparar-curso.js.
// `version_datos` de config/ajustes.json se ajusta siempre al motor que se está montando: así el
// curso de ejemplo no se queda desincronizado el día que suba `.kit/motor.json#version_datos`.
// `llm` (issue #45): fuerza `ajustes.llm` antes de instalar las skills, para que vayan al sitio que
// diga su adaptador (`.agents/skills` para Codex); sin él, el llm de `datosCurso` (siempre claude-code
// en pruebas/curso-ejemplo/, así que con Claude Code nada cambia).
function montarCurso({ trabajo, datosCurso, nombre, destino = carpetaTemporal(), llm }) {
  fs.mkdirSync(destino, { recursive: true });
  const motor = copiarMotor(trabajo, destino);
  ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'preparar-curso.js'), ['--subir', 'no', '--nombre', nombre], destino);

  for (const rel of ['config', 'estudio', 'README.md']) copiar(path.join(datosCurso, rel), path.join(destino, rel));

  const ficheroAjustes = path.join(destino, 'config', 'ajustes.json');
  const ajustes = JSON.parse(fs.readFileSync(ficheroAjustes, 'utf8'));
  ajustes.version_datos = motor.version_datos;
  if (llm) ajustes.llm = llm;
  fs.writeFileSync(ficheroAjustes, JSON.stringify(ajustes, null, 2) + '\n');

  iniciarGit(destino);
  ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'instalar-skills.js'), [], destino);
  // Con Codex, el curso montado queda con los permisos aceptados de una vez, como los dejaría un alumno de
  // verdad (permisos.js --aplicar): sin sesión, `codex exec` con approval_policy=never necesita ya de
  // entrada un curso "de confianza" para que la denegación que mida la prueba sea la de verdad, no un
  // rechazo por no haber aceptado nada.
  if (ajustes.llm === 'codex') ejecutarNodo(path.join(destino, '.kit', 'herramientas', 'permisos.js'), ['--aplicar'], destino);

  return { destino, motor };
}

function comprobarJson(destino) {
  const r = spawnSync(process.execPath, [path.join(destino, '.kit', 'herramientas', 'comprobar.js'), '--json'], { cwd: destino, encoding: 'utf8' });
  return JSON.parse(r.stdout);
}

module.exports = { carpetaTemporal, borrar, ejecutarNodo, git, iniciarGit, copiar, copiarMotor, montarCurso, comprobarJson };
