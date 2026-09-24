'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ix = require('../lib/indice');
const { cursoTemporal } = require('./ayuda');

const sesion = ({ fm = '', h1 = 'Tema', conceptos = '' } = {}) =>
  `---\ntipo: sesion\n${fm}---\n# ${h1}\n\n## Conceptos\n\n${conceptos}\n\n## Lo que hay que llevarse\n\n1. x\n`;

test('leerSesiones: id, título sin prefijo, clases, casilla, conceptos nuevos y ampliados', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/m1/01-02-02-03-ratios.md': sesion({
      fm: 'clases: [1.2.2, 1.2.3]\nestudiada: false\ntrabajada: 2026-09-22\n',
      h1: '01-02-02-03 · Ratios de rentabilidad',
      conceptos: '- [[roi]] (**nuevo**)\n- Ampliados: [[volatilidad]], [[roe|el ROE]]',
    }),
  });
  const s = ix.leerSesiones(raiz).find(x => x.id === '01-02-02-03-ratios');
  assert.equal(s.rel, 'sesiones/m1/01-02-02-03-ratios.md');
  assert.equal(s.titulo, 'Ratios de rentabilidad');
  assert.deepEqual(s.clases, ['1.2.2', '1.2.3']);
  assert.deepEqual(s.numeros, [1, 2, 2, 3]);
  assert.equal(s.clave, '01-02-02-03');
  assert.equal(s.estudiada, false);
  assert.deepEqual(s.conceptos, ['roi', 'volatilidad', 'roe']);
});

test('orden del temario: por números, luego orden:, nunca por el alfabeto del slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
    'estudio/sesiones/01-02-04-van-y-tir.md': sesion(),
    'estudio/sesiones/01-10-01-extra.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).filter(s => s.numeros).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids, ['01-02-04-van-y-tir', '01-03-01-renta-variable', '01-03-01-estilos-y-ciclos', '01-10-01-extra']);
});

test('ids sin números van detrás, por fecha trabajada y luego por slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/semana-b.md': sesion({ fm: 'trabajada: 2026-01-02\n' }),
    'estudio/sesiones/semana-a.md': sesion({ fm: 'trabajada: 2026-01-03\n' }),
    'estudio/sesiones/01-01-uno.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids.filter(i => i !== 's01-intro'), ['01-01-uno', 'semana-b', 'semana-a']);
});

test('ordenAmbiguo: mismas cifras y sin orden: → aviso; con orden: en todas → nada', () => {
  const sin = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion(),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion(),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(sin)).map(s => s.id).sort(), ['01-03-01-estilos-y-ciclos', '01-03-01-renta-variable']);
  const con = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(con)), []);
});

test('leerProgreso lee teoría y aplicación de cada fila, aunque el estado lleve texto', () => {
  const raiz = cursoTemporal({
    'estudio/progreso.md': '# P\n\n| Concepto | Teoría | Aplicación | Última prueba |\n|---|---|---|---|\n' +
      '| [[roi]] | ✅ sólido | 🟡 flojo | examen |\n| [[roe\\|ROE]] | ✅ | ⬜ sin evaluar | — |\n',
  });
  const p = ix.leerProgreso(raiz);
  assert.deepEqual(p.get('roi'), { teoria: '✅', aplicacion: '🟡' });
  assert.deepEqual(p.get('roe'), { teoria: '✅', aplicacion: '⬜' });
});

test('estadoProfesor: repasar > superada > faltan N > vacío', () => {
  const p = new Map([
    ['a', { teoria: '✅', aplicacion: '⬜' }],
    ['b', { teoria: '✅', aplicacion: '✅' }],
    ['c', { teoria: '⬜', aplicacion: '⬜' }],
    ['d', { teoria: '✅', aplicacion: '🔴' }],
  ]);
  assert.deepEqual(ix.estadoProfesor(['a', 'd'], p), { marca: 'repasar' });
  assert.deepEqual(ix.estadoProfesor(['a', 'b'], p), { marca: 'superada' });
  assert.deepEqual(ix.estadoProfesor(['a', 'c', 'x'], p), { marca: 'faltan', faltan: 2 });
  assert.deepEqual(ix.estadoProfesor(['c'], p), { marca: 'vacio' });
  assert.deepEqual(ix.estadoProfesor([], p), { marca: 'vacio' });
});

