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

// Claude Code: `.claude/settings.local.json` (el de este ordenador, fuera de git y del motor) en la raíz y en
// estudio/, que es donde lo abre Obsidian. Desde estudio/ necesita llegar a la raíz (config/, .kit/): `..`.
// Probado el 2026-09-24: la confianza en la carpeta del curso vale para sus subcarpetas, y se respeta el .local.
function sitiosClaudeCode(raiz) {
  const reglas = prefijo => [...herramientas(raiz).map(n => `Bash(node ${prefijo}.kit/herramientas/${n} *)`), ...GIT_DE_SOLO_LECTURA];
  return [
    { fichero: path.join(raiz, '.claude', 'settings.local.json'), allow: reglas(''), directorios: [] },
    { fichero: path.join(raiz, v.CARPETA_ALUMNO, '.claude', 'settings.local.json'),
      allow: [...reglas(''), ...reglas('../')], directorios: ['..'] },
  ];
}
const TIPOS = { 'claude-code': sitiosClaudeCode };

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

// Qué asistente usa el curso y si el kit sabe darle el sí de una vez.
function sitios(raiz) {
  const llm = v.leerAjustes(raiz).llm || 'claude-code';
  const config = (v.leerAdaptador(raiz, llm) || {}).aceptar_una_vez || {};
  if (!TIPOS[config.tipo]) {
    return { llm, soportado: false, motivo: `Con ${llm} todavía no sé dejarlo aceptado de una vez${config.pendiente ? ` (pendiente: ${config.pendiente})` : ''}.` };
  }
  return { llm, soportado: true, lista: TIPOS[config.tipo](raiz) };
}

function estado(raiz) {
  const s = sitios(raiz);
  if (!s.soportado) return { ...s, aplicado: false };
  const completos = s.lista.map(sitio => {
    const p = ((leerJsonDe(sitio.fichero) || {}).permissions) || {};
    return p.defaultMode === 'acceptEdits' && sitio.allow.every(r => (p.allow || []).includes(r))
      && sitio.directorios.every(d => (p.additionalDirectories || []).includes(d));
  });
  const aplicado = completos.every(Boolean);
  // A medias: aceptado en un sitio y no en otro (se borró un fichero, o se movió el curso a medias).
  return { ...s, aplicado, parcial: !aplicado && completos.some(Boolean) };
}

function sinSoporte(s) {
  if (!s.soportado) throw new Error(`${s.motivo} Tu profesor seguirá pidiéndote permiso como hasta ahora.`);
}

function aplicar(raiz) {
  const s = sitios(raiz);
  sinSoporte(s);
  const leidos = s.lista.map(sitio => leerJsonDe(sitio.fichero) || {});   // todos antes de escribir: todo o nada
  s.lista.forEach((sitio, i) => {
    const datos = leidos[i];
    const p = datos.permissions = datos.permissions || {};
    p.defaultMode = 'acceptEdits';
    p.allow = [...new Set([...(p.allow || []), ...sitio.allow])];
    if (sitio.directorios.length) p.additionalDirectories = [...new Set([...(p.additionalDirectories || []), ...sitio.directorios])];
    escribirJson(sitio.fichero, datos);
  });
}

// Quita solo lo que pone aplicar: lo que hubiera del alumno se queda; un fichero que se queda vacío, se borra.
function quitar(raiz) {
  const s = sitios(raiz);
  sinSoporte(s);
  for (const sitio of s.lista) {
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

module.exports = { aplicar, quitar, estado, cli };
