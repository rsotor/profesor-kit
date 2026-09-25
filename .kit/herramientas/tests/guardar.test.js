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
  const sinAnonimo = () => ({ conocido: false });   // nunca red real en los tests: se inyecta siempre
  assert.equal(destinoSeguro('/ruta/a/remoto.git', 'rsotor/profesor-kit', gh({ ok: false })).ok, true);
  assert.equal(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE\n' })).ok, true);
  assert.equal(destinoSeguro('git@github.com:ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE\n' })).ok, true);
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PUBLIC\n' })).motivo, /privad/);
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: false, salida: 'sin red' }), sinAnonimo).motivo, /comprobar/);
  assert.match(destinoSeguro('https://github.com/rsotor/profesor-kit.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE' })).motivo, /kit/);
  assert.match(destinoSeguro('https://gitlab.com/ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true })).motivo, /GitHub/);
});

// Revisión de la 0.27 (grave 1): la regex vieja no anclaba el host — "github.com" en cualquier parte de la URL
// bastaba para que se tratara como GitHub, y con gh fallando (típico sin sesión) caía a la API anónima, que
// respondía 404 para un repo que no existe en absoluto y eso se leía como "privado, se puede subir": un push a
// un servidor cualquiera que no es GitHub.
test('destinoSeguro: un host que no es github.com de verdad (aunque lo mencione) nunca se trata como GitHub', () => {
  const gh = () => ({ ok: false, motivo: 'no-existe' });   // como si no hubiera gh
  const anonimoQueDiceQueEsPrivado = () => ({ conocido: true, privado: true });   // si llegara a consultarse
  for (const url of [
    'https://gitlab.com/github.com/ana/curso.git',
    'https://notgithub.com/ana/curso.git',
    'git@evil.org:github.com/ana/curso.git',
    'https://github.com.evil.org/ana/curso.git',
  ]) {
    const r = destinoSeguro(url, 'rsotor/profesor-kit', gh, anonimoQueDiceQueEsPrivado);
    assert.equal(r.ok, false, url);
    assert.match(r.motivo, /no está en GitHub/, url);
  }
});

// Revisión de la 0.27, segunda ronda (grave 1): la forma corta SSH SIN usuario (`host:ruta`, sin `usuario@`)
// no coincidía con ninguna de las dos regex de "parece remota" — ni esquema (`scheme://`) ni `user@host:` — y
// se trataba como si fuera una carpeta local: {ok:true} sin comprobar nada, subiendo sin más.
test('destinoSeguro: la forma corta SSH sin usuario (host:ruta) se trata como remota, y pasa por repoGithubDe', () => {
  const gh = respuesta => () => respuesta;
  // github.com:owner/repo SÍ es GitHub de verdad (sintaxis SSH corta válida): se comprueba como cualquier otro.
  assert.equal(destinoSeguro('github.com:ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PRIVATE\n' })).ok, true);
  assert.match(destinoSeguro('github.com:ana/curso.git', 'rsotor/profesor-kit', gh({ ok: true, salida: 'PUBLIC\n' })).motivo, /privad/);
  // evil.org:curso.git y servidor:/srv/curso.git no son GitHub: se reconocen como remotas (no como local), y
  // se rechazan por no ser GitHub — nunca se suben sin comprobar.
  for (const url of ['evil.org:curso.git', 'servidor:/srv/curso.git']) {
    const r = destinoSeguro(url, 'rsotor/profesor-kit', gh({ ok: false }));
    assert.equal(r.ok, false, url);
    assert.match(r.motivo, /no está en GitHub/, url);
  }
});

test('destinoSeguro: una carpeta local de verdad (ruta sin esquema, o una letra de unidad de Windows) sigue dando ok', () => {
  const gh = () => ({ ok: false });
  for (const url of ['/ruta/a/remoto.git', '../otra/carpeta', 'C:\\Users\\ana\\curso', 'C:/Users/ana/curso']) {
    assert.equal(destinoSeguro(url, 'rsotor/profesor-kit', gh).ok, true, url);
  }
});

