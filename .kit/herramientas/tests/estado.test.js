'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { calcularEstado, materialNuevo, pidVivo, leerPreparaciones, cli, senalSincronizacion } = require('../estado');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

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

test('senales: van en el JSON y una por línea en el texto', () => {
  const raiz = raizAlDia({
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 falló dos veces | ⬜ |\n',
  });
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.senales.map(s => s.tipo), ['concepto-rojo']);
  const r = spawnSync(process.execPath, [require('node:path').join(__dirname, '..', 'estado.js'), '--raiz', raiz], { encoding: 'utf8' });
  assert.match(r.stdout, /Señal \(concepto-rojo\): alfa: falló dos veces \(teoría\)/);
});

test('senales: sin nada que decir, lista vacía y "Señales: ninguna"', () => {
  const raiz = raizAlDia();
  assert.deepEqual(calcularEstado(raiz).senales, []);
  const r = spawnSync(process.execPath, [require('node:path').join(__dirname, '..', 'estado.js'), '--raiz', raiz], { encoding: 'utf8' });
  assert.match(r.stdout, /Señales: ninguna/);
});

// Tarea 12 del plan 0.23.0 (Roberto: "no bloquear, pero revisar cada cierto tiempo, porque la bola crece").
test('senalAvisos: 10 más que en la última revisión, o 30 días con avisos; si no, nada', () => {
  const { senalAvisos } = require('../estado');
  assert.equal(senalAvisos(null, 9, '2026-10-01'), null, 'sin revisión, menos de 10');
  assert.match(senalAvisos(null, 12, '2026-10-01').detalle, /12 avisos/);
  assert.equal(senalAvisos({ fecha: '2026-09-25', avisos: 20 }, 25, '2026-10-01'), null, 'crecen poco y hace poco');
  assert.match(senalAvisos({ fecha: '2026-09-25', avisos: 20 }, 30, '2026-10-01').detalle, /10 más que en la última revisión/);
  assert.match(senalAvisos({ fecha: '2026-08-01', avisos: 5 }, 5, '2026-10-01').detalle, /desde el 2026-08-01/);
  assert.equal(senalAvisos({ fecha: '2026-08-01', avisos: 5 }, 0, '2026-10-01'), null, 'sin avisos no hay nada que revisar');
  assert.equal(senalAvisos(null, 12, '2026-10-01').tipo, 'avisos-acumulados');
});

test('senalAvisos: sin ninguna revisión, cuenta desde el primer guardado del curso', () => {
  const { senalAvisos } = require('../estado');
  assert.equal(senalAvisos(null, 5, '2026-10-01', '2026-09-20'), null, 'curso reciente');
  assert.match(senalAvisos(null, 5, '2026-10-01', '2026-08-01').detalle, /desde el 2026-08-01/);
});

test('estado: si comprobar revienta (una carpeta llamada "x.md"), el arranque sigue; solo falta esa señal', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const raiz = raizAlDia();
  fs.mkdirSync(path.join(raiz, 'estudio', 'conceptos', 'raro.md'));
  const estado = calcularEstado(raiz);
  assert.ok([1, 2, 3].includes(estado.caso));
  assert.ok(Array.isArray(estado.senales));
});

// B.1 del plan 0.27: el curso vive en más de un sitio (el Mac, un asistente en la nube). Un fetch rápido, al
// arrancar, dice si hay que traer o subir algo antes de seguir.
function conRemoto(raiz) {
  const remoto = temporal('kit-remoto-');
  git(remoto, 'init', '-q', '--bare', '-b', 'main');
  git(raiz, 'remote', 'add', 'origin', remoto);
  git(raiz, 'push', '-q', '-u', 'origin', 'main');
  return remoto;
}

// Un segundo clon del mismo remoto: lo que ve "el Mac" cuando se guarda "en la nube", o al revés.
function clonarOtroSitio(remoto) {
  const otroClon = path.join(temporal('kit-otro-'), 'clon');
  git(path.dirname(otroClon), 'clone', '-q', remoto, otroClon);
  git(otroClon, 'config', 'user.name', 'Test');
  git(otroClon, 'config', 'user.email', 'test@example.com');
  git(otroClon, 'config', 'commit.gpgsign', 'false');
  return otroClon;
}

test('senalSincronizacion: sin remoto, nada que decir', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  assert.equal(senalSincronizacion(raiz), null);
});

test('senalSincronizacion: recién sincronizado (al día con el remoto), nada que decir', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  conRemoto(raiz);
  assert.equal(senalSincronizacion(raiz), null);
});

test('senalSincronizacion: guardados locales sin subir (por delante del remoto), solo si subir_a_github es true', () => {
  const raiz = raizAlDia({ 'config/ajustes.json': JSON.stringify({ subir_a_github: true, version_datos: 1 }) });
  iniciarGit(raiz);
  conRemoto(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'sin subir');
  const s = senalSincronizacion(raiz);
  assert.equal(s.tipo, 'curso-sin-sincronizar');
  assert.match(s.detalle, /1 guardado sin subir a GitHub/);
});

// Revisión de la 0.27 (baja): sin `subir_a_github`, unos commits locales sin subir no son ningún problema que
// resolver (el curso no publica nada de todos modos), así que no cuentan para la señal.
test('senalSincronizacion: por delante del remoto, pero subir_a_github NO es true: nada que decir', () => {
  const raiz = raizAlDia();   // ajustes por defecto: subir_a_github false
  iniciarGit(raiz);
  conRemoto(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'sin subir');
  assert.equal(senalSincronizacion(raiz), null);
});

