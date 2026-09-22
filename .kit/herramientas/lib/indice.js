'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// El índice del curso: estudio/inicio.md y el pie de navegación de cada sesión. Aquí solo se calcula; quien
// escribe es guardar.js. Todo sale de lo que ya hay en disco: nadie rellena el índice a mano.

const ESTADO = /(✅|🟡|🔴|⬜)/u;
const SIN_EVALUAR = { teoria: '⬜', aplicacion: '⬜' };
const FALLADO = e => e === '🟡' || e === '🔴';
// Destino de un [[enlace]]: sin alias (| o \|), sin #sección, sin carpeta.
const destino = crudo => path.posix.basename(crudo.split(/\\?\|/)[0].split('#')[0].trim());

function conceptosDe(texto) {
  const m = /^## Conceptos\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto);
  if (!m) return [];
  return [...new Set([...m[1].matchAll(/\[\[([^\]]+)\]\]/g)].map(x => destino(x[1])).filter(Boolean))];
}

function tituloDe(texto, id) {
  const cuerpo = texto.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const m = /^#\s+(.+)$/m.exec(cuerpo);
  return m ? m[1].replace(/^\S+\s+·\s+/, '').trim() : id;
}

function leerSesiones(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const texto = fs.readFileSync(abs, 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    const id = path.basename(abs, '.md');
    const num = /^(\d+(?:-\d+)*)(?=-|$)/.exec(id);
    const clases = Array.isArray(fm.clases) ? fm.clases.map(String) : (fm.clases ? [String(fm.clases)] : []);
    return {
      id,
      rel: v.aPosix(path.relative(base, abs)),
      titulo: tituloDe(texto, id),
      clases,
      numeros: num ? num[1].split('-').map(Number) : null,
      clave: num ? num[1] : null,
      orden: v.numero(fm.orden),
      estudiada: v.esCierto(fm.estudiada),
      trabajada: String(fm.trabajada || ''),
      conceptos: conceptosDe(texto),
    };
  });
}

function compararNumeros(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Orden del temario: cifras del id; si empatan, `orden:`; el slug solo como último recurso (comprobar avisa).
function compararSesiones(a, b) {
  if (a.numeros && !b.numeros) return -1;
  if (!a.numeros && b.numeros) return 1;
  if (a.numeros) {
    const n = compararNumeros(a.numeros, b.numeros);
    if (n) return n;
    const oa = a.orden ?? Infinity;
    const ob = b.orden ?? Infinity;
    if (oa !== ob) return oa < ob ? -1 : 1;
  } else if (a.trabajada !== b.trabajada) {
    return a.trabajada < b.trabajada ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

function ordenAmbiguo(sesiones) {
  const grupos = new Map();
  for (const s of sesiones) if (s.clave) grupos.set(s.clave, [...(grupos.get(s.clave) || []), s]);
  return [...grupos.values()].filter(g => g.length > 1 && g.some(s => s.orden === null)).flat();
}

function leerProgreso(raiz) {
  const estados = new Map();
  const f = path.join(v.baseAlumno(raiz), 'progreso.md');
  if (!fs.existsSync(f)) return estados;
  const estado = celda => (ESTADO.exec(celda || '') || [null, '⬜'])[1];
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const celdas = linea.split(/(?<!\\)\|/).map(c => c.trim());   // la \| de un alias no separa celdas
    const m = /^\[\[([^\]]+)\]\]/.exec(celdas[1] || '');
    if (!m) continue;
    estados.set(destino(m[1]), { teoria: estado(celdas[2]), aplicacion: estado(celdas[3]) });
  }
  return estados;
}

// Lo que el profesor tiene probado de una sesión. Un concepto está probado con la teoría en ✅ y nada fallado.
function estadoProfesor(conceptos, progreso) {
  const estados = conceptos.map(c => progreso.get(c) || SIN_EVALUAR);
  if (estados.some(e => FALLADO(e.teoria) || FALLADO(e.aplicacion))) return { marca: 'repasar' };
  const probados = estados.filter(e => e.teoria === '✅').length;
  if (probados === 0) return { marca: 'vacio' };
  if (probados === conceptos.length) return { marca: 'superada' };
  return { marca: 'faltan', faltan: conceptos.length - probados };
}

module.exports = { leerSesiones, compararSesiones, ordenAmbiguo, leerProgreso, estadoProfesor };
