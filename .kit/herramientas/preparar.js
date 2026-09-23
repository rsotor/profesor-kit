'use strict';
// Preparación de una clase en segundo plano (plan 0.22, §3.3): mientras el alumno sigue con la tutoría
// (calentamiento, dudas, un examen), el profesor puede dejar que el material nuevo se procese aparte, en
// una copia de trabajo independiente (`git worktree`), sin que el alumno tenga que esperar delante de la
// pantalla. Tres órdenes:
//
//   --lanzar <ficheros de estudio/inbox/> --id <id de sesión>   (una sola preparación a la vez)
//   --estado                                                    (en curso / terminada / fallida)
//   --juntar <id>                                                (mezcla la copia con el curso principal)
//
// Y una interna, que no usa el profesor a mano: `--trabajar <id>` es el envoltorio que se lanza como
// proceso aparte (`detached`) y sobrevive a que se cierre la ventana; ejecuta el asistente sin
// conversación (el comando del adaptador, campo `segundo_plano`) y, al terminar, deja escrito
// `.preparacion/<id>/estado.json` con el resultado — ese fichero es el contrato fijo que lee `estado.js`
// al arrancar cada sesión.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const v = require('./lib/vault');
const g = require('./lib/git');
const { comprobar } = require('./comprobar');
const { regenerarGenerados, anotarEnDiario, subirSiProcede } = require('./guardar');

const CARPETA_PREPARACION = '.preparacion';
const dirDe = (raiz, id) => path.join(raiz, CARPETA_PREPARACION, id);
const ramaDe = id => `preparacion/${id}`;
const idValido = id => typeof id === 'string' && /^[\w.-]+$/.test(id);

// --- estado.json: el contrato fijo que lee estado.js -----------------------------------------------

function leerEstadoCrudo(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'estado.json'), 'utf8'));
}
function escribirEstado(dir, estado) {
  fs.writeFileSync(path.join(dir, 'estado.json'), JSON.stringify(estado, null, 2) + '\n');
}
// Lee y modifica sin perder lo que haya escrito el proceso en marcha a la vez (pid, ficheros...).
function actualizarEstado(dir, cambios) {
  const estado = { ...leerEstadoCrudo(dir), ...cambios };
  escribirEstado(dir, estado);
  return estado;
}

// ¿Sigue vivo el proceso de ese pid? En Windows y en Mac/Linux, `process.kill(pid, 0)` no mata nada:
// solo pregunta. EPERM significa que existe pero no es nuestro (lo tratamos como vivo, por prudencia).
function pidVivo(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

// El estado tal como lo ve el alumno: si `resultado` sigue "en-curso" pero el proceso ya no existe, el
// ordenador se apagó o se durmió a medio camino. No se reescribe el "en-curso" del contrato (lo lee
// estado.js tal cual): "interrumpida" es solo la lectura en caliente de --estado y de --lanzar/--juntar.
function estadoEnCaliente(dir) {
  const estado = leerEstadoCrudo(dir);
  const interrumpida = estado.resultado === 'en-curso' && !pidVivo(estado.pid);
  return { ...estado, resultadoEnCaliente: interrumpida ? 'interrumpida' : estado.resultado };
}

function todasLasPreparaciones(raiz) {
  const base = path.join(raiz, CARPETA_PREPARACION);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base)
    .filter(id => fs.existsSync(path.join(base, id, 'estado.json')))
    .map(id => estadoEnCaliente(dirDe(raiz, id)));
}

// Borra la copia de trabajo y su rama sin tocar el curso principal: para una preparación fallida o
// interrumpida, cuyo trabajo se descarta (el alumno puede pedir que se vuelva a preparar).
function descartarCopia(raiz, id) {
  g.intentarGit(raiz, ['worktree', 'remove', '--force', dirDe(raiz, id)]);
  g.intentarGit(raiz, ['worktree', 'prune']);
  g.intentarGit(raiz, ['branch', '-D', ramaDe(id)]);
  fs.rmSync(dirDe(raiz, id), { recursive: true, force: true, maxRetries: 3 });
}

// --- El prompt de segundo plano ---------------------------------------------------------------------

const PROMPT_SEGUNDO_PLANO = 'Trabajas en segundo plano, sin el alumno delante de la pantalla: no saludes, '
  + 'no preguntes nada y no compruebes si hay una versión nueva del kit. Ante cualquier duda, la opción más '
  + 'conservadora: déjala anotada como TODO en vez de preguntar. Al terminar, guarda.';

function construirPrompt(ficheros, id) {
  const lista = ficheros.map(f => `estudio/inbox/${f}`).join(' y ');
  return `${PROMPT_SEGUNDO_PLANO} He dejado los apuntes de la clase en ${lista}. Procésalos siguiendo la `
    + `skill /sesion (son la misma clase, con id ${id}).`;
}

