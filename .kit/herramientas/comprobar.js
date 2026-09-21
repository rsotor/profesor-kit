'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');

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

function comprobar(raiz) {
  const informe = { errores: [], avisos: [] };
  const notas = v.listarNotas(raiz);
  comprobarEnlaces(raiz, notas, informe);
  comprobarIndice(raiz, informe);
  comprobarFrontmatter(raiz, informe);
  comprobarProgreso(raiz, informe);
  comprobarMapa(raiz, informe);
  comprobarEjercicios(raiz, notas, informe);
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

if (require.main === module) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--raiz');
  const raiz = i >= 0 ? path.resolve(args[i + 1]) : path.resolve(__dirname, '..', '..');
  const informe = comprobar(raiz);
  if (args.includes('--json')) console.log(JSON.stringify(informe));
  else imprimir(informe);
  process.exit(informe.errores.length ? 1 : 0);
}

module.exports = { comprobar, slugsDelIndice };
