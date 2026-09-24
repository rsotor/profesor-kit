'use strict';
// Lo mecánico de corregir un examen, para que el profesor no lo edite a mano (diagnóstico de skills, 2026-09-24): el
// intento en "## Histórico de intentos" (la fila y el bloque con las respuestas literales), el frontmatter (nota,
// fecha, intentos), las respuestas vacías otra vez y, si aprueba un examen de módulo (no un test ni un final),
// `estudiada: true` en las sesiones de su unidad.
//
// Dos formatos, dos comandos:
//
// - **Libre** (los exámenes de antes de esta versión, con huecos "✍️ **Tu respuesta:**"): el profesor corrige él
//   mismo y aporta su juicio —nota, veredicto y el resultado de cada pregunta— en un JSON:
//
//     { "nota": 6.5, "fecha": "2026-10-02", "veredicto": ["✅ Dominado → …", "⚠️ …", "🔴 …"],
//       "preguntas": [{ "resultado": "✅ Correcta", "por_que": "…" }, …] }      (una por hueco, en orden)
//
//     node .kit/herramientas/examen.js --registrar <examen.md> --correccion <fichero.json>
//
// - **Test** (docs/planes/2026-09-25-examen-v1.md): casillas `- [ ] a) …`, corrige el código con la clave de
//   config/claves/: nada de juicio que aportar.
//
//     node .kit/herramientas/examen.js --corregir <examen.md>
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const indice = require('./lib/indice');
const examenes = require('./lib/examenes');

const HUECO = '✍️ **Tu respuesta:**';
const ETIQUETAS = ['✅ Correcta', '⚠️ Le falta', '❌ Incorrecta'];
const HISTORICO = '## Histórico de intentos';
const CABECERA = ['| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |', '|---|---|---|---|---|---|---|'];
const EN_BLANCO = '*(en blanco)*';

// Dónde numera una pregunta el formato de examen ("1. " o "**1.**"): lo mismo que usa comprobar.js para no
// desincronizarse de lo que la skill escribe.
const NUMERO = /^(\d+\.\s|\*\*\d+\.\*\*)/;

// Donde acaba la respuesta de un hueco (formato libre): la pregunta siguiente, un título, un callout u otro hueco.
const FIN_DE_RESPUESTA = l => NUMERO.test(l) || /^#/.test(l) || l.startsWith('>') || l.startsWith(HUECO);

// Los huecos del examen libre (fuera de callouts y antes del histórico), con la respuesta que haya debajo.
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

// Las preguntas del examen tipo test: cada una empieza en su número y trae, debajo, sus opciones con casilla
// ("- [ ] a) …", letras a, b, c…). Una pregunta sin ninguna opción con casilla no es de este formato (es del
// libre, o no sigue ninguno de los dos): se ignora aquí, no revienta.
const OPCION = /^-\s*\[([ xX])\]\s*([a-zA-Z])\)/;

