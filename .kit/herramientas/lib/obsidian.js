'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// Obsidian viene configurado de serie: ajustes y componentes internos por defecto, y los complementos de la
// comunidad instalados pero SIN activar. Activarlos es decisión del alumno: son código de terceros.
// community-plugins.json (la lista de activados) no se escribe nunca.
const AJUSTES = ['app.json', 'appearance.json', 'core-plugins.json'];
// Cada complemento va fijado a una versión y al sha256 de cada fichero: es código de terceros que acaba en el
// disco del alumno, y así una cuenta comprometida aguas arriba no puede colar otra cosa. Para subir de
// versión: cambiar `version`, recalcular los hashes (shasum -a 256) y una línea en el CHANGELOG.
const COMPLEMENTOS = [
  { id: 'terminal', repo: 'polyipseity/obsidian-terminal', version: '3.27.2', ficheros: {
    'main.js': '227e5cd8915ca9649007dfc089299b231eafebf06142bd1c715a0d7ae22bb467',
    'manifest.json': '213714012652ff27e0fb0a798cd9549752d3d02d41eee6459f88790131d896d2',
    'styles.css': '39ab74656d85ed316e92d94b891eb9800a6244bb2a4375916065e51703f572bb',
  } },
  { id: 'code-files', repo: 'lukasbach/obsidian-code-files', version: '1.1.9', ficheros: {
    'main.js': '362a9afa086e09f5a047e26152e79d08c02579846472e2ed593f24a2959b5122',
    'manifest.json': '3d7d9531054e50a6e89c23aedda492967bbe7441554b265d720fc0b93f645e0c',
  } },
  { id: 'realclaudian', repo: 'yishentu/claudian', version: '2.3.3', ficheros: {
    'main.js': '95b737ee1354842f2d8f51b9bb0bb43fd7886c42061bc14eca87be56a191e46d',
    'manifest.json': '874f2b47fbc5b25e30709d47f4426f20b94c9ed843a2c737de5034f9529b13f4',
    'styles.css': '48bdb9b2b7fdf028cb0db80a504d2d3bbf9f6f7011af4b27d8eb2363cb9e92f6',
  } },
];
const TIEMPO_MAXIMO = 120_000;   // ms por fichero: el main.js más grande pesa 5 MB
const dirObsidian = raiz => path.join(v.baseAlumno(raiz), '.obsidian');

// Si un fichero ya existe solo se añaden las claves que falten: nunca se cambia lo que eligió el alumno.
function aplicarAjustes(raiz) {
  const origen = path.join(raiz, '.kit', 'plantillas', 'obsidian');
  const destino = dirObsidian(raiz);
  fs.mkdirSync(destino, { recursive: true });
  const tocados = [];
  for (const nombre of AJUSTES) {
    const recomendado = JSON.parse(fs.readFileSync(path.join(origen, nombre), 'utf8'));
    const fichero = path.join(destino, nombre);
    let actual = null;
    if (fs.existsSync(fichero)) {
      try { actual = JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch { continue; }   // roto: no se toca
      // Obsidian guardaba antes core-plugins.json como un array de ids. Fusionarlo con el objeto
      // recomendado lo convertiría en un objeto de claves numéricas y pisaría la elección del alumno.
      if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) continue;
      if (Object.keys(recomendado).every(k => k in actual)) continue;
    }
    fs.writeFileSync(fichero, JSON.stringify({ ...recomendado, ...(actual || {}) }, null, 2) + '\n');
    tocados.push(nombre);
  }
  return tocados;
}

const sha256 = datos => crypto.createHash('sha256').update(datos).digest('hex');

// `esperado` = { version, sha256 }. Un fichero que no coincide con su hash se rechaza: no se escribe nada.
async function descargarDeGitHub(repo, fichero, esperado, traer = fetch) {
  const r = await traer(`https://github.com/${repo}/releases/download/${esperado.version}/${fichero}`, { signal: AbortSignal.timeout(TIEMPO_MAXIMO) });
  if (r.status === 404) return null;   // ese complemento no publica ese fichero (styles.css es opcional)
  if (!r.ok) throw new Error(`${repo}/${fichero}: HTTP ${r.status}`);
  const datos = Buffer.from(await r.arrayBuffer());
  if (sha256(datos) !== esperado.sha256) throw new Error(`${repo}/${fichero} ${esperado.version}: el contenido no es el esperado (hash distinto); no se instala`);
  return datos;
}

// Descarga los que falten. Todo o nada por complemento: si falla una descarga, no queda una carpeta a medias.
async function instalarComplementos(raiz, descargar = descargarDeGitHub) {
  const resultado = { instalados: [], yaEstaban: [], fallidos: [] };
  for (const c of COMPLEMENTOS) {
    const dir = path.join(dirObsidian(raiz), 'plugins', c.id);
    if (fs.existsSync(path.join(dir, 'manifest.json'))) { resultado.yaEstaban.push(c.id); continue; }
    try {
      const contenidos = {};
      for (const [f, hash] of Object.entries(c.ficheros)) contenidos[f] = await descargar(c.repo, f, { version: c.version, sha256: hash });
      if (!contenidos['main.js'] || !contenidos['manifest.json']) throw new Error('la versión publicada no trae main.js y manifest.json');
      fs.mkdirSync(dir, { recursive: true });
      for (const [f, datos] of Object.entries(contenidos)) if (datos) fs.writeFileSync(path.join(dir, f), datos);
      resultado.instalados.push(c.id);
    } catch (e) {
      resultado.fallidos.push({ id: c.id, motivo: e.message });
    }
  }
  return resultado;
}

module.exports = { AJUSTES, COMPLEMENTOS, aplicarAjustes, descargarDeGitHub, instalarComplementos, sha256 };
