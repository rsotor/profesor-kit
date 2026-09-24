'use strict';
// Saca el texto de un Word, PowerPoint o Excel del material del alumno, para leerlo sin improvisar `python3` (que
// pide permiso, y sin nadie delante se deniega). Los PDF y las fotos los lee el propio asistente; el audio y el vídeo
// necesitan una transcripción. Nunca inventa: lo que no sabe leer, lo dice.
//
//   node .kit/herramientas/leer.js <fichero> [--parte N]
const fs = require('node:fs');
const path = require('node:path');
const { leerZip } = require('./lib/zip');

const LOS_LEE_EL_ASISTENTE = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.md', '.txt', '.csv'];
const ANTIGUOS = ['.doc', '.ppt', '.xls'];
const AUDIO_Y_VIDEO = ['.mp3', '.m4a', '.wav', '.ogg', '.mp4', '.mov', '.webm', '.mkv'];

function textoXml(xml) {
  return xml.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

// El texto de un párrafo (<w:p> o <a:p>): sus <w:t>/<a:t> seguidos, y los tabuladores.
function textoDeParrafo(xml, prefijo) {
  const partes = [];
  for (const m of xml.matchAll(new RegExp(`<${prefijo}:t(?:\\s[^>]*)?>([^<]*)</${prefijo}:t>|<${prefijo}:tab/>`, 'g'))) {
    partes.push(m[1] === undefined ? '\t' : textoXml(m[1]));
  }
  return partes.join('');
}

const parrafos = (xml, prefijo) => [...xml.matchAll(new RegExp(`<${prefijo}:p[\\s>][\\s\\S]*?</${prefijo}:p>`, 'g'))]
  .map(m => textoDeParrafo(m[0], prefijo)).filter(t => t.trim());

function leerWord(zip) {
  const xml = (zip.get('word/document.xml') || Buffer.from('')).toString('utf8');
  const lineas = [];
  // Las tablas, fila a fila; lo demás, párrafo a párrafo, en el orden del documento.
  for (const m of xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[\s>][\s\S]*?<\/w:p>/g)) {
    if (m[0].startsWith('<w:tbl>')) {
      for (const fila of m[0].matchAll(/<w:tr[\s>][\s\S]*?<\/w:tr>/g)) {
        const celdas = [...fila[0].matchAll(/<w:tc[\s>][\s\S]*?<\/w:tc>/g)].map(c => parrafos(c[0], 'w').join(' '));
        lineas.push(`| ${celdas.join(' | ')} |`);
      }
    } else {
      const t = textoDeParrafo(m[0], 'w');
      if (t.trim()) lineas.push(t);
    }
  }
  return lineas.join('\n');
}

const numeroDe = nombre => Number((/(\d+)\.xml$/.exec(nombre) || [])[1] || 0);

function leerPowerPoint(zip) {
  const diapositivas = [...zip.keys()].filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => numeroDe(a) - numeroDe(b));
  return diapositivas.map(nombre => {
    const bloque = [`## Diapositiva ${numeroDe(nombre)}`, '', ...parrafos(zip.get(nombre).toString('utf8'), 'a')];
    const rels = zip.get(nombre.replace('slides/', 'slides/_rels/') + '.rels');
    const notas = rels && /Target="\.\.\/(notesSlides\/[^"]+)"/.exec(rels.toString('utf8'));
    const xmlNotas = notas && zip.get(`ppt/${notas[1]}`);
    const textoNotas = xmlNotas ? parrafos(xmlNotas.toString('utf8'), 'a') : [];
    if (textoNotas.length) bloque.push('', 'Notas del orador:', ...textoNotas);
    return bloque.join('\n');
  }).join('\n\n');
}

const AVISO_EXCEL = '(Los números van sin el formato del Excel: 0.0275 puede ser un 2,75 %, y una fecha sale como su número '
  + 'de serie, 46267 = 2026-09-02. Entre paréntesis, la fórmula que calcula la celda.)';

