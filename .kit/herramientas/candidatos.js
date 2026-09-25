'use strict';
// P5 (0.26.0): antes de crear una nota de concepto, ¿ya existe algo parecido con otro nombre? Compara por
// significado, no solo por nombre — un `grep` del slug no encuentra "fondo de reserva" cuando la nota ya
// existe como "colchón para imprevistos". **Solo lee: nunca escribe ni fusiona**; decide siempre el profesor.
//
//   node .kit/herramientas/candidatos.js "<nombre> — <definición en una frase>"
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const indice = require('./lib/indice');

// Peso de cada señal, de más a menos (docs/planes/2026-09-25-0.26.0-alcance.md, "P5+H12"): la definición del
// índice pesa más que un alias o el nombre de la nota, y eso pesa más que las palabras sueltas del slug.
const PESO_DEFINICION = 3;
const PESO_ALIAS = 2;
const PESO_SLUG = 1;
const UMBRAL = 3;   // por debajo de esto, es ruido: "ninguno parecido" antes que una falsa pista

const PALABRAS_VACIAS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'a', 'en', 'que', 'para', 'por',
  'con', 'sin', 'se', 'su', 'sus', 'es', 'son', 'del', 'al', 'lo', 'como', 'mas', 'menos', 'entre', 'sobre',
  'cada', 'si', 'no', 'muy', 'tan', 'ya', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'tu', 'tus', 'qué', 'cómo',
]);

