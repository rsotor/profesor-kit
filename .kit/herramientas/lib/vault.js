'use strict';
const fs = require('node:fs');
const path = require('node:path');

const CARPETAS_NOTAS = ['conceptos', 'sesiones', 'ejercicios', 'examenes', 'flashcards'];
const FICHEROS_VIVOS = ['progreso.md', 'formulario.md', 'mapa-del-curso.md'];
// 'repasos' es HTML generado, no notas: no se escanea, pero es del alumno y ningún motor puede pisarlo.
const RUTAS_PROTEGIDAS = ['config', 'inbox', 'repasos', ...CARPETAS_NOTAS, ...FICHEROS_VIVOS];
const AJUSTES_POR_DEFECTO = {
  subir_a_github: true,
  llm: 'claude-code',
  version_datos: 1,
  configuracion: { curso: false, estilo: false, nivel: false },
  patrones_prohibidos: [],
};

const aPosix = ruta => ruta.split(path.sep).join('/');

function recorrer(dir, filtro, excluir = new Set()) {
  const salida = [];
  if (!fs.existsSync(dir)) return salida;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!excluir.has(e.name)) salida.push(...recorrer(ruta, filtro, excluir));
    } else if (filtro(e.name)) salida.push(ruta);
  }
  return salida;
}

function listarNotas(raiz, { conInbox = false } = {}) {
  const carpetas = conInbox ? [...CARPETAS_NOTAS, 'inbox'] : CARPETAS_NOTAS;
  const esMd = n => n.endsWith('.md');
  const notas = carpetas.flatMap(c => recorrer(path.join(raiz, c), esMd));
  for (const f of FICHEROS_VIVOS) {
    if (fs.existsSync(path.join(raiz, f))) notas.push(path.join(raiz, f));
  }
  return notas.map(n => aPosix(path.relative(raiz, n))).sort();
}

function listarConceptos(raiz) {
  const dir = path.join(raiz, 'conceptos');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(n => n.endsWith('.md') && n !== '_index.md')
    .map(n => n.slice(0, -3))
    .sort();
}

function sinCodigo(texto) {
  let dentro = false;
  const lineas = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (/^\s*```/.test(linea)) { dentro = !dentro; continue; }
    if (!dentro) lineas.push(linea.replace(/`[^`]*`/g, ''));
  }
  return lineas.join('\n');
}

function limpiarValor(valor) {
  const v = valor.trim();
  const comillas = /^"(.*)"$|^'(.*)'$/.exec(v);
  if (comillas) return comillas[1] ?? comillas[2];
  return v.replace(/\s+#.*$/, '').trim();
}

function leerFrontmatter(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return null;
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linea);
    if (!par) continue;
    const bruto = par[2].trim();
    const lista = /^\[(.*)\]/.exec(bruto);
    datos[par[1]] = lista
      ? lista[1].split(',').map(limpiarValor).filter(s => s !== '')
      : limpiarValor(bruto);
  }
  return datos;
}

function leerAjustes(raiz) {
  const fichero = path.join(raiz, 'config', 'ajustes.json');
  if (!fs.existsSync(fichero)) return structuredClone(AJUSTES_POR_DEFECTO);
  return { ...structuredClone(AJUSTES_POR_DEFECTO), ...JSON.parse(fs.readFileSync(fichero, 'utf8')) };
}

function escribirAjustes(raiz, ajustes) {
  const fichero = path.join(raiz, 'config', 'ajustes.json');
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, JSON.stringify(ajustes, null, 2) + '\n');
}

function leerMarcador(raiz) {
  const fichero = path.join(raiz, 'config', 'profesor.md');
  if (!fs.existsSync(fichero)) return '@@';
  const fm = leerFrontmatter(fs.readFileSync(fichero, 'utf8'));
  return (fm && fm.marcador_dudas) || '@@';
}

function leerMotor(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.kit', 'motor.json'), 'utf8'));
}

function leerVersion(dir) {
  return fs.readFileSync(path.join(dir, '.kit', 'VERSION'), 'utf8').trim();
}

module.exports = {
  CARPETAS_NOTAS, FICHEROS_VIVOS, RUTAS_PROTEGIDAS, AJUSTES_POR_DEFECTO, aPosix,
  recorrer, listarNotas, listarConceptos, sinCodigo, leerFrontmatter,
  leerAjustes, escribirAjustes, leerMarcador, leerMotor, leerVersion,
};
