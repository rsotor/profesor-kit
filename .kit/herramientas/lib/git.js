'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ejecutar, explicar } = require('./proceso');

function intentarGit(raiz, args, opciones = {}) {
  return ejecutar('git', args, { cwd: raiz, ...opciones });
}

// Entorno para una llamada de red (fetch/push/ls-remote/clone): nunca se queda esperando una contraseña o el
// visto bueno de una huella SSH que nadie va a teclear (revisión de #50/B). `core.sshCommand` (del curso) o
// `GIT_SSH_COMMAND`/`GIT_SSH` (del entorno de quien lo ejecuta) son decisiones ya tomadas por el alumno o por
// su asistente (una clave con passphrase, un `ssh -i`…): si hay alguno, se respeta tal cual; si no hay
// ninguno, se fuerza BatchMode para que un `ssh` que sí pida algo falle rápido en vez de colgarse (revisión,
// baja 6).
function entornoSinPrompt(raiz) {
  const extra = { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', SSH_ASKPASS_REQUIRE: 'never' };
  const tieneSshPropio = intentarGit(raiz, ['config', 'core.sshCommand']).ok || process.env.GIT_SSH_COMMAND || process.env.GIT_SSH;
  if (!tieneSshPropio) extra.GIT_SSH_COMMAND = 'ssh -o BatchMode=yes';
  return { ...process.env, ...extra };
}

// Como intentarGit, pero para lo que toca red: con timeout (nunca se cuelga) y sin prompts. Mata el proceso
// (git) al vencer el tiempo (killSignal): no se queda él mismo colgado para siempre. Un `ssh` que git hubiera
// lanzado como hijo suyo puede sobrevivir como huérfano — SIGKILL no se propaga a los nietos del proceso — no
// es perfecto, pero evita que se cuelgue el propio kit (revisión, baja 6: el comentario anterior decía "sin
// huérfanos", y no es exacto).
function intentarGitRed(raiz, args, { timeoutMs = 20000 } = {}) {
  return intentarGit(raiz, args, { env: entornoSinPrompt(raiz), timeout: timeoutMs, killSignal: 'SIGKILL' });
}

// Rutas que guardar.js regenera siempre enteras (la lista única, en lib/vault.js): si un intento de merge
// fallido dejó alguna de ellas como añadida sin trackear, es segura de limpiar (se regenera sola en el
// siguiente guardado).
const GENERADOS_ENTEROS_CONOCIDOS = require('./vault').GENERADOS_ENTEROS.map(rel => `estudio/${rel}`);

function existeMergeEnCurso(raiz) {
  for (const rel of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'rebase-merge', 'rebase-apply']) {
    const r = intentarGit(raiz, ['rev-parse', '--git-path', rel]);
    if (r.ok && fs.existsSync(path.resolve(raiz, r.stdout.trim()))) return true;
  }
  return false;
}

