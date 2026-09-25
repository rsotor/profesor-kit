'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const g = require('../lib/git');
const { cursoTemporal, escribir, iniciarGit, git } = require('./ayuda');

function merge(raiz, ...args) { try { git(raiz, 'merge', ...args); } catch { /* conflicto esperado, no es un fallo del test */ } }

// Revisión de la 0.27 (alta 3/4, y segunda ronda media 1): visto de verdad en guardar.js --traer — tras un
// `merge --no-commit`, el código regenera ficheros con fs.writeFileSync (fuera del índice) antes de decidir si
// hay que abortar. Un `git merge --abort` normal se niega entonces ("Entry '…' not uptodate. Cannot merge."),
// y `git reset --merge` también, porque el árbol de trabajo ya no coincide con lo que el propio merge dejó:
// entonces (y solo entonces) se rescata lo sin guardar antes de descartar nada.
test('abortarMerge: cuando ni --abort ni reset --merge pueden, rescata lo sin guardar antes de limpiar', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { 'estudio/sesiones/s02-nueva.md': '---\ntipo: sesion\n---\n# Nueva\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'nueva');
  git(raiz, 'checkout', '-q', 'main');
  merge(raiz, '--no-commit', '--no-ff', 'otra');
  assert.equal(git(raiz, 'status', '--porcelain'), 'A  estudio/sesiones/s02-nueva.md');

  // Algo (regenerarGenerados, en la vida real) escribe por encima, fuera del índice: ni el abort normal ni el
  // reset --merge pueden ya.
  const contenidoDeVerdad = '# Tocado por encima, sin pasar por git\n';
  fs.writeFileSync(path.join(raiz, 'estudio', 'sesiones', 's02-nueva.md'), contenidoDeVerdad);
  assert.equal(g.intentarGit(raiz, ['merge', '--abort']).ok, false, 'la trampa: el abort normal se niega aquí');

  const r = g.abortarMerge(raiz);
  assert.equal(r.ok, true);
  assert.ok(r.rescatado, 'lo sin guardar se rescató a algún sitio');
  assert.equal(git(raiz, 'status', '--porcelain'), '', 'el árbol quedó limpio, como antes del merge');
  const rutaMerge = git(raiz, 'rev-parse', '--git-path', 'MERGE_HEAD');
  assert.equal(fs.existsSync(path.join(raiz, rutaMerge)), false, 'sin MERGE_HEAD colgado');
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', 'sesiones', 's02-nueva.md')), 'lo que trajo ese intento no se queda');

  // Lo rescatado tiene de verdad el contenido que se iba a perder, no lo que había en el merge.
  const ficheroRescatado = fs.readdirSync(r.rescatado)[0];
  assert.equal(fs.readFileSync(path.join(r.rescatado, ficheroRescatado), 'utf8'), contenidoDeVerdad);
});

test('abortarMerge: con un abort normal que sí funciona, no hace falta rescatar nada', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  git(raiz, 'checkout', '-q', '-b', 'otra');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nen la otra\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'otra');
  git(raiz, 'checkout', '-q', 'main');
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\naquí\n' });
  git(raiz, 'add', '-A');
  git(raiz, 'commit', '-q', '-m', 'aqui');
  merge(raiz, '--no-commit', '--no-ff', 'otra');   // choca de verdad: mismo fichero, mismas líneas
  assert.deepEqual(g.abortarMerge(raiz), { ok: true, rescatado: null });
  assert.equal(git(raiz, 'status', '--porcelain'), '');
});

// Revisión, media 1: sin ningún merge/rebase/cherry-pick en curso, no hay nada que abortar — y sobre todo, no
// se toca nada (nunca un reset --hard porque sí: borraría trabajo sin guardar que no tiene nada que ver).
test('abortarMerge: sin ningún merge en curso, no toca nada (ni siquiera lo sin guardar)', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/mapa-del-curso.md': '# Mapa\n\nsin guardar, y sin ningún merge de por medio\n' });
  assert.deepEqual(g.abortarMerge(raiz), { ok: true, rescatado: null });
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'mapa-del-curso.md'), 'utf8'), /sin ningún merge/);
});

test('entornoSinPrompt: sin nada propio, fuerza BatchMode; con core.sshCommand o GIT_SSH_COMMAND/GIT_SSH, lo respeta', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  const sinNada = g.entornoSinPrompt(raiz);
  assert.equal(sinNada.GIT_TERMINAL_PROMPT, '0');
  assert.match(sinNada.GIT_SSH_COMMAND, /BatchMode=yes/);

  git(raiz, 'config', 'core.sshCommand', 'ssh -i /una/clave/propia');
  assert.equal(g.entornoSinPrompt(raiz).GIT_SSH_COMMAND, undefined, 'no pisa lo que el alumno ya configuró en el curso');

  // Revisión, baja 6: también si viene del entorno de quien ejecuta (no solo del curso).
  const raiz2 = cursoTemporal();
  iniciarGit(raiz2);
  const antes = process.env.GIT_SSH_COMMAND;
  process.env.GIT_SSH_COMMAND = 'ssh -i /otra/clave/del/entorno';
  try {
    assert.equal(g.entornoSinPrompt(raiz2).GIT_SSH_COMMAND, 'ssh -i /otra/clave/del/entorno');
  } finally {
    if (antes === undefined) delete process.env.GIT_SSH_COMMAND; else process.env.GIT_SSH_COMMAND = antes;
  }
});

test('urlPush: sin remoto configurado, null', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  assert.equal(g.urlPush(raiz), null);
});

// Revisión, baja 3: un segmento que sea solo puntos, o que termine en ".git" de verdad, no es un owner/repo.
test('repoGithubDe: rechaza segmentos que son solo puntos, o que terminan en .git', () => {
  assert.equal(g.repoGithubDe('https://github.com/./ana.git'), null);
  assert.equal(g.repoGithubDe('https://github.com/../ana.git'), null);
  assert.equal(g.repoGithubDe('https://github.com/ana/..git'), null);
  assert.equal(g.repoGithubDe('https://github.com/ana/curso.git'), 'ana/curso', 'el .git normal de la URL no cuenta: ya se ha quitado');
});
