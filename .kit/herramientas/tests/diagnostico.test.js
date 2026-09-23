'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { diagnostico, cli } = require('../diagnostico');
const { crearAtajo } = require('../crear-atajo');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

const MOTOR = { '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros: ['AGENTS.md', '.kit'] }), 'AGENTS.md': 'reglas' };

// Un "ordenador" de mentira: qué responde cada comando.
const ordenador = (respuestas = {}) => (comando, args) => {
  const clave = [comando, ...args].join(' ');
  const r = Object.entries(respuestas).find(([k]) => clave.startsWith(k));
  return r ? r[1] : { ok: true, salida: '' };
};

const ADAPTADOR_CLAUDE = { comando: 'claude', skills: '.claude/skills', puente: 'CLAUDE.md',
  permisos: { fichero: '.claude/settings.json', formato: 'Bash(node .kit/herramientas/<nombre>.js *)' }, probado: 'macOS · 2026-09-23' };

function cursoInstalado({ subir = false, llm = 'claude-code' } = {}) {
  const raiz = cursoTemporal({ ...MOTOR, 'config/ajustes.json': JSON.stringify({ subir_a_github: subir, llm }),
    '.kit/adaptadores/claude-code.json': JSON.stringify(ADAPTADOR_CLAUDE),
    '.claude/skills/sesion/SKILL.md': 'x', 'estudio/.obsidian/workspace.json': '{}' });
  iniciarGit(raiz);
  const carpetaBin = temporal('kit-bin-');
  const entorno = { PATH: [carpetaBin, os.tmpdir()].join(path.delimiter) };
  crearAtajo({ raiz, nombre: 'historia', carpetaBin, entorno });
  return { raiz, carpetaBin, entorno };
}
const fallos = lista => lista.filter(c => !c.ok).map(c => c.id);

test('una instalación completa sale entera en verde', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })), []);
});

test('dice exactamente qué falta, con su arreglo, y no da por bueno lo que no puede comprobar', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  const lista = diagnostico({ raiz, carpetaBin, entorno, versionNode: '20.11.0',
    ejecutar: ordenador({ 'gh --version': { ok: false, salida: 'gh: no se reconoce' } }) });
  assert.deepEqual(fallos(lista), ['node', 'gh', 'sesion-github', 'acceso-al-kit']);
  assert.ok(lista.filter(c => !c.ok).every(c => c.arreglo.length > 10));
});

test('sesión iniciada pero el kit no responde (red): lo dice sin hablar de invitaciones', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  const lista = diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador({ 'gh api repos/rsotor/profesor-kit': { ok: false, salida: 'HTTP 404' } }) });
  assert.deepEqual(fallos(lista), ['acceso-al-kit']);
  assert.match(lista.find(c => c.id === 'acceso-al-kit').arreglo, /conexión/);
  assert.doesNotMatch(lista.find(c => c.id === 'acceso-al-kit').arreglo, /invitaci/);
});

test('si se sube a GitHub, exige remoto propio y que sea PRIVADO de verdad', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado({ subir: true });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })), ['copia-en-github']);

  git(raiz, 'remote', 'add', 'origin', 'https://github.com/rsotor/profesor-kit.git');     // sigue apuntando al kit
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })), ['copia-en-github']);

  git(raiz, 'remote', 'set-url', 'origin', 'https://github.com/ana/curso-historia.git');
  const publico = ordenador({ 'gh repo view': { ok: true, salida: 'PUBLIC\n' } });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: publico })), ['copia-privada']);
  const privado = ordenador({ 'gh repo view': { ok: true, salida: 'PRIVATE\n' } });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: privado })), []);
  const sinRespuesta = ordenador({ 'gh repo view': { ok: false, salida: '' } });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: sinRespuesta })), ['copia-privada']);
});

test('atajo: que exista, que sea de ESTE curso y que su carpeta esté en el PATH', () => {
  const { raiz, carpetaBin } = cursoInstalado();
  const casa = temporal('kit-casa-');
  const sinNada = { casa, ejecutarPs: () => ({ ok: true, salida: '' }) };
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno: { PATH: os.tmpdir() }, ejecutar: ordenador(), ...sinNada })), ['atajo-en-path']);
  // Ya guardado para las ventanas nuevas (lo hizo crear-atajo.js), aunque esta ventana aún no lo vea: vale.
  const guardado = { casa, ejecutarPs: () => ({ ok: true, salida: carpetaBin }) };
  fs.writeFileSync(path.join(casa, process.platform === 'darwin' ? '.zshrc' : '.profile'), `export PATH="${carpetaBin}:$PATH"\n`);
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno: { PATH: os.tmpdir() }, ejecutar: ordenador(), ...guardado })), []);
  fs.rmSync(path.join(carpetaBin, process.platform === 'win32' ? 'historia.cmd' : 'historia'));
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno: { PATH: carpetaBin }, ejecutar: ordenador() })), ['atajo']);
});

test('otro LLM sin adaptador del kit: no se puede verificar, es aviso, no bloquea', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado({ llm: 'codex-cli' });
  fs.rmSync(path.join(raiz, '.claude'), { recursive: true });
  const lista = diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() });
  const skills = lista.find(c => c.id === 'skills');
  assert.deepEqual([skills.ok, skills.obligatorio], [false, false]);
  assert.match(skills.arreglo, /No hay un adaptador para codex-cli.*ESTANDARES\.md.*config\/adaptador-llm\.json/s);
});

test('otro LLM con adaptador propio del curso (config/adaptador-llm.json): comprueba su carpeta de skills de verdad', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado({ llm: 'codex-cli' });
  fs.rmSync(path.join(raiz, '.claude'), { recursive: true });
  escribir(raiz, { 'config/adaptador-llm.json': JSON.stringify({ comando: 'codex', skills: '.codex/skills', puente: null, permisos: null, probado: 'Windows · 2026-09-23' }) });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })), ['skills']);
  escribir(raiz, { '.codex/skills/sesion/SKILL.md': 'x' });
  assert.deepEqual(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })), []);
});

test('una carpeta .obsidian creada por el kit no cuenta como bóveda abierta', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  fs.rmSync(path.join(raiz, 'estudio', '.obsidian', 'workspace.json'));
  assert.ok(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })).includes('obsidian'));
});

test('Obsidian sin abrir es un aviso, no bloquea; un curso con errores sí', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  fs.rmSync(path.join(raiz, 'estudio', '.obsidian'), { recursive: true });
  assert.equal(cli([], raiz, { carpetaBin, entorno, ejecutar: ordenador() }), 0);
  assert.match(lineas.join('\n'), /⚠ La carpeta estudio está abierta en Obsidian/);
  assert.match(lineas.join('\n'), /Todo listo\. \(1 aviso/);

  escribir(raiz, { 'estudio/progreso.md': '# vacío\n' });
  assert.equal(cli([], raiz, { carpetaBin, entorno, ejecutar: ordenador() }), 1);
  assert.match(lineas.join('\n'), /✗ El curso está sano/);
  assert.match(lineas.join('\n'), /Faltan 1 cosa/);
  assert.equal(cli(['--json'], raiz, { carpetaBin, entorno, ejecutar: ordenador() }), 1);
  assert.equal(JSON.parse(lineas.pop()).find(c => c.id === 'curso-sano').ok, false);
});