// --- Lanzar ------------------------------------------------------------------------------------------

function lanzar(raiz, { ficheros, id }) {
  if (!g.esRepo(raiz)) return { lanzada: false, motivo: 'sin-repo' };
  const ajustes = v.leerAjustes(raiz);
  const adaptador = v.leerAdaptador(raiz, ajustes.llm);
  if (!adaptador || !Array.isArray(adaptador.segundo_plano) || !adaptador.segundo_plano.length) {
    return { lanzada: false, motivo: 'sin-segundo-plano' };
  }
  if (!idValido(id)) return { lanzada: false, motivo: 'id-invalido' };
  if (!ficheros || !ficheros.length) return { lanzada: false, motivo: 'sin-ficheros' };
  for (const f of ficheros) {
    if (!fs.existsSync(path.join(v.baseAlumno(raiz), 'inbox', f))) return { lanzada: false, motivo: 'fichero-ausente', fichero: f };
  }

  const [existente] = todasLasPreparaciones(raiz);
  if (existente) {
    if (existente.resultadoEnCaliente === 'terminada') return { lanzada: false, motivo: 'hay-terminada', id: existente.id };
    if (existente.resultadoEnCaliente === 'en-curso') return { lanzada: false, motivo: 'en-marcha', id: existente.id };
    // fallida o interrumpida: no hay nada que rescatar (el curso principal nunca se tocó), se descarta sola.
    descartarCopia(raiz, existente.id);
  }
  if (fs.existsSync(dirDe(raiz, id))) return { lanzada: false, motivo: 'id-en-uso', id };

  fs.mkdirSync(path.join(raiz, CARPETA_PREPARACION), { recursive: true });
  const rWorktree = g.intentarGit(raiz, ['worktree', 'add', '-b', ramaDe(id), dirDe(raiz, id)]);
  if (!rWorktree.ok) return { lanzada: false, motivo: 'worktree', detalle: rWorktree.salida };

  const dir = dirDe(raiz, id);
  escribirEstado(dir, { id, ficheros, pid: null, inicio: new Date().toISOString(), fin: null, resultado: 'en-curso', rama: ramaDe(id) });

  const hijo = spawn(process.execPath, [__filename, '--trabajar', id], { cwd: raiz, detached: true, stdio: 'ignore' });
  hijo.unref();
  actualizarEstado(dir, { pid: hijo.pid });

  return { lanzada: true, id, dir, rama: ramaDe(id) };
}

// --- El envoltorio que corre en segundo plano (proceso aparte, detached) -----------------------------

// Nunca deja `estado.json` en "en-curso" para siempre si algo revienta antes de lanzar el asistente:
// captura sus propios fallos y los deja en el registro, como si el asistente hubiera fallado.
function trabajar(raiz, id) {
  const dir = dirDe(raiz, id);
  const registro = path.join(dir, 'registro.txt');
  try {
    const estado = leerEstadoCrudo(dir);
    const ajustes = v.leerAjustes(raiz);
    const adaptador = v.leerAdaptador(raiz, ajustes.llm);
    const modelo = ((adaptador.modelo_recomendado && adaptador.modelo_recomendado.modelo) || 'sonnet').toLowerCase();
    const prompt = construirPrompt(estado.ficheros, id);
    const args = adaptador.segundo_plano.map(a => a.replace('{prompt}', prompt).replace('{modelo}', modelo));

    // En Windows, el comando del adaptador suele ser un .cmd: solo se puede lanzar con `shell: true`. Con
    // shell:true, Node escapa cada argumento por su cuenta (también las comillas del prompt).
    const opciones = { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' };
    const r = spawnSync(adaptador.comando, args, opciones);
    const ok = !r.error && r.status === 0;
    const salida = ((r.stdout || '') + (r.stderr || '') + (r.error ? `\n${r.error.message}` : '')).trim();
    fs.writeFileSync(registro, `${salida}\n`);
    actualizarEstado(dir, { fin: new Date().toISOString(), resultado: ok ? 'terminada' : 'fallida' });
  } catch (error) {
    try { fs.writeFileSync(registro, `Fallo inesperado preparando la clase: ${error.message}\n`); } catch { /* nada que hacer */ }
    try { actualizarEstado(dir, { fin: new Date().toISOString(), resultado: 'fallida' }); } catch { /* estado.json ni existía */ }
  }
}

// --- Juntar --------------------------------------------------------------------------------------------

// Ficheros que "se toma cualquiera de los dos lados y se regeneran después, que es lo que son" (plan
// §3.3): todo lo que escribe regenerarGenerados() y los pies de sesión (que van dentro de las propias
// notas de estudio/sesiones/, no en un fichero aparte).
function ficheroResoluble(rel) {
  if (rel === 'README.md') return true;
  if (rel === 'estudio/ejercicios/_index.md') return true;
  if (rel.startsWith('estudio/sesiones/') && rel.endsWith('.md')) return true;
  const base = path.posix.basename(rel);
  return rel.startsWith('estudio/') && ['inicio.md', 'pendientes.md', 'formulario.md', 'auditoria-del-material.md'].includes(base);
}

// El driver "union" es de git de fábrica (no hace falta declarar merge.union.driver): basta con la
// marca en .git/info/attributes. No toca .gitattributes del curso, así que no es nada que el alumno vea.
function configurarUnionParaDiario(raiz) {
  const linea = 'config/diario.md merge=union';
  const fichero = path.join(raiz, '.git', 'info', 'attributes');
  const previo = fs.existsSync(fichero) ? fs.readFileSync(fichero, 'utf8') : '';
  if (previo.split(/\r?\n/).includes(linea)) return;
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, previo.replace(/\n*$/, '') + (previo ? '\n' : '') + linea + '\n');
}