function leerExcel(zip) {
  const leerTexto = n => (zip.get(n) || Buffer.from('')).toString('utf8');
  const compartidos = [...leerTexto('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(m => [...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(t => textoXml(t[1])).join(''));
  const destinos = new Map([...leerTexto('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map(m => [
    (/\bId="([^"]+)"/.exec(m[0]) || [])[1], (/\bTarget="([^"]+)"/.exec(m[0]) || [])[1],
  ]));
  const hojas = [...leerTexto('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)].map(m => ({
    nombre: textoXml((/\bname="([^"]*)"/.exec(m[0]) || [])[1] || ''),
    destino: destinos.get((/\br:id="([^"]+)"/.exec(m[0]) || [])[1]) || '',
  }));
  return hojas.map(({ nombre, destino }) => {
    const ruta = destino.startsWith('/') ? destino.slice(1) : `xl/${destino}`;
    const filas = [];
    for (const fila of leerTexto(ruta).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const celdas = [];
      for (const c of fila[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = (/\br="([^"]+)"/.exec(c[1]) || [])[1];
        const tipo = (/\bt="([^"]+)"/.exec(c[1]) || [])[1];
        const dentro = c[2] || '';
        const v = (/<v>([^<]*)<\/v>/.exec(dentro) || [])[1];
        const formula = (/<f(?:\s[^>]*)?>([^<]*)<\/f>/.exec(dentro) || [])[1];
        let valor;
        if (tipo === 's') valor = compartidos[Number(v)];
        else if (tipo === 'inlineStr') valor = [...dentro.matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map(t => textoXml(t[1])).join('');
        else if (tipo === 'b') valor = v === '1' ? 'VERDADERO' : 'FALSO';
        else if (v !== undefined && /^-?[\d.]+(E[-+]?\d+)?$/i.test(v)) valor = String(Number(v));   // 2.75E-2 → 0.0275
        else valor = v === undefined ? undefined : textoXml(v);
        if (valor === undefined && !formula) continue;
        celdas.push(`${ref}: ${valor ?? ''}${formula ? ` (=${textoXml(formula)})` : ''}`);
      }
      if (celdas.length) filas.push(celdas.join(' · '));
    }
    return [`## Hoja: ${nombre}`, '', ...filas].join('\n');
  }).reduce((texto, hoja) => `${texto}\n\n${hoja}`, AVISO_EXCEL);
}

const LECTORES = { '.docx': leerWord, '.pptx': leerPowerPoint, '.xlsx': leerExcel };

function leer(fichero) {
  const ext = path.extname(fichero).toLowerCase();
  const nombre = path.basename(fichero);
  if (LECTORES[ext]) {
    let zip;
    try { zip = leerZip(fs.readFileSync(fichero)); } catch (error) {
      throw new Error(`${nombre}: no se ha podido leer (${error.message}). Pide al alumno que lo exporte a PDF o a otro formato.`);
    }
    return LECTORES[ext](zip);
  }
  if (LOS_LEE_EL_ASISTENTE.includes(ext)) return `${nombre}: léelo tú directamente, con tu herramienta de leer ficheros.`;
  if (ANTIGUOS.includes(ext)) return `${nombre}: es un formato antiguo de Office que no sé leer. Pide al alumno que lo exporte a PDF (o a ${ext}x).`;
  if (AUDIO_Y_VIDEO.includes(ext)) return `${nombre}: es audio o vídeo. Pide al alumno una transcripción (o sus apuntes de esa parte); no inventes lo que dice.`;
  return `${nombre}: no sé leer este formato. Pide al alumno que lo exporte a PDF.`;
}

// La salida de un comando se corta hacia los 30 000 caracteres: un Excel de verdad puede tener diez veces más. Se
// reparte en partes que caben, cortando entre líneas, y cada una dice cuál sigue: así se lee entero sin `head` ni `sed`.
const TAMANO_PARTE = 20000;

function partes(texto) {
  const lista = [];
  let actual = '';
  for (const linea of texto.split('\n')) {
    if (actual && actual.length + linea.length + 1 > TAMANO_PARTE) { lista.push(actual); actual = ''; }
    actual += (actual ? '\n' : '') + linea;
  }
  lista.push(actual);
  return lista;
}

function cli(args) {
  const i = args.indexOf('--parte');
  const n = i >= 0 ? Number(args[i + 1]) : 1;
  const nombre = args.find((a, j) => !a.startsWith('--') && args[j - 1] !== '--parte');
  if (!nombre) { console.error('Uso: node .kit/herramientas/leer.js <fichero de Word, PowerPoint o Excel> [--parte N]'); return 2; }
  const fichero = path.resolve(nombre);
  if (!fs.existsSync(fichero)) { console.error(`No existe: ${nombre}`); return 2; }
  const trozos = partes(leer(fichero));
  if (trozos.length === 1 && n === 1) { console.log(trozos[0]); return 0; }
  if (!Number.isInteger(n) || n < 1 || n > trozos.length) { console.error(`${nombre} tiene ${trozos.length} partes: pide una entre 1 y ${trozos.length}.`); return 2; }
  const pie = n < trozos.length
    ? `(parte ${n} de ${trozos.length}; sigue con: node .kit/herramientas/leer.js ${nombre} --parte ${n + 1})`
    : `(parte ${n} de ${trozos.length}: es la última)`;
  console.log(`${trozos[n - 1]}\n\n${pie}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'leer.js');

module.exports = { leer, cli };