// Revisión de la 0.27 (media 7): nunca se ofrece sincronizar con el repositorio del kit.
test('senalSincronizacion: si origin es el repositorio del kit, nada que decir', () => {
  const raiz = raizAlDia({ '.kit/motor.json': JSON.stringify({ repo: 'rsotor/profesor-kit', version_datos: 1, ficheros: ['AGENTS.md'] }) });
  iniciarGit(raiz);
  git(raiz, 'remote', 'add', 'origin', 'https://github.com/rsotor/profesor-kit.git');
  assert.equal(senalSincronizacion(raiz), null);
});

test('senalSincronizacion: divergencia (los dos lados avanzaron)', () => {
  const raiz = raizAlDia({ 'config/ajustes.json': JSON.stringify({ subir_a_github: true, version_datos: 1 }) });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroClon = clonarOtroSitio(remoto);
  escribir(otroClon, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroClon, 'add', '-A');
  git(otroClon, 'commit', '-q', '-m', 'desde otro sitio');
  git(otroClon, 'push', '-q', 'origin', 'main');

  escribir(raiz, { 'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ | ⬜ |\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'aquí');

  const s = senalSincronizacion(raiz);
  assert.equal(s.tipo, 'curso-sin-sincronizar');
  assert.match(s.detalle, /1 tuyo sin subir/);
  assert.match(s.detalle, /1 desde otro sitio sin traer/);
});

test('senalSincronizacion: si detrás del remoto, el detalle lo dice y propone traer', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroClon = clonarOtroSitio(remoto);
  escribir(otroClon, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde otro sitio\n' });
  git(otroClon, 'add', '-A');
  git(otroClon, 'commit', '-q', '-m', 'desde otro sitio');
  git(otroClon, 'push', '-q', 'origin', 'main');

  const s = senalSincronizacion(raiz);
  assert.equal(s.tipo, 'curso-sin-sincronizar');
  assert.match(s.detalle, /hay cambios hechos desde otro sitio \(1 guardado\)/);
  assert.match(s.detalle, /guardar\.js --traer/);
});

test('senalSincronizacion: sin red (o si el fetch tarda), no dice nada aunque haya divergencia real', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroClon = clonarOtroSitio(remoto);
  escribir(otroClon, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  git(otroClon, 'add', '-A');
  git(otroClon, 'commit', '-q', '-m', 'x');
  git(otroClon, 'push', '-q', 'origin', 'main');

  const sinRed = () => ({ ok: false, motivo: 'fallo', salida: 'no se pudo conectar' });
  assert.equal(senalSincronizacion(raiz, { ejecutarFetch: sinRed }), null);
});

// Revisión de la 0.27 (baja, "tests que no prueban lo que dicen" y media 6): con la función por defecto de
// verdad (nada inyectado), un ssh que nunca contesta no puede colgar el arranque del profesor: el timeout real
// (TIMEOUT_FETCH_MS) tiene que cortarlo. `core.sshCommand` a algo que se queda dormido simula justo eso, sin
// tocar la red real; como ya está puesto, entornoSinPrompt lo respeta y no lo pisa con su BatchMode por defecto.
test('senalSincronizacion: con la función por defecto (sin inyectar nada), un ssh que nunca contesta corta por el timeout real', () => {
  const raiz = raizAlDia({ 'config/ajustes.json': JSON.stringify({ subir_a_github: true, version_datos: 1 }) });
  iniciarGit(raiz);
  git(raiz, 'remote', 'add', 'origin', 'git@localhost:no-existe/repo.git');
  git(raiz, 'config', 'core.sshCommand', "sh -c 'sleep 30'");
  const empieza = Date.now();
  const s = senalSincronizacion(raiz);
  const tardo = Date.now() - empieza;
  assert.equal(s, null, 'sin poder hacer fetch, no dice nada');
  assert.ok(tardo < 15000, `tardó ${tardo}ms: el timeout de 8s no ha cortado a tiempo`);
});

test('senalSincronizacion: en una rama preparacion/*, nada que decir (eso lo resuelve --juntar)', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  conRemoto(raiz);
  git(raiz, 'checkout', '-q', '-b', 'preparacion/02-01');
  assert.equal(senalSincronizacion(raiz), null);
});

test('calcularEstado: la señal de sincronización va la primera, antes que las del perfil', () => {
  const raiz = raizAlDia({
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 falló dos veces | ⬜ |\n',
  });
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroClon = clonarOtroSitio(remoto);
  escribir(otroClon, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  git(otroClon, 'add', '-A');
  git(otroClon, 'commit', '-q', '-m', 'x');
  git(otroClon, 'push', '-q', 'origin', 'main');

  const estado = calcularEstado(raiz);
  assert.equal(estado.senales[0].tipo, 'curso-sin-sincronizar');
  assert.equal(estado.senales[1].tipo, 'concepto-rojo');
});

// Ensayo real del plan 0.27: dos clones de un mismo bare, un commit en uno, estado.js --json en el otro.
test('ensayo real: estado.js --json ve, desde el CLI, lo guardado en el otro clon', () => {
  const raiz = raizAlDia();
  iniciarGit(raiz);
  const remoto = conRemoto(raiz);
  const otroClon = clonarOtroSitio(remoto);
  escribir(otroClon, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndesde el cli\n' });
  git(otroClon, 'add', '-A');
  git(otroClon, 'commit', '-q', '-m', 'desde el cli');
  git(otroClon, 'push', '-q', 'origin', 'main');

  const r = spawnSync(process.execPath, [require('node:path').join(__dirname, '..', 'estado.js'), '--json', '--raiz', raiz], { encoding: 'utf8' });
  const estado = JSON.parse(r.stdout);
  assert.equal(estado.senales[0].tipo, 'curso-sin-sincronizar');
});
