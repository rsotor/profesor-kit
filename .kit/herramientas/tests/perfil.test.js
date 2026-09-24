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

test('intentosDe: lee el histórico, con coma decimal y con "7/10"', () => {
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
    { intento: 3, fecha: '2026-10-12', nota: 7 },
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

const PROFESOR = '---\ntono: cercano\n---\n# El profesor\n\n## Tono\n\nDirecto y cálido.\n\n'
  + '## Qué le funciona a este alumno al explicar\n\n## Historial de cambios\n<!-- fecha · qué -->\n';

test('markdownPerfil: copia lo que hay, "Todavía nada" en lo vacío, y no enseña lo interno', () => {
  const raiz = cursoTemporal({
    'config/alumno.md': ALUMNO + '\n## Cómo escribe en sus notas\n\n| Propiedad | Escribió |\n|---|---|\n| estudiada | sí |\n'
      + '\n## Nivel de partida\n\n- Módulo 1: 1\n',
    'config/profesor.md': PROFESOR,
  });
  const md = perfil.markdownPerfil(raiz);
  assert.match(md, /^# Mi perfil/);
  assert.match(md, /díselo/i);
  assert.match(md, /## Cómo te explico y por qué[\s\S]*### Tono\n\nDirecto y cálido\.[\s\S]*### Cómo explicarte\n\n\| Funciona/);
  assert.doesNotMatch(md, /### Lo que te funciona/);                 // sección vacía en profesor.md: no sale
  assert.match(md, /## Lo que te entró a la primera\n\n\*Todavía nada/);
  assert.match(md, /## Cambios en cómo te explico\n\n\*Todavía nada/);
  assert.doesNotMatch(md, /Cómo escribe en sus notas|estudiada \| sí|Nivel de partida/);
  assert.match(md, /### Donde más dudas\n\n- alfa: 3 dudas/);
});

test('markdownPerfil: tabla de exámenes con cada intento y si aprueba', () => {
  const raiz = cursoTemporal({
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-09\nnota: 6,5', HIST([[1, '2026-10-01', '4'], [2, '2026-10-09', '6,5']])),
  });
  const md = perfil.markdownPerfil(raiz);
  assert.match(md, /\| \[\[examenes\/01-examen\\\|Examen 01\]\] \| 4,0 \(2026-10-01\) → 6,5 \(2026-10-09\) \| ✅ aprobado \|/);
});

test('markdownPerfil: curso recién instalado, sin alumno.md ni profesor.md ni exámenes', () => {
  const raiz = cursoTemporal();
  require('node:fs').rmSync(require('node:path').join(raiz, 'config', 'profesor.md'));
  const md = perfil.markdownPerfil(raiz);
  assert.equal((md.match(/Todavía nada/g) || []).length >= 4, true);
  assert.match(md, /### Conceptos, por bloque/);   // progreso.md de la base tiene [[alfa]] ⬜
});

// --- Revisión de la 0.23.0 ------------------------------------------------------------------------------

const exa = (fm, historico = '') => `---\ntipo: examen\n${fm}\n---\n# Examen\n${historico ? `\n## Histórico de intentos\n\n| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |\n|---|---|---|---|---|---|---|\n${historico}\n` : ''}`;

test('examen-suspenso: una versión nueva aprobada apaga el suspenso de la anterior', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen-2026-10-01.md': exa('unidad: 01\nfecha: 2026-10-01\nnota: 0,5'),
    'estudio/examenes/01-examen-2026-10-08.md': exa('unidad: 01\nfecha: 2026-10-08\nnota: 8\nversion: 2\nanterior: "[[examenes/01-examen-2026-10-01]]"'),
  });
  assert.deepEqual(perfil.senales(raiz).filter(s => s.tipo === 'examen-suspenso'), []);
  assert.match(perfil.markdownPerfil(raiz), /versión anterior/);
});

test('examen-suspenso: un examen posterior aprobado que cubre la unidad lo apaga; uno que no la cubre, no', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-02-examen-2026-10-01.md': exa('unidad: 01-02\nfecha: 2026-10-01\nnota: 3'),
    'estudio/examenes/01-examen-2026-10-09.md': exa('unidad: 01\nfecha: 2026-10-09\nnota: 7'),
    'estudio/examenes/02-examen-2026-10-10.md': exa('unidad: 02\nfecha: 2026-10-10\nnota: 2'),
  });
  assert.deepEqual(perfil.senales(raiz).filter(s => s.tipo === 'examen-suspenso').map(s => s.examen), ['examenes/02-examen-2026-10-10.md']);
});

test('examen-suspenso: un examen final solo lo sustituye otro de su mismo escalón, no uno de módulo ni de otro escalón', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/final-1.md': exa('unidad: 01\nfecha: 2026-10-01\nnota: 4\ntipo_examen: final\nescalon: 1\naprobado: 7'),
    'estudio/examenes/final-2.md': exa('unidad: 01\nfecha: 2026-10-05\nnota: 9\ntipo_examen: final\nescalon: 2\naprobado: 8'),
    'estudio/examenes/01-examen-modulo.md': exa('unidad: 01\nfecha: 2026-10-06\nnota: 8'),
  });
  const suspensos = perfil.senales(raiz).filter(s => s.tipo === 'examen-suspenso').map(s => s.examen);
  assert.deepEqual(suspensos, ['examenes/final-1.md'], 'ni el examen de módulo ni el escalón 2 apagan el escalón 1');
});