// El título de la sesión que acaba de mezclarse, para el mensaje de commit ("sesion(<id>): <tema>").
function temaDeSesion(raiz, id) {
  const dir = path.join(v.baseAlumno(raiz), 'sesiones');
  for (const f of v.recorrer(dir, n => n.endsWith('.md') && !n.startsWith('_'))) {
    if (path.basename(f).startsWith(`${id}-`)) {
      const m = /^#\s+(.+)$/m.exec(fs.readFileSync(f, 'utf8'));
      if (m) return m[1].trim();
    }
  }
  return id;
}

function juntar(raiz, id) {
  const dir = dirDe(raiz, id);
  if (!fs.existsSync(path.join(dir, 'estado.json'))) return { juntado: false, motivo: 'no-existe' };
  const estado = estadoEnCaliente(dir);
  if (estado.resultadoEnCaliente !== 'terminada') return { juntado: false, motivo: estado.resultadoEnCaliente, estado };

  configurarUnionParaDiario(raiz);
  const rMerge = g.intentarGit(raiz, ['merge', '--no-commit', '--no-ff', estado.rama]);
  const lineasEstado = g.intentarGit(raiz, ['status', '--porcelain']).salida.split(/\r?\n/).filter(Boolean);
  const conflictos = lineasEstado.filter(l => /^(UU|AA|DD|AU|UA|UD|DU) /.test(l)).map(l => l.slice(3).trim());

  if (!rMerge.ok && !conflictos.length) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'error-merge', detalle: rMerge.salida }; }
  if (conflictos.length) {
    const noResolubles = conflictos.filter(f => !ficheroResoluble(f));
    if (noResolubles.length) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'choque', ficheros: noResolubles }; }
    for (const f of conflictos) { g.git(raiz, ['checkout', '--ours', '--', f]); g.git(raiz, ['add', '--', f]); }
  }

  regenerarGenerados(raiz);
  const informe = comprobar(raiz);
  if (informe.errores.length) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'errores', informe }; }

  const hoy = new Date().toISOString().slice(0, 10);
  const mensaje = `sesion(${id}): ${temaDeSesion(raiz, id)} (preparada en segundo plano)`;
  anotarEnDiario(raiz, mensaje, hoy);
  g.git(raiz, ['add', '-A']);
  g.git(raiz, ['commit', '-q', '-m', mensaje]);
  const subida = subirSiProcede(raiz, informe);

  descartarCopia(raiz, id);
  return { juntado: true, mensaje, informe, ...subida };
}

// --- CLI -------------------------------------------------------------------------------------------

const EXPLICACION_LANZAR = {
  'sin-repo': 'esta carpeta no es un repositorio git.',
  'sin-segundo-plano': 'tu asistente no puede trabajar en segundo plano: prepara la clase en primer plano.',
  'id-invalido': 'el id de la sesión solo puede llevar letras, números, puntos y guiones.',
  'sin-ficheros': 'falta al menos un fichero de estudio/inbox/.',
  'en-marcha': r => `ya hay una preparación en marcha (${r.id}). Usa --estado para verla.`,
  'hay-terminada': r => `hay una preparación terminada sin juntar (${r.id}). Júntala primero: --juntar ${r.id}.`,
  'id-en-uso': r => `ya existe una copia con el id ${r.id}.`,
  'worktree': r => `no se pudo crear la copia de trabajo: ${r.detalle}`,
  'fichero-ausente': r => `${r.fichero} no está en estudio/inbox/.`,
};

