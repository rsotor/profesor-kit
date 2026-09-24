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
const { instalarSkills } = require('./instalar-skills');
const indice = require('./lib/indice');
const { actualizarEstadoReadme } = require('./lib/generados');
const os = require('node:os');

const CARPETA_PREPARACION = '.preparacion';
const dirDe = (raiz, id) => path.join(raiz, CARPETA_PREPARACION, id);
const ramaDe = id => `preparacion/${id}`;
const idValido = id => typeof id === 'string' && /^[\w.-]+$/.test(id);

// --- estado.json: el contrato fijo que lee estado.js -----------------------------------------------

function leerEstadoCrudo(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'estado.json'), 'utf8'));
}
// Escritura atómica (issue #39, H05): se escribe en un temporal y se renombra, para que un corte a medias nunca deje
// un estado.json roto que estado.js no pueda leer.
function escribirEstado(dir, estado) {
  const temporal = path.join(dir, `estado.json.${process.pid}.tmp`);
  fs.writeFileSync(temporal, JSON.stringify(estado, null, 2) + '\n');
  fs.renameSync(temporal, path.join(dir, 'estado.json'));
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

// Borra la copia de trabajo y su rama sin tocar el curso principal. Tras juntar, no queda nada que guardar. Al
// descartar una preparación fallida o interrumpida (`conservar`), antes se guarda lo recuperable (issue #39, H05):
// su registro en `.preparacion/descartadas/` y, si llegó a guardar algo, su rama con otro nombre. Solo las últimas
// CONSERVADAS de cada cosa, para no acumular basura.
const CONSERVADAS = 3;
function descartarCopia(raiz, id, { conservar = false } = {}) {
  const dir = dirDe(raiz, id);
  if (conservar) {
    const marca = new Date().toISOString().replace(/[:.]/g, '-');
    const carpeta = path.join(raiz, CARPETA_PREPARACION, 'descartadas');
    fs.mkdirSync(carpeta, { recursive: true });
    const registro = path.join(dir, 'registro.txt');
    if (fs.existsSync(registro)) fs.copyFileSync(registro, path.join(carpeta, `${id}-${marca}.txt`));
    for (const viejo of fs.readdirSync(carpeta).filter(n => n.endsWith('.txt')).sort().reverse().slice(CONSERVADAS)) {
      fs.rmSync(path.join(carpeta, viejo), { force: true });
    }
    let base = null;
    try { base = leerEstadoCrudo(dir).base; } catch { /* sin estado */ }
    const conTrabajo = base && g.intentarGit(raiz, ['rev-list', '--count', `${base}..${ramaDe(id)}`]).salida.trim() !== '0';
    if (conTrabajo) g.intentarGit(raiz, ['branch', '-m', ramaDe(id), `preparacion-descartada/${id}-${marca}`]);
    const guardadas = g.intentarGit(raiz, ['for-each-ref', '--sort=-refname', '--format=%(refname:short)', 'refs/heads/preparacion-descartada/']);
    for (const rama of (guardadas.ok ? guardadas.salida.split(/\r?\n/).filter(Boolean) : []).slice(CONSERVADAS)) g.intentarGit(raiz, ['branch', '-D', rama]);
  }
  g.intentarGit(raiz, ['worktree', 'remove', '--force', dir]);
  g.intentarGit(raiz, ['worktree', 'prune']);
  g.intentarGit(raiz, ['branch', '-D', ramaDe(id)]);
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
}

// Un solo lanzamiento a la vez, también si dos llegan en el mismo instante (issue #39, H05): un fichero que se crea
// en exclusiva. Uno olvidado (el proceso murió sin soltarlo) caduca a los CERROJO_CADUCA_MS.
const CERROJO_CADUCA_MS = 5 * 60 * 1000;
function tomarCerrojo(raiz) {
  const carpeta = path.join(raiz, CARPETA_PREPARACION);
  fs.mkdirSync(carpeta, { recursive: true });
  const f = path.join(carpeta, '.cerrojo');
  try {
    if (Date.now() - fs.statSync(f).mtimeMs > CERROJO_CADUCA_MS) fs.rmSync(f, { force: true });
  } catch { /* no había cerrojo */ }
  try {
    fs.writeFileSync(f, String(process.pid), { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') return null;
    throw error;
  }
  return () => fs.rmSync(f, { force: true });
}

// estado.json y registro.txt viven en la raíz de la copia de trabajo, pero no son del curso: no pueden entrar en
// sus guardados (issue #39, H05). Se excluyen en el `info/exclude` común a todas las copias.
function excluirEstadoDeGit(raiz) {
  const comun = g.intentarGit(raiz, ['rev-parse', '--git-common-dir']);
  if (!comun.ok) return;
  const fichero = path.resolve(raiz, comun.salida.trim(), 'info', 'exclude');
  const previo = fs.existsSync(fichero) ? fs.readFileSync(fichero, 'utf8') : '';
  const faltan = ['/estado.json', '/estado.json.*.tmp', '/registro.txt'].filter(l => !previo.split(/\r?\n/).includes(l));
  if (!faltan.length) return;
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, previo.replace(/\n*$/, '') + (previo ? '\n' : '') + faltan.join('\n') + '\n');
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

  const soltar = tomarCerrojo(raiz);
  if (!soltar) return { lanzada: false, motivo: 'lanzando' };
  try {
    return lanzarConCerrojo(raiz, { ficheros, id, adaptador });
  } finally {
    soltar();
  }
}

function lanzarConCerrojo(raiz, { ficheros, id, adaptador }) {
  const [existente] = todasLasPreparaciones(raiz);
  if (existente) {
    if (existente.resultadoEnCaliente === 'terminada') return { lanzada: false, motivo: 'hay-terminada', id: existente.id };
    if (existente.resultadoEnCaliente === 'en-curso') return { lanzada: false, motivo: 'en-marcha', id: existente.id };
    // fallida o interrumpida: el curso principal nunca se tocó; se descarta guardando lo recuperable.
    descartarCopia(raiz, existente.id, { conservar: true });
  }
  if (fs.existsSync(dirDe(raiz, id))) return { lanzada: false, motivo: 'id-en-uso', id };

  // El material de la clase entra en la copia tal cual está ahora (issue #39, H05). La copia sale del último
  // guardado: si el material está sin guardar (lo normal: el alumno acaba de dejarlo en inbox), se guarda antes
  // solo ese material, sin tocar nada más de lo que haya sin guardar.
  const rutas = ficheros.map(f => `${v.CARPETA_ALUMNO}/inbox/${f}`);
  if (g.intentarGit(raiz, ['status', '--porcelain', '--', ...rutas]).salida.trim()) {
    if (!g.tieneIdentidad(raiz)) return { lanzada: false, motivo: 'sin-identidad' };
    g.git(raiz, ['add', '--', ...rutas]);
    g.git(raiz, ['commit', '-q', '-m', `inbox: material de la clase ${id}`, '--', ...rutas]);
  }
  const huella = (cwd, rel) => g.intentarGit(cwd, ['hash-object', '--', rel]).salida.trim();
  const entradas = rutas.map(rel => ({ fichero: rel, huella: huella(raiz, rel) }));

  fs.mkdirSync(path.join(raiz, CARPETA_PREPARACION), { recursive: true });
  excluirEstadoDeGit(raiz);
  const base = g.shaActual(raiz).trim();
  const rWorktree = g.intentarGit(raiz, ['worktree', 'add', '-b', ramaDe(id), dirDe(raiz, id)]);
  if (!rWorktree.ok) return { lanzada: false, motivo: 'worktree', detalle: rWorktree.salida };
  const dir = dirDe(raiz, id);
  const distinta = entradas.find(e => huella(dir, e.fichero) !== e.huella);
  if (distinta) {
    descartarCopia(raiz, id);
    return { lanzada: false, motivo: 'entrada-distinta', fichero: distinta.fichero };
  }
  // Las skills no están en git (se ignoran): sin copiarlas, el asistente de la copia no encontraría /sesion.
  if (adaptador.skills) instalarSkills({ raiz: dir, destino: adaptador.skills });

  escribirEstado(dir, { id, ficheros, entradas, base, pid: null, inicio: new Date().toISOString(), fin: null, resultado: 'en-curso', rama: ramaDe(id) });

  const hijo = spawn(process.execPath, [__filename, '--trabajar', id], { cwd: raiz, detached: true, stdio: 'ignore' });
  hijo.unref();
  actualizarEstado(dir, { pid: hijo.pid });

  return { lanzada: true, id, dir, rama: ramaDe(id) };
}

// --- El envoltorio que corre en segundo plano (proceso aparte, detached) -----------------------------

// Tiempo máximo del asistente: una clase tarda entre 10 y 12 minutos (prueba real de la 0.21). Con 90 hay margen
// para una clase muy larga, y un asistente colgado no deja la preparación "en curso" para siempre.
const LIMITE_MS = 90 * 60 * 1000;

// ¿Hay en la copia, guardada después de `base`, una nota de sesión de esta clase (`<id>-…md`)?
function sesionGuardada(dir, id, base) {
  if (base && g.intentarGit(dir, ['rev-list', '--count', `${base}..HEAD`]).salida.trim() === '0') return false;
  const guardadas = g.intentarGit(dir, ['ls-tree', '-r', '--name-only', 'HEAD', '--', `${v.CARPETA_ALUMNO}/sesiones`]);
  return guardadas.ok && guardadas.salida.split(/\r?\n/).some(rel => path.posix.basename(rel).startsWith(`${id}-`) && rel.endsWith('.md'));
}

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
    const plan = comoLanzar({ comando: adaptador.comando, segundoPlano: adaptador.segundo_plano, promptPorStdin: adaptador.prompt_por_stdin === true,
      prompt: construirPrompt(estado.ficheros, id), modelo });
    if (plan.error) throw new Error(plan.error);
    const limite = Number(process.env.PROFESOR_KIT_PREPARAR_LIMITE_MS) || LIMITE_MS;
    const r = lanzarAsistente(plan, dir, limite);
    const salida = ((r.stdout || '') + (r.stderr || '') + (r.error ? `\n${r.error.message}` : '')).trim();
    // Que el asistente acabe con 0 no basta (issue #39, H05): tiene que haber guardado la sesión de esta clase.
    let motivo = null;
    if ((r.error && r.error.code === 'ETIMEDOUT') || r.signal) motivo = `se paró al llegar al límite de tiempo (${Math.round(limite / 60000)} min)`;
    else if (r.error || r.status !== 0) motivo = 'el asistente terminó con un error';
    else if (!sesionGuardada(dir, id, estado.base)) motivo = `el asistente terminó, pero no ha dejado la sesión ${id} guardada en la copia`;
    fs.writeFileSync(registro, `${salida}\n${motivo ? `\n[preparar.js] ${motivo}.\n` : ''}`);
    actualizarEstado(dir, { fin: new Date().toISOString(), resultado: motivo ? 'fallida' : 'terminada' });
  } catch (error) {
    try { fs.writeFileSync(registro, `Fallo inesperado preparando la clase: ${error.message}\n`); } catch { /* nada que hacer */ }
    try { actualizarEstado(dir, { fin: new Date().toISOString(), resultado: 'fallida' }); } catch { /* estado.json ni existía */ }
  }
}

