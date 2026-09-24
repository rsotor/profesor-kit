'use strict';
// El "servicio técnico" del kit (docs/planes/2026-09-24-permisos-diseno.md): con un sí del alumno, su profesor edita
// sus notas y ejecuta las herramientas del kit sin preguntar a cada paso, solo dentro del curso. Qué se permite lo
// decide el kit, igual para todos; dónde y cómo se escribe, el adaptador de cada asistente (`aceptar_una_vez`).
// Nunca: nada fuera del curso, ningún comando genérico (python3, bash…), ni el modo "sin preguntar nada".
//
//   node .kit/herramientas/permisos.js --ver | --aplicar | --quitar
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');

const GIT_DE_SOLO_LECTURA = ['Bash(git status *)', 'Bash(git log *)', 'Bash(git diff *)'];

// Las herramientas del kit que hay en este curso (no las piezas internas de lib/ ni los tests).
function herramientas(raiz) {
  const dir = path.join(raiz, '.kit', 'herramientas');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.js')).sort() : [];
}

// ── Claude Code ──────────────────────────────────────────────────────────────────────────────────────
// `.claude/settings.local.json` (el de este ordenador, fuera de git y del motor) en la raíz y en estudio/, que es
// donde lo abre Obsidian. Desde estudio/ necesita llegar a la raíz (config/, .kit/): `..`. Probado el 2026-09-24:
// la confianza en la carpeta del curso vale para sus subcarpetas, y se respeta el .local.
function sitiosClaudeCode(raiz) {
  const reglas = prefijo => [...herramientas(raiz).map(n => `Bash(node ${prefijo}.kit/herramientas/${n} *)`), ...GIT_DE_SOLO_LECTURA];
  return [
    { fichero: path.join(raiz, '.claude', 'settings.local.json'), allow: reglas(''), directorios: [] },
    { fichero: path.join(raiz, v.CARPETA_ALUMNO, '.claude', 'settings.local.json'),
      allow: [...reglas(''), ...reglas('../')], directorios: ['..'] },
  ];
}

function leerJsonDe(fichero) {
  if (!fs.existsSync(fichero)) return null;
  try { return JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch {
    throw new Error(`${path.basename(path.dirname(path.dirname(fichero)))}/.claude/settings.local.json no es JSON válido: arréglalo (o bórralo) y repite; no se ha tocado nada.`);
  }
}

function escribirJson(fichero, datos) {
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, JSON.stringify(datos, null, 2) + '\n');
}

const claudeCode = {
  estado(raiz) {
    return sitiosClaudeCode(raiz).map(sitio => {
      const p = ((leerJsonDe(sitio.fichero) || {}).permissions) || {};
      return p.defaultMode === 'acceptEdits' && sitio.allow.every(r => (p.allow || []).includes(r))
        && sitio.directorios.every(d => (p.additionalDirectories || []).includes(d));
    });
  },
  aplicar(raiz) {
    const lista = sitiosClaudeCode(raiz);
    const leidos = lista.map(sitio => leerJsonDe(sitio.fichero) || {});   // todos antes de escribir: todo o nada
    lista.forEach((sitio, i) => {
      const datos = leidos[i];
      const p = datos.permissions = datos.permissions || {};
      p.defaultMode = 'acceptEdits';
      p.allow = [...new Set([...(p.allow || []), ...sitio.allow])];
      if (sitio.directorios.length) p.additionalDirectories = [...new Set([...(p.additionalDirectories || []), ...sitio.directorios])];
      escribirJson(sitio.fichero, datos);
    });
  },
  // Quita solo lo que pone aplicar: lo que hubiera del alumno se queda; un fichero que se queda vacío, se borra.
  quitar(raiz) {
    for (const sitio of sitiosClaudeCode(raiz)) {
      const datos = leerJsonDe(sitio.fichero);
      if (!datos) continue;
      const p = datos.permissions || {};
      if (p.defaultMode === 'acceptEdits') delete p.defaultMode;
      if (p.allow) p.allow = p.allow.filter(r => !sitio.allow.includes(r));
      if (p.additionalDirectories) p.additionalDirectories = p.additionalDirectories.filter(d => !sitio.directorios.includes(d));
      for (const k of ['allow', 'additionalDirectories']) if (p[k] && !p[k].length) delete p[k];
      if (datos.permissions && !Object.keys(p).length) delete datos.permissions;
      if (Object.keys(datos).length) escribirJson(sitio.fichero, datos);
      else fs.rmSync(sitio.fichero);
    }
  },
};

// ── Codex ────────────────────────────────────────────────────────────────────────────────────────────
// Probado en Windows con Codex CLI 0.156.1 (issue #42): la configuración y las reglas pueden ir dentro del curso, en
// .codex/, si la carpeta es de confianza; desde estudio/ (Obsidian), la raíz del curso en `writable_roots` quita la
// petición para editar config/. `python` pregunta (decisión "prompt", comprobada con `codex execpolicy check`): lo
// decide el alumno cada vez. Ficheros enteros del kit, con su marca: si ya hay uno del alumno, no se toca.
const MARCA = '# profesor-kit: lo escribe permisos.js con el sí del alumno; se quita con permisos.js --quitar';

