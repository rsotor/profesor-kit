'use strict';
// Piezas que usa pruebas/prueba-real.js para simular al alumno entre llamadas al LLM (insertar dudas,
// marcar una casilla "a su manera", rellenar el examen) y para leer lo que el LLM dejó en disco. Nada
// de esto llama a `claude`: eso lo hace prueba-real.js, que es quien decide el prompt de cada paso.
const fs = require('node:fs');
const path = require('node:path');
const { MARCA_INICIO } = require('../../.kit/herramientas/lib/indice');
const { sinCodigo } = require('../../.kit/herramientas/lib/vault');

// Inserta contenido en el cuerpo de la nota, antes del pie de navegación (`%% navegación %%` de
// lib/indice.js) si ya lo tiene: si se añadiera detrás, quedaría fuera del cuerpo que lee /dudas y
// comprobar.js lo contaría como duda pendiente en un sitio raro (plan 0.22, arreglo 5b.2). Si la nota
// todavía no tiene pie (aún no ha pasado por guardar.js), se añade al final, como antes.
function insertarAntesDelPie(texto, contenido) {
  const i = texto.indexOf(MARCA_INICIO);
  if (i < 0) return `${texto.replace(/\s+$/, '')}\n\n${contenido}\n`;
  return `${texto.slice(0, i).replace(/\s+$/, '')}\n\n${contenido}\n\n${texto.slice(i)}`;
}

function recorrerMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...recorrerMd(abs));
    else if (e.name.endsWith('.md') && !e.name.startsWith('_')) salida.push(abs);
  }
  return salida.sort();
}

// El primer concepto y la primera sesión que haya escrito /sesion, para simular al alumno sobre algo
// real. `null` si todavía no hay nada (por ejemplo, en --sin-llm: nadie ha escrito nada).
function primerConcepto(destino) {
  const dir = path.join(destino, 'estudio', 'conceptos');
  const [f] = recorrerMd(dir);
  return f || null;
}
function primeraSesion(destino) {
  const [f] = recorrerMd(path.join(destino, 'estudio', 'sesiones'));
  return f || null;
}

// Dos dudas con el marcador del curso (una en un concepto, otra en una sesión) y una casilla escrita
// "a su manera" (estudiada: sí, en vez de true/false): lo que haría el alumno en Obsidian entre el
// paso 1 y el paso 2. Devuelve qué tocó, o null si aún no hay ninguna nota sobre la que escribir.
function simularAlumnoTrasSesiones(destino, marcador) {
  const concepto = primerConcepto(destino);
  const sesion = primeraSesion(destino);
  if (!concepto && !sesion) return null;
  // Relativas a estudio/, no a la raíz del curso: es como comprobar.js nombra `fichero` en sus avisos.
  const baseEstudio = path.join(destino, 'estudio');
  const tocado = { concepto: null, sesion: null, casillaNoEstandar: false };
  if (concepto) {
    fs.appendFileSync(concepto, `\n${marcador} no entiendo bien esta parte, ¿me lo explicas con otro ejemplo?\n`);
    tocado.concepto = path.relative(baseEstudio, concepto).split(path.sep).join('/');
  }
  if (sesion) {
    let texto = fs.readFileSync(sesion, 'utf8');
    texto = insertarAntesDelPie(texto, `${marcador} ¿por qué esto importa para el resto del módulo?`);
    if (/estudiada:\s*false/.test(texto)) { texto = texto.replace(/estudiada:\s*false/, 'estudiada: sí'); tocado.casillaNoEstandar = true; }
    fs.writeFileSync(sesion, texto);
    tocado.sesion = path.relative(baseEstudio, sesion).split(path.sep).join('/');
  }
  return tocado;
}

// ¿Queda algún marcador de duda sin resolver, en cualquier nota de estudio/? (para comprobar que
// /dudas se las comió todas)
function quedaMarcador(destino, marcador) {
  for (const f of recorrerMd(path.join(destino, 'estudio'))) {
    // Como comprobar.js: el marcador entre comillas de código es un ejemplo (la hoja de uso lo explica así), no una duda.
    if (sinCodigo(fs.readFileSync(f, 'utf8')).includes(marcador)) return f;
  }
  return null;
}

// Un concepto con la sección "## La fórmula" rellena de verdad (no el hueco de la plantilla): candidato
// para el paso 3, /ejercicio.
function conceptoConFormula(destino) {
  for (const f of recorrerMd(path.join(destino, 'estudio', 'conceptos'))) {
    const m = /^## La fórmula\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(fs.readFileSync(f, 'utf8'));
    const cuerpo = m ? m[1].trim() : '';
    if (cuerpo && !/^\$\$\s*\.\.\.\s*\$\$$/.test(cuerpo)) return path.basename(f, '.md');
  }
  return null;
}