// `git merge --abort` se niega si el árbol de trabajo tiene cambios por encima de lo que el propio merge dejó
// (visto de verdad: preparar.js/guardar.js regeneran ficheros con fs.writeFileSync, fuera del índice, antes de
// decidir si hay que abortar): "Entry '…' not uptodate. Cannot merge." Nunca deja el merge a medias por eso
// (revisión de la 0.27, alta 3/4 y media 1), pero tampoco descarta trabajo sin guardar a la ligera:
//   1. Sin ningún merge/rebase/cherry-pick en curso, no hay nada que abortar: no se toca nada (evita borrar
//      trabajo sin guardar cuando el merge ni siquiera llegó a empezar — rechazado por git antes de tocar el
//      árbol de trabajo).
//   2. `git merge --abort` normal.
//   3. Si no puede, `git reset --merge` (más cuidadoso: intenta preservar lo que solo esté en el árbol de
//      trabajo, no en el merge).
//   4. Si ni eso puede (hay cambios de más que chocan de verdad con lo que hay que restaurar), antes de
//      descartar nada se copia aparte (fuera del índice) todo lo que hubiera sin guardar
//      (`git ls-files -m -o --exclude-standard`) a `.git/kit-rescate/<fecha>/`, y se devuelve esa ruta para
//      que quien llama la diga. Solo entonces un `reset --hard` al HEAD de antes, y un `clean` limitado a lo
//      que el propio intento de merge había añadido (no todo lo sin trackear del curso).
function abortarMerge(raiz) {
  if (!existeMergeEnCurso(raiz)) return { ok: true, rescatado: null };
  if (intentarGit(raiz, ['merge', '--abort']).ok) return { ok: true, rescatado: null };
  if (intentarGit(raiz, ['reset', '--merge']).ok) return { ok: true, rescatado: null };

  const sinGuardar = intentarGit(raiz, ['ls-files', '-z', '-m', '-o', '--exclude-standard']).stdout.split('\0').filter(Boolean);
  let rescatado = null;
  if (sinGuardar.length) {
    const marca = new Date().toISOString().replace(/[:.]/g, '-');
    const carpeta = path.join(raiz, '.git', 'kit-rescate', marca);
    fs.mkdirSync(carpeta, { recursive: true });
    for (const rel of sinGuardar) {
      const origen = path.join(raiz, ...rel.split('/'));
      if (!fs.existsSync(origen) || fs.statSync(origen).isDirectory()) continue;
      const destino = path.join(carpeta, rel.replace(/[\\/]/g, '__'));
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(origen, destino);
    }
    rescatado = carpeta;
  }

  // Lo que el propio merge (a medio camino) había añadido: lo único que hace falta quitar aparte con clean
  // (leído ANTES del reset --hard, mientras MERGE_HEAD todavía existe).
  const anadidos = intentarGit(raiz, ['diff', '--name-only', '-z', '--diff-filter=A', 'HEAD', 'MERGE_HEAD']);
  const rutasLimpiar = anadidos.ok ? anadidos.stdout.split('\0').filter(Boolean) : [];

  intentarGit(raiz, ['reset', '--hard', 'HEAD']);
  for (const rel of [...rutasLimpiar, ...GENERADOS_ENTEROS_CONOCIDOS]) intentarGit(raiz, ['clean', '-fd', '--', rel]);
  intentarGit(raiz, ['merge', '--abort']);
  const ruta = intentarGit(raiz, ['rev-parse', '--git-path', 'MERGE_HEAD']);
  const limpio = !(ruta.ok && fs.existsSync(path.resolve(raiz, ruta.stdout.trim())));
  return { ok: limpio, rescatado };
}

function git(raiz, args) {
  const r = intentarGit(raiz, args);
  if (!r.ok) throw new Error(`git ${args[0]} falló: ${explicar(r)}`);
  return r.salida;
}

