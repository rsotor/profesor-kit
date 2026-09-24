'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const perfil = require('../lib/perfil');
const { cursoTemporal } = require('./ayuda');

const ALUMNO = [
  '# El alumno', '',
  '## Cómo explicarle', '',
  '| Funciona | No funciona | Prueba |', '|---|---|---|',
  '| Ejemplo con cifras | Definición primero | sesión 0 |', '',
  '## Qué funcionó', '<!-- analogías -->', '',
  '## Conceptos que entraron a la primera', '',
  '## Registro de dudas', '',
  '| Concepto | Nº de dudas | Última |', '|---|---|---|',
  '| alfa | 3 | 2026-10-01 · conceptos/alfa.md |',
  '| [[beta\\|Beta]] | 1 | 2026-10-02 |',
  '| sesión 01-01-01 (relación con el módulo) | 2 | 2026-10-03 |', '',
].join('\n');

test('seccion: cuerpo hasta el siguiente ##, sin comentarios; vacío si no existe', () => {
  assert.match(perfil.seccion(ALUMNO, 'Cómo explicarle'), /Ejemplo con cifras/);
  assert.equal(perfil.seccion(ALUMNO, 'Qué funcionó'), '');
  assert.equal(perfil.seccion(ALUMNO, 'No existe'), '');
});

test('seccion: lee igual un fichero con finales de línea de Windows', () => {
  const crlf = ALUMNO.replace(/\n/g, '\r\n');
  assert.match(perfil.seccion(crlf.replace(/\r\n/g, '\n'), 'Cómo explicarle'), /Ejemplo con cifras/);
  const raiz = cursoTemporal({ 'config/alumno.md': crlf });
  assert.match(perfil.seccion(perfil.leerConfig(raiz, 'alumno.md'), 'Cómo explicarle'), /Ejemplo con cifras/);
});

test('tieneContenido: una tabla con solo cabecera está vacía; con una fila, no', () => {
  assert.equal(perfil.tieneContenido(''), false);
  assert.equal(perfil.tieneContenido('| A | B |\n|---|---|'), false);
  assert.equal(perfil.tieneContenido('| A | B |\n|---|---|\n| 1 | 2 |'), true);
  assert.equal(perfil.tieneContenido('- una línea'), true);
});

test('intentosDe: lee el histórico, acepta coma decimal e ignora notas que no son número', () => {
  const texto = [
    '# Examen', '', '## Histórico de intentos', '',
    '| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |', '|---|---|---|---|---|---|---|',
    '| 2 | 2026-10-09 | 6,5 | 5 | 1 | 1 | 0 |',
    '| 1 | 2026-10-01 | 4 | 3 | 1 | 2 | 1 |',
    '| 3 | 2026-10-12 | 7/10 | 6 | 0 | 1 | 0 |', '',
    '> [!example]- Intento 1 · 2026-10-01',
  ].join('\n');
  assert.deepEqual(perfil.intentosDe(texto), [
    { intento: 1, fecha: '2026-10-01', nota: 4 },
    { intento: 2, fecha: '2026-10-09', nota: 6.5 },
  ]);
});

test('examenesConIntentos: sin histórico usa el frontmatter; los parciales no cuentan', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen-2026-10-01.md': '---\ntipo: examen\nunidad: 01\nfecha: 2026-10-01\nnota: 5,5\n---\n# Examen\n',
    'estudio/examenes/01-02-examen-2026-10-02.md': '---\ntipo: examen\nunidad: 01-02\nfecha: 2026-10-02\nnota: 2\nparcial: true\n---\n# Parcial\n',
  });
  const lista = perfil.examenesConIntentos(raiz);
  assert.equal(lista.length, 1);
  assert.deepEqual(lista[0].intentos, [{ intento: 1, fecha: '2026-10-01', nota: 5.5 }]);
});

test('leerDudas: filas de concepto y de otra cosa, alias limpio, de más a menos', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': ALUMNO });
  assert.deepEqual(perfil.leerDudas(raiz).map(d => [d.concepto, d.veces]), [
    ['alfa', 3], ['sesión 01-01-01 (relación con el módulo)', 2], ['beta', 1],
  ]);
});

test('conceptosPorBloque: cuenta estados por eje y bloque; sin bloques: va a "Sin bloque"', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nbloques: [2]\n---\n# Beta\n\n## El ejemplo\n\nDos.\n',
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n'
      + '| [[alfa]] | ✅ sólido | 🔴 falló dos veces |\n| [[beta]] | 🟡 flojo | ⬜ sin evaluar |\n',
  });
  const bloques = new Map(perfil.conceptosPorBloque(raiz));
  assert.deepEqual(bloques.get('Bloque 2').teoria, { '✅': 0, '🟡': 1, '🔴': 0, '⬜': 0 });
  assert.deepEqual(bloques.get('Sin bloque').aplicacion, { '✅': 0, '🟡': 0, '🔴': 1, '⬜': 0 });
});

const examen = (nombre, fm, historico = '') => ({
  [`estudio/examenes/${nombre}.md`]: `---\ntipo: examen\n${fm}\n---\n# Examen\n${historico}`,
});
const HIST = filas => '\n## Histórico de intentos\n\n| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |\n'
  + `|---|---|---|---|---|---|---|\n${filas.map(([i, f, n]) => `| ${i} | ${f} | ${n} | 0 | 0 | 0 | 0 |`).join('\n')}\n`;

test('senales: las cuatro, en orden de prioridad', () => {
  const raiz = cursoTemporal({
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-09\nnota: 4', HIST([[1, '2026-10-01', '6'], [2, '2026-10-09', '4']])),
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 falló dos veces | ⬜ |\n',
    'config/alumno.md': ALUMNO,
  });
  assert.deepEqual(perfil.senales(raiz).map(s => s.tipo), ['examen-suspenso', 'nota-baja', 'concepto-rojo', 'tercer-tropiezo']);
  const [suspenso, baja] = perfil.senales(raiz);
  assert.match(suspenso.detalle, /4,0/);
  assert.match(baja.detalle, /de 6,0 a 4,0/);
});

test('senales: aprobado de config/curso.md; un parcial suspendido no da señal', () => {
  const raiz = cursoTemporal({
    'config/curso.md': '---\naprobado: 6\n---\n# Curso\n',
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-01\nnota: 5,5'),
    ...examen('01-02-parcial', 'unidad: 01-02\nfecha: 2026-10-02\nnota: 1\nparcial: true'),
  });
  assert.deepEqual(perfil.senales(raiz).map(s => [s.tipo, s.examen]), [['examen-suspenso', 'examenes/01-examen.md']]);
});

test('senales: curso sin datos, lista vacía', () => {
  assert.deepEqual(perfil.senales(cursoTemporal()), []);
});
