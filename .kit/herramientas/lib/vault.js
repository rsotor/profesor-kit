'use strict';
const fs = require('node:fs');
const path = require('node:path');

const CARPETAS_NOTAS = ['conceptos', 'sesiones', 'ejercicios', 'examenes', 'flashcards'];
const FICHEROS_VIVOS = ['progreso.md', 'formulario.md', 'mapa-del-curso.md'];
// Generados por guardar.js que enlazan a otras notas: se comprueban sus enlaces, pero no se exigen ni se reparan.
const GENERADOS_CON_ENLACES = ['inicio.md'];
// Todo lo del alumno vive en una sola carpeta: es la que abre en Obsidian, y así no ve ni toca el motor.
const CARPETA_ALUMNO = 'estudio';
// Carpetas del alumno que no son notas: 'inbox' es su material en bruto y 'repasos' es HTML generado.
const OTRAS_CARPETAS_ALUMNO = ['inbox', 'repasos'];
const RUTAS_PROTEGIDAS = ['config', CARPETA_ALUMNO, 'README.md'];
const GUIA_DE_USO = 'como-usar-tu-profesor.md';
const AJUSTES_POR_DEFECTO = {
  subir_a_github: true,
  llm: 'claude-code',
  nombre_curso: '',
  atajo: '',
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

const baseAlumno = raiz => path.join(raiz, CARPETA_ALUMNO);

// Las rutas que devuelve son relativas a `estudio/`: es lo que el alumno ve en Obsidian.
function listarNotas(raiz, { conInbox = false } = {}) {
  raiz = baseAlumno(raiz);
  const carpetas = conInbox ? [...CARPETAS_NOTAS, 'inbox'] : CARPETAS_NOTAS;
  const esMd = n => n.endsWith('.md');
  const notas = carpetas.flatMap(c => recorrer(path.join(raiz, c), esMd));
  for (const f of [...FICHEROS_VIVOS, ...GENERADOS_CON_ENLACES]) {
    if (fs.existsSync(path.join(raiz, f))) notas.push(path.join(raiz, f));
  }
  return notas.map(n => aPosix(path.relative(raiz, n))).sort();
}

function listarConceptos(raiz) {
  const dir = path.join(baseAlumno(raiz), 'conceptos');
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

// Obsidian guarda las casillas como `true`/`false`; leídas como texto, "false" sería verdadero.
const esCierto = valor => valor === true || String(valor ?? '').trim().toLowerCase() === 'true';

function numero(valor) {
  if (valor === undefined || valor === null || Array.isArray(valor)) return null;
  const texto = String(valor).trim().replace(',', '.');
  if (texto === '') return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}

function leerFrontmatter(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return null;
  const datos = {};
  let lista = null;   // clave cuyo valor vino vacío: puede seguir una lista en bloque (`- item`)
  for (const linea of m[1].split(/\r?\n/)) {
    const item = lista && /^\s*-\s+(.*)$/.exec(linea);
    if (item) {
      if (!Array.isArray(datos[lista])) datos[lista] = [];
      const valor = limpiarValor(item[1]);
      if (valor !== '') datos[lista].push(valor);
      continue;
    }
    lista = null;
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linea);
    if (!par) continue;
    const bruto = par[2].trim();
    const enLinea = /^\[(.*)\]/.exec(bruto);
    datos[par[1]] = enLinea
      ? enLinea[1].split(',').map(limpiarValor).filter(s => s !== '')
      : limpiarValor(bruto);
    if (datos[par[1]] === '') lista = par[1];
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

// Lo que un curso necesita para funcionar y no está: piezas del motor, carpetas del alumno y ficheros
// vivos. Rutas relativas a la raíz del curso, con /.
function piezasAusentes(raiz) {
  const ausentes = [];
  const falta = rel => !fs.existsSync(path.join(raiz, ...rel.split('/')));
  const ficheroMotor = path.join(raiz, '.kit', 'motor.json');
  if (fs.existsSync(ficheroMotor)) {
    for (const rel of JSON.parse(fs.readFileSync(ficheroMotor, 'utf8')).ficheros) {
      if (falta(rel)) ausentes.push({ ruta: rel, tipo: 'motor' });
    }
  }
  if (falta('README.md')) ausentes.push({ ruta: 'README.md', tipo: 'fichero' });
  for (const carpeta of [...CARPETAS_NOTAS, ...OTRAS_CARPETAS_ALUMNO]) {
    if (falta(`${CARPETA_ALUMNO}/${carpeta}`)) ausentes.push({ ruta: `${CARPETA_ALUMNO}/${carpeta}`, tipo: 'carpeta' });
  }
  // La guía de uso la escribe /configurar al cerrar: solo se exige cuando la configuración está completa.
  const conGuia = leerAjustes(raiz).configuracion.nivel ? [GUIA_DE_USO] : [];
  for (const vivo of [...FICHEROS_VIVOS, 'conceptos/_index.md', ...conGuia]) {
    if (falta(`${CARPETA_ALUMNO}/${vivo}`)) ausentes.push({ ruta: `${CARPETA_ALUMNO}/${vivo}`, tipo: 'fichero' });
  }
  return ausentes;
}

function leerMotor(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.kit', 'motor.json'), 'utf8'));
}

function leerVersion(dir) {
  return fs.readFileSync(path.join(dir, '.kit', 'VERSION'), 'utf8').trim();
}

module.exports = {
  CARPETA_ALUMNO, OTRAS_CARPETAS_ALUMNO, GUIA_DE_USO, CARPETAS_NOTAS, FICHEROS_VIVOS, GENERADOS_CON_ENLACES, RUTAS_PROTEGIDAS, AJUSTES_POR_DEFECTO,
  aPosix, baseAlumno,
  recorrer, listarNotas, listarConceptos, sinCodigo, leerFrontmatter, esCierto, numero,
  leerAjustes, escribirAjustes, leerMarcador, leerMotor, leerVersion, piezasAusentes,
};
