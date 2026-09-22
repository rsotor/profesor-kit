'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// Obsidian viene configurado de serie: ajustes y componentes internos por defecto, y los complementos de la
// comunidad instalados pero SIN activar. Activarlos es decisión del alumno: son código de terceros.
// community-plugins.json (la lista de activados) no se escribe nunca.
const AJUSTES = ['app.json', 'appearance.json', 'core-plugins.json'];
const COMPLEMENTOS = [
  { id: 'terminal', repo: 'polyipseity/obsidian-terminal', ficheros: ['main.js', 'manifest.json', 'styles.css'] },
  { id: 'code-files', repo: 'lukasbach/obsidian-code-files', ficheros: ['main.js', 'manifest.json'] },
  { id: 'realclaudian', repo: 'yishentu/claudian', ficheros: ['main.js', 'manifest.json', 'styles.css'] },
];
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
      if (Object.keys(recomendado).every(k => k in actual)) continue;
    }
    fs.writeFileSync(fichero, JSON.stringify({ ...recomendado, ...(actual || {}) }, null, 2) + '\n');
    tocados.push(nombre);
  }
  return tocados;
}

async function descargarDeGitHub(repo, fichero) {
  const r = await fetch(`https://github.com/${repo}/releases/latest/download/${fichero}`);
  if (r.status === 404) return null;   // ese complemento no publica ese fichero (styles.css es opcional)
  if (!r.ok) throw new Error(`${repo}/${fichero}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// Descarga los que falten. Todo o nada por complemento: si falla una descarga, no queda una carpeta a medias.
async function instalarComplementos(raiz, descargar = descargarDeGitHub) {
  const resultado = { instalados: [], yaEstaban: [], fallidos: [] };
  for (const c of COMPLEMENTOS) {
    const dir = path.join(dirObsidian(raiz), 'plugins', c.id);
    if (fs.existsSync(path.join(dir, 'manifest.json'))) { resultado.yaEstaban.push(c.id); continue; }
    try {
      const contenidos = {};
      for (const f of c.ficheros) contenidos[f] = await descargar(c.repo, f);
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

module.exports = { AJUSTES, COMPLEMENTOS, aplicarAjustes, descargarDeGitHub, instalarComplementos };