// --- Cómo se lanza el asistente (issue #39, H01) ------------------------------------------------------

// El prompt lleva nombres de ficheros del alumno: nunca pasa por una shell. Con `prompt_por_stdin` en el
// adaptador va por la entrada estándar y los argumentos son solo valores fijos del adaptador más el modelo.
// Sin shell, Node pasa cada argumento tal cual. La excepción es Windows con un comando `.cmd`/`.bat` (así se
// instalan muchos asistentes con npm): solo se puede lanzar con cmd.exe, y entonces se exige que todos los
// argumentos sean limpios (sin espacios, comillas ni & | < > ^ % !), cosa que un prompt nunca es.
const ARGUMENTO_LIMPIO = /^[\w.:=/@+\\-]+$/;

function resolverEnWindows(comando, entorno) {
  if (path.isAbsolute(comando)) return comando;
  const extensiones = ['', ...(entorno.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)];
  for (const dir of (entorno.PATH || entorno.Path || '').split(path.delimiter).filter(Boolean)) {
    for (const ext of extensiones) {
      const candidato = path.join(dir, comando + ext.toLowerCase());
      if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
    }
  }
  return comando;
}

function comoLanzar({ comando, segundoPlano, promptPorStdin, prompt, modelo, plataforma = process.platform, entorno = process.env }) {
  if (!ARGUMENTO_LIMPIO.test(modelo)) return { error: `el modelo del adaptador no es válido: ${JSON.stringify(modelo)}` };
  if (promptPorStdin && segundoPlano.some(a => a.includes('{prompt}'))) {
    return { error: 'el adaptador tiene prompt_por_stdin y a la vez {prompt} en segundo_plano: el prompt va por uno de los dos sitios, no por los dos' };
  }
  const args = segundoPlano.map(a => a.replace('{modelo}', modelo).replace('{prompt}', prompt));
  const entrada = promptPorStdin ? prompt : undefined;
  if (plataforma !== 'win32') return { ejecutable: comando, args, entrada };
  const resuelto = resolverEnWindows(comando, entorno);
  if (!/\.(cmd|bat)$/i.test(resuelto)) return { ejecutable: resuelto, args, entrada };
  if (!args.every(a => ARGUMENTO_LIMPIO.test(a)) || /["%&|<>^!]/.test(resuelto)) {
    return { error: `en Windows, ${path.basename(resuelto)} solo se puede lanzar con argumentos fijos y limpios: pon prompt_por_stdin en el adaptador y quita {prompt} de segundo_plano` };
  }
  return { ejecutable: entorno.ComSpec || 'cmd.exe', args: ['/d', '/s', '/c', `""${resuelto}" ${args.join(' ')}"`], literal: true, entrada };
}

function lanzarAsistente(plan, cwd, limiteMs) {
  return spawnSync(plan.ejecutable, plan.args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: limiteMs, killSignal: 'SIGKILL',
    input: plan.entrada === undefined ? '' : plan.entrada, windowsVerbatimArguments: plan.literal === true, shell: false });
}