test('lib/git.urlPush: sin pushurl propio, cae al de lectura; con uno distinto, ese manda', () => {
  const g = require('../lib/git');
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  git(raiz, 'remote', 'add', 'origin', 'https://github.com/ana/lectura.git');
  assert.equal(g.urlPush(raiz), 'https://github.com/ana/lectura.git');
  git(raiz, 'remote', 'set-url', '--push', 'origin', 'https://github.com/ana/push-de-verdad.git');
  assert.equal(g.urlPush(raiz), 'https://github.com/ana/push-de-verdad.git');
  assert.equal(g.urlOrigen(raiz), 'https://github.com/ana/lectura.git', 'la de lectura no cambia');
});

// Revisión de la 0.27 (grave 1): subirSiProcede comprueba el destino de PUSH, no el de lectura — si son
// distintos, no basta con que la de lectura parezca segura (una carpeta local) o esté vacía.
test('subirSiProcede: comprueba la privacidad de la URL de push, no la de lectura, cuando son distintas', () => {
  const raiz = cursoTemporal({ 'config/ajustes.json': ajustes(true) });
  iniciarGit(raiz);
  git(raiz, 'remote', 'add', 'origin', temporal('kit-lectura-'));   // local: por sí sola, "segura"
  git(raiz, 'remote', 'set-url', '--push', 'origin', 'https://github.com/ana/curso.git');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nx\n' });
  const informe = require('../comprobar').comprobar(raiz);
  const gh = () => ({ ok: true, salida: 'PUBLIC\n' });   // la de push es pública: no debe subir
  const r = require('../guardar').subirSiProcede(raiz, informe, { ejecutarGh: gh });
  assert.equal(r.subido, false);
  assert.match(r.motivoSubida, /privad/);
});

// issue #50: un entorno sin `gh` (Claude Code en la nube), con la API anónima de GitHub como segunda vía.
test('destinoSeguro sin gh: 404 (no visible sin identificarse) es privado; 200 público no sube; sin saberlo, tampoco (fail-closed)', () => {
  const sinGh = () => ({ ok: false, motivo: 'no-existe', salida: 'no encuentro "gh"' });
  const anonimo = respuesta => () => respuesta;
  assert.equal(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', sinGh,
    anonimo({ conocido: true, privado: true })).ok, true, '404: no visible sin identificarse, se trata como privado');
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', sinGh,
    anonimo({ conocido: true, privado: false })).motivo, /privad/, '200 con private:false: público, no sube');
  assert.match(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', sinGh,
    anonimo({ conocido: false })).motivo, /comprobar/, 'sin red o 403 de límite: no se sabe, no sube');
});

test('destinoSeguro: gh presente pero que falla también cae a la API anónima (no solo cuando gh no existe)', () => {
  const ghFalla = () => ({ ok: false, motivo: 'fallo', salida: 'sin sesión de gh' });
  const anonimo = respuesta => () => respuesta;
  assert.equal(destinoSeguro('https://github.com/ana/curso.git', 'rsotor/profesor-kit', ghFalla,
    anonimo({ conocido: true, privado: true })).ok, true);
});

test('consultaPrivacidadAnonima: 404 privado, 200 según "private", otro código o sin red no se sabe', () => {
  const { consultaPrivacidadAnonima } = require('../lib/red');
  const obtener = respuesta => () => respuesta;
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 404, cuerpo: JSON.stringify({ message: 'Not Found' }) }) }), { conocido: true, privado: true });
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 200, cuerpo: JSON.stringify({ private: false }) }) }), { conocido: true, privado: false });
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 200, cuerpo: JSON.stringify({ private: true }) }) }), { conocido: true, privado: true });
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 403, cuerpo: '{}' }) }), { conocido: false });
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: false, detalle: 'sin red' }) }), { conocido: false });
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 200, cuerpo: 'no es json' }) }), { conocido: false });
  // Revisión de la 0.27 (grave 1): un 404 que no es de verdad la API de GitHub (un proxy, un balanceador que no
  // sepa nada del repo) no cuenta como "privado" solo por el código de estado.
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 404, cuerpo: '{}' }) }), { conocido: false }, 'un 404 sin el cuerpo real de GitHub no cuenta');
  assert.deepEqual(consultaPrivacidadAnonima('a/b', { obtener: obtener({ ok: true, status: 404, cuerpo: 'not found' }) }), { conocido: false }, 'un 404 con cuerpo no-JSON tampoco');
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
