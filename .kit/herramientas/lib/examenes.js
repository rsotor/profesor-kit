'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// La configuración del examen tipo test (docs/planes/2026-09-25-examen-v1.md): opciones por pregunta, cuánto
// resta un fallo y, por tipo de examen, cuántas preguntas y con qué nota se aprueba. Vive en config/examenes.json,
// con valores por defecto cuando falta el fichero o una clave (un JSON roto no revienta nada: como si no
// existiera). Cada examen copia en su clave (config/claves/…) la configuración con la que nació: cambiar este
// fichero a mitad de curso solo afecta a los exámenes nuevos.
const RUTA_CONFIG = 'config/examenes.json';
const RUTA_CLAVES = 'config/claves';
const APROBADO_POR_DEFECTO = 5;

const POR_DEFECTO = {
  opciones: 4,
  resta_fallo: 0,
  tipos: {
    'lo-que-falta': { preguntas: 5 },
    modulo: { preguntas: 15, aprobado: 5 },
    trimestre: { preguntas: 40, aprobado: 7 },
    final: { escalones: [
      { preguntas: 20, aprobado: 7 },
      { preguntas: 30, aprobado: 8 },
      { preguntas: 40, aprobado: 9 },
      { preguntas: 50, aprobado: 10 },
    ] },
  },
};

// Fusión por claves: lo que trae el JSON gana; lo que falta, el valor por defecto de ese tipo. Los tipos que
// el profesor inventó (nombres libres) se quedan tal cual, sin valores por defecto que no les tocan.
function leer(raiz) {
  const f = path.join(raiz, ...RUTA_CONFIG.split('/'));
  let datos = {};
  if (fs.existsSync(f)) {
    try { datos = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { datos = {}; }
  }
  const tipos = {};
  for (const nombre of new Set([...Object.keys(POR_DEFECTO.tipos), ...Object.keys(datos.tipos || {})])) {
    tipos[nombre] = { ...(POR_DEFECTO.tipos[nombre] || {}), ...((datos.tipos || {})[nombre] || {}) };
  }
  return {
    opciones: v.numero(datos.opciones) ?? POR_DEFECTO.opciones,
    resta_fallo: v.numero(datos.resta_fallo) ?? POR_DEFECTO.resta_fallo,
    tipos,
  };
}

// El aprobado global de los cursos de antes de esta versión: vivía en config/curso.md. Sigue siendo el último
// respaldo antes del 5 por defecto (los cursos nuevos no llevan esta clave: aquí da null y no pasa nada).
function aprobadoDeCurso(raiz) {
  const f = path.join(raiz, 'config', 'curso.md');
  const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) : null;
  return v.numero(fm && fm.aprobado);
}

// El aprobado de un tipo de examen (o, en el final, de uno de sus escalones). Sin ese tipo en el JSON, o sin
// aprobado en él: cae al de config/curso.md y, al final, al 5 por defecto.
function aprobadoDeTipo(raiz, tipo, escalon) {
  const cfg = leer(raiz);
  const t = tipo ? cfg.tipos[String(tipo)] : null;
  let n = null;
  if (t && Array.isArray(t.escalones)) n = v.numero((t.escalones[(v.numero(escalon) || 1) - 1] || {}).aprobado);
  else if (t) n = v.numero(t.aprobado);
  return n ?? aprobadoDeCurso(raiz) ?? APROBADO_POR_DEFECTO;
}

// El aprobado de un examen ya escrito: el `aprobado:` de su propio frontmatter (se copió al crearlo) manda
// siempre; sin él, el de su tipo; sin tipo, el de curso.md; sin nada, 5. Un solo sitio para los tres que lo
// necesitan: examen.js, lib/indice.js y lib/perfil.js.
function aprobadoDeExamen(raiz, fm = {}) {
  const propio = v.numero(fm.aprobado);
  if (propio !== null) return propio;
  return aprobadoDeTipo(raiz, fm.tipo_examen, fm.escalon);
}

