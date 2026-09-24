'use strict';
// leer.js: saca el texto de Word, PowerPoint y Excel sin dependencias (son un zip con XML), para que el profesor no
// improvise `python3` para leer el material (que pide permiso, y sin nadie delante se deniega).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { temporal } = require('./ayuda');
const { leerZip } = require('../lib/zip');
const { leer, cli } = require('../leer');

// Un zip mínimo de verdad (cabeceras locales + directorio central), guardado o comprimido con deflate.
function zipear(entradas, { comprimir = true } = {}) {
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;
  for (const [nombre, texto] of Object.entries(entradas)) {
    const datos = Buffer.from(texto, 'utf8');
    const guardado = comprimir ? zlib.deflateRawSync(datos) : datos;
    const n = Buffer.from(nombre, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(comprimir ? 8 : 0, 8);
    local.writeUInt32LE(guardado.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(comprimir ? 8 : 0, 10);
    central.writeUInt32LE(guardado.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(desplazamiento, 42);
    locales.push(local, n, guardado);
    centrales.push(central, n);
    desplazamiento += local.length + n.length + guardado.length;
  }
  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(Object.keys(entradas).length, 8);
  fin.writeUInt16LE(Object.keys(entradas).length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  return Buffer.concat([...locales, directorio, fin]);
}

function fichero(nombre, contenido) {
  const f = path.join(temporal('kit-leer-'), nombre);
  fs.writeFileSync(f, contenido);
  return f;
}

test('leerZip: lee entradas guardadas y comprimidas; un fichero que no es un zip, error claro', () => {
  for (const comprimir of [true, false]) {
    const zip = leerZip(zipear({ 'a.txt': 'hola', 'dir/b.xml': '<x>ñ</x>' }, { comprimir }));
    assert.equal(zip.get('a.txt').toString('utf8'), 'hola');
    assert.equal(zip.get('dir/b.xml').toString('utf8'), '<x>ñ</x>');
  }
  assert.throws(() => leerZip(Buffer.from('no soy un zip')), /no es un zip/);
});

test('Word: párrafos en orden, tablas con sus celdas, y los caracteres especiales bien', () => {
  const doc = `<w:document><w:body>
    <w:p><w:r><w:t>Presupuesto &amp; ahorro</w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve">La regla </w:t></w:r><w:r><w:t>50/30/20</w:t></w:r><w:r><w:tab/><w:t>&#8364;</w:t></w:r></w:p>
    <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Gasto</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Importe</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Alquiler</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>700</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
  </w:body></w:document>`;
  const texto = leer(fichero('apuntes.docx', zipear({ 'word/document.xml': doc })));
  assert.equal(texto, 'Presupuesto & ahorro\nLa regla 50/30/20\t€\n| Gasto | Importe |\n| Alquiler | 700 |');
});

test('PowerPoint: cada diapositiva en su orden numérico, con sus notas del orador', () => {
  const diapositiva = (...parrafos) => `<p:sld><p:cSld><p:spTree>${parrafos.map(t => `<a:p><a:r><a:t>${t}</a:t></a:r></a:p>`).join('')}</p:spTree></p:cSld></p:sld>`;
  const rels = n => `<Relationships><Relationship Id="rId2" Target="../notesSlides/notesSlide${n}.xml"/></Relationships>`;
  const texto = leer(fichero('clase.pptx', zipear({
    'ppt/slides/slide10.xml': diapositiva('Diez'),
    'ppt/slides/slide2.xml': diapositiva('Dos', 'segunda línea'),
    'ppt/slides/slide1.xml': diapositiva('Uno'),
    'ppt/slides/_rels/slide2.xml.rels': rels(7),
    'ppt/notesSlides/notesSlide7.xml': '<p:notes><a:p><a:r><a:t>Contar el ejemplo del café</a:t></a:r></a:p></p:notes>',
  })));
  assert.equal(texto, '## Diapositiva 1\n\nUno\n\n## Diapositiva 2\n\nDos\nsegunda línea\n\nNotas del orador:\nContar el ejemplo del café\n\n## Diapositiva 10\n\nDiez');
});

test('Excel: cada hoja con su nombre, celda a celda, con el valor y la fórmula que lo calcula', () => {
  const texto = leer(fichero('cuentas.xlsx', zipear({
    'xl/workbook.xml': '<workbook><sheets><sheet name="Gastos" sheetId="1" r:id="rId1"/><sheet name="Notas" sheetId="2" r:id="rId2"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
    'xl/sharedStrings.xml': '<sst><si><t>Alquiler</t></si><si><r><t>Tasa </t></r><r><t>de ahorro</t></r></si></sst>',
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData>
      <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>700</v></c><c r="C1"><v>2.75E-2</v></c></row>
      <row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><f>B1/2000</f><v>0.35</v></c><c r="C2"/></row>
    </sheetData></worksheet>`,
    'xl/worksheets/sheet2.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>ojo: 10 %</t></is></c><c r="B1" t="b"><v>1</v></c></row></sheetData></worksheet>',
  })));
  assert.match(texto, /^\(Los números van sin el formato del Excel/);
  assert.equal(texto.slice(texto.indexOf('## ')), '## Hoja: Gastos\n\nA1: Alquiler · B1: 700 · C1: 0.0275\nA2: Tasa de ahorro · B2: 0.35 (=B1/2000)\n\n## Hoja: Notas\n\nA1: ojo: 10 % · B1: VERDADERO');
});

test('lo que no es Word, PowerPoint ni Excel: dice qué hacer, sin inventar su contenido', () => {
  assert.match(leer(fichero('a.pdf', '%PDF')), /léelo tú directamente/);
  assert.match(leer(fichero('foto.jpg', 'x')), /léelo tú directamente/);
  assert.match(leer(fichero('viejo.doc', 'x')), /formato antiguo.*exporte/);
  assert.match(leer(fichero('clase.mp3', 'x')), /transcripción/);
  assert.match(leer(fichero('raro.xyz', 'x')), /no sé leer/);
  assert.throws(() => leer(fichero('roto.docx', 'no es un zip')), /no se ha podido leer.*otro formato/);
});

test('cli: imprime el texto; sin fichero o si no existe, lo dice y sale con 2', t => {
  const salida = [];
  t.mock.method(console, 'log', (...a) => salida.push(a.join(' ')));
  t.mock.method(console, 'error', (...a) => salida.push(a.join(' ')));
  const f = fichero('apuntes.docx', zipear({ 'word/document.xml': '<w:p><w:r><w:t>hola</w:t></w:r></w:p>' }));
  assert.equal(cli([f], path.dirname(f)), 0);
  assert.equal(salida.pop(), 'hola');
  assert.equal(cli([], '.'), 2);
  assert.equal(cli([path.join(path.dirname(f), 'no-existe.docx')], '.'), 2);
  assert.match(salida.join('\n'), /Uso:[\s\S]*No existe/);
});

test('cli: un texto largo sale por partes que caben en la salida, y cada una dice cuál sigue', t => {
  const salida = [];
  t.mock.method(console, 'log', (...a) => salida.push(a.join(' ')));
  const parrafos = Array.from({ length: 3000 }, (_, i) => `<w:p><w:r><w:t>Línea ${i + 1} del documento, con algo de texto para ocupar sitio.</w:t></w:r></w:p>`);
  const f = fichero('largo.docx', zipear({ 'word/document.xml': parrafos.join('') }));
  assert.equal(cli([f]), 0);
  const primera = salida.pop();
  assert.ok(primera.length < 25000, `${primera.length} caracteres`);
  assert.match(primera, /^Línea 1 del/);
  const total = Number(/parte 1 de (\d+)/.exec(primera)[1]);
  assert.ok(total >= 5);
  assert.match(primera, /sigue con: node \.kit\/herramientas\/leer\.js .*largo\.docx --parte 2/);
  assert.equal(cli([f, '--parte', String(total)]), 0);
  const ultima = salida.pop();
  assert.match(ultima, /Línea 3000 del documento/);
  assert.match(ultima, new RegExp(`parte ${total} de ${total}: es la última`));
  assert.equal(cli([f, '--parte', String(total + 1)]), 2);
});
