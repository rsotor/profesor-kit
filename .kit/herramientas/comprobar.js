'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const { escanearSecretos } = require('./lib/secretos');

const FUERA_DE_ENLACES = new Set(['.git', '.kit', '.claude', '.github', '.obsidian', 'docs', 'node_modules', 'pruebas-local']);

const leer = (raiz, rel) => fs.readFileSync(path.join(raiz, ...rel.split('/')), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(raiz, ...rel.split('/')));

function comprobarEnlaces(raiz, notas, informe) {
  const nombres = new Set(
    v.recorrer(raiz, n => n.endsWith('.md'), FUERA_DE_ENLACES).map(r => path.basename(r, '.md'))
  );
  for (const nota of notas) {
    const texto = v.sinCodigo(leer(raiz, nota));
    for (const m of texto.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const destino = m[1].split('|')[0].split('#')[0].trim();
      if (!destino) continue;
      const ext = path.posix.extname(destino);
      const ok = ext && ext !== '.md'
        ? existe(raiz, destino)
        : existe(raiz, destino.replace(/\.md$/, '') + '.md') || nombres.has(path.posix.basename(destino, '.md'));
      if (!ok) informe.errores.push({ regla: 'enlace-roto', fichero: nota, detalle: `[[${destino}]] no existe` });
    }
  }
}

function slugsDelIndice(raiz) {
  if (!existe(raiz, 'conceptos/_index.md')) return null;
  const slugs = [];
  let dentro = false;
  for (const linea of leer(raiz, 'conceptos/_index.md').split(/\r?\n/)) {
    if (/^## Conceptos/.test(linea)) { dentro = true; continue; }
    if (dentro && /^## /.test(linea)) break;
    const m = dentro && /^([a-z0-9][a-z0-9-]*) *\|/.exec(linea);
    if (m) slugs.push(m[1]);
  }
  return slugs;
}

function comprobarIndice(raiz, informe) {
  const conceptos = v.listarConceptos(raiz);
  const indice = slugsDelIndice(raiz);
  if (indice === null) {
    if (conceptos.length) informe.errores.push({ regla: 'indice', fichero: 'conceptos/_index.md', detalle: 'no existe el índice de conceptos' });
    return;
  }
  for (const slug of conceptos) {
    if (!indice.includes(slug)) informe.errores.push({ regla: 'indice', fichero: `conceptos/${slug}.md`, detalle: `${slug} tiene nota pero no está en _index.md` });
  }
  for (const slug of indice) {
    if (!conceptos.includes(slug)) informe.errores.push({ regla: 'indice', fichero: 'conceptos/_index.md', detalle: `${slug} está en _index.md pero no tiene nota` });
  }
}

function comprobarFrontmatter(raiz, informe) {
  for (const slug of v.listarConceptos(raiz)) {
    const fichero = `conceptos/${slug}.md`;
    const fm = v.leerFrontmatter(leer(raiz, fichero));
    if (!fm) informe.errores.push({ regla: 'frontmatter', fichero, detalle: 'falta el frontmatter' });
    else if (fm.tipo !== 'concepto') informe.errores.push({ regla: 'frontmatter', fichero, detalle: 'falta `tipo: concepto`' });
    else if (!('alias' in fm)) informe.errores.push({ regla: 'frontmatter', fichero, detalle: 'falta `alias:` (puede ser una lista vacía)' });
  }
}

function comprobarProgreso(raiz, informe) {
  const progreso = existe(raiz, 'progreso.md') ? leer(raiz, 'progreso.md') : '';
  for (const slug of v.listarConceptos(raiz)) {
    if (!progreso.includes(`[[${slug}]]`) && !progreso.includes(`[[${slug}|`)) {
      informe.errores.push({ regla: 'progreso', fichero: 'progreso.md', detalle: `${slug} no aparece en progreso.md` });
    }
  }
}

function comprobarMapa(raiz, informe) {
  const dir = path.join(raiz, 'sesiones');
  if (!fs.existsSync(dir)) return;
  const mapa = existe(raiz, 'mapa-del-curso.md') ? leer(raiz, 'mapa-del-curso.md') : '';
  for (const n of fs.readdirSync(dir)) {
    if (!n.endsWith('.md') || n.startsWith('_')) continue;
    const base = n.slice(0, -3);
    if (!mapa.includes(`[[${base}`) && !mapa.includes(`[[sesiones/${base}`)) {
      informe.errores.push({ regla: 'mapa', fichero: 'mapa-del-curso.md', detalle: `la sesión ${base} no está en el mapa` });
    }
  }
}

function comprobarEjercicios(raiz, notas, informe) {
  for (const nota of notas) {
    const dir = path.posix.dirname(nota);
    for (const m of leer(raiz, nota).matchAll(/\]\(([^)\s]+\.html)\)/g)) {
      if (/^https?:/.test(m[1])) continue;
      const destino = path.posix.normalize(path.posix.join(dir, m[1]));
      if (!existe(raiz, destino)) informe.errores.push({ regla: 'html-roto', fichero: nota, detalle: `${m[1]} no existe` });
    }
  }
  const declarados = new Set();
  for (const slug of v.listarConceptos(raiz)) {
    const fm = v.leerFrontmatter(leer(raiz, `conceptos/${slug}.md`));
    if (!fm || !fm.ejercicio) continue;
    declarados.add(fm.ejercicio);
    if (!existe(raiz, `ejercicios/${fm.ejercicio}.html`) && !existe(raiz, `ejercicios/${fm.ejercicio}.md`)) {
      informe.errores.push({ regla: 'ejercicio', fichero: `conceptos/${slug}.md`, detalle: `declara ejercicio "${fm.ejercicio}" y no existe ejercicios/${fm.ejercicio}.html ni .md` });
    }
  }
  return declarados;
}

const escaparRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function comprobarPendientes(raiz, informe) {
  const marcador = new RegExp(escaparRegex(v.leerMarcador(raiz)), 'g');
  for (const nota of v.listarNotas(raiz, { conInbox: true })) {
    const limpio = v.sinCodigo(leer(raiz, nota));
    const dudas = (limpio.match(marcador) || []).length;
    const todos = (limpio.match(/\*\*TODO:\*\*|^TODO:|\bTBD\b/gm) || []).length;
    const faltas = (limpio.match(/FALTA INFO:/g) || []).length;
    if (dudas) informe.avisos.push({ regla: 'duda-pendiente', fichero: nota, detalle: `${dudas} sin responder → /dudas` });
    if (todos) informe.avisos.push({ regla: 'todo', fichero: nota, detalle: `${todos} TODO/TBD` });
    if (faltas) informe.avisos.push({ regla: 'falta-info', fichero: nota, detalle: `${faltas} FALTA INFO` });
  }
}

function comprobarPatrones(raiz, notas, informe) {
  for (const { patron, mensaje } of v.leerAjustes(raiz).patrones_prohibidos || []) {
    let regex;
    try { regex = new RegExp(patron); } catch {
      informe.avisos.push({ regla: 'patron-invalido', fichero: 'config/ajustes.json', detalle: `patrón no válido: ${patron}` });
      continue;
    }
    for (const nota of notas) {
      leer(raiz, nota).split(/\r?\n/).forEach((linea, i) => {
        if (regex.test(linea)) informe.errores.push({ regla: 'patron-prohibido', fichero: nota, detalle: `línea ${i + 1}: ${mensaje}` });
      });
    }
  }
}

function comprobarHuerfanos(raiz, notas, informe) {
  const textos = notas.filter(n => n !== 'conceptos/_index.md').map(n => [n, leer(raiz, n)]);
  for (const slug of v.listarConceptos(raiz)) {
    const enlazado = textos.some(([n, t]) => n !== `conceptos/${slug}.md` && n !== 'progreso.md'
      && (t.includes(`[[${slug}]]`) || t.includes(`[[${slug}|`) || t.includes(`[[${slug}#`)));
    if (!enlazado) informe.avisos.push({ regla: 'huerfano', fichero: `conceptos/${slug}.md`, detalle: 'ninguna sesión ni concepto lo enlaza' });
  }
}

function comprobarDuplicados(raiz, informe) {
  const slugs = v.listarConceptos(raiz);
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const comun = slugs[i].split('-').find(p => p.length >= 6 && slugs[j].split('-').includes(p));
      if (comun) informe.avisos.push({ regla: 'posible-duplicado', fichero: `conceptos/${slugs[i]}.md`, detalle: `comparte «${comun}» con ${slugs[j]} — ¿son el mismo concepto?` });
    }
  }
}

function comprobarEjerciciosSueltos(raiz, declarados, informe) {
  const dir = path.join(raiz, 'ejercicios');
  if (!fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir)) {
    if (n.endsWith('.html') && !declarados.has(n.slice(0, -5))) {
      informe.avisos.push({ regla: 'ejercicio-suelto', fichero: `ejercicios/${n}`, detalle: 'ningún concepto lo declara en su frontmatter' });
    }
  }
}

function comprobar(raiz) {
  const informe = { errores: [], avisos: [] };
  const notas = v.listarNotas(raiz);
  comprobarEnlaces(raiz, notas, informe);
  comprobarIndice(raiz, informe);
  comprobarFrontmatter(raiz, informe);
  comprobarProgreso(raiz, informe);
  comprobarMapa(raiz, informe);
  const declarados = comprobarEjercicios(raiz, notas, informe);
  comprobarEjerciciosSueltos(raiz, declarados, informe);
  comprobarPatrones(raiz, notas, informe);
  comprobarPendientes(raiz, informe);
  comprobarHuerfanos(raiz, notas, informe);
  comprobarDuplicados(raiz, informe);
  informe.errores.push(...escanearSecretos(raiz));
  return informe;
}

function imprimir(informe) {
  const color = process.stdout.isTTY ? (c, t) => `\x1b[${c}m${t}\x1b[0m` : (c, t) => t;
  for (const e of informe.errores) console.log(color(31, `  ✗ [${e.regla}] ${e.fichero} — ${e.detalle}`));
  for (const a of informe.avisos) console.log(color(33, `  ⚠ [${a.regla}] ${a.fichero} — ${a.detalle}`));
  if (informe.errores.length) console.log(color(31, `\n${informe.errores.length} error(es) · ${informe.avisos.length} aviso(s) — hay que arreglarlo antes de guardar`));
  else if (informe.avisos.length) console.log(color(33, `\n0 errores · ${informe.avisos.length} aviso(s) — no bloquean`));
  else console.log(color(32, '\nCurso sano.'));
}

// Devuelve el código de salida. `raizPorDefecto` es la carpeta del curso al que pertenece esta herramienta.
function cli(args, raizPorDefecto) {
  const i = args.indexOf('--raiz');
  const informe = comprobar(i >= 0 ? path.resolve(args[i + 1]) : raizPorDefecto);
  if (args.includes('--json')) console.log(JSON.stringify(informe));
  else imprimir(informe);
  return informe.errores.length ? 1 : 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { comprobar, slugsDelIndice, cli };
