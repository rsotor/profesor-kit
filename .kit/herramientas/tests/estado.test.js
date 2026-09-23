'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { calcularEstado, materialNuevo, pidVivo, leerPreparaciones, cli } = require('../estado');
const { cursoTemporal, escribir } = require('./ayuda');

// s01-intro (de la base de cursoTemporal) no tiene `estudiada:`, así que siempre cuenta como sin estudiar
// salvo que el test la sobrescriba. Se marca estudiada aquí para dejar los cursos de prueba "al día".
function raizAlDia(extra = {}) {
  return cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nestudiada: true\nfuente: inbox/clase1.pdf\n---\n# Intro\n\n'
      + '## Conceptos\n\n- [[alfa]] — nuevo\n\n'
      + '## Cobertura del material\n\nToda la diapositiva quedó en [[alfa]].\n\n'
      + '## Auditoría del material\n\nSin discrepancias.\n\n'
      + '## Para pensarlo despacio\n\n¿Por qué alfa es la primera letra?\n',
    ...extra,
  });
}

test('caso 1: sin material nuevo en inbox', () => {
  const raiz = raizAlDia();
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.materialNuevo, []);
  assert.equal(estado.caso, 1);
});

test('caso 2: material nuevo y todo lo preparado ya estudiado (al día)', () => {
  const raiz = raizAlDia({ 'estudio/inbox/clase2.pdf': 'x' });
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.materialNuevo, ['inbox/clase2.pdf']);
  assert.equal(estado.caso, 2);
});

test('caso 3: material nuevo y sesiones preparadas sin estudiar (atrasado)', () => {
  const raiz = cursoTemporal({ 'estudio/inbox/clase2.pdf': 'x' });   // s01-intro sin `estudiada:` = sin estudiar
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.preparadasSinEstudiar, ['s01-intro']);
  assert.equal(estado.caso, 3);
});

test('caso 3: material nuevo y algo en 🔁 (atrasado), aunque todo esté estudiado', () => {
  const raiz = raizAlDia({
    'estudio/inbox/clase2.pdf': 'x',
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 | ⬜ |\n',
  });
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.enRepaso, ['s01-intro']);
  assert.equal(estado.caso, 3);
});

test('material nuevo: se compara por nombre de fichero, tolera `fuente:` en lista', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nestudiada: true\nfuente: [inbox/clase1.pdf, inbox/clase1b.pdf]\n---\n# Intro\n\n'
      + '## Cobertura del material\n\nx\n\n## Auditoría del material\n\nx\n\n## Para pensarlo despacio\n\nx\n',
    'estudio/inbox/clase1.pdf': 'x', 'estudio/inbox/clase1b.pdf': 'x', 'estudio/inbox/clase2.pdf': 'x', 'estudio/inbox/.gitkeep': '',
  });
  assert.deepEqual(materialNuevo(raiz), ['inbox/clase2.pdf']);
});

test('siguiente sesión sin estudiar y preparadas sin estudiar, en orden del temario', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nestudiada: true\n---\n# Intro\n\n## Cobertura del material\n\nx\n\n## Auditoría del material\n\nx\n\n## Para pensarlo despacio\n\nx\n',
    'estudio/sesiones/s02-dos.md': '---\ntipo: sesion\nestudiada: false\n---\n# Dos\n\n## Cobertura del material\n\nx\n\n## Auditoría del material\n\nx\n\n## Para pensarlo despacio\n\nx\n',
  });
  const estado = calcularEstado(raiz);
  assert.equal(estado.siguienteSesion, 's02-dos');
  assert.deepEqual(estado.preparadasSinEstudiar, ['s02-dos']);
});

test('pidVivo: un proceso ya terminado no está vivo', () => {
  const r = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
  assert.equal(pidVivo(r.pid), false);
});

test('pidVivo: el propio proceso de test está vivo', () => {
  assert.equal(pidVivo(process.pid), true);
});

