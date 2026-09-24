'use strict';
// Lo mecánico de corregir un examen, para que el profesor no lo edite a mano (diagnóstico de skills, 2026-09-24): el
// intento en "## Histórico de intentos" (la fila y el bloque con las respuestas literales), el frontmatter (nota,
// fecha, intentos), los huecos vacíos otra vez y, si aprueba un examen (no un test), `estudiada: true` en las
// sesiones de su unidad. El profesor solo aporta lo que es juicio —la nota, el veredicto y el resultado de cada
// pregunta— en un JSON que escribe con su herramienta de ficheros:
//
//   { "nota": 6.5, "fecha": "2026-10-02", "veredicto": ["✅ Dominado → …", "⚠️ …", "🔴 …"],
//     "preguntas": [{ "resultado": "✅ Correcta", "por_que": "…" }, …] }      (una por hueco, en orden)
//
//   node .kit/herramientas/examen.js --registrar <examen.md> --correccion <fichero.json>
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const indice = require('./lib/indice');

const HUECO = '✍️ **Tu respuesta:**';
const ETIQUETAS = ['✅ Correcta', '⚠️ Le falta', '❌ Incorrecta'];
const HISTORICO = '## Histórico de intentos';
const CABECERA = ['| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |', '|---|---|---|---|---|---|---|'];

// Donde acaba la respuesta de un hueco: la pregunta siguiente, un título, un callout u otro hueco.
const FIN_DE_RESPUESTA = l => /^\*\*\d+\.\*\*/.test(l) || /^#/.test(l) || l.startsWith('>') || l.startsWith(HUECO);

// Los huecos del examen (fuera de callouts y antes del histórico), con la respuesta que haya debajo.
function huecos(lineas) {
  const fin = lineas.indexOf(HISTORICO) >= 0 ? lineas.indexOf(HISTORICO) : lineas.length;
  const lista = [];
  for (let i = 0; i < fin; i++) {
    if (!lineas[i].startsWith(HUECO)) continue;
    let j = i + 1;
    while (j < fin && !FIN_DE_RESPUESTA(lineas[j])) j++;
    const texto = [lineas[i].slice(HUECO.length), ...lineas.slice(i + 1, j)].map(l => l.trim()).filter(Boolean).join(' ');
    lista.push({ desde: i, hasta: j, respuesta: texto });
  }
  return lista;
}

function leerNota(nota) {
  const n = typeof nota === 'number' ? nota : (/^\d+(?:[.,]\d+)?$/.test(String(nota).trim()) ? Number(String(nota).replace(',', '.')) : NaN);
  if (!Number.isFinite(n) || n < 0 || n > 10) throw new Error(`la nota tiene que ser un número de 0 a 10 (${JSON.stringify(nota)}): 6.5, no "6,5/10"`);
  return n;
}

function validar(correccion, lista) {
  const nota = leerNota(correccion.nota);
  const preguntas = correccion.preguntas || [];
  if (preguntas.length !== lista.length) throw new Error(`el examen tiene ${lista.length} preguntas y la corrección trae ${preguntas.length} resultados`);
  preguntas.forEach((p, i) => {
    const resultado = String(p.resultado || '');
    if (!ETIQUETAS.some(e => resultado.startsWith(e))) throw new Error(`el resultado de la pregunta ${i + 1} tiene que empezar por ${ETIQUETAS.join(', por ')}: "${resultado}"`);
    if (!lista[i].respuesta && !resultado.startsWith('❌ Incorrecta')) throw new Error(`la pregunta ${i + 1} está en blanco: su resultado es "❌ Incorrecta (en blanco)"`);
  });
  const fecha = correccion.fecha || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error(`la fecha tiene que ser AAAA-MM-DD: "${fecha}"`);
  return { nota, fecha, preguntas };
}

// Pone (o cambia) una propiedad del frontmatter, sin tocar el resto.
function ponerPropiedad(texto, clave, valor) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return `---\n${clave}: ${valor}\n---\n${texto}`;
  const linea = new RegExp(`^${clave}:.*$`, 'm');
  const fm = linea.test(m[1]) ? m[1].replace(linea, `${clave}: ${valor}`) : `${m[1]}\n${clave}: ${valor}`;
  return texto.slice(0, m.index) + `---\n${fm}\n---` + texto.slice(m.index + m[0].length);
}

const celda = texto => String(texto).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
const notaEnTexto = n => String(n).replace('.', ',');

