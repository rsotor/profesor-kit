'use strict';
const fs = require('node:fs');
const path = require('node:path');

const CARPETAS_NOTAS = ['conceptos', 'sesiones', 'ejercicios', 'examenes', 'flashcards'];
// mapa-del-curso.md es el único fichero vivo que sigue a mano (solo la cobertura del material: lo único
// que inicio.md no cubre). progreso.md también, porque solo lo cambian las respuestas del alumno.
const FICHEROS_VIVOS = ['progreso.md', 'mapa-del-curso.md'];
// Generados por guardar.js que enlazan a otras notas: se comprueban sus enlaces, pero no se exigen ni se reparan
// (antes de que exista el primer guardado, un enlace a uno de ellos no es un enlace roto).
const GENERADOS_CON_ENLACES = ['inicio.md', 'formulario.md'];
// Todo lo del alumno vive en una sola carpeta: es la que abre en Obsidian, y así no ve ni toca el motor.
const CARPETA_ALUMNO = 'estudio';
// Carpetas del alumno que no son notas: 'inbox' es su material en bruto y 'repasos' es HTML generado.
const OTRAS_CARPETAS_ALUMNO = ['inbox', 'repasos'];
const RUTAS_PROTEGIDAS = ['config', CARPETA_ALUMNO, 'README.md'];
const GUIA_DE_USO = 'como-usar-tu-profesor.md';
// Sin un sí explícito (`subir_a_github: true`), no se sube nada: publicar es lo único que no se puede deshacer
// (issue #39, H07). preparar-curso.js siempre lo escribe, con lo que el alumno eligió.
const AJUSTES_POR_DEFECTO = {
  subir_a_github: false,
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

// Lo que el alumno escribe a su manera. Las propiedades de una nota las escribe el profesor, pero también el
// alumno desde Obsidian, y hay mil formas de escribir lo mismo. Aquí NO se adivina qué quiso decir: se señala
// lo que el kit no sabe leer, o lee pero no le sirve, para que el profesor lo entienda, lo pregunte si hace
// falta y lo reescriba en el estándar (AGENTS.md, "Cuando el alumno escribe a su manera").
// Solo las propiedades que alguna herramienta lee: las demás son texto libre y no se vigilan.
const esFecha = t => /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(`${t}T00:00:00Z`))
  && new Date(`${t}T00:00:00Z`).toISOString().startsWith(t);
const ESPERADO = {
  'si-no': { vale: t => /^(true|false)$/i.test(t), dice: 'el kit espera true o false (la casilla de Obsidian)' },
  numero: { vale: t => numero(t) !== null, dice: 'el kit espera un número' },
  entero: { vale: t => Number.isInteger(numero(t)), dice: 'el kit espera un número entero' },
  nota: { vale: t => numero(t) !== null && numero(t) >= 0 && numero(t) <= 10, dice: 'el kit espera un número de 0 a 10 (por ejemplo 7,5; nunca 7/10)' },
  dificultad: { vale: t => [1, 2, 3].includes(numero(t)), dice: 'el kit espera 1, 2 o 3' },
  fecha: { vale: esFecha, dice: 'el kit espera una fecha AAAA-MM-DD' },
};
const PROPIEDADES = {
  estudiada: 'si-no', parcial: 'si-no',
  nota: 'nota', dificultad: 'dificultad', orden: 'numero', intentos: 'entero', version: 'entero',
  fecha: 'fecha', trabajada: 'fecha',
};

// Devuelve [{ linea, texto, motivo }]; `linea` es la del fichero (la 1 es el primer `---`).
function revisarPropiedades(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return [];
  const problemas = [];
  let lista = null;
  m[1].split(/\r?\n/).forEach((linea, i) => {
    const n = i + 2;
    if (lista && /^\s*-\s+/.test(linea)) return;
    lista = null;
    if (linea.trim() === '' || /^\s*#/.test(linea)) return;
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linea);
    if (!par) { problemas.push({ linea: n, texto: linea.trim(), motivo: 'el kit no sabe leer esta línea' }); return; }
    const bruto = par[2].trim();
    if (bruto === '') { lista = par[1]; return; }
    const tipo = PROPIEDADES[par[1]];
    if (!tipo) return;
    const valor = /^\[.*\]$/.test(bruto) ? null : limpiarValor(bruto);
    if (valor === '') return;   // vacía a propósito (la nota de un examen sin corregir)
    if (valor === null || !ESPERADO[tipo].vale(valor)) problemas.push({ linea: n, texto: linea.trim(), motivo: ESPERADO[tipo].dice });
  });
  return problemas;
}

