'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const v = require('./lib/vault');
const g = require('./lib/git');
const { guardar } = require('./guardar');
const { escanearSecretos } = require('./lib/secretos');

function validarMotor(ficheros) {
  for (const f of ficheros) {
    const normal = path.posix.normalize(f);
    if (normal !== f || f.startsWith('/') || /^[A-Za-z]:/.test(f) || normal.split('/').includes('..')) {
      throw new Error(`Ruta de motor no válida: ${f}`);
    }
    if (v.RUTAS_PROTEGIDAS.includes(normal.split('/')[0])) {
      throw new Error(`El motor no puede tocar datos del alumno: ${f}`);
    }
  }
}

function nodo(script, args, cwd) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
}

function contarErrores(dirKit, raiz) {
  const r = nodo(path.join(dirKit, '.kit', 'herramientas', 'comprobar.js'), ['--json', '--raiz', raiz], raiz);
  return JSON.parse(r.stdout).errores.length;
}

function reinstalarSkills(raiz) {
  const r = nodo(path.join(raiz, '.kit', 'herramientas', 'instalar-skills.js'), [], raiz);
  if (r.status !== 0) throw new Error(`instalar-skills falló: ${r.stderr}`);
}

function migracionesPendientes(raiz, desde) {
  const dir = path.join(raiz, '.kit', 'herramientas', 'migraciones');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(n => /^\d+-.+\.js$/.test(n))
    .map(n => ({ version: parseInt(n, 10), fichero: path.join(dir, n) }))
    .filter(m => m.version > desde)
    .sort((a, b) => a.version - b.version);
}

// Pone la fecha de modificación a "ahora" en todo lo copiado. En Windows, copiar un fichero conserva
// la fecha del original: si además pesa lo mismo que el que sustituye, git lo da por no modificado y
// ni lo guarda ni lo restaura. Con la fecha nueva, git siempre mira el contenido.
function tocar(ruta) {
  const ahora = new Date();
  const ficheros = fs.statSync(ruta).isDirectory() ? v.recorrer(ruta, () => true) : [ruta];
  for (const f of ficheros) fs.utimesSync(f, ahora, ahora);
}

// Deja el curso exactamente como estaba en `sha`. El índice se vacía antes para que git reescriba
// TODOS los ficheros en vez de fiarse de fechas y tamaños (ver `tocar`).
function restaurar(raiz, sha) {
  g.git(raiz, ['read-tree', '--empty']);
  g.git(raiz, ['reset', '-q', '--hard', sha]);
  g.git(raiz, ['clean', '-q', '-fd']);
}