const normalizar = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Sin plurales simples: "gastos" → "gasto", "meses" → "mes". Es una regla simple, no un lematizador de verdad
// — basta para no perder coincidencias obvias por una "s" de más.
function recortar(palabra) {
  if (palabra.length >= 5 && /[^aeiou]es$/.test(palabra)) return palabra.slice(0, -2);
  if (palabra.length > 4 && palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

// Hasta que no cambie: así "intereses" e "interés" acaban en la misma raíz (una sola pasada daba "interes" e "inter").
function singular(palabra) {
  for (let antes = ''; antes !== palabra;) { antes = palabra; palabra = recortar(palabra); }
  return palabra;
}

function palabras(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean).map(singular).filter(p => p.length > 2 && !PALABRAS_VACIAS.has(p));
}

// La línea de cada concepto en conceptos/_index.md: "slug | definición | bloques | dif | alias: …".
function leerIndice(raiz) {
  const datos = new Map();
  const fichero = path.join(v.baseAlumno(raiz), 'conceptos', '_index.md');
  if (!fs.existsSync(fichero)) return datos;
  for (const linea of fs.readFileSync(fichero, 'utf8').split(/\r?\n/)) {
    const m = /^([a-z0-9][a-z0-9-]*) *\|(.*)$/.exec(linea);
    if (!m) continue;
    const campos = m[2].split('|').map(c => c.trim());
    const campoAlias = campos.find(c => /^alias:/i.test(c)) || '';
    const alias = campoAlias ? campoAlias.replace(/^alias:\s*/i, '').split(',').map(a => a.trim()).filter(Boolean) : [];
    datos.set(m[1], { definicion: campos[0] || '', alias });
  }
  return datos;
}

// Un candidato por concepto existente: su definición (del índice), sus nombres (título + alias, de la nota y
// del índice) y las palabras de su slug.
function leerConceptos(raiz) {
  const delIndice = leerIndice(raiz);
  return v.listarConceptos(raiz).map(slug => {
    const fichero = path.join(v.baseAlumno(raiz), 'conceptos', `${slug}.md`);
    const texto = fs.readFileSync(fichero, 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    const enIndice = delIndice.get(slug) || { definicion: '', alias: [] };
    const aliasFm = Array.isArray(fm.alias) ? fm.alias : [];
    const nombres = [...new Set([indice.tituloDe(texto, slug), ...aliasFm, ...enIndice.alias].filter(Boolean))];
    return {
      slug,
      definicion: enIndice.definicion,
      nombres,
      bloques: Array.isArray(fm.bloques) ? fm.bloques.map(String) : [],
      requiere: Array.isArray(fm.requiere) ? fm.requiere.map(String) : [],
    };
  });
}

// Señal 2: el alias o el nombre de la nota aparece, literal, dentro del texto dado (o al revés). Solo cuenta a
// partir de 4 caracteres normalizados: por debajo, cualquier palabra suelta empataría con medio glosario.
function nombresQueCoinciden(candidato, nombreDado, textoDadoNorm) {
  const nombreDadoNorm = normalizar(nombreDado);
  return candidato.nombres.filter(n => {
    const nn = normalizar(n);
    if (nn.length < 4) return false;
    return textoDadoNorm.includes(nn) || (nombreDadoNorm.length >= 4 && nn.includes(nombreDadoNorm));
  });
}

function puntuar(candidato, inputPalabras, nombreDado, textoDadoNorm) {
  const defPalabras = [...new Set(palabras(candidato.definicion))];
  const coincidenDef = defPalabras.filter(p => inputPalabras.includes(p));

  const coincidenNombres = nombresQueCoinciden(candidato, nombreDado, textoDadoNorm);

  const slugPalabras = [...new Set(candidato.slug.split('-').map(normalizar).map(singular))];
  const coincidenSlug = slugPalabras.filter(p => p.length > 2 && inputPalabras.includes(p));

  const puntuacion = coincidenDef.length * PESO_DEFINICION + coincidenNombres.length * PESO_ALIAS + coincidenSlug.length * PESO_SLUG;
  const senales = [];
  if (coincidenDef.length) senales.push(`definición: ${coincidenDef.join(', ')}`);
  if (coincidenNombres.length) senales.push(`alias o nombre: ${coincidenNombres.join(', ')}`);
  if (coincidenSlug.length) senales.push(`slug: ${coincidenSlug.join(', ')}`);
  return { puntuacion, senales };
}

// Desempate (mismo requiere/bloque): entre dos con la misma puntuación, el que comparte bloque o un
// prerrequisito con el mejor candidato queda antes — es el que más probablemente vive en el mismo tema.
function compartenBloqueORequiere(a, b) {
  return a.bloques.some(x => b.bloques.includes(x)) || a.requiere.some(x => b.requiere.includes(x)) || b.requiere.some(x => a.requiere.includes(x));
}

// Separa "<nombre> — <definición>". Sin el guion largo, todo el texto cuenta como nombre y como definición: se
// pierde el matiz, pero se sigue pudiendo buscar por palabras.
function partir(textoDado) {
  const m = /^(.+?)\s+[—–-]\s+(.+)$/.exec(String(textoDado || '').trim());
  return m ? { nombre: m[1].trim(), definicion: m[2].trim() } : { nombre: textoDado.trim(), definicion: textoDado.trim() };
}

function candidatos(raiz, textoDado, { top = 3 } = {}) {
  const { nombre, definicion } = partir(textoDado);
  const inputPalabras = palabras(`${nombre} ${definicion}`);
  const textoDadoNorm = normalizar(`${nombre} ${definicion}`);

  const puntuados = leerConceptos(raiz)
    .map(c => ({ ...c, ...puntuar(c, inputPalabras, nombre, textoDadoNorm) }))
    .filter(c => c.puntuacion > 0)
    .sort((a, b) => b.puntuacion - a.puntuacion);

  const mejor = puntuados[0];
  const ordenados = mejor
    ? [...puntuados].sort((a, b) => {
      if (b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
      return (compartenBloqueORequiere(b, mejor) ? 1 : 0) - (compartenBloqueORequiere(a, mejor) ? 1 : 0);
    })
    : puntuados;

  if (!ordenados.length || ordenados[0].puntuacion < UMBRAL) return { consulta: { nombre, definicion }, candidatos: [] };
  return {
    consulta: { nombre, definicion },
    candidatos: ordenados.slice(0, top).map(({ slug, definicion: def, puntuacion, senales }) => ({ slug, definicion: def, puntuacion, senales })),
  };
}

function imprimir(textoDado, resultado) {
  if (!resultado.candidatos.length) {
    console.log(`Ninguno parecido a "${textoDado}": probablemente es un concepto nuevo.`);
    return;
  }
  console.log(`${resultado.candidatos.length} candidato(s) para "${textoDado}":\n`);
  resultado.candidatos.forEach((c, i) => {
    console.log(`${i + 1}. ${c.slug} (puntuación ${c.puntuacion}) — ${c.definicion}`);
    console.log(`   Coincide en ${c.senales.join(' · ')}`);
  });
}

function cli(args, raizPorDefecto) {
  const i = args.indexOf('--raiz');
  const raiz = i >= 0 ? path.resolve(args[i + 1]) : raizPorDefecto;
  const textoDado = args.filter((a, k) => !a.startsWith('--') && args[k - 1] !== '--raiz')[0];
  if (!textoDado) {
    console.error('Uso: node .kit/herramientas/candidatos.js "<nombre> — <definición en una frase>"');
    return 2;
  }
  const resultado = candidatos(raiz, textoDado);
  if (args.includes('--json')) console.log(JSON.stringify(resultado));
  else imprimir(textoDado, resultado);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'candidatos.js');

module.exports = { candidatos, partir, palabras, cli };