// --- Juntar --------------------------------------------------------------------------------------------

// Ficheros que se resuelven solos al juntar (plan §3.3). Dos clases:
//  - generados enteros (lo que escribe regenerarGenerados()): se toma cualquier lado y se regeneran después;
//  - con una parte generada y otra escrita (las sesiones con su pie de navegación, el README con su sección
//    Estado): se quita lo generado y el resto se fusiona a tres bandas. Si los dos lados cambiaron la misma parte
//    escrita, es un choque de verdad y se para, nunca se queda un lado entero (issue #39, H04).
function generadoEntero(rel) {
  if (rel === 'estudio/ejercicios/_index.md') return true;
  const base = path.posix.basename(rel);
  return rel.startsWith('estudio/') && !rel.startsWith('estudio/sesiones/') && ['inicio.md', 'pendientes.md', 'formulario.md', 'auditoria-del-material.md'].includes(base);
}
const sinEstadoReadme = texto => texto.replace(/^## Estado\s*\n[\s\S]*?(?=^## |(?![\s\S]))/m, '## Estado\n\n');
function parteEscrita(rel) {
  if (rel === 'README.md') return sinEstadoReadme;
  if (rel.startsWith('estudio/sesiones/') && rel.endsWith('.md')) return indice.sinPie;
  return null;
}
function ficheroResoluble(rel) {
  return generadoEntero(rel) || parteEscrita(rel) !== null;
}

// Fusión a tres bandas de la parte escrita de un fichero en conflicto. true si se ha podido sin choque.
function fusionarParteEscrita(raiz, rel) {
  const quitar = parteEscrita(rel);
  const version = etapa => { const r = g.intentarGit(raiz, ['show', `:${etapa}:${rel}`]); return r.ok ? quitar(r.stdout) : ''; };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-juntar-'));
  try {
    const [nuestra, comun, suya] = ['nuestra', 'comun', 'suya'].map(n => path.join(dir, n));
    fs.writeFileSync(nuestra, version(2));
    fs.writeFileSync(comun, version(1));
    fs.writeFileSync(suya, version(3));
    const r = spawnSync('git', ['merge-file', '-p', nuestra, comun, suya], { encoding: 'utf8' });
    if (r.status !== 0) return false;
    fs.writeFileSync(path.join(raiz, ...rel.split('/')), r.stdout);
    g.git(raiz, ['add', '--', rel]);
    return true;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Ficheros que los dos lados tocan a la vez con filas, una por concepto: la tutoría cambia el estado de filas que
// ya existían (un examen) y la preparación añade filas nuevas al final. Si quedan pegadas, git no sabe juntarlas
// (visto en la prueba real de la 0.22). Se juntan por concepto: todas las filas del curso principal (que llevan
// lo que el alumno ha demostrado) y, detrás de la última, las filas nuevas de la preparación.
const POR_FILAS = {
  'estudio/progreso.md': linea => (/^\|\s*\[\[([^\]|\\#]+)/.exec(linea) || [])[1],
  'estudio/conceptos/_index.md': linea => (/^([a-z0-9][a-z0-9-]*) *\|/.exec(linea) || [])[1],
};

// Con la versión común (`base`), una fila que existe en los dos lados y que solo cambió en uno se queda con ese
// cambio (la preparación añade un alias a un concepto que ya existía); si cambió en los dos, es un choque (null).
// Sin `base`, mandan las filas del curso principal.
function juntarPorFilas(ours, theirs, clave, base = null) {
  const eol = ours.includes('\r\n') ? '\r\n' : '\n';
  const porClave = texto => new Map(texto.split(/\r?\n/).filter(l => clave(l)).map(l => [clave(l), l]));
  const suyas = porClave(theirs);
  const comunes = base === null ? null : porClave(base);
  const nuestras = ours.split(/\r?\n/);
  for (let i = 0; i < nuestras.length; i++) {
    const k = clave(nuestras[i]);
    if (!k || !comunes || !suyas.has(k) || suyas.get(k) === nuestras[i]) continue;
    const comun = comunes.get(k);
    if (comun === nuestras[i]) nuestras[i] = suyas.get(k);
    else if (comun !== suyas.get(k)) return null;
  }
  const tenemos = new Set(nuestras.map(clave).filter(Boolean));
  const nuevas = theirs.split(/\r?\n/).filter(l => clave(l) && !tenemos.has(clave(l)));
  let ultima = -1;
  nuestras.forEach((l, i) => { if (clave(l)) ultima = i; });
  if (ultima < 0) return null;   // sin filas propias: no se sabe dónde van; que decida una persona
  nuestras.splice(ultima + 1, 0, ...nuevas);
  return nuestras.join(eol);
}

function resolverPorFilas(raiz, rel) {
  const ours = g.intentarGit(raiz, ['show', `:2:${rel}`]);
  const theirs = g.intentarGit(raiz, ['show', `:3:${rel}`]);
  if (!ours.ok || !theirs.ok) return false;
  const comun = g.intentarGit(raiz, ['show', `:1:${rel}`]);
  const texto = juntarPorFilas(ours.stdout, theirs.stdout, POR_FILAS[rel], comun.ok ? comun.stdout : null);
  if (texto === null) return false;
  fs.writeFileSync(path.join(raiz, ...rel.split('/')), texto.endsWith('\n') ? texto : texto + '\n');
  g.git(raiz, ['add', '--', rel]);
  return true;
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
    const noResolubles = conflictos.filter(f => !ficheroResoluble(f) && !POR_FILAS[f]);
    if (noResolubles.length) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'choque', ficheros: noResolubles }; }
    for (const f of conflictos.filter(x => POR_FILAS[x])) {
      if (!resolverPorFilas(raiz, f)) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'choque', ficheros: [f] }; }
    }
    for (const f of conflictos.filter(x => !POR_FILAS[x] && parteEscrita(x))) {
      if (!fusionarParteEscrita(raiz, f)) { g.intentarGit(raiz, ['merge', '--abort']); return { juntado: false, motivo: 'choque', ficheros: [f] }; }
    }
    for (const f of conflictos.filter(x => generadoEntero(x))) { g.git(raiz, ['checkout', '--ours', '--', f]); g.git(raiz, ['add', '--', f]); }
  }

  regenerarGenerados(raiz);
  actualizarEstadoReadme(raiz);
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
  'sin-repo': 'la carpeta del curso no es la raíz de su propio repositorio git (no tiene uno, o está dentro de otro). Ejecuta node .kit/herramientas/diagnostico.js para ver cómo arreglarlo.',
  'sin-segundo-plano': 'tu asistente no puede trabajar en segundo plano: prepara la clase en primer plano.',
  'id-invalido': 'el id de la sesión solo puede llevar letras, números, puntos y guiones.',
  'sin-ficheros': 'falta al menos un fichero de estudio/inbox/.',
  'en-marcha': r => `ya hay una preparación en marcha (${r.id}). Usa --estado para verla.`,
  'hay-terminada': r => `hay una preparación terminada sin juntar (${r.id}). Júntala primero: --juntar ${r.id}.`,
  'id-en-uso': r => `ya existe una copia con el id ${r.id}.`,
  'worktree': r => `no se pudo crear la copia de trabajo: ${r.detalle}`,
  'fichero-ausente': r => `${r.fichero} no está en estudio/inbox/.`,
  'lanzando': 'ahora mismo se está lanzando otra preparación: espera un momento y mira --estado.',
  'sin-identidad': 'git no sabe quién eres todavía, y hay que guardar el material de la clase antes de prepararla: configura user.name y user.email.',
  'entrada-distinta': r => `${r.fichero} no ha llegado igual a la copia de trabajo: no se prepara nada. Vuelve a intentarlo.`,
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
  comoLanzar, lanzarAsistente, tomarCerrojo,
  juntarPorFilas,
  lanzar, trabajar, juntar, cli, todasLasPreparaciones, formatearEstado, ficheroResoluble, pidVivo, descartarCopia,
  construirPrompt, dirDe, ramaDe,
};
