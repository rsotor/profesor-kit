'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ejecutar } = require('./lib/proceso');
const v = require('./lib/vault');

// El camino del profesor al kit: una issue bien formada, sin datos del alumno, sin duplicar.
//   node .kit/herramientas/issue.js --titulo "[skill] qué pasa" --cuerpo cuerpo.md          → vista previa
//   node .kit/herramientas/issue.js --titulo "…" --cuerpo cuerpo.md --enviar                  → la crea (tras el sí del alumno)
// El cuerpo lo escribe el profesor (esperado / qué pasó / propuesta / arreglo aplicado); el entorno lo pone esto.

const PERSONAL = [
  [/\/Users\/[^/\s]+|\/home\/[^/\s]+|[A-Za-z]:\\Users\\[^\\\s]+/, 'una ruta con tu nombre de usuario'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bsk-[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'algo que parece un secreto'],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, 'una dirección de correo'],
];

function ejecutarReal(cmd, args) {
  return ejecutar(cmd, args);
}

function entorno(raiz, plataforma = process.platform, version = os.release()) {
  const ajustes = v.leerAjustes(raiz);
  const sistema = { darwin: 'macOS', win32: 'Windows', linux: 'Linux' }[plataforma] || plataforma;
  return `**Entorno:** ${sistema} ${version} · ${ajustes.llm} · kit ${v.leerVersion(raiz)} · Node ${process.versions.node}`;
}

function revisar(texto) {
  const problemas = [];
  for (const [regex, que] of PERSONAL) if (regex.test(texto)) problemas.push(que);
  return problemas;
}

function duplicadas(repo, titulo, ejecutar) {
  const palabras = titulo.replace(/\[[^\]]*\]/g, '').split(/\s+/).filter(p => p.length >= 5).slice(0, 3).join(' ');
  if (!palabras) return [];
  const r = ejecutar('gh', ['issue', 'list', '--repo', repo, '--state', 'all', '--search', palabras, '--json', 'number,title,state', '--limit', '5']);
  if (!r.ok) return [];
  try { return JSON.parse(r.salida); } catch { return []; }
}

function prepararIssue({ raiz, titulo, cuerpo, ejecutar = ejecutarReal, plataforma, version }) {
  const problemas = revisar(`${titulo}\n${cuerpo}`);
  if (problemas.length) return { ok: false, motivo: 'datos-personales', problemas };
  if (!/^\[[^\]]+\] .{8,}/.test(titulo)) return { ok: false, motivo: 'titulo', problemas: ['el título va como "[skill o herramienta] qué pasa", por ejemplo "[/sesion] No lee el PDF entero"'] };
  const repo = v.leerMotor(raiz).repo;
  const texto = `${entorno(raiz, plataforma, version)}\n\n${cuerpo.trim()}\n`;
  return { ok: true, repo, titulo, texto, parecidas: duplicadas(repo, titulo, ejecutar) };
}

function enviarIssue({ repo, titulo, texto, ejecutar = ejecutarReal }) {
  const r = ejecutar('gh', ['issue', 'create', '--repo', repo, '--title', titulo, '--body', texto, '--label', 'feedback']);
  return r.ok ? { ok: true, url: r.salida.split('\n').pop().trim() } : { ok: false, salida: r.salida };
}

function cli(args, raiz, opciones = {}) {
  const valor = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const titulo = valor('--titulo');
  const ficheroCuerpo = valor('--cuerpo');
  if (!titulo || !ficheroCuerpo || !fs.existsSync(ficheroCuerpo)) { console.log('Uso: node .kit/herramientas/issue.js --titulo "[skill] qué pasa" --cuerpo <fichero.md> [--enviar]'); return 2; }
  const p = prepararIssue({ raiz, titulo, cuerpo: fs.readFileSync(ficheroCuerpo, 'utf8'), ...opciones });
  if (!p.ok) { console.log(`No se envía: el texto lleva ${p.problemas.join(' y ')}. Quítalo y vuelve a probar.`); return 1; }
  if (p.parecidas.length) {
    console.log('Ya hay issues parecidas; si es la misma, comenta ahí en vez de abrir otra:');
    for (const i of p.parecidas) console.log(`  #${i.number} (${i.state}) ${i.title}`);
  }
  if (!args.includes('--enviar')) {
    console.log(`--- Vista previa (repo ${p.repo}) ---\n# ${p.titulo}\n\n${p.texto}--- Enséñasela al alumno; con su sí, repite con --enviar ---`);
    return 0;
  }
  const r = enviarIssue({ ...p, ...opciones });
  if (!r.ok) { console.log(`No se ha podido crear (¿sesión de gh? ¿acceso al kit?): ${r.salida}\nGuarda el texto en config/feedback-pendiente.md y dile al alumno que se lo pase a quien le dio el kit.`); return 1; }
  console.log(`Issue creada: ${r.url}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'issue.js');

module.exports = { prepararIssue, enviarIssue, revisar, cli };