// Un examen cuenta como "de módulo" (nota de la unidad, 🏁, marca estudiada, sustituye a otros de módulo) si es
// de toda la vida (sin tipo_examen), o de tipo módulo o "lo que me falta"; y no tiene escalón. El final y el
// trimestre quedan fuera: son de otro alcance (docs/planes/2026-09-25-examen-v1.md, decisión 6).
function esDeModulo(fm = {}) {
  if (v.numero(fm.escalon) !== null) return false;
  return !fm.tipo_examen || fm.tipo_examen === 'modulo' || fm.tipo_examen === 'lo-que-falta';
}

// Dónde vive la clave de un examen: fuera de la bóveda, con la misma ruta que el examen pero relativa a
// estudio/examenes/ (no a estudio/) y en JSON. `relExamen` es como lo da lib/indice (relativo a estudio/).
function rutaClave(raiz, relExamen) {
  const relDesdeExamenes = v.aPosix(relExamen).replace(/^examenes\//, '');
  return path.join(raiz, ...RUTA_CLAVES.split('/'), ...relDesdeExamenes.replace(/\.md$/, '.json').split('/'));
}

function leerClave(raiz, relExamen) {
  const f = rutaClave(raiz, relExamen);
  if (!fs.existsSync(f)) throw new Error(`falta la clave de este examen: ${v.aPosix(path.relative(raiz, f))}`);
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { throw new Error(`la clave no es un JSON válido: ${v.aPosix(path.relative(raiz, f))}`); }
}

// Como leerClave, pero para cálculos que no pueden reventar (la línea del examen final en inicio.md): una
// clave ausente o rota cae a los valores del JSON de configuración, nunca lanza.
function leerClaveSegura(raiz, relExamen) {
  try { return leerClave(raiz, relExamen); } catch { return null; }
}

// Cuántos escalones tiene el examen final, y con qué aprobado cada uno. Sale de la clave del último final que
// haya (la configuración con la que nació esa escalera); sin ningún final todavía, del JSON de hoy.
function escalonesFinal(raiz, examenesFinales) {
  const ultimo = [...examenesFinales]
    .filter(e => e.escalon !== null)
    .sort((a, b) => b.escalon - a.escalon || (b.fecha || '').localeCompare(a.fecha || ''))[0];
  const clave = ultimo && leerClaveSegura(raiz, ultimo.rel);
  if (clave && Array.isArray(clave.escalones) && clave.escalones.length) return clave.escalones;
  return leer(raiz).tipos.final.escalones || POR_DEFECTO.tipos.final.escalones;
}

// El estado del examen final para estudio/inicio.md: el siguiente escalón por aprobar (con su aprobado, sobre
// 10) o, si ya se superó el último, la fecha de cuando se superó. `examenesFinales` son los exámenes de
// lib/indice.leerExamenes con `escalon` puesto (los que no son de esos, no llegan aquí).
function infoFinal(raiz, examenesFinales) {
  const escalones = escalonesFinal(raiz, examenesFinales);
  const total = escalones.length;
  const porEscalon = new Map();
  for (const e of examenesFinales) {
    if (e.nota === null || !e.fecha) continue;
    const actual = porEscalon.get(e.escalon);
    if (!actual || e.fecha > actual.fecha || (e.fecha === actual.fecha && e.rel > actual.rel)) porEscalon.set(e.escalon, e);
  }
  for (let n = 1; n <= total; n++) {
    const e = porEscalon.get(n);
    if (!e || e.nota < e.aprobado) {
      const aprobado = e ? e.aprobado : (v.numero((escalones[n - 1] || {}).aprobado) ?? APROBADO_POR_DEFECTO);
      return { total, pendiente: n, aprobado, fechaSuperado: null };
    }
  }
  return { total, pendiente: null, aprobado: null, fechaSuperado: (porEscalon.get(total) || {}).fecha || null };
}

module.exports = {
  RUTA_CONFIG, RUTA_CLAVES, POR_DEFECTO, APROBADO_POR_DEFECTO,
  leer, aprobadoDeCurso, aprobadoDeTipo, aprobadoDeExamen, esDeModulo,
  rutaClave, leerClave, leerClaveSegura, escalonesFinal, infoFinal,
};