// Una cadena TOML: literal ('…', sin escapes: las barras de Windows tal cual) salvo que lleve comilla simple.
function cadenaToml(texto) {
  return texto.includes("'") ? `"${texto.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : `'${texto}'`;
}

function ficherosCodex(raiz) {
  const permitidas = prefijo => herramientas(raiz).map(n => `prefix_rule(pattern=["node", "${prefijo}.kit/herramientas/${n}"], decision="allow")`);
  return [
    { fichero: path.join(raiz, '.codex', 'config.toml'), texto: [MARCA,
      'sandbox_mode = "workspace-write"', 'approval_policy = "on-request"', '',
      '[sandbox_workspace_write]', `writable_roots = [${cadenaToml(raiz)}]`, 'network_access = false', ''].join('\n') },
    { fichero: path.join(raiz, '.codex', 'rules', 'profesor-kit.rules'), texto: [MARCA,
      ...permitidas(''), ...permitidas('../'),
      ...['status', 'log', 'diff'].map(c => `prefix_rule(pattern=["git", "${c}"], decision="allow")`),
      ...['python', 'python3'].map(c => `prefix_rule(pattern=["${c}"], decision="prompt")`), ''].join('\n') },
  ];
}
const esDelKit = fichero => fs.existsSync(fichero) && fs.readFileSync(fichero, 'utf8').startsWith(MARCA);

const codex = {
  estado(raiz) {
    return ficherosCodex(raiz).map(f => esDelKit(f.fichero) && fs.readFileSync(f.fichero, 'utf8') === f.texto);
  },
  aplicar(raiz) {
    const lista = ficherosCodex(raiz);
    const ajeno = lista.find(f => fs.existsSync(f.fichero) && !esDelKit(f.fichero));
    if (ajeno) throw new Error(`${path.relative(raiz, ajeno.fichero).split(path.sep).join('/')} es tuyo (no lo escribió el kit): no lo toco. Si quieres que lo haga el kit, bórralo o muévelo y repite; no se ha tocado nada.`);
    for (const f of lista) { fs.mkdirSync(path.dirname(f.fichero), { recursive: true }); fs.writeFileSync(f.fichero, f.texto); }
  },
  quitar(raiz) {
    for (const f of ficherosCodex(raiz)) if (esDelKit(f.fichero)) fs.rmSync(f.fichero);
  },
};

const TIPOS = { 'claude-code': claudeCode, codex };

// Qué asistente usa el curso y si el kit sabe darle el sí de una vez.
function tipo(raiz) {
  const llm = v.leerAjustes(raiz).llm || 'claude-code';
  const config = (v.leerAdaptador(raiz, llm) || {}).aceptar_una_vez || {};
  if (!TIPOS[config.tipo]) {
    return { llm, soportado: false, motivo: `Con ${llm} todavía no sé dejarlo aceptado de una vez${config.pendiente ? ` (pendiente: ${config.pendiente})` : ''}.` };
  }
  return { llm, soportado: true, forma: TIPOS[config.tipo] };
}

function estado(raiz) {
  const { forma, ...t } = tipo(raiz);
  if (!t.soportado) return { ...t, aplicado: false };
  const completos = forma.estado(raiz);
  const aplicado = completos.every(Boolean);
  // A medias: aceptado en un sitio y no en otro (se borró un fichero, o se movió el curso a medias).
  return { ...t, aplicado, parcial: !aplicado && completos.some(Boolean) };
}

function sinSoporte(t) {
  if (!t.soportado) throw new Error(`${t.motivo} Tu profesor seguirá pidiéndote permiso como hasta ahora.`);
}

function aplicar(raiz) {
  const t = tipo(raiz);
  sinSoporte(t);
  t.forma.aplicar(raiz);
}

function quitar(raiz) {
  const t = tipo(raiz);
  sinSoporte(t);
  t.forma.quitar(raiz);
}

const EXPLICACION = [
  'Con tu sí, tu profesor podrá, sin preguntarte cada vez y solo dentro de este curso:',
  '- escribir y corregir tus notas y tu configuración;',
  '- ejecutar las herramientas del kit (guardar, comprobar, leer tu material…);',
  '- mirar el historial de cambios.',
  'Para cualquier otro programa, o para algo fuera del curso, seguirá preguntándote (o no podrá).',
  'Todo queda guardado: si algo no te gusta, "deshaz lo último" lo devuelve. Y se puede quitar cuando quieras.',
].join('\n');

function cli(args, raiz) {
  const accion = ['--ver', '--aplicar', '--quitar'].find(a => args.includes(a));
  if (!accion) { console.error('Uso: node .kit/herramientas/permisos.js --ver | --aplicar | --quitar'); return 2; }
  try {
    if (accion === '--ver') {
      const e = estado(raiz);
      console.log(e.soportado ? `${EXPLICACION}\n\nAhora: ${e.aplicado ? 'aceptado' : 'sin aceptar'}.` : `${e.motivo} Tu profesor seguirá pidiéndote permiso como hasta ahora.`);
      return 0;
    }
    if (accion === '--aplicar') { aplicar(raiz); console.log('Hecho: tu profesor ya puede trabajar en tu curso sin preguntarte a cada paso. Se nota al abrirlo la próxima vez.'); }
    else { quitar(raiz); console.log('Hecho: tu profesor volverá a preguntarte antes de cada cambio.'); }
    return 0;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'permisos.js');

module.exports = { aplicar, quitar, estado, cli, cadenaToml };
