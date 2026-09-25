'use strict';
// Lanzador de Codex CLI para las pruebas del kit (issue #45, plan-lanzadores). Codex 0.156.1 instalado SIN
// sesión (`codex login status` → "Not logged in"): todo lo de aquí se prueba con fixtures sintéticas, nunca
// con codex de verdad. Lo marcado como SUPUESTO se comprueba con la primera sesión real (issue #45).
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const preparar = require('../../../.kit/herramientas/preparar');

// El `-` final de `segundo_plano` es "el prompt por stdin": aquí siempre, así que se quita de los argumentos
// y se manda tal cual como `entrada` (nunca por una shell). `--sandbox` se sustituye por el que toque
// (escritura para la prueba real, solo lectura para disparadores).
function base({ adaptador, sandbox }) {
  const args = adaptador.segundo_plano.filter(a => a !== '-');
  const i = args.indexOf('--sandbox');
  if (i >= 0) args[i + 1] = sandbox;
  return args;
}

// Codex separa `-c a.b.c=valor` por el punto, literal, sin respetar comillas (openai/codex#35780,
// codex-rs/config/src/overrides.rs): una ruta de carpeta temporal con puntos (macOS los usa en nombres como
// "profesor-kit-prueba-XXXXXX.abc") rompería `projects."<ruta>".trust_level=...` como CLAVE. Por eso la ruta
// va en el VALOR, en una tabla TOML en línea con una sola clave fija ("projects"): `projects={"<ruta>"={...}}`.
// SUPUESTO (#45): sin sesión que lo confirme, no se sabe si Codex compara esto contra la ruta tal cual se le
// pasó o contra su forma canónica (macOS resuelve /tmp → /private/tmp, /var → /private/var): se usa
// `fs.realpathSync` para no depender de qué resuelva `cwd` que llegue aquí.
function conConfianza(args, cwd) {
  const ruta = JSON.stringify(fs.realpathSync(cwd));
  return [...args, '-c', `projects={${ruta}={trust_level="trusted"}}`];
}

function argsComunes({ adaptador, sandbox, modelo, cwd }) {
  // `approval_policy=never` sin comillas: a diferencia de `projects={...}` (una tabla TOML en línea de
  // verdad), esta es una anulación de un campo con un valor de tipo enumerado — Codex la admite sin comillas.
  const args = [...conConfianza(base({ adaptador, sandbox }), cwd), '--json', '-c', 'approval_policy=never'];
  if (modelo) args.push('-m', modelo);
  return args;
}

// Escribe en el curso (workspace-write); el prompt siempre por stdin, nunca como argumento.
function argsTarea({ prompt, modelo, cwd, adaptador }) {
  return { args: argsComunes({ adaptador, sandbox: 'workspace-write', modelo, cwd }), entrada: prompt };
}

// disparadores.js: solo lectura, nunca escribe en el curso montado.
function argsSondeo({ prompt, modelo, cwd, adaptador }) {
  return { args: argsComunes({ adaptador, sandbox: 'read-only', modelo, cwd }), entrada: prompt };
}