const ESTRUCTURA = JSON.stringify({ unidades: [
  { prefijo: '01', carpeta: 'modulo-01', titulo: 'Módulo 1 · Conceptos' },
  { prefijo: '01-02', carpeta: 'modulo-01/1.2-medidores', titulo: '1.2 Medidores' },
  { prefijo: '02', carpeta: 'modulo-02-finanzas-personales' },
] });
const examen = (unidad, fecha, nota, extra = '') => `---\ntipo: examen\nunidad: ${unidad}\nfecha: ${fecha}\nnota: ${nota}\n${extra}---\n# Examen\n`;

function cursoConIndice(extra = {}) {
  return cursoTemporal({
    'config/ajustes.json': JSON.stringify({ nombre_curso: 'Inversión', version_datos: 3 }),
    'config/estructura.json': ESTRUCTURA,
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-01-interes.md': sesion({ fm: 'clases: [1.2.1]\nestudiada: true\n', h1: '01-02-01 · Interés', conceptos: '- [[a]]' }),
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-04-van.md': sesion({ fm: 'clases: [1.2.4]\nestudiada: false\n', h1: '01-02-04 · VAN y TIR', conceptos: '- [[b]]\n- [[c]]' }),
    'estudio/progreso.md': '| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n| [[b]] | ✅ | ⬜ |\n| [[c]] | ⬜ | ⬜ |\n',
    ...extra,
  });
}

test('notaDeUnidad: cuenta el último examen no parcial de exactamente esa unidad', () => {
  const raiz = cursoConIndice({
    'estudio/examenes/01-02-examen-2026-10-01.md': examen('01-02', '2026-10-01', '4'),
    'estudio/examenes/01-02-examen-2026-10-09.md': examen('01-02', '2026-10-09', '8,5'),
    'estudio/examenes/01-02-examen-2026-10-20.md': examen('01-02', '2026-10-20', '3', 'parcial: true\n'),
    'estudio/examenes/01-examen-varios.md': examen('[01-02, 01-03]', '2026-10-05', '6'),
  });
  const ex = ix.leerExamenes(raiz);
  assert.equal(ix.notaDeUnidad('01-02', ex).nota, 8.5);
  assert.equal(ix.notaDeUnidad('01-03', ex).nota, 6);
  assert.equal(ix.notaDeUnidad('01', ex), null);   // un examen de 1.2+1.3 no es examen de módulo
});

test('leerAprobado: 5 por defecto, o el aprobado: de config/curso.md', () => {
  assert.equal(ix.leerAprobado(cursoTemporal()), 5);
  assert.equal(ix.leerAprobado(cursoTemporal({ 'config/curso.md': '---\nestado: configurado\naprobado: 6\n---\n# C\n' })), 6);
});