function preguntasTest(lineas) {
  const fin = lineas.indexOf(HISTORICO) >= 0 ? lineas.indexOf(HISTORICO) : lineas.length;
  const lista = [];
  for (let i = 0; i < fin; i++) {
    if (!NUMERO.test(lineas[i])) continue;
    let j = i + 1;
    const opciones = [];
    while (j < fin) {
      const m = OPCION.exec(lineas[j]);
      if (m) { opciones.push({ linea: j, marcada: /x/i.test(m[1]), letra: m[2].toLowerCase() }); j++; continue; }
      if (lineas[j].trim() === '') { j++; continue; }
      if (opciones.length || NUMERO.test(lineas[j]) || /^#/.test(lineas[j]) || lineas[j].startsWith('>')) break;
      j++;   // todavía es parte del enunciado, antes de llegar a las opciones
    }
    if (opciones.length) lista.push({ desde: i, hasta: j, opciones });
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

// Lo común a --registrar y --corregir: la fila y el callout del intento en "## Histórico de intentos", el
// frontmatter (fecha, nota, intentos) y, si aprueba un examen de módulo (ni un test, ni un final, ni un
// trimestre: lib/examenes.esDeModulo), `estudiada: true` en las sesiones de su unidad. `lineas` ya trae las
// respuestas vaciadas o las casillas desmarcadas: aquí solo se escribe el histórico.
function escribirIntento(raiz, fichero, eol, lineas, { nota, fecha, filas, veredicto = [], fm }) {
  const cuenta = { enteras: 0, medias: 0, falladas: 0, blanco: 0 };
  filas.forEach(f => {
    if (f.respuesta === EN_BLANCO) cuenta.blanco++;
    else if (f.resultado.startsWith('✅')) cuenta.enteras++;
    else if (f.resultado.startsWith('⚠️')) cuenta.medias++;
    else cuenta.falladas++;
  });

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
    ...veredicto.map(l => (String(l).trim() ? `> ${l}` : '>')), '>',
    '> | # | Tu respuesta | Resultado | Por qué |', '> |---|---|---|---|',
    ...filas.map((f, k) => `> | ${k + 1} | ${celda(f.respuesta)} | ${celda(f.resultado)} | ${celda(f.por_que || '')} |`), '');

  let texto = lineas.join('\n');
  texto = ponerPropiedad(ponerPropiedad(ponerPropiedad(texto, 'fecha', fecha), 'nota', String(nota)), 'intentos', String(intento));
  fs.writeFileSync(fichero, texto.replace(/\n/g, eol));

  // Aprueba un examen de módulo (no un test, ni un final, ni un trimestre): sus sesiones, estudiadas. Es la
  // única vez que el profesor marca esa casilla.
  const aprobado = examenes.aprobadoDeExamen(raiz, fm);
  const estudiadas = [];
  if (!v.esCierto(fm.parcial) && examenes.esDeModulo(fm) && nota >= aprobado) {
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

function registrar(raiz, rel, correccion) {
  const fichero = path.resolve(raiz, rel);
  const original = fs.readFileSync(fichero, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const lineas = original.replace(/\r\n/g, '\n').split('\n');
  const lista = huecos(lineas);
  const { nota, fecha, preguntas } = validar(correccion, lista);   // si algo no cuadra, se lanza aquí: nada escrito

  // Los huecos, vacíos otra vez (de abajo arriba, para no mover los índices de los de arriba).
  for (const h of [...lista].reverse()) lineas.splice(h.desde, h.hasta - h.desde, HUECO, ...(h.hasta < lineas.length ? [''] : []));

  const filas = preguntas.map((p, i) => ({
    respuesta: lista[i].respuesta ? lista[i].respuesta : EN_BLANCO,
    resultado: p.resultado, por_que: p.por_que || '',
  }));
  const fm = v.leerFrontmatter(original) || {};
  return escribirIntento(raiz, fichero, eol, lineas, { nota, fecha, filas, veredicto: correccion.veredicto || [], fm });
}

// Examen tipo test: lee las casillas marcadas, las compara con la clave (config/claves/…) y pone la nota con la
// fórmula de notaTest: (aciertos − resta_fallo × fallos) / total × 10, nunca por debajo de 0, truncada a 1 decimal. Varias correctas:
// bien solo si marca exactamente las correctas, ni una más ni una menos; sin marcar ninguna, en blanco (no
// resta). Desmarca las casillas al terminar, para poder repetirlo.
// Truncada a un decimal, nunca redondeada: redondear haría aprobar un escalón del 70 % con un 69,5 %. El 1e-9 evita
// que la coma flotante baje una décima de más (29/100 × 100 = 28,999…).
function notaTest({ aciertos, fallos, total, restaFallo }) {
  return Math.max(0, Math.floor(((aciertos - restaFallo * fallos) * 100) / total + 1e-9) / 10);
}

function corregir(raiz, rel) {
  const fichero = path.resolve(raiz, rel);
  const original = fs.readFileSync(fichero, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const lineas = original.replace(/\r\n/g, '\n').split('\n');
  const preguntas = preguntasTest(lineas);
  if (!preguntas.length) throw new Error('no se han encontrado preguntas con casillas ("- [ ] a) …"): este examen no es del formato test');

  const relDesdeEstudio = v.aPosix(path.relative(v.baseAlumno(raiz), fichero));
  const clave = examenes.leerClave(raiz, relDesdeEstudio);
  const clavePreguntas = Array.isArray(clave.preguntas) ? clave.preguntas : [];
  if (clavePreguntas.length !== preguntas.length) {
    throw new Error(`el examen tiene ${preguntas.length} preguntas y la clave trae ${clavePreguntas.length}`);
  }

  const restaFallo = v.numero(clave.resta_fallo) ?? 0;
  let aciertos = 0;
  let fallos = 0;
  const filas = preguntas.map((p, i) => {
    const marcadas = p.opciones.filter(o => o.marcada).map(o => o.letra).sort();
    const correctas = (clavePreguntas[i].correctas || []).map(l => String(l).toLowerCase()).sort();
    const explicacion = clavePreguntas[i].explicacion || '';
    const concepto = clavePreguntas[i].concepto || null;
    if (!marcadas.length) return { respuesta: EN_BLANCO, resultado: '❌ Incorrecta (en blanco)', por_que: explicacion, concepto };
    const bien = marcadas.length === correctas.length && marcadas.every((l, k) => l === correctas[k]);
    if (bien) { aciertos++; return { respuesta: marcadas.join(', '), resultado: '✅ Correcta', por_que: explicacion, concepto }; }
    fallos++;
    const porQue = `Correcta: ${correctas.join(', ') || '—'}.${explicacion ? ` ${explicacion}` : ''}`;
    return { respuesta: marcadas.join(', '), resultado: '❌ Incorrecta', por_que: porQue, concepto };
  });

  const total = preguntas.length;
  const nota = notaTest({ aciertos, fallos, total, restaFallo });
  const fecha = new Date().toISOString().slice(0, 10);

  // Desmarca las casillas (de abajo arriba, para no mover los índices de las de arriba).
  for (const p of [...preguntas].reverse()) {
    for (const o of [...p.opciones].reverse()) lineas[o.linea] = lineas[o.linea].replace(/^(-\s*)\[[ xX]\]/, '$1[ ]');
  }

  const fm = v.leerFrontmatter(original) || {};
  const r = escribirIntento(raiz, fichero, eol, lineas, { nota, fecha, filas, fm });

  const fallosPorConcepto = {};
  filas.forEach(f => { if (f.resultado !== '✅ Correcta' && f.concepto) fallosPorConcepto[f.concepto] = (fallosPorConcepto[f.concepto] || 0) + 1; });
  return { ...r, aprobo: nota >= r.aprobado, aciertos, fallos, blancos: total - aciertos - fallos, fallosPorConcepto };
}

function cli(args, raiz) {
  const valor = marca => { const i = args.indexOf(marca); return i >= 0 ? args[i + 1] : undefined; };
  const registrarArg = valor('--registrar');
  const corregirArg = valor('--corregir');
  const json = valor('--correccion');

  if (corregirArg) {
    try {
      const r = corregir(raiz, corregirArg);
      const veredicto = r.parcial ? 'test: no pone nota a la unidad' : r.aprobo ? 'aprobado' : `suspenso (aprobado: ${r.aprobado})`;
      console.log(`Intento ${r.intento} corregido: ${notaEnTexto(r.nota)} · ${veredicto} · ${r.aciertos} aciertos, ${r.fallos} fallos, ${r.blancos} en blanco.`
        + (r.estudiadas.length ? ` Sesiones marcadas como estudiadas: ${r.estudiadas.join(', ')}.` : ''));
      console.log(JSON.stringify({ nota: r.nota, aprobado: r.aprobado, aprobo: r.aprobo, fallosPorConcepto: r.fallosPorConcepto }));
      return 0;
    } catch (error) {
      console.error(`No se ha corregido nada: ${error.message}`);
      return 1;
    }
  }

  if (!registrarArg || !json) {
    console.error('Uso: node .kit/herramientas/examen.js --registrar <examen.md> --correccion <fichero.json>'
      + ' · node .kit/herramientas/examen.js --corregir <examen.md>');
    return 2;
  }
  const ficheroJson = path.resolve(raiz, json);
  try {
    const correccion = JSON.parse(fs.readFileSync(ficheroJson, 'utf8'));
    const r = registrar(raiz, registrarArg, correccion);
    fs.rmSync(ficheroJson);   // ya está en el examen: el JSON era solo el mensajero
    const veredicto = r.parcial ? 'test: no pone nota a la unidad' : r.nota >= r.aprobado ? 'aprobado' : `suspenso (aprobado: ${r.aprobado})`;
    console.log(`Intento ${r.intento} registrado: ${notaEnTexto(r.nota)} · ${veredicto} · ${r.enteras} enteras, ${r.medias} a medias, ${r.falladas} falladas, ${r.blanco} en blanco.`
      + (r.estudiadas.length ? ` Sesiones marcadas como estudiadas: ${r.estudiadas.join(', ')}.` : ''));
    console.log(`${path.basename(ficheroJson)} ya está borrado (no hace falta que lo borres). Falta lo tuyo: estudio/progreso.md (y config/alumno.md si hay errores repetidos). Después, guarda.`);
    return 0;
  } catch (error) {
    console.error(`No se ha registrado nada: ${error.message}`);
    return 1;
  }
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'examen.js');

module.exports = { registrar, corregir, cli, notaTest };
