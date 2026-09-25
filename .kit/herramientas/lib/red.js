'use strict';
// Una petición HTTP GET sencilla, sin credenciales y con límite de tiempo — para lo poco que el kit necesita
// saber de GitHub sin `gh` (issue #50: un asistente en la nube, con red pero sin esa CLI). El resto del kit
// es síncrono (git, gh, todo pasa por lib/proceso.js): fetch es una promesa, así que la petición se hace en
// un proceso de Node aparte, que sí se puede esperar con spawnSync. No hace falta curl ni ninguna otra
// herramienta que no esté ya garantizada por requerir Node.
const { spawnSync } = require('node:child_process');

const SCRIPT = `
const [url, limiteMs] = process.argv.slice(1);
const controlador = new AbortController();
const aviso = setTimeout(() => controlador.abort(), Number(limiteMs));
fetch(url, { signal: controlador.signal, headers: { 'User-Agent': 'profesor-kit' } })
  .then(r => r.text().then(cuerpo => { process.stdout.write(JSON.stringify({ status: r.status, cuerpo })); }))
  .catch(e => { process.stderr.write(String((e && e.message) || e)); process.exitCode = 1; })
  .finally(() => clearTimeout(aviso));
`;

// { ok: true, status, cuerpo } o { ok: false, detalle } (sin red, timeout, lo que sea). Nunca lanza.
// NODE_USE_ENV_PROXY (revisión de la 0.27, alta 5): sin él, el `fetch` nativo de Node ignora HTTP_PROXY/
// HTTPS_PROXY aunque estén puestas; en un entorno detrás de un proxy obligatorio (un asistente en la nube, por
// ejemplo) la petición se iría directa y fallaría. Con él, las respeta como cualquier otro cliente HTTP.
function obtenerJson(url, { timeoutMs = 5000 } = {}) {
  const r = spawnSync(process.execPath, ['-e', SCRIPT, url, String(timeoutMs)],
    { encoding: 'utf8', timeout: timeoutMs + 3000, env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  if (r.error || r.status !== 0) return { ok: false, detalle: (r.stderr || (r.error && r.error.message) || '').trim() || 'sin respuesta' };
  try { return { ok: true, ...JSON.parse(r.stdout) }; } catch { return { ok: false, detalle: 'respuesta no legible' }; }
}

// ¿Es privado el repo `owner/nombre`? Sin sesión ni token (issue #50, guardar.js sin gh): un repo que no es
// visible así (404, y de verdad — el cuerpo tiene que ser el JSON que manda GitHub, no cualquier 404 de un
// proxy o un balanceador que no sepa nada del repo; revisión de la 0.27, grave 1) es privado, o no existe — y
// entonces el push que venga después fallará solo, con su propio motivo. 200 con private:false es público.
// Cualquier otra cosa (sin red, 403 por límite de la API sin autenticar…) no se puede saber, y no saberlo nunca
// cuenta como privado (fail-closed: nunca sube si no está seguro).
function consultaPrivacidadAnonima(repoSlug, { obtener = obtenerJson, timeoutMs = 5000 } = {}) {
  const r = obtener(`https://api.github.com/repos/${repoSlug}`, { timeoutMs });
  if (!r.ok) return { conocido: false };
  if (r.status === 404) {
    let cuerpo;
    try { cuerpo = JSON.parse(r.cuerpo); } catch { return { conocido: false }; }
    return cuerpo && cuerpo.message === 'Not Found' ? { conocido: true, privado: true } : { conocido: false };
  }
  if (r.status === 200) {
    try { return { conocido: true, privado: JSON.parse(r.cuerpo).private === true }; } catch { return { conocido: false }; }
  }
  return { conocido: false };
}

module.exports = { obtenerJson, consultaPrivacidadAnonima };
