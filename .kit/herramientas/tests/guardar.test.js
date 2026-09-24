'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { guardar, destinoSeguro } = require('../guardar');
const { cursoTemporal, escribir, iniciarGit, git, temporal } = require('./ayuda');

function conOrigen(raiz) {
  const remoto = temporal('kit-remoto-');
  git(remoto, 'init', '-q', '--bare', '-b', 'main');
  git(raiz, 'remote', 'add', 'origin', remoto);
  git(raiz, 'push', '-q', '-u', 'origin', 'main');
  return remoto;
}
const ajustes = subir => JSON.stringify({ subir_a_github: subir, version_datos: 1 });

test('guarda en local y no sube si subir_a_github es false', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(false) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'sesion(s02): prueba' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.equal(git(raiz, 'log', '-1', '--format=%s'), 'sesion(s02): prueba');
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('sube cuando subir_a_github es true', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.subido, true);
  assert.equal(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('con errores no guarda', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n[[alfa]] [[roto]]\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, false);
  assert.equal(r.motivo, 'errores');
  assert.equal(git(raiz, 'log', '--format=%s').split('\n').length, 1);
});

test('una sesión que no está en mapa-del-curso.md ya no impide guardar', () => {
  const raiz = cursoTemporal({ 'estudio/mapa-del-curso.md': '# Mapa\n' });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  assert.equal(guardar({ raiz, mensaje: 'x' }).guardado, true);
});

test('con permitirErrores guarda, pero un secreto nunca se sube', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/inbox/x.txt': 'ghp_' + 'a1B2'.repeat(9) });
  const r = guardar({ raiz, mensaje: 'copia', permitirErrores: true });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /secreto/);
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('sin cambios no crea commit', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.deepEqual([guardar({ raiz, mensaje: 'x' }).guardado, guardar({ raiz, mensaje: 'x' }).motivo], [false, 'sin-cambios']);
});

test('en una rama preparacion/* hace commit pero no sube, aunque subir_a_github esté activo y haya remoto', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  git(raiz, 'checkout', '-b', 'preparacion/02-01');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'sesion(02-01): prueba' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /preparación en segundo plano/);
  assert.equal(git(remoto, 'branch', '--list', 'preparacion/02-01'), '', 'la rama de preparación no llega al remoto');
});

test('sin remoto guarda en local y lo dice', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /remoto/);
});

test('al guardar se regenera estudio/pendientes.md, por bloques, con TODO, FALTA INFO y dudas', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n[[alfa]]\n\n⚠️ **FALTA INFO:** la tabla de la diapositiva 4\n',
    'estudio/conceptos/alfa.md': '---\ntipo: concepto\nalias: []\nbloques: [2]\n---\n**TODO:** confirmar la fecha\n\n@@ no lo pillo\n',
    'estudio/inbox/apuntes.md': 'apuntes sueltos @@ ¿esto qué era?\n',
  });
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  const p = fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8');
  assert.match(p, /## Bloque 1 \(1\)\n\n- \[ \] \*\*Falta material del curso\*\* · \[\[sesiones\/s01-intro\]\] — la tabla de la diapositiva 4/);
  assert.match(p, /## Bloque 2 \(2\)/);
  assert.match(p, /\*\*Pendiente del profesor\*\* · \[\[conceptos\/alfa\]\] — confirmar la fecha/);
  assert.match(p, /\*\*Duda tuya sin responder\*\* · \[\[conceptos\/alfa\]\] — no lo pillo/);
  assert.match(p, /## Sin bloque \(1\)[\s\S]*\[\[inbox\/apuntes\]\] — ¿esto qué era\?/);
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'pendientes.md queda guardado en el commit');
});