// La raíz del curso tiene que ser la raíz de su propio repositorio (o de una copia de trabajo suya, un worktree).
// Estar "dentro" de uno no basta: un curso sin git propio dentro de otro repositorio guardaría en el de fuera
// (issue #39, H03). Se comparan rutas reales: en macOS /tmp es /private/tmp, y en Windows git usa `/`.
// Si el entorno no deja ejecutar git (el sandbox de un asistente), no se sabe si es un repositorio: se lanza un error
// EPERM, que lib/arranque.js explica como "autoriza la ejecución fuera del entorno restringido" (issues #33 y #36).
function esRepo(raiz, { intentar = intentarGit } = {}) {
  const cima = intentar(raiz, ['rev-parse', '--show-toplevel']);
  if (cima.motivo === 'permiso') {
    const error = new Error('el entorno de tu asistente no deja ejecutar git aquí');
    error.code = 'EPERM';
    throw error;
  }
  if (!cima.ok) return false;
  const real = p => fs.realpathSync.native(path.resolve(p));
  try { return real(cima.stdout.trim()) === real(raiz); } catch { return false; }
}
const hayCambios = raiz => git(raiz, ['status', '--porcelain']) !== '';
const shaActual = raiz => git(raiz, ['rev-parse', 'HEAD']);
// La rama en la que está HEAD ahora mismo: 'preparacion/<id>' en una copia de trabajo de preparar.js,
// o 'HEAD' si está en detached HEAD (no debería pasar en un curso normal).
const ramaActual = raiz => git(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
// `git var` decide como decide `git commit`: una identidad vacía (user.name= en el global de una máquina con
// varias cuentas) hace que `git config` responda pero el commit falle.
const tieneIdentidad = raiz =>
  intentarGit(raiz, ['var', 'GIT_AUTHOR_IDENT']).ok && intentarGit(raiz, ['var', 'GIT_COMMITTER_IDENT']).ok;

function urlOrigen(raiz) {
  const r = intentarGit(raiz, ['remote', 'get-url', 'origin']);
  return r.ok ? r.salida : null;
}

// A dónde va de verdad un `git push`: si el alumno (u otro asistente) configuró un `pushurl` distinto del de
// lectura, es ESE el que hay que comprobar como destino seguro, no el de fetch (revisión de la 0.27, grave 1).
// Sin `pushurl` propio, git ya cae solo al de fetch: `git remote get-url --push` lo hace por nosotros.
function urlPush(raiz) {
  const r = intentarGit(raiz, ['remote', 'get-url', '--push', 'origin']);
  return r.ok ? r.salida : null;
}

// Owner/repo de una URL de GitHub, o de la del proxy de git de Claude Code en la nube (revisión, alta 5):
// `http(s)://[usuario@]127.0.0.1(:puerto)/git/<owner>/<repo>` — el contenedor no habla directo con GitHub, pasa
// por ese proxy local, pero para la comprobación de privacidad (la API) el repo de verdad es el mismo. Estricto:
// exige que el HOST sea github.com (o el proxy local), nunca que la cadena "github.com" aparezca en cualquier
// parte de la URL — un `https://gitlab.com/github.com/ana/repo.git` no es GitHub (revisión, grave 1). El
// usuario en la forma corta SSH (`user@github.com:owner/repo`) es opcional: `github.com:owner/repo.git` es
// sintaxis SSH corta válida igual (revisión, grave 1 de la segunda ronda).
const OWNER_REPO = '[A-Za-z0-9._-]+';
const RE_URI = new RegExp(`^(?:https?|ssh|git)://(?:[^@/]+@)?github\\.com(?::\\d+)?/(${OWNER_REPO})/(${OWNER_REPO}?)(?:\\.git)?/?$`, 'i');
const RE_SCP = new RegExp(`^(?:[^@/]+@)?github\\.com:(${OWNER_REPO})/(${OWNER_REPO}?)(?:\\.git)?/?$`, 'i');
const RE_PROXY_NUBE = new RegExp(`^https?://(?:[^@/]+@)?(?:127\\.0\\.0\\.1|localhost)(?::\\d+)?/git/(${OWNER_REPO})/(${OWNER_REPO}?)(?:\\.git)?/?$`, 'i');
// Un segmento que sea solo puntos (".", "..") o que termine literalmente en ".git" no es un owner/repo de
// verdad (revisión, baja 3): son restos de una URL mal formada o de una manipulación, no un repo real.
const segmentoValido = s => s !== '.' && s !== '..' && !/\.git$/i.test(s);
function repoGithubDe(url) {
  const m = RE_URI.exec(url) || RE_SCP.exec(url) || RE_PROXY_NUBE.exec(url);
  if (!m || !segmentoValido(m[1]) || !segmentoValido(m[2])) return null;
  return `${m[1]}/${m[2]}`;
}

// ¿Es esta URL el propio repositorio del kit? Sin distinguir mayúsculas (issue #39, H07; revisión, media 7):
// usado tanto para no subir nunca al kit (guardar.js) como para no ofrecer sincronizar con él (estado.js).
function esUrlDelKit(url, repoKit) {
  if (!repoKit) return false;
  const repo = repoGithubDe(url);
  return Boolean(repo) && repo.toLowerCase() === repoKit.toLowerCase();
}

module.exports = {
  git, intentarGit, intentarGitRed, entornoSinPrompt, esRepo, hayCambios, shaActual, ramaActual, tieneIdentidad,
  urlOrigen, urlPush, repoGithubDe, esUrlDelKit, abortarMerge,
};
