'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { obtenerJson, consultaPrivacidadAnonima } = require('../lib/red');
const { temporal } = require('./ayuda');

// `obtenerJson` hace la petición en un proceso de Node aparte (spawnSync): bloquea el proceso que llama,
// como todo lo demás del kit (git, gh). Un servidor de mentira en ESE MISMO proceso de test se quedaría sin
// poder atender la petición mientras spawnSync lo tiene bloqueado (interbloqueo). Por eso el servidor de
// mentira vive en un proceso aparte de verdad (spawn, no spawnSync): nunca toca la red real y sigue siendo
// determinista, pero no se pisa con el bloqueo de obtenerJson.
function servidorDeMentira(modo) {
  return `
const http = require('node:http');
const s = http.createServer((req, res) => {
  const modo = ${JSON.stringify(modo)};
  if (modo === 'colgado') return;   // nunca responde: para probar el timeout
  if (modo === '404') { res.writeHead(404, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ message: 'Not Found' })); }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ private: modo === 'privado' }));
});
s.listen(0, '127.0.0.1', () => { process.stdout.write('LISTO ' + s.address().port + '\\n'); });
`;
}

async function conServidor(modo, fn) {
  const dir = temporal('kit-red-');
  const fichero = path.join(dir, 'servidor.js');
  fs.writeFileSync(fichero, servidorDeMentira(modo));
  const hijo = spawn(process.execPath, [fichero], { stdio: ['ignore', 'pipe', 'inherit'] });
  const puerto = await new Promise((resolve, reject) => {
    let bruto = '';
    hijo.stdout.on('data', d => {
      bruto += d.toString();
      const m = /LISTO (\d+)/.exec(bruto);
      if (m) resolve(m[1]);
    });
    hijo.on('error', reject);
    hijo.on('exit', code => reject(new Error(`el servidor de mentira murió antes de escuchar (código ${code})`)));
  });
  try {
    return await fn(`http://127.0.0.1:${puerto}`);
  } finally {
    hijo.kill();
  }
}

test('obtenerJson: trae el status y el cuerpo de una petición real (contra un servidor local, en otro proceso)', async () => {
  const r = await conServidor('publico', url => obtenerJson(url));
  assert.deepEqual(r, { ok: true, status: 200, cuerpo: '{"private":false}' });
});

test('obtenerJson: un 404 también llega con su status, no como fallo', async () => {
  const r = await conServidor('404', url => obtenerJson(url));
  assert.equal(r.ok, true);
  assert.equal(r.status, 404);
});

test('obtenerJson: sin nadie escuchando en el puerto, falla sin lanzar (ok:false, con detalle)', () => {
  const r = obtenerJson('http://127.0.0.1:1', { timeoutMs: 2000 });
  assert.equal(r.ok, false);
  assert.ok(r.detalle.length > 0);
});

test('obtenerJson: si el servidor no contesta a tiempo, corta con el timeout (no se queda colgado)', async () => {
  const r = await conServidor('colgado', url => obtenerJson(url, { timeoutMs: 300 }));
  assert.equal(r.ok, false);
});

test('consultaPrivacidadAnonima end to end: un 404 real de verdad se trata como privado', async () => {
  const r = await conServidor('404', url => consultaPrivacidadAnonima('a/b', { obtener: (_url, opts) => obtenerJson(url, opts) }));
  assert.deepEqual(r, { conocido: true, privado: true });
});

test('consultaPrivacidadAnonima end to end: un 200 con private:false es público', async () => {
  const r = await conServidor('publico', url => consultaPrivacidadAnonima('a/b', { obtener: (_url, opts) => obtenerJson(url, opts) }));
  assert.deepEqual(r, { conocido: true, privado: false });
});

test('consultaPrivacidadAnonima end to end: un 200 con private:true es privado', async () => {
  const r = await conServidor('privado', url => consultaPrivacidadAnonima('a/b', { obtener: (_url, opts) => obtenerJson(url, opts) }));
  assert.deepEqual(r, { conocido: true, privado: true });
});