test('sin nada pendiente lo dice; y las flashcards heredan el bloque de su sesión', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8'), /Nada pendiente/);
  escribir(raiz, {
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 3\n---\n[[alfa]]\n',
    'estudio/flashcards/s01-intro.md': '---\ntipo: flashcards\nsesion: s01-intro\n---\n**TODO:** pregunta 4\n',
  });
  guardar({ raiz, mensaje: 'y' });
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'pendientes.md'), 'utf8'), /## Bloque 3 \(1\)[\s\S]*flashcards\/s01-intro/);
});

test('cada guardado deja su línea en config/diario.md, dentro del mismo commit; sin cambios, no escribe nada', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const diario = path.join(raiz, 'config', 'diario.md');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nuno\n' });
  guardar({ raiz, mensaje: 'sesion(s02): tema', hoy: '2026-03-01' });
  assert.match(fs.readFileSync(diario, 'utf8'), /^# Diario del curso[\s\S]*- 2026-03-01 · sesion\(s02\): tema\n$/);
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'el diario va en el commit');
  guardar({ raiz, mensaje: 'nada', hoy: '2026-03-02' });
  assert.doesNotMatch(fs.readFileSync(diario, 'utf8'), /nada/);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\ndos\n' });
  guardar({ raiz, mensaje: 'dudas: 1 resuelta', hoy: '2026-03-02' });
  assert.match(fs.readFileSync(diario, 'utf8'), /sesion\(s02\): tema\n- 2026-03-02 · dudas: 1 resuelta\n$/);
});

test('el diario respeta lo que el profesor escribió a mano (una línea "en curso")', () => {
  const raiz = cursoTemporal({ 'config/diario.md': '# Diario del curso\n\n- 2026-03-01 · en curso: procesando la clase 3\n' });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  guardar({ raiz, mensaje: 'sesion(s03): tema', hoy: '2026-03-01' });
  assert.match(fs.readFileSync(path.join(raiz, 'config', 'diario.md'), 'utf8'), /en curso: procesando la clase 3\n- 2026-03-01 · sesion\(s03\): tema\n$/);
});

test('al guardar se reúne la auditoría del material de todas las sesiones, por bloque; la plantilla vacía no cuenta', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n[[alfa]]\n\n## Auditoría del material\n\n- El Excel usa un 10 % y el PDF un 9 %.\n- La hoja 2 está vacía.\n\n## Para pensarlo despacio\n\nx\n',
    'estudio/sesiones/s02-tema.md': '---\ntipo: sesion\nbloque: 2\n---\n[[alfa]]\n\n## Auditoría del material\n\n<Discrepancias entre los ficheros de la clase, errores detectados y qué falta.>\n\n## Para pensarlo despacio\n\nx\n',
    'estudio/mapa-del-curso.md': '[[s01-intro]] [[s02-tema]]',
  });
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'x' });
  const a = fs.readFileSync(path.join(raiz, 'estudio', 'auditoria-del-material.md'), 'utf8');
  assert.match(a, /## Bloque 1\n\n### \[\[sesiones\/s01-intro\]\]\n\n- El Excel usa un 10 % y el PDF un 9 %\.\n- La hoja 2 está vacía\./);
  assert.doesNotMatch(a, /Bloque 2|Discrepancias entre/);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

test('un curso sin inicio.md se guarda y sale con él y con el pie en cada sesión', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  fs.rmSync(path.join(raiz, 'estudio', 'inicio.md'));
  escribir(raiz, {
    'estudio/sesiones/s02-tema.md': '---\ntipo: sesion\n---\n# Tema\n\n## Conceptos\n\n- [[alfa]]\n',
    'estudio/mapa-del-curso.md': '# Mapa\n\n- [[s01-intro]]\n- [[s02-tema]]\n',
  });
  const r = guardar({ raiz, mensaje: 'sesion(s02): tema' });
  assert.equal(r.guardado, true, JSON.stringify(r.informe.errores));
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'inicio.md'), 'utf8'), /\[\[s01-intro\\\|Intro\]\]/);
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'sesiones', 's02-tema.md'), 'utf8'), /← \[\[s01-intro\|Intro\]\] · \[\[inicio\|🏠 Inicio\]\]\n%% fin/);
  assert.equal(guardar({ raiz, mensaje: 'otra vez' }).motivo, 'sin-cambios');
});

