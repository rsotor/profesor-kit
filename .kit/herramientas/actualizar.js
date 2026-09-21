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
      if (!motorNuevo.ficheros.includes(f)) fs.rmSync(path.join(raiz, ...f.split('/')), { recursive: true, force: true });
    }
    for (const f of motorNuevo.ficheros) {
      const desde = path.join(origen, ...f.split('/'));
      const hasta = path.join(raiz, ...f.split('/'));
      if (!fs.existsSync(desde)) continue;
      fs.rmSync(hasta, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(hasta), { recursive: true });
      fs.cpSync(desde, hasta, { recursive: true });
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
    g.git(raiz, ['reset', '-q', '--hard', sha]);
    g.git(raiz, ['clean', '-q', '-fd']);
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

if (require.main === module) {
  const args = process.argv.slice(2);
  const raiz = path.resolve(__dirname, '..', '..');
  const i = args.indexOf('--origen');
  const origen = i >= 0 ? path.resolve(args[i + 1]) : descargar(v.leerMotor(raiz).repo);
  const de = v.leerVersion(raiz);
  const a = v.leerVersion(origen);

  if (de === a) console.log(`Ya tienes la última versión (${de}).`);
  else if (!args.includes('--aplicar')) console.log(`Tienes la ${de}; hay una ${a}.\n\n${novedades(origen, de)}\n\nPara aplicarla: node .kit/herramientas/actualizar.js --aplicar`);
  else {
    const r = actualizar({ raiz, origen });
    if (r.actualizado) console.log(`Actualizado de ${r.de} a ${r.a}.${r.migraciones.length ? ` Datos migrados: ${r.migraciones.join(', ')}.` : ''}`);
    else { console.log(`No se ha actualizado: todo sigue como estaba, en la ${r.de}. Motivo: ${r.detalle || r.motivo}`); process.exit(1); }
  }
}

module.exports = { actualizar, validarMotor, novedades };
