'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const v = require('./vault');

// E1 · Repaso espaciado (Leitner, cinco cajas). Leer una flashcard una vez no la fija; volver a ella cuando toca,
// sí. El alumno marca ✅ o ❌ debajo de cada tarjeta en Obsidian (o el profesor, en el calentamiento) y guardar.js
// mueve la tarjeta de caja, desmarca y escribe cuándo vuelve. El estado, en config/repaso.json: fuera de la bóveda,
// para que no se rompa sin querer. Solo entran las sesiones estudiadas: antes de eso, leerlas es estudiar.

const ESTADO = path.join('config', 'repaso.json');
const DIAS = [1, 3, 7, 14, 30];   // días hasta la siguiente vez, por caja (1..5)
const SI = '✅ la sabía';
const NO = '❌ no la sabía';
const PREGUNTA = /^\*\*(.+)\*\*\s*$/;
const RESPUESTA = /^>\s*\[!success\]-/;
const CASILLA = /^- \[([ xX])\] (✅|❌)/;
const LINEA_CAJA = /^\*Caja \d+ de \d+ · /;

const normalizar = t => t.trim().replace(/\s+/g, ' ').toLowerCase();
// La sesión va en el id: la misma pregunta en dos sesiones son dos tarjetas, y mover el fichero no la reinicia.
const idTarjeta = (sesion, pregunta) => crypto.createHash('sha1').update(`${sesion}\n${normalizar(pregunta)}`).digest('hex').slice(0, 12);

function sumarDias(iso, dias) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
const corta = iso => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

function mover(tarjeta, marca, hoy) {
  const caja = marca === 'bien' ? Math.min(tarjeta.caja + 1, DIAS.length) : 1;
  return { caja, proxima: sumarDias(hoy, DIAS[caja - 1]) };
}

function bloque(t) {
  return ['', `- [ ] ${SI}`, `- [ ] ${NO}`, `*Caja ${t.caja} de ${DIAS.length} · te toca el ${corta(t.proxima)}*`];
}

// Las tarjetas de un fichero: la pregunta en negrita, su callout de respuesta y, si ya lo tiene, el bloque de
// casillas (una línea en blanco, ✅, ❌ y la línea de la caja). `desde`/`hasta` es el tramo que se reescribe.
function leerTarjetas(lineas) {
  const lista = [];
  for (let i = 0; i < lineas.length - 1; i++) {
    const m = PREGUNTA.exec(lineas[i]);
    if (!m || !RESPUESTA.test(lineas[i + 1])) continue;
    let j = i + 1;
    while (j < lineas.length && lineas[j].startsWith('>')) j++;
    let hasta = j;   // sin bloque todavía: se inserta justo después de la respuesta
    const marcas = new Set();
    if (lineas[j] === '' && CASILLA.test(lineas[j + 1] || '')) {
      hasta = j + 1;
      while (hasta < lineas.length && (CASILLA.test(lineas[hasta]) || LINEA_CAJA.test(lineas[hasta]))) {
        const c = CASILLA.exec(lineas[hasta]);
        if (c && c[1] !== ' ') marcas.add(c[2]);
        hasta++;
      }
    }
    // Las dos marcadas cuenta como no la sabía: ante la duda, que vuelva pronto.
    const marca = marcas.has('❌') ? 'mal' : marcas.has('✅') ? 'bien' : null;
    lista.push({ pregunta: m[1], desde: j, hasta, marca });
    i = hasta - 1;
  }
  return lista;
}

function leerEstado(raiz) {
  try { return JSON.parse(fs.readFileSync(path.join(raiz, ESTADO), 'utf8')).tarjetas || {}; } catch { return {}; }
}

function ficherosDeFlashcards(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'flashcards'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const texto = fs.readFileSync(abs, 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    return { abs, rel: v.aPosix(path.relative(base, abs)), texto, sesion: String(fm.sesion || path.basename(abs, '.md')) };
  });
}

// Mueve de caja lo marcado, pone casillas a las tarjetas nuevas y escribe config/repaso.json. Solo reescribe lo
// que cambia: guardar dos veces seguidas no toca nada.
function procesar(raiz, { hoy, estudiadas }) {
  const anterior = leerEstado(raiz);
  const nuevo = {};
  for (const f of ficherosDeFlashcards(raiz)) {
    if (!estudiadas.has(f.sesion)) continue;
    const eol = f.texto.includes('\r\n') ? '\r\n' : '\n';
    const lineas = f.texto.split(/\r?\n/);
    const tarjetas = leerTarjetas(lineas);
    for (const t of tarjetas.reverse()) {   // de abajo arriba: los índices de las de arriba no se mueven
      const id = idTarjeta(f.sesion, t.pregunta);
      const previa = anterior[id] || { caja: 1, proxima: hoy };
      const movida = t.marca ? mover(previa, t.marca, hoy) : { caja: previa.caja, proxima: previa.proxima };
      nuevo[id] = { ...movida, fichero: f.rel };
      lineas.splice(t.desde, t.hasta - t.desde, ...bloque(movida));
    }
    const texto = lineas.join(eol);
    if (texto !== f.texto) fs.writeFileSync(f.abs, texto);
  }
  const f = path.join(raiz, ESTADO);
  const json = JSON.stringify({ version: 1, tarjetas: nuevo }, null, 2) + '\n';
  if (Object.keys(nuevo).length || fs.existsSync(f)) {
    if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== json) fs.writeFileSync(f, json);
  }
}

// El texto sin lo que escribe guardar.js (las casillas y la línea de la caja): lo que escribió el profesor. Para
// comparar un fichero de flashcards antes y después, como sinPie en las sesiones.
function sinCasillas(texto) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto.split(/\r?\n/);
  for (const t of leerTarjetas(lineas).reverse()) lineas.splice(t.desde, t.hasta - t.desde);
  return lineas.join(eol);
}

// Lo que toca, en dos tramos de fechas: inicio.md solo cambia al guardar, y "hoy" dejaría de ser verdad mañana.
function tramos(raiz, hoy) {
  const estado = Object.values(leerEstado(raiz));
  const limites = [{ hasta: sumarDias(hoy, 2) }, { desde: sumarDias(hoy, 3), hasta: sumarDias(hoy, 9) }];
  return limites.map(l => {
    const cuenta = new Map();
    for (const t of estado) {
      if (t.proxima > l.hasta || (l.desde && t.proxima < l.desde)) continue;
      cuenta.set(t.fichero, (cuenta.get(t.fichero) || 0) + 1);
    }
    return { ...l, ficheros: [...cuenta].sort((a, b) => a[0].localeCompare(b[0])).map(([fichero, n]) => ({ fichero, n })) };
  }).filter(l => l.ficheros.length);
}

module.exports = { ESTADO, DIAS, idTarjeta, mover, leerTarjetas, procesar, tramos, corta, sinCasillas };