test('la sección Estado de la portada se calcula sola al guardar, y no toca el resto del README', () => {
  const raiz = cursoTemporal({
    'README.md': '# Mi curso\n\n## De qué va\n\nTexto mío.\n\n## Estado\n\n_Pendiente._\n\n## Cómo se usa\n\nx\n',
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\nbloque: 1\n---\n[[alfa]]\n\n**TODO:** algo\n',
  });
  iniciarGit(raiz);
  guardar({ raiz, mensaje: 'sesion(s01): intro', hoy: '2026-03-01' });
  const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
  assert.match(readme, /## Estado\n\n- \*\*1 clase\*\* procesada en 1 bloque \(1\), \*\*1 concepto\*\*, 0 exámenes\.\n- \*\*1 pendiente\*\* \(ver `estudio\/pendientes\.md`\)\.\n- Actualizado el 2026-03-01\.\n\n## Cómo se usa/);
  assert.match(readme, /## De qué va\n\nTexto mío\./);
  assert.equal(git(raiz, 'status', '--porcelain'), '');
  assert.equal(guardar({ raiz, mensaje: 'nada', hoy: '2026-03-02' }).motivo, 'sin-cambios', 'un curso quieto no cambia de fecha');
});

test('el diario respeta el fin de línea de Windows: no mezcla \\n y \\r\\n', () => {
  const { anotarEnDiario } = require('../guardar');
  const raiz = cursoTemporal({ 'config/diario.md': '# Diario\r\n\r\n- 2026-01-01 · uno\r\n' });
  anotarEnDiario(raiz, 'dos', '2026-01-02');
  const texto = require('node:fs').readFileSync(require('node:path').join(raiz, 'config', 'diario.md'), 'utf8');
  assert.equal(texto, '# Diario\r\n\r\n- 2026-01-01 · uno\r\n- 2026-01-02 · dos\r\n');
  assert.doesNotMatch(texto.replace(/\r\n/g, ''), /\n/, 'ningún \\n suelto');
});

// issue #39, H03: un curso sin git propio dentro de otro repositorio no puede guardar en el de fuera.
test('un curso sin git propio dentro de otro repositorio no guarda nada, y el de fuera no cambia', () => {
  const padre = temporal('kit-padre-');
  escribir(padre, { 'LEEME.txt': 'repo ajeno' });
  iniciarGit(padre);
  const antes = git(padre, 'rev-parse', 'HEAD');
  const raiz = path.join(padre, 'curso');
  fs.cpSync(cursoTemporal({ 'config/ajustes.json': ajustes(false) }), raiz, { recursive: true });
  const r = guardar({ raiz, mensaje: 'sesion(1): intento' });
  assert.equal(r.guardado, false);
  assert.equal(r.motivo, 'sin-repo');
  assert.equal(git(padre, 'rev-parse', 'HEAD'), antes);
  assert.equal(git(padre, 'diff', '--cached', '--name-only'), '');
});

test('esRepo: la raíz exacta sí; una subcarpeta no; una copia de trabajo (worktree) sí', () => {
  const g = require('../lib/git');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.equal(g.esRepo(raiz), true);
  assert.equal(g.esRepo(path.join(raiz, 'estudio')), false);
  const copia = path.join(temporal('kit-wt-'), 'copia');
  git(raiz, 'worktree', 'add', '-q', '-b', 'otra', copia);
  assert.equal(g.esRepo(copia), true);
});

// issue #39, H07: publicar solo con un sí claro y a un destino que se sabe privado.
test('subir_a_github como texto ("false") no sube, y dice por qué', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': JSON.stringify({ subir_a_github: 'false', version_datos: 1 }) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nnuevo\n' });
  const r = guardar({ raiz, mensaje: 'x' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /subir_a_github/);
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('un secreto en un guardado intermedio que aún no se ha subido bloquea la subida, aunque ya no esté en los ficheros', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  const remoto = conOrigen(raiz);
  escribir(raiz, { 'estudio/inbox/nota.md': `mi token ghp_${'x'.repeat(36)}\n` });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'con secreto');
  escribir(raiz, { 'estudio/inbox/nota.md': 'ya no\n' });
  const r = guardar({ raiz, mensaje: 'quitado' });
  assert.equal(r.guardado, true);
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /secreto/);
  assert.doesNotMatch(r.motivoSubida, /ghp_/);
  assert.notEqual(git(remoto, 'rev-parse', 'main'), git(raiz, 'rev-parse', 'HEAD'));
});

