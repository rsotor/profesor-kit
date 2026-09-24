'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');
const indice = require('./indice');

// estudio/mi-perfil.md y las señales de estado.js: lo que el profesor sabe del alumno y cómo va, juntado desde
// config/alumno.md, config/profesor.md, los exámenes y progreso.md. Aquí solo se calcula; quien escribe es
// guardar.js. No se inventa nada: lo que no está escrito sale como "Todavía nada".

const ESTADOS = ['✅', '🟡', '🔴', '⬜'];
const SEPARADOR = /^\|[\s:|-]+\|$/;

function leerConfig(raiz, nombre) {
  const f = path.join(raiz, 'config', nombre);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '';
}

// El cuerpo de `## <titulo>` hasta el siguiente `## ` (o el final), sin los comentarios de la plantilla.
function seccion(texto, titulo) {
  const escapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^## ${escapado}[ \\t]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(texto);
  return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : '';
}

// Una tabla con solo cabecera y separador (la de la plantilla) no cuenta como contenido.
function tieneContenido(cuerpo) {
  const lineas = cuerpo.split('\n').map(l => l.trim()).filter(Boolean);
  const filas = lineas.filter((l, i) => l.startsWith('|') && !SEPARADOR.test(l) && !SEPARADOR.test(lineas[i + 1] || ''));
  return lineas.some(l => !l.startsWith('|')) || filas.length > 0;
}

// La tabla "## Histórico de intentos" que escribe /examen: | Intento | Fecha | Nota | … |
function intentosDe(texto) {
  const intentos = [];
  for (const linea of seccion(texto.replace(/\r\n/g, '\n'), 'Histórico de intentos').split('\n')) {
    const c = linea.split('|').map(x => x.trim());
    if (c.length < 5 || !/^\d+$/.test(c[1]) || !/^\d{4}-\d{2}-\d{2}$/.test(c[2])) continue;
    const nota = v.numero(c[3]);
    if (nota !== null) intentos.push({ intento: Number(c[1]), fecha: c[2], nota });
  }
  return intentos.sort((a, b) => a.intento - b.intento);
}

// Los exámenes completos con sus intentos. Sin histórico (un examen corregido antes de que existiera), el
// frontmatter cuenta como único intento.
function examenesConIntentos(raiz) {
  const base = v.baseAlumno(raiz);
  return indice.leerExamenes(raiz).filter(e => !e.parcial).map(e => {
    let intentos = intentosDe(fs.readFileSync(path.join(base, ...e.rel.split('/')), 'utf8'));
    if (!intentos.length && e.nota !== null && e.fecha) intentos = [{ intento: 1, fecha: e.fecha, nota: e.nota }];
    return { ...e, intentos };
  }).filter(e => e.intentos.length)
    .sort((a, b) => a.intentos[0].fecha.localeCompare(b.intentos[0].fecha) || a.rel.localeCompare(b.rel));
}

// "## Registro de dudas" de config/alumno.md: | Concepto | Nº de dudas | Última |. La celda del concepto puede
// ser un slug, un [[enlace\|alias]] o texto libre (una sesión): se deja legible, sin corchetes ni alias.
function leerDudas(raiz) {
  const dudas = [];
  for (const linea of seccion(leerConfig(raiz, 'alumno.md'), 'Registro de dudas').split('\n')) {
    const c = linea.split(/(?<!\\)\|/).map(x => x.trim());
    if (c.length < 4) continue;
    const veces = v.numero(c[2]);
    if (!Number.isInteger(veces) || veces <= 0) continue;
    const concepto = c[1].replace(/^\[\[/, '').replace(/\]\]$/, '').split(/\\?\|/)[0].trim();
    dudas.push({ concepto, veces, ultima: c[3] });
  }
  return dudas.sort((a, b) => b.veces - a.veces || a.concepto.localeCompare(b.concepto));
}

const cero = () => Object.fromEntries(ESTADOS.map(e => [e, 0]));

// Cuántos conceptos hay en cada estado, por eje y por bloque (el primero de `bloques:`, como formulario.md).
function conceptosPorBloque(raiz) {
  const base = v.baseAlumno(raiz);
  const bloques = new Map();
  for (const [slug, estado] of indice.leerProgreso(raiz)) {
    const f = path.join(base, 'conceptos', `${slug}.md`);
    const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) || {} : {};
    const bloque = Array.isArray(fm.bloques) && fm.bloques.length ? `Bloque ${fm.bloques[0]}` : 'Sin bloque';
    if (!bloques.has(bloque)) bloques.set(bloque, { teoria: cero(), aplicacion: cero() });
    bloques.get(bloque).teoria[estado.teoria]++;
    bloques.get(bloque).aplicacion[estado.aplicacion]++;
  }
  return [...bloques.entries()].sort(([a], [b]) => a.localeCompare(b));
}

module.exports = { ESTADOS, leerConfig, seccion, tieneContenido, intentosDe, examenesConIntentos, leerDudas, conceptosPorBloque };