// SUPUESTO (#45) S1: el modelo lee SKILL.md con un `command_execution` (un futuro flag `skill_search` podría
// cambiarlo). Cuenta como esa skill si el comando cita UNA sola `.agents/skills/<nombre>/SKILL.md` (ruta
// absoluta o relativa, entre comillas, con barras de Windows); si no cita ninguna o cita más de una
// (`ls .agents/skills`, comparar dos skills), es una herramienta cualquiera, no una skill.
const RE_SKILL = /(?:^|[\s'"/\\])\.agents[/\\]skills[/\\]([\w-]+)[/\\]SKILL\.md/g;
function skillDelComando(comando) {
  if (typeof comando !== 'string') return null;
  const nombres = new Set();
  let m;
  RE_SKILL.lastIndex = 0;
  while ((m = RE_SKILL.exec(comando))) nombres.add(m[1]);
  return nombres.size === 1 ? [...nombres][0] : null;
}

// Cada línea JSONL de `codex exec --json` → los eventos normalizados. `item.started` e `item.completed`
// traen el mismo `item.id`: decidirEleccion/abrioGuia (pruebas/disparadores.js) descartan el repetido.
function eventos(linea) {
  let m;
  try { m = JSON.parse(linea); } catch { return []; }
  // Solo turn.completed/turn.failed terminan el turno de verdad (event_processor_with_jsonl_output.rs):
  // un evento `error` NO corta el proceso, sigue habiendo item.* después — se trata como texto, no como fin.
  if (m.type === 'turn.completed') return [{ tipo: 'fin', ok: true }];
  if (m.type === 'turn.failed') return [{ tipo: 'fin', ok: false }];
  if (m.type === 'error') return [{ tipo: 'texto', texto: m.message || '' }];
  if (m.type !== 'item.started' && m.type !== 'item.completed') return [];
  const item = m.item || {};
  const id = item.id;
  if (item.type === 'command_execution') {
    const skill = skillDelComando(item.command);
    return [skill ? { tipo: 'skill', id, skill } : { tipo: 'herramienta', id, nombre: 'Bash', entrada: { command: item.command } }];
  }
  if (item.type === 'file_change') {
    const cambios = item.changes || [];
    return [{ tipo: 'herramienta', id, nombre: 'file_change', entrada: { path: cambios[0] && cambios[0].path } }];
  }
  if (item.type === 'mcp_tool_call') return [{ tipo: 'herramienta', id, nombre: item.tool || 'mcp_tool_call', entrada: { server: item.server, tool: item.tool } }];
  if (item.type === 'web_search') return [{ tipo: 'herramienta', id, nombre: 'web_search', entrada: { query: item.query } }];
  if (item.type === 'agent_message') return [{ tipo: 'texto', texto: item.text || '' }];
  return [];
}

// SUPUESTO (#45) S5: el status y el texto exactos de una denegación están por comprobar con una sesión real.
// De momento: `declined` es siempre una denegación (Codex ya decidió no hacerlo); `completed` nunca lo es
// (el comando corrió, pase lo que pase en su salida — "sandbox" o "rejected" salen también en comandos que
// simplemente miran la configuración, no serían denegaciones); `failed` solo cuenta si la salida es
// justo la de un permiso real denegado por el sandbox (no cualquier fallo: un `rg` sin resultados también
// sale con status failed y código de salida 1, y no es una denegación).
const PATRON_DENEGACION = /Operation not permitted|Read-only file system/;
function esDenegacion(item) {
  if (item.status === 'declined') return true;
  if (item.status !== 'failed') return false;
  return PATRON_DENEGACION.test(String(item.aggregated_output || ''));
}
function leerSalida(stdout) {
  const texto = String(stdout || '');
  let esJsonl = false;
  let ultimoMensaje = '';
  const denegaciones = [];
  for (const linea of texto.split('\n')) {
    if (!linea.trim()) continue;
    let m;
    try { m = JSON.parse(linea); } catch { continue; }
    if (!m || typeof m !== 'object' || !m.type) continue;
    esJsonl = true;
    const item = m.item || {};
    if ((m.type === 'item.started' || m.type === 'item.completed') && item.type === 'agent_message' && item.text) ultimoMensaje = item.text;
    if (m.type === 'item.completed' && (item.type === 'command_execution' || item.type === 'file_change') && esDenegacion(item)) {
      const detalle = item.type === 'command_execution' ? item.command : ((item.changes || [])[0] || {}).path;
      denegaciones.push({ herramienta: item.type === 'command_execution' ? 'Bash' : 'file_change', detalle: String(detalle || '').slice(0, 300) });
    }
  }
  if (!esJsonl) return { texto: texto.trim(), denegaciones: [] };
  return { texto: ultimoMensaje.trim(), denegaciones };
}

// SUPUESTO (#45) S6: los nombres exactos de las variables de entorno de la sesión de Codex están por
// comprobar con una sesión real (se ven en su código fuente: CODEX_SANDBOX*, CODEX_THREAD_ID). Nunca se toca
// CODEX_HOME: es donde el alumno guarda su propia configuración de Codex.
const VARIABLES_DE_SESION = /^CODEX_(SANDBOX|THREAD_ID)/;
function entorno(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([k]) => !VARIABLES_DE_SESION.test(k)));
}