function leerAjustes(raiz) {
  const fichero = path.join(raiz, 'config', 'ajustes.json');
  if (!fs.existsSync(fichero)) return structuredClone(AJUSTES_POR_DEFECTO);
  return { ...structuredClone(AJUSTES_POR_DEFECTO), ...JSON.parse(fs.readFileSync(fichero, 'utf8')) };
}

// Los ajustes con un tipo distinto del esperado ("false" en texto, un número entre comillas): no se interpretan,
// se señalan. Las claves que no están en AJUSTES_POR_DEFECTO no se miran (el curso puede tener las suyas).
function revisarAjustes(ajustes) {
  const tipo = x => (Array.isArray(x) ? 'lista' : x === null ? 'nada' : typeof x);
  const nombre = { boolean: 'true o false', string: 'un texto', number: 'un número', object: 'un grupo de ajustes', lista: 'una lista' };
  return Object.entries(AJUSTES_POR_DEFECTO)
    .filter(([clave, porDefecto]) => clave in ajustes && tipo(ajustes[clave]) !== tipo(porDefecto))
    .map(([clave, porDefecto]) => ({ clave, esperado: nombre[tipo(porDefecto)], valor: JSON.stringify(ajustes[clave]) }));
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

// Identificadores viejos de `llm` que apuntan al adaptador de hoy: cursos creados antes de que el id se
// afinara siguen funcionando sin tocar su config/ajustes.json. `codex-cli` es el nombre del ejecutable
// que anunciaba `codex --version`; el adaptador del kit vive como `codex` (issue [adaptador] codex-cli).
const ALIAS_LLM = { 'codex-cli': 'codex' };

// El adaptador dice, para un LLM, dónde busca sus skills, qué comando lo abre, si necesita un fichero
// puente hacia AGENTS.md y cómo se le dan permisos. `config/adaptador-llm.json` es el que ha escrito el
// propio curso (vive en config/: /actualizar nunca lo toca) y manda sobre el que trae el kit en
// `.kit/adaptadores/<llm>.json`, que solo existe para los LLMs ya verificados. Sin ninguno de los dos,
// null: quien llama decide cómo avisar (ver .kit/ESTANDARES.md).
function leerAdaptador(raiz, llm) {
  // El alias es un respaldo, nunca sustituye la búsqueda literal: si algún día existiera de verdad un
  // adaptador `codex-cli.json` (un curso que lo escribió a mano antes de este cambio, por ejemplo), ese
  // manda sobre el alias.
  const rutas = [path.join(raiz, 'config', 'adaptador-llm.json')];
  for (const id of [llm, ALIAS_LLM[llm]].filter(Boolean)) rutas.push(path.join(raiz, '.kit', 'adaptadores', `${id}.json`));
  for (const ruta of rutas) {
    if (!fs.existsSync(ruta)) continue;
    try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch { return null; }
  }
  return null;
}

function leerVersion(dir) {
  return fs.readFileSync(path.join(dir, '.kit', 'VERSION'), 'utf8').trim();
}

module.exports = {
  revisarAjustes,
  CARPETA_ALUMNO, OTRAS_CARPETAS_ALUMNO, GUIA_DE_USO, CARPETAS_NOTAS, FICHEROS_VIVOS, GENERADOS_CON_ENLACES, RUTAS_PROTEGIDAS, AJUSTES_POR_DEFECTO,
  aPosix, baseAlumno,
  recorrer, listarNotas, listarConceptos, sinCodigo, leerFrontmatter, revisarPropiedades, PROPIEDADES, esCierto, numero,
  leerAjustes, escribirAjustes, leerMarcador, leerMotor, leerVersion, leerAdaptador, piezasAusentes,
};