function registrar(raiz, rel, correccion) {
  const fichero = path.resolve(raiz, rel);
  const original = fs.readFileSync(fichero, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const lineas = original.replace(/\r\n/g, '\n').split('\n');
  const lista = huecos(lineas);
  const { nota, fecha, preguntas } = validar(correccion, lista);   // si algo no cuadra, se lanza aquí: nada escrito

  const cuenta = { enteras: 0, medias: 0, falladas: 0, blanco: 0 };
  preguntas.forEach((p, i) => {
    if (!lista[i].respuesta) cuenta.blanco++;
    else if (p.resultado.startsWith('✅')) cuenta.enteras++;
    else if (p.resultado.startsWith('⚠️')) cuenta.medias++;
    else cuenta.falladas++;
  });

  // Los huecos, vacíos otra vez (de abajo arriba, para no mover los índices de los de arriba).
  for (const h of [...lista].reverse()) lineas.splice(h.desde, h.hasta - h.desde, HUECO, ...(h.hasta < lineas.length ? [''] : []));

  // El histórico: la fila, en su tabla; el bloque del intento, al final de la nota.
  let i = lineas.indexOf(HISTORICO);
  if (i < 0) {
    while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
    lineas.push('', HISTORICO, '', ...CABECERA);
    i = lineas.indexOf(HISTORICO);
  }
  let ultimaFila = lineas.findIndex((l, k) => k > i && l.startsWith('|---'));
  if (ultimaFila < 0) { lineas.splice(i + 1, 0, '', ...CABECERA); ultimaFila = i + 3; }
  while (lineas[ultimaFila + 1] && lineas[ultimaFila + 1].startsWith('|')) ultimaFila++;
  const intento = lineas.slice(i, ultimaFila + 1).filter(l => /^\|\s*\d+\s*\|/.test(l)).length + 1;
  lineas.splice(ultimaFila + 1, 0, `| ${intento} | ${fecha} | ${notaEnTexto(nota)} | ${cuenta.enteras} | ${cuenta.medias} | ${cuenta.falladas} | ${cuenta.blanco} |`);
  while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
  lineas.push('', `> [!example]- Intento ${intento} · ${fecha} · tus respuestas y la corrección`, '>',
    ...(correccion.veredicto || []).map(l => (String(l).trim() ? `> ${l}` : '>')), '>',
    '> | # | Tu respuesta | Resultado | Por qué |', '> |---|---|---|---|',
    ...preguntas.map((p, k) => `> | ${k + 1} | ${lista[k].respuesta ? celda(lista[k].respuesta) : '*(en blanco)*'} | ${celda(p.resultado)} | ${celda(p.por_que || '')} |`), '');

  let texto = lineas.join('\n');
  texto = ponerPropiedad(ponerPropiedad(ponerPropiedad(texto, 'fecha', fecha), 'nota', String(nota)), 'intentos', String(intento));
  fs.writeFileSync(fichero, texto.replace(/\n/g, eol));

  // Aprueba un examen (no un test): sus sesiones, estudiadas. Es la única vez que el profesor marca esa casilla.
  const fm = v.leerFrontmatter(texto) || {};
  const aprobado = indice.leerAprobado(raiz);
  const estudiadas = [];
  if (!v.esCierto(fm.parcial) && nota >= aprobado) {
    const unidades = (Array.isArray(fm.unidad) ? fm.unidad : [fm.unidad]).filter(u => u !== undefined && u !== null).map(String);
    for (const s of indice.leerSesiones(raiz)) {
      if (!s.clave || !unidades.some(u => s.clave === u || s.clave.startsWith(`${u}-`))) continue;
      const abs = path.join(v.baseAlumno(raiz), ...s.rel.split('/'));
      fs.writeFileSync(abs, ponerPropiedad(fs.readFileSync(abs, 'utf8'), 'estudiada', 'true'));
      estudiadas.push(s.id);
    }
  }
  return { intento, nota, fecha, aprobado, parcial: v.esCierto(fm.parcial), ...cuenta, estudiadas };
}

function cli(args, raiz) {
  const valor = marca => { const i = args.indexOf(marca); return i >= 0 ? args[i + 1] : undefined; };
  const examen = valor('--registrar');
  const json = valor('--correccion');
  if (!examen || !json) { console.error('Uso: node .kit/herramientas/examen.js --registrar <examen.md> --correccion <fichero.json>'); return 2; }
  const ficheroJson = path.resolve(raiz, json);
  try {
    const correccion = JSON.parse(fs.readFileSync(ficheroJson, 'utf8'));
    const r = registrar(raiz, examen, correccion);
    fs.rmSync(ficheroJson);   // ya está en el examen: el JSON era solo el mensajero
    const veredicto = r.parcial ? 'test: no pone nota a la unidad' : r.nota >= r.aprobado ? 'aprobado' : `suspenso (aprobado: ${r.aprobado})`;
    console.log(`Intento ${r.intento} registrado: ${notaEnTexto(r.nota)} · ${veredicto} · ${r.enteras} enteras, ${r.medias} a medias, ${r.falladas} falladas, ${r.blanco} en blanco.`
      + (r.estudiadas.length ? ` Sesiones marcadas como estudiadas: ${r.estudiadas.join(', ')}.` : ''));
    console.log('Falta lo tuyo: estudio/progreso.md (y config/alumno.md si hay errores repetidos). Después, guarda.');
    return 0;
  } catch (error) {
    console.error(`No se ha registrado nada: ${error.message}`);
    return 1;
  }
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'examen.js');

module.exports = { registrar, cli };
