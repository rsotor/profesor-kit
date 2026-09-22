'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const v = require('./lib/vault');
const g = require('./lib/git');
const { guardar } = require('./guardar');

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

function actualizar({ raiz, origen }) {
  const motorViejo = v.leerMotor(raiz);
  const motorNuevo = v.leerMotor(origen);
  validarMotor(motorNuevo.ficheros);

  const de = v.leerVersion(raiz);
  const a = v.leerVersion(origen);
  if (de === a) return { actualizado: false, motivo: 'al-dia', de, a, migraciones: [] };
  if (!g.esRepo(raiz)) return { actualizado: false, motivo: 'sin-repo', de, a, migraciones: [] };

  const antes = contarErrores(origen, raiz);
  guardar({ raiz, mensaje: `copia de seguridad antes de actualizar a ${a}`, permitirErrores: true });
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
      fs.rmSync(hasta, { recursive: true, force: true, maxRetries: 3 });
      fs.mkdirSync(path.dirname(hasta), { recursive: true });
      fs.cpSync(desde, hasta, { recursive: true });
      tocar(hasta);
    }

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

function descargar(repo) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profesor-kit-'));
  const r = spawnSync('gh', ['repo', 'clone', repo, tmp, '--', '--depth', '1', '-q'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`No se pudo descargar el kit (¿sesión de gh iniciada?): ${r.stderr}`);
  return tmp;
}

function novedades(origen, versionActual) {
  const lineas = fs.readFileSync(path.join(origen, '.kit', 'CHANGELOG.md'), 'utf8').split(/\r?\n/);
  const inicio = lineas.findIndex(l => l.startsWith('## '));
  const fin = lineas.findIndex(l => l.trim() === `## ${versionActual}`);
  return lineas.slice(inicio < 0 ? 0 : inicio, fin < 0 ? lineas.length : fin).join('\n').trim();
}

// Consulta ligera (sin clonar): ¿qué versión hay publicada? Devuelve null si no hay red o sesión.
function versionPublicada(repo) {
  const r = spawnSync('gh', ['api', `repos/${repo}/contents/.kit/VERSION`, '-H', 'Accept: application/vnd.github.raw'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
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
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { actualizar, restaurar, validarMotor, novedades, comprobarNovedades, cli };
