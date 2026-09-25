'use strict';
// Lanzador de Claude Code para las pruebas del kit (issue #45, plan-lanzadores): movido tal cual desde
// prueba-real.js y disparadores.js — mismos args, mismo entorno, misma forma de leer la salida. Con Claude
// Code nada cambia de comportamiento; esto es solo dónde vive el código.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const preparar = require('../../../.kit/herramientas/preparar');

// La salida en JSON trae qué se denegó (permission_denials): sin eso, un paso que se quedó sin hacer por un
// permiso solo se podía adivinar (prueba real del 2026-09-24).
function argsClaude({ prompt, modelo, permitidas }) {
  const args = ['-p', prompt, '--model', modelo, '--permission-mode', 'acceptEdits', '--permission-prompts', 'none', '--output-format', 'json'];
  return permitidas.length ? [...args, '--allowedTools', ...permitidas] : args;
}

const VARIABLES_DE_SESION = /^(CLAUDECODE|CLAUDE_CODE_[A-Z_]+|CLAUDE_EFFORT|CLAUDE_JOB_DIR|CLAUDE_PID)$/;
function entornoDeAlumno(entorno = process.env) {
  return Object.fromEntries(Object.entries(entorno).filter(([k]) => !VARIABLES_DE_SESION.test(k)));
}

// Como en el ordenador de un alumno (prueba real del 2026-09-24, 7/12): el alumno acepta una vez que confía
// en la carpeta del curso y desde entonces se aplican sus reglas (.claude/settings.json); una carpeta temporal
// nueva no es de confianza y Claude Code las ignora. Se las pasamos al lanzarlo (--allowedTools, al final).
function reglasDelCurso(cwd) {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, '.claude', 'settings.json'), 'utf8')).permissions.allow || [];
  } catch { return []; }
}

// El texto de la respuesta y lo que se denegó, de la salida JSON de claude -p. Si no hay JSON (claude falló
// antes de empezar), el texto tal cual: es lo que hay que leer para saber qué pasó.
function leerSalidaClaude(stdout) {
  const linea = String(stdout || '').split('\n').reverse().find(l => l.trim().startsWith('{'));
  let json;
  try { json = linea && JSON.parse(linea); } catch { json = null; }
  if (!json || typeof json !== 'object') return { texto: String(stdout || '').trim(), denegaciones: [] };
  const denegaciones = (json.permission_denials || []).map(d => {
    const e = d.tool_input || {};
    return { herramienta: d.tool_name, detalle: String(e.command || e.file_path || e.path || JSON.stringify(e)).slice(0, 300) };
  });
  return { texto: String(json.result ?? '').trim(), denegaciones };
}

// prueba-real.js: escribe en el curso (acceptEdits), prompt como argumento (nunca por stdin: así lo hacía
// argsClaude de siempre). Las reglas del curso salen de disco, del propio `cwd` en el que se lanza.
function argsTarea({ prompt, modelo, cwd }) {
  return { args: argsClaude({ prompt, modelo, permitidas: reglasDelCurso(cwd) }), entrada: undefined };
}

// disparadores.js: sin permisos de escritura (se deniegan sin preguntar) y en stream, para poder cortar en
// cuanto elige una skill o abre una guía.
function argsSondeo({ prompt, modelo }) {
  return {
    args: ['-p', prompt, '--model', modelo, '--permission-mode', 'default', '--permission-prompts', 'none', '--output-format', 'stream-json', '--verbose'],
    entrada: undefined,
  };
}

// Cada línea de stream-json (o la única línea de --output-format json) → los eventos normalizados que
// decidirEleccion/abrioGuia entienden. El prefijo "kit:" de un plugin no forma parte del nombre de la skill.
// Sin `id`: a diferencia de Codex (que repite el mismo item en started/completed), cada tool_use de Claude
// es una llamada distinta — equivalencia estricta con el `decidirEleccion`/`abrioGuia` de siempre, que
// contaban cada línea sin mirar ningún identificador.
function eventos(linea) {
  let m;
  try { m = JSON.parse(linea); } catch { return []; }
  if (m.type === 'result') return [{ tipo: 'fin', ok: !m.is_error }];
  if (m.type !== 'assistant') return [];
  const salida = [];
  for (const c of (m.message && m.message.content) || []) {
    if (c.type !== 'tool_use') continue;
    if (c.name === 'Skill') salida.push({ tipo: 'skill', skill: String((c.input || {}).skill || '').split(':').pop() });
    else salida.push({ tipo: 'herramienta', nombre: c.name, entrada: c.input || {} });
  }
  return salida;
}

// `motivo` (además de `mensaje`): "no-encontrado" es el único caso hoy (no hay equivalente de "sin sesión"
// que `claude --version` pueda detectar); lo usa disparadores.js para su propio texto, sin --sin-llm.
function comprobar({ ejecutar = spawnSync } = {}) {
  const r = ejecutar('claude', ['--version'], { encoding: 'utf8' });
  const ok = !r.error && r.status === 0;
  if (ok) return { ok: true, motivo: null, mensaje: '' };
  return {
    ok: false, motivo: 'no-encontrado',
    mensaje: `No se encuentra \`claude\` (o falló al arrancar). Instálalo o usa --sin-llm.\n${((r.stdout || '') + (r.stderr || '')).trim()}`.trim(),
  };
}

// En macOS (donde se lanza siempre la prueba real: CONTRIBUTING.md, "nunca en el CI") esto es un paso
// directo; comoLanzar solo actúa distinto en Windows, cuando `claude` resuelve a un `.cmd` de npm.
function comoEjecutar(plan, { plataforma = process.platform, entorno = process.env } = {}) {
  return preparar.comoLanzar({ comando: 'claude', segundoPlano: plan.args, promptPorStdin: plan.entrada !== undefined, prompt: plan.entrada || '', modelo: null, plataforma, entorno });
}

module.exports = {
  id: 'claude-code', comando: 'claude', nombre: 'claude',
  comprobar, argsTarea, argsSondeo, eventos, leerSalida: leerSalidaClaude, entorno: entornoDeAlumno, comoEjecutar,
  // Reexports: los usan prueba-real.js/disparadores.js y sus tests, byte a byte como antes de moverlos aquí.
  argsClaude, leerSalidaClaude, entornoDeAlumno, reglasDelCurso,
};