test('leerPreparaciones: en-curso con pid vivo, terminada, fallida, e interrumpida cuando el pid ya no existe', () => {
  const raiz = raizAlDia();
  const muerto = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' }).pid;
  const ahora = new Date().toISOString();
  escribir(raiz, {
    '.preparacion/01-02/estado.json': JSON.stringify({
      id: '01-02', ficheros: ['inbox/clase2.pdf'], pid: process.pid, inicio: ahora, fin: null, resultado: 'en-curso', rama: 'preparacion/01-02',
    }),
    '.preparacion/01-03/estado.json': JSON.stringify({
      id: '01-03', ficheros: ['inbox/clase3.pdf'], pid: muerto, inicio: ahora, fin: null, resultado: 'en-curso', rama: 'preparacion/01-03',
    }),
    '.preparacion/01-04/estado.json': JSON.stringify({
      id: '01-04', ficheros: ['inbox/clase4.pdf'], pid: muerto, inicio: ahora, fin: ahora, resultado: 'terminada', rama: 'preparacion/01-04',
    }),
    '.preparacion/01-05/estado.json': JSON.stringify({
      id: '01-05', ficheros: ['inbox/clase5.pdf'], pid: muerto, inicio: ahora, fin: ahora, resultado: 'fallida', rama: 'preparacion/01-05',
    }),
  });
  const preparaciones = leerPreparaciones(raiz);
  const porId = Object.fromEntries(preparaciones.map(p => [p.id, p.resultado]));
  assert.deepEqual(porId, { '01-02': 'en-curso', '01-03': 'interrumpida', '01-04': 'terminada', '01-05': 'fallida' });
});

test('leerPreparaciones: sin carpeta .preparacion, lista vacía', () => {
  assert.deepEqual(leerPreparaciones(raizAlDia()), []);
});

test('cli: en llano saca el caso sugerido; con --json, el objeto completo', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = raizAlDia({ 'estudio/inbox/clase2.pdf': 'x' });
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /Caso sugerido: 2/);
  lineas.length = 0;
  assert.equal(cli(['--json'], raiz), 0);
  const estado = JSON.parse(lineas.join('\n'));
  assert.equal(estado.caso, 2);
});

test('cli: en llano, lista también las preparaciones si las hay', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = raizAlDia();
  escribir(raiz, {
    '.preparacion/01-02/estado.json': JSON.stringify({
      id: '01-02', ficheros: ['inbox/clase2.pdf'], pid: process.pid, inicio: new Date().toISOString(), fin: null, resultado: 'en-curso', rama: 'preparacion/01-02',
    }),
  });
  assert.equal(cli([], raiz), 0);
  assert.match(lineas.join('\n'), /Preparación 01-02: en curso \(\d+ min\) \(inbox\/clase2\.pdf\)/);
});

test('cli: acepta --raiz', t => {
  const lineas = [];
  t.mock.method(console, 'log', (...a) => lineas.push(a.join(' ')));
  const raiz = raizAlDia();
  assert.equal(cli(['--json', '--raiz', raiz], '/no/existe'), 0);
  assert.equal(JSON.parse(lineas.join('\n')).caso, 1);
});

// Visto en la prueba real de la 0.22: la clase que ya se estaba preparando en segundo plano contaba como
// "material nuevo", y el profesor, en vez de hacer el examen que le pedían, ofrecía prepararla otra vez.
test('lo que ya se está preparando (o está preparado sin juntar) no es material nuevo; lo interrumpido sí', () => {
  const raiz = raizAlDia();
  const ahora = new Date().toISOString();
  const muerto = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' }).pid;
  escribir(raiz, {
    'estudio/inbox/clase2.pdf': 'x', 'estudio/inbox/clase3.pdf': 'x', 'estudio/inbox/clase4.pdf': 'x',
    '.preparacion/01-02/estado.json': JSON.stringify({ id: '01-02', ficheros: ['clase2.pdf'], pid: process.pid, inicio: ahora, fin: null, resultado: 'en-curso', rama: 'preparacion/01-02' }),
    '.preparacion/01-03/estado.json': JSON.stringify({ id: '01-03', ficheros: ['clase3.pdf'], pid: muerto, inicio: ahora, fin: ahora, resultado: 'terminada', rama: 'preparacion/01-03' }),
    '.preparacion/01-04/estado.json': JSON.stringify({ id: '01-04', ficheros: ['clase4.pdf'], pid: muerto, inicio: ahora, fin: null, resultado: 'en-curso', rama: 'preparacion/01-04' }),
  });
  const e = calcularEstado(raiz);
  assert.deepEqual(e.materialNuevo, ['inbox/clase4.pdf'], 'solo la interrumpida vuelve a ser material por preparar');
});