test('inicio: sigue por aquí, contadores, temario entero y tabla con alias escapado', () => {
  const md = ix.markdownInicio(cursoConIndice(), { pendientes: 3 });
  assert.match(md, /^# Inversión\n/);
  assert.match(md, /👉 Sigue por aquí: \[\[01-02-04-van\|1\.2\.4 VAN y TIR\]\]/);
  assert.match(md, /Estudiadas 1 de 3 · Pendientes abiertos: 3 → \[\[pendientes\]\]/);   // 3 = 2 + s01-intro de la base
  assert.match(md, /^## Módulo 1 · Conceptos · 1\/2 estudiadas · 2\/3 conceptos dominados · sin examen de módulo$/m);
  assert.match(md, /^### 1\.2 Medidores · 1\/2 estudiadas$/m);
  assert.match(md, /^\| \[\[01-02-01-interes\\\|1\.2\.1 Interés\]\] \| ✅ \| ✅ superada \|$/m);
  assert.match(md, /^\| \[\[01-02-04-van\\\|1\.2\.4 VAN y TIR\]\] \| ⬜ \| 📝 faltan 1 \|$/m);
  assert.match(md, /^## modulo 02 finanzas personales · aún sin sesiones$/m);   // sin titulo: la carpeta
  assert.match(md, /^## Sin unidad/m);   // s01-intro de la base no casa con ningún prefijo
});

test('inicio: 🔁 para repasar como lista, una sesión por línea, y nota suspensa', () => {
  const raiz = cursoConIndice({
    'estudio/progreso.md': '| C | T | A |\n|---|---|---|\n| [[a]] | 🟡 | ⬜ |\n| [[b]] | ✅ | 🔴 |\n| [[c]] | ⬜ | ⬜ |\n',
    'estudio/examenes/01-02-examen.md': examen('01-02', '2026-10-02', '4'),
  });
  const md = ix.markdownInicio(raiz);
  assert.match(md, /🔁 Para repasar:\n- \[\[01-02-01-interes\|1\.2\.1 Interés\]\]\n- \[\[01-02-04-van\|1\.2\.4 VAN y TIR\]\]\n/);
  assert.match(md, /^### 1\.2 Medidores · 1\/2 estudiadas · 📝 4,0 suspenso \(2026-10-02\)$/m);
});

test('inicio: módulo entero estudiado y sin examen → lo propone; con examen de módulo → su nota', () => {
  const todo = { 'estudio/sesiones/modulo-01/1.2-medidores/01-02-04-van.md': sesion({ fm: 'clases: [1.2.4]\nestudiada: true\n', h1: 'VAN', conceptos: '- [[b]]' }) };
  assert.match(ix.markdownInicio(cursoConIndice(todo)), /^## Módulo 1 · Conceptos · 2\/2 estudiadas · 2\/2 conceptos dominados · listo para el examen del módulo: pídeselo a tu profesor$/m);
  const conExamen = cursoConIndice({ ...todo, 'estudio/examenes/01-examen.md': examen('01', '2026-11-21', '7,5') });
  assert.match(ix.markdownInicio(conExamen), /^## Módulo 1 · Conceptos · 2\/2 estudiadas · 2\/2 conceptos dominados · 📝 7,5 \(2026-11-21\)$/m);
});

test('inicio sin estructura: una sola tabla con todas las sesiones', () => {
  const md = ix.markdownInicio(cursoTemporal());
  assert.match(md, /^## Sesiones$/m);
  assert.match(md, /\[\[s01-intro\\\|Intro\]\]/);
});

test('inicio solo enlaza las hojas que existen', () => {
  const md = ix.markdownInicio(cursoTemporal());
  assert.match(md, /\[\[mapa-del-curso\]\]/);
  assert.doesNotMatch(md, /como-usar-tu-profesor/);
  assert.doesNotMatch(md, /test-inicial/);
  assert.match(ix.markdownInicio(cursoTemporal({ 'estudio/test-inicial.md': '# Test inicial\n' })), /\[\[test-inicial\]\]/);
});

test('pieDeSesion: anterior · inicio · siguiente, con línea en blanco antes de la raya', () => {
  const a = { id: 'a', clases: ['1.1'], titulo: 'Uno' };
  const b = { id: 'b', clases: [], titulo: 'Dos' };
  assert.equal(ix.pieDeSesion(a, b), `${ix.MARCA_INICIO}\n\n---\n← [[a|1.1 Uno]] · [[inicio|🏠 Inicio]] · [[b|Dos]] →\n${ix.MARCA_FIN}`);
  assert.match(ix.pieDeSesion(null, b), /\n\[\[inicio\|🏠 Inicio\]\] · \[\[b\|Dos\]\] →\n/);
  assert.match(ix.pieDeSesion(a, null), /\n← \[\[a\|1\.1 Uno\]\] · \[\[inicio\|🏠 Inicio\]\]\n/);
});

test('ponerPie: lo añade al final, lo reescribe entre marcadores y no toca el resto', () => {
  const pie1 = ix.pieDeSesion(null, { id: 'b', clases: [], titulo: 'Dos' });
  const pie2 = ix.pieDeSesion(null, { id: 'c', clases: [], titulo: 'Tres' });
  const con1 = ix.ponerPie('# X\n\nCuerpo.\n\n\n', pie1);
  assert.equal(con1, `# X\n\nCuerpo.\n\n${pie1}\n`);
  assert.equal(ix.ponerPie(con1, pie1), con1);                 // idempotente
  assert.equal(ix.ponerPie(con1, pie2), `# X\n\nCuerpo.\n\n${pie2}\n`);
});

test('ponerPie conserva CRLF y no toca una nota con los marcadores rotos', () => {
  const pie = ix.pieDeSesion(null, null);
  const crlf = ix.ponerPie('# X\r\n\r\nCuerpo.\r\n', pie);
  assert.ok(!/[^\r]\n/.test(crlf), 'todas las líneas en CRLF');
  const roto = `# X\n\n${ix.MARCA_INICIO}\nsin cierre\n`;
  assert.equal(ix.ponerPie(roto, pie), roto);
  assert.equal(ix.marcadoresRotos(roto), true);
  assert.equal(ix.marcadoresRotos(crlf), false);
});

test('marcadoresRotos: un pie duplicado (dos MARCA_INICIO o dos MARCA_FIN) también es navegación rota', () => {
  const duplicado = `# X\n\n${ix.MARCA_INICIO}\n\n---\nuno\n${ix.MARCA_FIN}\n\n${ix.MARCA_INICIO}\n\n---\ndos\n${ix.MARCA_FIN}\n`;
  assert.equal(ix.marcadoresRotos(duplicado), true);
});

test('sinPie: el pie de navegación no cuenta como conceptos aunque ## Conceptos sea la última sección', () => {
  const pie = ix.pieDeSesion({ id: 'antes', clases: [], titulo: 'Antes' }, { id: 'despues', clases: [], titulo: 'Después' });
  const raiz = cursoTemporal({ 'estudio/sesiones/01-01-x.md': `---\ntipo: sesion\n---\n# X\n\n## Conceptos\n\n- [[alfa]]\n\n${pie}\n` });
  assert.deepEqual(ix.leerSesiones(raiz).find(s => s.id === '01-01-x').conceptos, ['alfa']);
});

test('piesDeSesion: cada sesión enlaza a la anterior y a la siguiente del temario', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-01-uno.md': sesion({ h1: 'Uno' }),
    'estudio/sesiones/01-02-dos.md': sesion({ h1: 'Dos' }),
  });
  const pies = ix.piesDeSesion(raiz);
  assert.match(pies.get('sesiones/01-01-uno.md'), /\[\[inicio\|🏠 Inicio\]\] · \[\[01-02-dos\|Dos\]\] →/);
  assert.match(pies.get('sesiones/01-02-dos.md'), /← \[\[01-01-uno\|Uno\]\] · \[\[inicio\|🏠 Inicio\]\] · \[\[s01-intro\|Intro\]\] →/);
});

test('inicio: módulo sin sesiones en su árbol ocupa una línea, sin subunidades', () => {
  const estructura = JSON.stringify({ unidades: [
    { prefijo: '01', carpeta: 'modulo-01', titulo: 'Módulo 1 · Conceptos' },
    { prefijo: '01-02', carpeta: 'modulo-01/1.2-medidores', titulo: '1.2 Medidores' },
    { prefijo: '02', carpeta: 'modulo-02-finanzas-personales', titulo: 'Módulo 2 · Finanzas' },
    { prefijo: '02-01', carpeta: 'modulo-02-finanzas-personales/2.1-gestion', titulo: '2.1 Gestión' },
  ] });
  const raiz = cursoTemporal({
    'config/ajustes.json': JSON.stringify({ nombre_curso: 'Inversión', version_datos: 3 }),
    'config/estructura.json': estructura,
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-01-interes.md': sesion({ fm: 'clases: [1.2.1]\nestudiada: true\n', h1: '01-02-01 · Interés', conceptos: '- [[a]]' }),
    'estudio/progreso.md': '| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n',
  });
  const md = ix.markdownInicio(raiz);

  // Módulo 1 con sesiones: debe mostrar su cabecera y la de su hijo
  assert.match(md, /^## Módulo 1 · Conceptos · 1\/1 estudiadas · 1\/1 conceptos dominados · listo para el examen del módulo/m);
  assert.match(md, /^### 1\.2 Medidores · 1\/1 estudiadas$/m);

  // Módulo 2 sin sesiones: debe mostrar solo su cabecera (una línea con "aún sin sesiones"), NO la de su hijo
  assert.match(md, /^## Módulo 2 · Finanzas · aún sin sesiones$/m);
  assert.doesNotMatch(md, /^### 2\.1 Gestión/m, 'El hijo vacío de módulo vacío no debe aparecer');
});

// E3 · Progreso visible (0.25.0): lo que se ve es lo que entiende (conceptos dominados, módulos superados), no
// cuánto ha hecho. Sin rachas ni insignias.
test('inicio: conceptos dominados por módulo, contados una vez aunque salgan en dos sesiones', () => {
  const raiz = cursoConIndice({
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-05-mas.md': sesion({ fm: 'clases: [1.2.5]\n', h1: 'Más', conceptos: '- [[a]]\n- [[d]]' }),
    'estudio/progreso.md': '| C | T | A |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n| [[b]] | ✅ | 🟡 |\n| [[c]] | ⬜ | ⬜ |\n| [[d]] | ✅ | ✅ |\n',
  });
  // a y d dominados; b tiene la aplicación floja (no dominado); c sin evaluar → 2 de 4
  assert.match(ix.markdownInicio(raiz), /^## Módulo 1 · Conceptos · 1\/3 estudiadas · 2\/4 conceptos dominados · sin examen de módulo$/m);
});

test('inicio: módulo aprobado → línea de módulo superado arriba; suspenso → nada', () => {
  const aprobado = cursoConIndice({ 'estudio/examenes/01-examen.md': examen('01', '2026-10-02', '7,5') });
  assert.match(ix.markdownInicio(aprobado), /^🏁 Módulo 1 · Conceptos superado el 2026-10-02 con un 7,5$/m);
  const suspenso = cursoConIndice({ 'estudio/examenes/01-examen.md': examen('01', '2026-10-02', '4') });
  assert.doesNotMatch(ix.markdownInicio(suspenso), /🏁/);
  const subunidad = cursoConIndice({ 'estudio/examenes/01-02-examen.md': examen('01-02', '2026-10-02', '9') });
  assert.doesNotMatch(ix.markdownInicio(subunidad), /🏁/);   // solo los módulos, no cada subunidad
});

test('inicio: progreso_en_inicio: no en config/profesor.md lo quita', () => {
  const raiz = cursoConIndice({
    'config/profesor.md': '---\nprogreso_en_inicio: no\n---\n# El profesor\n',
    'estudio/examenes/01-examen.md': examen('01', '2026-10-02', '7,5'),
  });
  const md = ix.markdownInicio(raiz);
  assert.doesNotMatch(md, /conceptos dominados|🏁/);
  assert.match(md, /^## Módulo 1 · Conceptos · 1\/2 estudiadas · 📝 7,5 \(2026-10-02\)$/m);
});

test('enlace: si la etiqueta de la clase ya lleva el título, no lo repite', () => {
  const s = { id: '01-01-01-dinero', clases: ['Clase 1.1 · El dinero y sus funciones'], titulo: 'El dinero y sus funciones' };
  assert.equal(ix.enlace(s), '[[01-01-01-dinero|Clase 1.1 · El dinero y sus funciones]]');
  assert.equal(ix.enlace({ ...s, clases: ['1.1'] }), '[[01-01-01-dinero|1.1 El dinero y sus funciones]]');
});

// E1 · Repaso espaciado: en inicio, lo que toca en dos tramos de fechas (inicio solo cambia al guardar).
test('inicio: flashcards para repasar por tramos, con enlace al fichero y el nombre de su sesión', () => {
  const raiz = cursoConIndice({ 'config/repaso.json': JSON.stringify({ version: 1, tarjetas: {
    a: { caja: 1, proxima: '2026-09-24', fichero: 'flashcards/modulo-01/01-02-01-interes.md' },
    b: { caja: 1, proxima: '2026-09-25', fichero: 'flashcards/modulo-01/01-02-01-interes.md' },
    c: { caja: 2, proxima: '2026-09-30', fichero: 'flashcards/modulo-01/01-02-04-van.md' },
  } }) });
  const md = ix.markdownInicio(raiz, { hoy: '2026-09-24' });
  assert.match(md, /👉 Sigue por aquí[^\n]*\n\n🗂️ Flashcards para repasar:\n- Hasta el 26\/9 · 2 tarjetas: \[\[flashcards\/modulo-01\/01-02-01-interes\|1\.2\.1 Interés\]\] \(2\)\n- Del 27\/9 al 3\/10 · 1 tarjeta: \[\[flashcards\/modulo-01\/01-02-04-van\|1\.2\.4 VAN y TIR\]\] \(1\)\n/);
  assert.doesNotMatch(ix.markdownInicio(cursoConIndice(), { hoy: '2026-09-24' }), /Flashcards para repasar/);
});