test('nombreExamen: el final se ve como tal en mi-perfil, no mezclado con los de módulo', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/final-1.md': exa('unidad: 01\nfecha: 2026-10-01\nnota: 8\ntipo_examen: final\nescalon: 1\naprobado: 7'),
  });
  assert.match(perfil.markdownPerfil(raiz), /Examen final \(escalón 1\)/);
});

test('intentos: "7/10" se lee; y el frontmatter manda sobre un último intento que no se entiende', () => {
  assert.deepEqual(perfil.intentosDe(exa('', '| 1 | 2026-10-01 | 4 | 1 | 1 | 1 | 0 |\n| 2 | 2026-10-05 | 7/10 | 1 | 1 | 1 | 0 |')).map(i => i.nota), [4, 7]);
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen-2026-10-01.md': exa('unidad: 01\nfecha: 2026-10-05\nnota: 7\nintentos: 2', '| 1 | 2026-10-01 | 4 | 1 | 1 | 1 | 0 |\n| 2 | 2026-10-05 | siete | 1 | 1 | 1 | 0 |'),
  });
  assert.deepEqual(perfil.examenesConIntentos(raiz)[0].intentos.map(i => i.nota), [4, 7]);
  assert.deepEqual(perfil.senales(raiz).filter(s => s.tipo === 'examen-suspenso'), []);
});

test('leerDudas: [[slug|alias]] sin escapar y el número con texto detrás no pierden la fila', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': '# A\n\n## Registro de dudas\n\n| Concepto | Nº de dudas | Última |\n|---|---|---|\n'
    + '| [[liquidez|Liquidez]] | 3 | 2026-10-01 |\n| inflacion | 3 (01-01, 01-02) | 2026-10-02 |\n' });
  assert.deepEqual(perfil.leerDudas(raiz).map(d => [d.concepto, d.veces]), [['inflacion', 3], ['liquidez', 3]]);
  assert.doesNotMatch(perfil.markdownPerfil(raiz).replace(/\\\|/g, ''), /\[\[[^\]]*\|/, 'en la hoja, el | del alias va escapado');
});

test('tercer-tropiezo: si la nota se reescribió después de la última duda, ya no salta', () => {
  const { iniciarGit, git } = require('./ayuda');
  const raiz = cursoTemporal({ 'config/alumno.md': '# A\n\n## Registro de dudas\n\n| Concepto | Nº de dudas | Última |\n|---|---|---|\n| alfa | 3 | 2000-01-01 |\n' });
  iniciarGit(raiz);
  assert.deepEqual(perfil.senales(raiz).filter(s => s.tipo === 'tercer-tropiezo'), [], 'la nota (guardada hoy) es posterior a la duda');
  require('node:fs').writeFileSync(require('node:path').join(raiz, 'config', 'alumno.md'),
    '# A\n\n## Registro de dudas\n\n| Concepto | Nº de dudas | Última |\n|---|---|---|\n| alfa | 3 | 2999-01-01 |\n');
  git(raiz, 'commit', '-qam', 'duda nueva');
  assert.equal(perfil.senales(raiz).filter(s => s.tipo === 'tercer-tropiezo').length, 1, 'duda posterior a la última reescritura');
});

test('conceptosPorBloque: un bloque con nombre sale tal cual, sin "Bloque" delante', () => {
  const raiz = cursoTemporal({ 'estudio/conceptos/uno.md': '---\ntipo: concepto\nalias: []\nbloques: [modulo-01]\n---\n# U\n\n## El ejemplo\n\nUno.\n',
    'estudio/progreso.md': '# P\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[uno]] | ⬜ | ⬜ |\n' });
  assert.deepEqual(perfil.conceptosPorBloque(raiz).map(([b]) => b), ['modulo-01']);
});

test('conceptosPorBloque: "Bloque 10" va después de "Bloque 2"', () => {
  const nota = b => `---\ntipo: concepto\nalias: []\nbloques: [${b}]\n---\n# X\n\n## El ejemplo\n\nUno.\n`;
  const raiz = cursoTemporal({ 'estudio/conceptos/diez.md': nota(10), 'estudio/conceptos/dos.md': nota(2),
    'estudio/progreso.md': '# P\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[diez]] | ⬜ | ⬜ |\n| [[dos]] | ⬜ | ⬜ |\n' });
  assert.deepEqual(perfil.conceptosPorBloque(raiz).map(([b]) => b), ['Bloque 2', 'Bloque 10']);
});