test('destinoSeguro: una carpeta del disco vale; en GitHub, solo si es privado y no es el kit; si no se sabe, no', () => {
  const gh = respuesta => () => respuesta;
  assert.equal(destinoSeguro('/ruta/a/remoto.git', 'rsotor/profesor-kit', gh({ ok: false })).ok, true);
  assert.equal(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE\n' })).ok, true);
  assert.equal(destinoSeguro('git@github.com:ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE\n' })).ok, true);
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PUBLIC\n' })).motivo, /privad/);
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: false, salida: 'sin red' })).motivo, /comprobar/);
  assert.match(destinoSeguro('https://github.com/rsotor/profesor-kit.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE' })).motivo, /kit/);
  assert.match(destinoSeguro('https://gitlab.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true })).motivo, /GitHub/);
});

test('regenerarGenerados: escribe mi-perfil.md e inicio.md la enlaza desde el primer guardado', () => {
  const raiz = cursoTemporal();
  const base = path.join(raiz, 'estudio');
  assert.match(fs.readFileSync(path.join(base, 'mi-perfil.md'), 'utf8'), /^# Mi perfil/);
  assert.match(fs.readFileSync(path.join(base, 'inicio.md'), 'utf8'), /\[\[mi-perfil\]\]/);
});

// #36: en el entorno restringido de Codex git no se puede ejecutar. No es que el curso "no sea la raíz de su git":
// es el entorno, y lib/arranque.js ya sabe decirlo con un error EPERM (issue #33).
test('esRepo: si el entorno no deja ejecutar git, lo dice como error de permiso, no como "no es un repositorio"', () => {
  const g = require('../lib/git');
  const sinPermiso = () => ({ ok: false, motivo: 'permiso', salida: '', stdout: '', comando: 'git' });
  assert.throws(() => g.esRepo('/cualquier/sitio', { intentar: sinPermiso }), e => e.code === 'EPERM');
  assert.equal(g.esRepo('/no/existe/de/verdad', { intentar: () => ({ ok: false, motivo: 'error', salida: 'fatal', stdout: '' }) }), false);
});

test('--empezar deja la línea "en curso" en el diario, sin guardar nada; el guardado de después la cierra', () => {
  const { cli } = require('../guardar');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const diario = path.join(raiz, 'config', 'diario.md');
  const hoy = new Date().toISOString().slice(0, 10);
  const antes = git(raiz, 'rev-parse', 'HEAD');
  assert.equal(cli(['--empezar', 'procesar la clase 3'], raiz), 0);
  assert.match(fs.readFileSync(diario, 'utf8'), new RegExp(`- ${hoy} · en curso: procesar la clase 3\\n$`));
  assert.equal(git(raiz, 'rev-parse', 'HEAD'), antes, 'no hace commit: se guarda con el trabajo');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  guardar({ raiz, mensaje: 'sesion(s03): tema', hoy });
  assert.match(fs.readFileSync(diario, 'utf8'), /en curso: procesar la clase 3\n- \d{4}-\d{2}-\d{2} · sesion\(s03\): tema\n$/);
  assert.equal(cli(['--empezar'], raiz), 2, 'sin qué, no escribe nada');
});
