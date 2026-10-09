'use strict';
// base-kit dentro de profesor-kit (issue #99): los cursos reciben `.base-kit/` por el motor (el feedback al kit,
// `kit-issue.js`, y la protección de claves, `secret-guard`), configurado por `.kit/base-kit.json`; las reglas y
// los agentes de desarrollo (`.claude/rules/base-kit.md`, `.claude/agents/`) se quedan en este repo. Estos tests
// vigilan que esa frontera no se mueva sin querer.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..', '..', '..');
const leer = rel => fs.readFileSync(path.join(RAIZ, ...rel.split('/')), 'utf8');
const json = rel => JSON.parse(leer(rel));

test('el motor incluye .base-kit: un curso recibe el feedback al kit y la protección de claves al actualizar', () => {
  assert.ok(json('.kit/motor.json').ficheros.includes('.base-kit'));
  for (const f of ['.base-kit/installed.json', '.base-kit/hooks/kit-issue.js', '.base-kit/hooks/secret-guard.js', '.base-kit/hooks/lib/config.js']) {
    assert.ok(fs.existsSync(path.join(RAIZ, ...f.split('/'))), f);
  }
});

test('cada hook de .claude/settings.json apunta a un fichero que existe, y el único registrado es secret-guard', () => {
  const ajustes = json('.claude/settings.json');
  const comandos = Object.values(ajustes.hooks || {}).flat().flatMap(e => e.hooks || []).map(h => h.command);
  assert.ok(comandos.length > 0, 'secret-guard tiene que estar registrado: sin él, nada impide al asistente leer .env');
  for (const c of comandos) {
    const m = /^node "\$CLAUDE_PROJECT_DIR\/([^"]+)"$/.exec(c);
    assert.ok(m, `el comando del hook va con $CLAUDE_PROJECT_DIR y una ruta relativa: ${c}`);
    assert.ok(fs.existsSync(path.join(RAIZ, ...m[1].split('/'))), `el hook apunta a un fichero que no existe: ${m[1]}`);
  }
  assert.deepEqual(comandos.map(c => path.basename(c, '"')), ['secret-guard.js'], 'en los cursos solo va secret-guard (decisión 6 de la #99)');
});

test('.kit/base-kit.json es válido: feedback encendido hacia este repo, etiqueta con la versión del kit, autosave apagado', () => {
  const config = json('.kit/base-kit.json');
  assert.equal(config.status, 'configured');
  assert.equal(config.feedback.auto, true);
  assert.equal(config.feedback.repo, 'rsotor/profesor-kit');
  assert.equal(config.feedback.label, `profesor-kit ${leer('.kit/VERSION').trim()}`, 'la etiqueta va con .kit/VERSION: súbela con la versión');
  assert.ok(!config.feedback.account, 'sin cuenta fija: firma la cuenta activa de gh del alumno');
  assert.equal(config.autosave.enabled, false, 'un curso guarda con guardar.js');
  assert.equal(json('.base-kit/installed.json').configFile, '.kit/base-kit.json', 'el manifiesto apunta a esta config: es la que lee kit-issue.js');
});

test('el manifiesto de base-kit es el de una instalación que reparte: modo project, distribute, solo secret-guard', () => {
  const m = json('.base-kit/installed.json');
  assert.equal(m.mode, 'project');
  assert.equal(m.distribute, true);
  assert.deepEqual(m.hookSet, ['secret-guard']);
  assert.equal(m.rulesFile, '.claude/rules/base-kit.md');
  assert.equal(m.hooksFile, '.claude/settings.json');
});

test('permisos.js permite kit-issue.js al alumno que acepta una vez (Claude Code y Codex)', () => {
  const { aplicar } = require('../permisos');
  const { cursoTemporal } = require('./ayuda');
  const adaptador = JSON.stringify({ comando: 'claude', skills: '.claude/skills', aceptar_una_vez: { tipo: 'claude-code' } });
  const raiz = cursoTemporal({
    'config/ajustes.json': JSON.stringify({ llm: 'claude-code', subir_a_github: false, version_datos: 4 }),
    '.kit/adaptadores/claude-code.json': adaptador, '.kit/herramientas/guardar.js': '', '.base-kit/hooks/kit-issue.js': '',
  });
  aplicar(raiz);
  const p = JSON.parse(fs.readFileSync(path.join(raiz, 'estudio', '.claude', 'settings.local.json'), 'utf8')).permissions;
  assert.ok(p.allow.includes('Bash(node .base-kit/hooks/kit-issue.js *)'));
  assert.ok(p.allow.includes('Bash(node ../.base-kit/hooks/kit-issue.js *)'), 'desde estudio/, con ..');
});

test('.claude/agents (los agentes de desarrollo de base-kit) está en SOLO_DEL_KIT: un curso no los recibe', () => {
  const codigo = leer('.kit/herramientas/preparar-curso.js');
  const lista = /const SOLO_DEL_KIT = \[([^\]]+)\]/.exec(codigo);
  assert.ok(lista, 'SOLO_DEL_KIT sigue siendo una lista literal');
  assert.ok(lista[1].includes("'.claude/agents'"));
  assert.ok(lista[1].includes("'.claude/rules'"));
  assert.ok(!json('.kit/motor.json').ficheros.some(f => f.startsWith('.claude/agents') || f.startsWith('.claude/rules')), 'ni por el motor');
});

test('nada de lo versionado lleva una ruta con un nombre de usuario', () => {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: RAIZ, encoding: 'utf8' });
  if (r.status !== 0) return; // sin git (una copia suelta del kit): no hay lista que mirar
  const RUTA_DE_USUARIO = /(\/Users|\/home|[A-Za-z]:\\Users)\/[A-Za-z0-9._-]+\//;
  // Fuera: los tests (fabrican rutas de ejemplo) y lo que es texto de ejemplo con un nombre inventado (`ana`).
  const FUERA = /^\.kit\/herramientas\/tests\//;
  const malas = [];
  for (const f of r.stdout.split('\0').filter(Boolean)) {
    if (FUERA.test(f) || !/\.(md|js|json|yml|yaml|txt|sh|toml)$/.test(f)) continue;
    const abs = path.join(RAIZ, f);
    if (!fs.existsSync(abs)) continue; // borrado en el árbol, aún en el índice
    const texto = fs.readFileSync(abs, 'utf8');
    const lineas = texto.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => RUTA_DE_USUARIO.test(l) && !/<usuario>|tunombre|\/ana\//.test(l));
    for (const [n] of lineas) malas.push(`${f}:${n}`);
  }
  assert.deepEqual(malas, [], 'rutas con nombre de usuario en ficheros versionados');
});