function explicar(mapa, r) {
  const e = mapa[r.motivo];
  return typeof e === 'function' ? e(r) : e || r.motivo;
}

function formatearEstado(estado, dir) {
  if (estado.resultadoEnCaliente === 'en-curso') {
    const minutos = Math.max(0, Math.round((Date.now() - Date.parse(estado.inicio)) / 60000));
    return `En curso (${minutos} min): ${estado.id} — ${estado.ficheros.join(', ')}`;
  }
  if (estado.resultadoEnCaliente === 'terminada') return `Terminada: ${estado.id} — lista para juntar (--juntar ${estado.id}).`;
  if (estado.resultadoEnCaliente === 'interrumpida') {
    return `Interrumpida: ${estado.id} — el proceso se paró a medias (¿se apagó o se durmió el ordenador?). El curso principal no se tocó; la próxima vez que se lance una preparación, esta se descarta sola.`;
  }
  const registro = path.join(dir, 'registro.txt');
  const ultimas = fs.existsSync(registro) ? fs.readFileSync(registro, 'utf8').trim().split(/\r?\n/).slice(-5).join('\n') : '(sin registro)';
  return `Fallida: ${estado.id} — últimas líneas del registro:\n${ultimas}`;
}

function cliEstado(raiz, json) {
  const preparaciones = todasLasPreparaciones(raiz);
  if (json) { console.log(JSON.stringify(preparaciones)); return 0; }
  if (!preparaciones.length) { console.log('No hay ninguna preparación en marcha.'); return 0; }
  for (const estado of preparaciones) console.log(formatearEstado(estado, dirDe(raiz, estado.id)));
  return 0;
}

function cliLanzar(raiz, args) {
  const iLanzar = args.indexOf('--lanzar');
  const iId = args.indexOf('--id');
  const id = iId >= 0 ? args[iId + 1] : null;
  const ficheros = [];
  for (let i = iLanzar + 1; i < args.length; i++) { if (args[i] === '--id') break; ficheros.push(args[i]); }
  const r = lanzar(raiz, { ficheros, id });
  if (!r.lanzada) { console.log(`No se ha lanzado: ${explicar(EXPLICACION_LANZAR, r)}`); return 1; }
  console.log(`Preparando la clase ${r.id} en segundo plano (rama ${r.rama}). Usa --estado para ver cómo va.`);
  return 0;
}

function cliJuntar(raiz, id) {
  const r = juntar(raiz, id);
  if (r.juntado) { console.log(`Juntada: ${r.mensaje}${r.subido ? ' (subida a GitHub)' : ` (en local: ${r.motivoSubida})`}`); return 0; }
  if (r.motivo === 'no-existe') { console.log(`No hay ninguna preparación con id ${id}.`); return 1; }
  if (r.motivo === 'en-curso') { console.log('Todavía está en marcha: espera a que termine (--estado).'); return 1; }
  if (r.motivo === 'fallida') { console.log('Esa preparación falló: revisa el registro (--estado) y vuelve a lanzarla.'); return 1; }
  if (r.motivo === 'interrumpida') { console.log('Se interrumpió antes de terminar: no hay nada que juntar. Vuelve a lanzarla.'); return 1; }
  if (r.motivo === 'choque') { console.log(`Hay un choque real que no se resuelve solo, en: ${r.ficheros.join(', ')}. El curso principal no se ha tocado; la copia sigue en preparacion/${id}.`); return 1; }
  if (r.motivo === 'errores') { console.log(`Tras juntar, comprobar.js da errores: no se ha guardado. El curso principal no se ha tocado.\n${r.informe.errores.map(e => `  [${e.regla}] ${e.fichero} — ${e.detalle}`).join('\n')}`); return 1; }
  console.log(`No se ha podido juntar: ${r.detalle || r.motivo}`);
  return 1;
}

function cli(args, raiz) {
  if (args.includes('--trabajar')) { trabajar(raiz, args[args.indexOf('--trabajar') + 1]); return 0; }
  if (args.includes('--estado')) return cliEstado(raiz, args.includes('--json'));
  if (args.includes('--juntar')) return cliJuntar(raiz, args[args.indexOf('--juntar') + 1]);
  if (args.includes('--lanzar')) return cliLanzar(raiz, args);
  console.error('Uso: node .kit/herramientas/preparar.js --lanzar <ficheros de inbox> --id <id> | --estado | --juntar <id>');
  return 2;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'preparar.js');

module.exports = {
  lanzar, trabajar, juntar, cli, todasLasPreparaciones, formatearEstado, ficheroResoluble, pidVivo, descartarCopia,
  construirPrompt, dirDe, ramaDe,
};
