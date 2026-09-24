'use strict';
// dudas.js: sube el contador de un concepto en "## Registro de dudas" de config/alumno.md, y solo ahí. La prueba real
// del 2026-09-24 metió las filas del registro bajo todas las tablas de tres columnas del fichero (un reemplazo a mano
// en todo el fichero) y dejó vacío el registro: mi-perfil.md lo habría enseñado así al alumno.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { registrarDuda } = require('../dudas');
const { cursoTemporal } = require('./ayuda');

const ALUMNO = [
  '# El alumno', '',
  '## Cómo explicarle', '', '| Funciona | No funciona | Prueba |', '|---|---|---|', '| Ejemplo | Definición | sesión 0 |', '',
  '## Cómo escribe en sus notas', '', '| Propiedad | Escribió | Quería decir | Veces | Última |', '|---|---|---|---|---|', '',
  '## Registro de dudas', '', '| Concepto | Nº de dudas | Última |', '|---|---|---|', '',
].join('\n');
const leer = raiz => fs.readFileSync(path.join(raiz, 'config', 'alumno.md'), 'utf8');

test('registrarDuda: la primera duda de un concepto añade su fila solo en el registro', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': ALUMNO });
  assert.deepEqual(registrarDuda(raiz, { concepto: 'colchon-financiero', fecha: '2026-09-24', prueba: 'conceptos/colchon-financiero.md' }), { concepto: 'colchon-financiero', veces: 1 });
  const texto = leer(raiz);
  assert.equal((texto.match(/^\| colchon-financiero /gm) || []).length, 1, 'una sola fila en todo el fichero');
  assert.match(texto, /## Registro de dudas\n\n\| Concepto \| Nº de dudas \| Última \|\n\|---\|---\|---\|\n\| colchon-financiero \| 1 \| 2026-09-24 · conceptos\/colchon-financiero\.md \|/);
  assert.equal(texto.replace(/\| colchon-financiero .*\n/, ''), ALUMNO, 'el resto del fichero, intacto');
});

test('registrarDuda: una duda más sube el contador y la fecha; reconoce [[slug|alias]] y el número con texto', () => {
  const registro = '| Concepto | Nº de dudas | Última |\n|---|---|---|\n';
  const con = ALUMNO.replace(registro, `${registro}| [[liquidez|Liquidez]] | 2 (01-01) | 2026-09-01 |\n| otra | 1 | 2026-09-02 |\n`);
  const raiz = cursoTemporal({ 'config/alumno.md': con });
  assert.deepEqual(registrarDuda(raiz, { concepto: 'liquidez', fecha: '2026-09-24' }), { concepto: 'liquidez', veces: 3 });
  assert.match(leer(raiz), /\| \[\[liquidez\\\|Liquidez\]\] \| 3 \| 2026-09-24 \|\n\| otra \| 1 \| 2026-09-02 \|/);
});

test('registrarDuda: sin la sección, la crea al final; respeta los finales de línea de Windows', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': '# El alumno\r\n\r\n## Quién es\r\n\r\nAna.\r\n' });
  registrarDuda(raiz, { concepto: 'inflacion', fecha: '2026-09-24' });
  const texto = leer(raiz);
  assert.match(texto, /## Registro de dudas\r\n\r\n\| Concepto \| Nº de dudas \| Última \|\r\n\|---\|---\|---\|\r\n\| inflacion \| 1 \| 2026-09-24 \|\r\n$/);
  assert.doesNotMatch(texto, /[^\r]\n/);
});

test('registrarDuda: sin concepto, error claro', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': ALUMNO });
  assert.throws(() => registrarDuda(raiz, { concepto: '  ' }), /concepto/);
});
