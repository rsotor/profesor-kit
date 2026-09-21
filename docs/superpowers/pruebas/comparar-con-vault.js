#!/usr/bin/env node
'use strict';
// Comparador de usar y tirar para la prueba 1 (tarea 17): el vault de origen contra un curso creado con el kit.
// Uso: node docs/superpowers/pruebas/comparar-con-vault.js <ruta-del-vault> <ruta-del-curso-del-kit> [--sesion <texto>]
// No juzga calidad: eso lo hace Roberto leyendo. Solo dice qué hay en cada lado.
const fs = require('node:fs');
const path = require('node:path');

const [vault, curso] = process.argv.slice(2);
if (!vault || !curso) { console.error('Uso: comparar-con-vault.js <vault> <curso-del-kit> [--sesion <texto>]'); process.exit(2); }
const i = process.argv.indexOf('--sesion');
const filtroSesion = i >= 0 ? process.argv[i + 1].toLowerCase() : null;

function frontmatter(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto); const d = {};
  if (m) for (const l of m[1].split(/\r?\n/)) { const p = /^([\w-]+):\s*(.*)$/.exec(l); if (p) d[p[1]] = p[2]; }
  return d;
}
const lista = v => (/^\[(.*)\]/.exec(v || '') || [, ''])[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '').toLowerCase()).filter(Boolean);
const normal = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

function conceptos(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(n => n.endsWith('.md') && n !== '_index.md').map(n => {
    const texto = fs.readFileSync(path.join(dir, n), 'utf8'); const fm = frontmatter(texto);
    return { slug: n.slice(0, -3), alias: lista(fm.alias), texto, lineas: texto.split('\n').length,
      visto: (fm.visto_en || '') + ' ' + (texto.match(/## Historial[\s\S]*/) || [''])[0] };
  });
}
const nombres = c => new Set([normal(c.slug), ...c.alias.map(normal)]);
const mismo = (a, b) => [...nombres(a)].some(n => nombres(b).has(n));

let delVault = conceptos(path.join(vault, 'conceptos'));
const delCurso = conceptos(path.join(curso, 'estudio', 'conceptos'));
if (filtroSesion) delVault = delVault.filter(c => c.visto.toLowerCase().includes(filtroSesion));

const parejas = [], soloVault = [], soloCurso = [...delCurso];
for (const v of delVault) {
  const k = soloCurso.findIndex(c => mismo(v, c));
  if (k >= 0) parejas.push([v, soloCurso.splice(k, 1)[0]]); else soloVault.push(v);
}
const marcas = cs => ({
  'aportado por el alumno': cs.reduce((n, c) => n + (c.texto.match(/\[!quote\] De la clase/g) || []).length, 0),
  'ampliación': cs.reduce((n, c) => n + (c.texto.match(/\[!info\] Ampliaci/g) || []).length, 0),
  'fuente externa': cs.reduce((n, c) => n + (c.texto.match(/Conocimiento general, no del curso/g) || []).length, 0),
  'TODO': cs.reduce((n, c) => n + (c.texto.match(/\*\*TODO:\*\*/g) || []).length, 0),
  'FALTA INFO': cs.reduce((n, c) => n + (c.texto.match(/FALTA INFO:/g) || []).length, 0),
});
const media = cs => cs.length ? Math.round(cs.reduce((n, c) => n + c.lineas, 0) / cs.length) : 0;
const duplicados = cs => { const d = []; for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) if (mismo(cs[a], cs[b])) d.push(`${cs[a].slug} ≈ ${cs[b].slug}`); return d; };

console.log(`# Comparación · vault vs curso del kit${filtroSesion ? ` · sesión "${filtroSesion}"` : ''}\n`);
console.log(`| | Vault | Kit |\n|---|---|---|`);
console.log(`| Conceptos | ${delVault.length} | ${delCurso.length} |`);
console.log(`| Líneas por nota (media) | ${media(delVault)} | ${media(delCurso)} |`);
const mv = marcas(delVault), mk = marcas(delCurso);
for (const k of Object.keys(mv)) console.log(`| ${k} | ${mv[k]} | ${mk[k]} |`);
console.log(`| Posibles duplicados | ${duplicados(delVault).length} | ${duplicados(delCurso).length} |`);
console.log(`\n## En los dos (${parejas.length})\n`); for (const [v, c] of parejas) console.log(`- ${v.slug}${v.slug !== c.slug ? ` ↔ ${c.slug}` : ''}  (${v.lineas} / ${c.lineas} líneas)`);
console.log(`\n## Solo en el vault (${soloVault.length}) — ¿se le escaparon al kit, o el vault los sacó de otra clase?\n`); for (const v of soloVault) console.log(`- ${v.slug}`);
console.log(`\n## Solo en el kit (${soloCurso.length}) — ¿sobran, o el vault los tiene con otro nombre?\n`); for (const c of soloCurso) console.log(`- ${c.slug}  (alias: ${c.alias.join(', ') || '—'})`);
const dk = duplicados(delCurso); if (dk.length) { console.log(`\n## ⚠ Duplicados en el kit (tiene que ser cero)\n`); dk.forEach(d => console.log(`- ${d}`)); }
