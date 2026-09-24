'use strict';
// Apunta una duda del alumno en "## Registro de dudas" de config/alumno.md: sube el contador del concepto (o añade su
// fila) y pone la fecha. Solo toca esa tabla. Hacerlo a mano acabó en la prueba real del 2026-09-24 con las filas del
// registro metidas bajo todas las tablas de tres columnas del fichero, y el registro vacío.
//
//   node .kit/herramientas/dudas.js <concepto> [--fecha AAAA-MM-DD] [--prueba "<de dónde sale>"]
const fs = require('node:fs');
const path = require('node:path');

const SECCION = '## Registro de dudas';
const CABECERA = ['| Concepto | Nº de dudas | Última |', '|---|---|---|'];

// El concepto de una celda, sin corchetes ni alias: "[[liquidez\|Liquidez]]" → "liquidez".
const conceptoDe = celda => celda.trim().replace(/^\[\[/, '').replace(/\]\]$/, '').split(/\\?\|/)[0].trim();

// Parte una fila respetando el | de un [[enlace|alias]], aunque no vaya escapado.
function celdas(linea) {
  const protegida = linea.replace(/\[\[[^\]]*\]\]/g, enlace => enlace.replace(/\|/g, '\u0000'));
  return protegida.split('|').map(c => c.replace(/\u0000/g, '|').trim());
}

function registrarDuda(raiz, { concepto, fecha = new Date().toISOString().slice(0, 10), prueba = '' }) {
  const nombre = String(concepto || '').trim();
  if (!nombre) throw new Error('Falta el concepto: node .kit/herramientas/dudas.js <concepto>');
  const fichero = path.join(raiz, 'config', 'alumno.md');
  const texto = fs.existsSync(fichero) ? fs.readFileSync(fichero, 'utf8') : '# El alumno\n';
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const lineas = texto.split(/\r?\n/);
  const ultima = `${fecha}${prueba ? ` · ${prueba}` : ''}`;

  let inicio = lineas.findIndex(l => l.trim() === SECCION);
  if (inicio < 0) {
    while (lineas.length && lineas[lineas.length - 1] === '') lineas.pop();
    lineas.push('', SECCION, '', ...CABECERA, '');
    inicio = lineas.length - 5;
  }
  let fin = lineas.findIndex((l, i) => i > inicio && /^## /.test(l));
  if (fin < 0) fin = lineas.length;

  const filasDeTabla = () => {
    const filas = [];
    for (let i = inicio + 1; i < fin; i++) if (/^\s*\|/.test(lineas[i])) filas.push(i);
    return filas;
  };
  let filas = filasDeTabla();
  // La sección existe pero sin tabla todavía: cabecera justo debajo del título.
  if (filas.length < 2) {
    lineas.splice(inicio + 1, 0, '', ...CABECERA);
    fin += 1 + CABECERA.length;
    filas = filasDeTabla();
  }
  const datos = filas.slice(2);
  const existente = datos.find(i => conceptoDe(celdas(lineas[i])[1] || '') === nombre);
  let veces = 1;
  if (existente !== undefined) {
    const c = celdas(lineas[existente]);
    veces = (Number((/^\d+/.exec(c[2] || '') || [])[0]) || 0) + 1;
    const celdaConcepto = c[1].replace(/\[\[([^\]|\\]+)(?<!\\)\|/, '[[$1\\|');
    lineas[existente] = `| ${celdaConcepto} | ${veces} | ${ultima} |`;
  } else {
    const despues = (datos.length ? datos[datos.length - 1] : filas[1]) + 1;
    lineas.splice(despues, 0, `| ${nombre} | 1 | ${ultima} |`);
  }
  escribir(fichero, lineas, eol);
  return { concepto: nombre, veces };
}

function escribir(fichero, lineas, eol) {
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  let texto = lineas.join(eol);
  if (!texto.endsWith(eol)) texto += eol;
  fs.writeFileSync(fichero, texto);
}

function cli(args, raiz) {
  const valor = marca => { const i = args.indexOf(marca); return i >= 0 ? args[i + 1] : undefined; };
  const sueltos = args.filter((a, i) => !a.startsWith('--') && !['--fecha', '--prueba'].includes(args[i - 1]));
  const r = registrarDuda(raiz, { concepto: sueltos[0], fecha: valor('--fecha'), prueba: valor('--prueba') });
  console.log(`Registro de dudas: ${r.concepto} → ${r.veces} ${r.veces === 1 ? 'duda' : 'dudas'}.`);
  if (r.veces >= 3) console.log('Es la tercera duda (o más) sobre este concepto: tercer tropiezo, reescribe la nota desde otro ángulo.');
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'dudas.js');

module.exports = { registrarDuda, cli };