// Ficheros del motor que el alumno también puede haber tocado: no se sustituyen, se les añade lo que falte.
// `.gitignore` es el caso: las reglas del kit son unas y las suyas (o las de otro LLM) son otras.
const SE_FUSIONAN = ['.gitignore'];
const patronesDe = texto => new Set(texto.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')));

function fusionarGitignore(actual, nuevo, version) {
  const tiene = patronesDe(actual);
  const faltan = [...patronesDe(nuevo)].filter(p => !tiene.has(p));
  if (!faltan.length) return actual;
  const eol = actual.includes('\r\n') ? '\r\n' : '\n';
  return actual.replace(/(\r?\n)*$/, '') + eol + eol + `# Reglas del kit añadidas al actualizar a la ${version}` + eol + faltan.join(eol) + eol;
}

function actualizar({ raiz, origen }) {
  const motorViejo = v.leerMotor(raiz);
  const motorNuevo = v.leerMotor(origen);
  validarMotor(motorNuevo.ficheros);

  const de = v.leerVersion(raiz);
  const a = v.leerVersion(origen);
  if (de === a) return { actualizado: false, motivo: 'al-dia', de, a, migraciones: [] };
  if (!g.esRepo(raiz)) return { actualizado: false, motivo: 'sin-repo', de, a, migraciones: [] };

  // Un posible secreto sin guardar no puede entrar en el commit previo: ese commit no se sube, pero el siguiente
  // guardado limpio subiría toda la historia, secreto incluido. Primero se quita; después se actualiza.
  const secretos = escanearSecretos(raiz);
  if (secretos.length) {
    return { actualizado: false, motivo: 'secreto', de, a, migraciones: [], detalle: `hay un posible secreto en ${[...new Set(secretos.map(x => x.fichero))].join(', ')}: quítalo antes de actualizar; no se toca nada` };
  }
  const antes = contarErrores(origen, raiz);
  // No es una copia aparte: es un commit de lo que hubiera sin guardar, para poder volver exactamente aquí.
  // Si no se pudo guardar (git sin identidad, por ejemplo), no se sigue: la vuelta atrás borraría lo que no
  // llegó a guardarse, y eso es lo único que la actualización promete no tocar nunca.
  const previo = guardar({ raiz, mensaje: `guardado antes de actualizar a ${a}`, permitirErrores: true });
  if (!previo.guardado && previo.motivo !== 'sin-cambios') {
    return { actualizado: false, motivo: 'sin-guardar', de, a, migraciones: [], detalle: `no se pudo guardar tu trabajo antes de actualizar (${previo.motivo}); no se toca nada` };
  }
  const sha = g.shaActual(raiz);

  const hechas = [];
  try {
    for (const f of motorViejo.ficheros) {
      if (!motorNuevo.ficheros.includes(f)) fs.rmSync(path.join(raiz, ...f.split('/')), { recursive: true, force: true, maxRetries: 3 });
    }
    for (const f of motorNuevo.ficheros) {
      const desde = path.join(origen, ...f.split('/'));
      const hasta = path.join(raiz, ...f.split('/'));
      if (!fs.existsSync(desde)) continue;
      if (SE_FUSIONAN.includes(f) && fs.existsSync(hasta)) {
        fs.writeFileSync(hasta, fusionarGitignore(fs.readFileSync(hasta, 'utf8'), fs.readFileSync(desde, 'utf8'), a));
        continue;
      }
      fs.rmSync(hasta, { recursive: true, force: true, maxRetries: 3 });
      fs.mkdirSync(path.dirname(hasta), { recursive: true });
      fs.cpSync(desde, hasta, { recursive: true });
      tocar(hasta);
    }

    // Lo que había en memoria de las herramientas es de la versión vieja: se olvida antes de migrar, para que
    // las migraciones (nuevas) carguen las piezas nuevas. Las migraciones también lo hacen por su cuenta.
    const herramientas = path.join(raiz, '.kit', 'herramientas') + path.sep;
    for (const k of Object.keys(require.cache)) if (k.startsWith(herramientas)) delete require.cache[k];
    const ajustes = v.leerAjustes(raiz);
    for (const m of migracionesPendientes(raiz, ajustes.version_datos)) {
      require(m.fichero).migrar(raiz);
      hechas.push(m.version);
    }
    if (hechas.length) v.escribirAjustes(raiz, { ...v.leerAjustes(raiz), version_datos: motorNuevo.version_datos });

    reinstalarSkills(raiz);
    const despues = contarErrores(raiz, raiz);
    if (despues > antes) throw new Error(`tras actualizar hay ${despues} errores (antes había ${antes})`);
  } catch (error) {
    restaurar(raiz, sha);
    reinstalarSkills(raiz);
    return { actualizado: false, motivo: 'revertido', de, a, migraciones: hechas, detalle: error.message };
  }

  guardar({ raiz, mensaje: `kit: actualizado a ${a}`, permitirErrores: true });
  return { actualizado: true, de, a, migraciones: hechas };
}

function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  return { ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// La versión publicada es la última **release** del kit (etiqueta `vX.Y.Z`), nunca lo que haya en `main`:
// así a los cursos solo les llega lo que se ha decidido publicar, y se puede volver a una versión concreta.
function etiquetaPublicada(repo, ejecutar = gh) {
  const r = ejecutar(['api', `repos/${repo}/releases/latest`, '--jq', '.tag_name']);
  return r.ok && /^v\d+\.\d+\.\d+$/.test(r.salida) ? r.salida : null;
}

function descargar(repo, ejecutar = gh) {
  const etiqueta = etiquetaPublicada(repo, ejecutar);
  if (!etiqueta) throw new Error('No se pudo saber cuál es la última versión publicada del kit (¿sesión de gh iniciada? ¿hay alguna release?)');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profesor-kit-'));
  const r = ejecutar(['repo', 'clone', repo, tmp, '--', '--depth', '1', '--branch', etiqueta, '-q']);
  if (!r.ok) throw new Error(`No se pudo descargar el kit ${etiqueta}: ${r.salida}`);
  return tmp;
}

function novedades(origen, versionActual) {
  const lineas = fs.readFileSync(path.join(origen, '.kit', 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
  const inicio = lineas.findIndex(l => l.startsWith('## '));
  const fin = lineas.findIndex(l => l.trim() === `## ${versionActual}`);
  return lineas.slice(inicio < 0 ? 0 : inicio, fin < 0 ? lineas.length : fin).join('\n').trim();
}

// Consulta ligera (sin clonar): ¿qué versión hay publicada? Devuelve null si no hay red, sesión ni releases.
function versionPublicada(repo, ejecutar = gh) {
  const etiqueta = etiquetaPublicada(repo, ejecutar);
  return etiqueta ? etiqueta.slice(1) : null;
}

// Compara versiones número a número: '0.10.0' es más nueva que '0.9.1', aunque como texto no lo parezca.
function esMasNueva(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
}

// `--comprobar`: para el arranque de cada sesión. Una vez al día como mucho; imprime una línea solo si hay
// versión nueva, y nada si no la hay o no se puede saber. Nunca bloquea al alumno.
function comprobarNovedades(raiz, hoy = new Date().toISOString().slice(0, 10), consultar = versionPublicada) {
  const ajustes = v.leerAjustes(raiz);
  if (ajustes.ultima_comprobacion === hoy) return null;
  v.escribirAjustes(raiz, { ...ajustes, ultima_comprobacion: hoy });
  const nueva = consultar(v.leerMotor(raiz).repo);
  const actual = v.leerVersion(raiz);
  if (!nueva || !esMasNueva(nueva, actual)) return null;
  return `Hay una versión nueva del kit: tienes la ${actual} y está publicada la ${nueva}. Cuando quieras, pídeme "actualiza el kit".`;
}

// `descargarKit` se inyecta para poder probar el flujo sin red.
function cli(args, raiz, descargarKit = descargar, consultar = versionPublicada) {
  if (args.includes('--comprobar')) { const aviso = comprobarNovedades(raiz, undefined, consultar); if (aviso) console.log(aviso); return 0; }
  const i = args.indexOf('--origen');
  const origen = i >= 0 ? path.resolve(args[i + 1]) : descargarKit(v.leerMotor(raiz).repo);
  try {
    const de = v.leerVersion(raiz);
    const a = v.leerVersion(origen);

    if (de === a) { console.log(`Ya tienes la última versión (${de}).`); return 0; }
    if (!args.includes('--aplicar')) {
      console.log(`Tienes la ${de}; hay una ${a}.\n\n${novedades(origen, de)}\n\nPara aplicarla: node .kit/herramientas/actualizar.js --aplicar`);
      return 0;
    }
    const r = actualizar({ raiz, origen });
    if (r.actualizado) {
      console.log(`Actualizado de ${r.de} a ${r.a}.${r.migraciones.length ? ` Datos migrados: ${r.migraciones.join(', ')}.` : ''}`);
      return 0;
    }
    console.log(`No se ha actualizado: todo sigue como estaba, en la ${r.de}. Motivo: ${r.detalle || r.motivo}`);
    return 1;
  } finally {
    // Lo descargado es temporal: no se deja una copia del kit por cada actualización.
    if (i < 0) fs.rmSync(origen, { recursive: true, force: true, maxRetries: 3 });
  }
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'actualizar.js');

module.exports = { actualizar, restaurar, validarMotor, novedades, comprobarNovedades, fusionarGitignore, etiquetaPublicada, versionPublicada, descargar, cli };