// En Windows, `codex` casi siempre es un `.cmd` de npm: spawnSync('codex', ...) sin shell da ENOENT (Node no
// ejecuta .cmd/.bat directos sin `shell: true`). `comoLanzar` (preparar.js) sabe resolverlo y envolverlo con
// cmd.exe — aquí basta, porque `--version`/`login status` son argumentos "limpios" (sin comillas ni llaves).
function correr(args, { ejecutar, plataforma, entorno }) {
  const plan = preparar.comoLanzar({ comando: 'codex', segundoPlano: args, promptPorStdin: false, prompt: '', modelo: null, plataforma, entorno });
  if (plan.error) return { error: new Error(plan.error), status: null };
  return ejecutar(plan.ejecutable, plan.args, { encoding: 'utf8', windowsVerbatimArguments: plan.literal === true });
}

// `motivo` (además de `mensaje`, ya listo para imprimir): quien llama a comprobar() puede usarlo para dar
// un texto propio en vez del genérico (disparadores.js no tiene --sin-llm, y "no encuentro codex" necesita
// otra sugerencia ahí).
function comprobar({ ejecutar = spawnSync, plataforma = process.platform, entorno = process.env } = {}) {
  const version = correr(['--version'], { ejecutar, plataforma, entorno });
  if (version.error || version.status !== 0) return { ok: false, motivo: 'no-encontrado', mensaje: 'No encuentro `codex`: instálalo o usa --sin-llm.' };
  const sesion = correr(['login', 'status'], { ejecutar, plataforma, entorno });
  if (sesion.status !== 0) return { ok: false, motivo: 'sin-sesion', mensaje: 'Codex está instalado pero sin sesión: ejecuta `codex login` y repite.' };
  return { ok: true, motivo: null, mensaje: '' };
}

// Igual que resolverEnWindows de preparar.js (duplicado a propósito: no es parte de la interfaz pública del
// motor — comoLanzar no devuelve la ruta resuelta cuando envuelve con cmd.exe, y aquí hace falta para poder
// buscar al lado el script real de Codex).
function resolverEnWindows(comando, entorno) {
  if (path.isAbsolute(comando)) return comando;
  const extensiones = ['', ...(entorno.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)];
  for (const dir of (entorno.PATH || entorno.Path || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of extensiones) {
      const candidato = path.join(dir, comando + ext.toLowerCase());
      if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
    }
  }
  return comando;
}

// Los argumentos de argsTarea/argsSondeo nunca son "limpios" (approval_policy=never, el trust en TOML): en
// Windows, comoLanzar los rechaza si `codex` resuelve a un `.cmd` (solo se puede lanzar por cmd.exe, que no
// admite comillas ni llaves sueltas — issue #39 H01). SUPUESTO (#45): el paquete npm de Codex en Windows deja
// su script real al lado del `.cmd`, en `node_modules/@openai/codex/bin/codex.js`; se lanza con
// `process.execPath` (node), sin ninguna shell de por medio, así que los argumentos pueden ser cualquier cosa.
function scriptNpmJuntoAlCmd(rutaCmd) {
  return path.join(path.dirname(rutaCmd), 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
}

function comoEjecutar(plan, { plataforma = process.platform, entorno = process.env } = {}) {
  const r = preparar.comoLanzar({ comando: 'codex', segundoPlano: plan.args, promptPorStdin: plan.entrada !== undefined, prompt: plan.entrada || '', modelo: null, plataforma, entorno });
  if (plataforma !== 'win32' || !r.error) return r;
  const resuelto = resolverEnWindows('codex', entorno);
  if (!/\.(cmd|bat)$/i.test(resuelto)) return r;   // el error era otra cosa: no era el caso del .cmd
  const script = scriptNpmJuntoAlCmd(resuelto);
  if (!fs.existsSync(script)) return { error: `no encuentro el script de Codex junto a ${path.basename(resuelto)} (esperaba ${script})` };
  return { ejecutable: process.execPath, args: [script, ...plan.args], entrada: plan.entrada };
}

module.exports = {
  id: 'codex', comando: 'codex', nombre: 'codex',
  comprobar, argsTarea, argsSondeo, eventos, leerSalida, entorno, comoEjecutar, skillDelComando,
};