// El examen más reciente de estudio/examenes/ (el que acaba de escribir el paso 4a).
function examenMasReciente(destino) {
  const ficheros = recorrerMd(path.join(destino, 'estudio', 'examenes'));
  if (!ficheros.length) return null;
  return ficheros.map(f => ({ f, mtime: fs.statSync(f).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0].f;
}

// Parsea la tabla de pruebas/curso-ejemplo/alumno/respuestas-examen.md: filas `clave | calidad | respuesta`.
function parseTablaRespuestas(md) {
  const filas = [];
  for (const linea of md.split(/\r?\n/)) {
    const m = /^\|([^|]+)\|([^|]+)\|(.*)\|$/.exec(linea.trim());
    if (!m) continue;
    const claves = m[1].trim();
    const calidad = m[2].trim();
    if (claves === 'Palabras clave' || /^-+$/.test(claves.replace(/\s/g, ''))) continue;
    if (!['bien', 'a-medias', 'mal', 'blanco'].includes(calidad)) continue;
    filas.push({ claves: claves.split(',').map(c => c.trim().toLowerCase()).filter(Boolean), calidad, respuesta: m[3].trim() });
  }
  return filas;
}

const CICLO_POR_DEFECTO = [
  { calidad: 'bien', respuesta: 'Lo explico con mis palabras, tal como lo entendí en clase.' },
  { calidad: 'a-medias', respuesta: 'Creo que va por aquí, aunque no estoy del todo seguro.' },
  { calidad: 'mal', respuesta: 'No estoy seguro, pero diría que es justo lo contrario.' },
  { calidad: 'blanco', respuesta: '' },
];

// Rellena cada `✍️ **Tu respuesta:**` del examen con una respuesta preparada (nunca inventa la
// pregunta: la lee del propio examen y busca la fila de la tabla cuyas palabras clave aparecen en su
// enunciado). Si ninguna fila encaja, cicla bien/a-medias/mal/blanco para que la tanda salga variada
// de todos modos. Devuelve cuántas respuestas de cada calidad escribió.
function rellenarRespuestasExamen(ficheroExamen, tablaRespuestasMd) {
  const filas = parseTablaRespuestas(tablaRespuestasMd);
  const lineas = fs.readFileSync(ficheroExamen, 'utf8').split(/\r?\n/);
  const contadas = { bien: 0, 'a-medias': 0, mal: 0, blanco: 0, 'sin-plantilla': 0 };
  let preguntaActual = '';
  let indiceCiclo = 0;
  for (let i = 0; i < lineas.length; i++) {
    if (/^\d+\.\s/.test(lineas[i])) preguntaActual = '';
    if (!/✍️\s*\*\*Tu respuesta:\*\*/.test(lineas[i])) { preguntaActual += ` ${lineas[i]}`; continue; }
    const textoPregunta = preguntaActual.toLowerCase();
    const fila = filas.find(f => f.claves.some(clave => textoPregunta.includes(clave)));
    const elegida = fila || { ...CICLO_POR_DEFECTO[indiceCiclo % CICLO_POR_DEFECTO.length], sinPlantilla: true };
    if (!fila) indiceCiclo++;
    contadas[fila ? elegida.calidad : 'sin-plantilla']++;
    if (elegida.calidad !== 'blanco' && elegida.respuesta) lineas[i] = `${lineas[i]} ${elegida.respuesta}`;
    preguntaActual = '';
  }
  fs.writeFileSync(ficheroExamen, lineas.join('\n'));
  return contadas;
}

// HTML de repaso generados en estudio/repasos/.
function repasosGenerados(destino) {
  const dir = path.join(destino, 'estudio', 'repasos');
  if (!fs.existsSync(dir)) return [];
  const salida = [];
  const recorrer = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const abs = path.join(d, e.name); if (e.isDirectory()) recorrer(abs); else if (e.name.endsWith('.html')) salida.push(abs); } };
  recorrer(dir);
  return salida;
}

module.exports = {
  recorrerMd, primerConcepto, primeraSesion, insertarAntesDelPie, simularAlumnoTrasSesiones, quedaMarcador,
  conceptoConFormula, examenMasReciente, parseTablaRespuestas, rellenarRespuestasExamen, repasosGenerados,
};
