'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');
const indice = require('./indice');

// Rutas relativas a la carpeta del alumno (`estudio/`), que es lo que él ve.
const leer = (raiz, rel) => fs.readFileSync(path.join(v.baseAlumno(raiz), ...rel.split('/')), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(v.baseAlumno(raiz), ...rel.split('/')));

const escaparRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Todo lo que queda por resolver, con el bloque del temario al que pertenece. Es lo que `guardar.js`
// vuelca en `estudio/pendientes.md` para que el alumno vea de un vistazo qué le falta.
const PENDIENTES = [
  ['falta-info', /FALTA INFO:\s*(.*)/],
  ['todo', /\*\*TODO:\*\*\s*(.*)|^TODO:\s*(.*)/],
];
function bloqueDe(raiz, nota, texto) {
  const fm = v.leerFrontmatter(texto) || {};
  if (fm.bloque) return String(fm.bloque);
  if (Array.isArray(fm.bloques) && fm.bloques.length) return String(fm.bloques[0]);
  if (fm.sesion && existe(raiz, `sesiones/${fm.sesion}.md`)) return bloqueDe(raiz, `sesiones/${fm.sesion}.md`, leer(raiz, `sesiones/${fm.sesion}.md`));
  return null;
}
function pendientes(raiz) {
  const lista = [];
  const marcador = new RegExp(escaparRegex(v.leerMarcador(raiz)) + '\\s*(.*)');
  for (const nota of v.listarNotas(raiz, { conInbox: true })) {
    const texto = leer(raiz, nota);
    const bloque = bloqueDe(raiz, nota, texto);
    v.sinCodigo(texto).split(/\r?\n/).forEach((linea, i) => {
      for (const [tipo, regex] of [...PENDIENTES, ['duda', marcador]]) {
        const m = regex.exec(linea);
        if (m) { lista.push({ bloque, fichero: nota, linea: i + 1, tipo, texto: (m[1] || m[2] || '').replace(/^[*_\s]+|[*_\s]+$/g, '') }); break; }
      }
    });
  }
  return lista;
}
// Los hallazgos sobre el material de cada sesión (la sección "Auditoría del material"), juntos y por bloque:
// para que el profesor pueda mirar "¿esto ya lo vimos?" y para que al final del curso el informe de errores del
// material para el centro ya esté escrito.
function auditorias(raiz) {
  const lista = [];
  const dir = path.join(v.baseAlumno(raiz), 'sesiones');
  for (const abs of v.recorrer(dir, n => n.endsWith('.md') && !n.startsWith('_'))) {
    const texto = fs.readFileSync(abs, 'utf8');
    const m = /^## Auditoría del material\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(indice.sinPie(texto));
    if (!m) continue;
    const cuerpo = m[1].split('\n').filter(l => l.trim() && !/^[*_<>].*[*_>]$/.test(l.trim())).join('\n').trim();
    if (!cuerpo || /^<.*>$/.test(cuerpo)) continue;
    const rel = v.aPosix(path.relative(v.baseAlumno(raiz), abs));
    lista.push({ bloque: bloqueDe(raiz, rel, texto), sesion: rel.replace(/\.md$/, ''), cuerpo });
  }
  return lista;
}
function markdownAuditoria(raiz) {
  const lista = auditorias(raiz);
  const lineas = ['# Auditoría del material', '', '> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material',
    '> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del',
    '> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.', ''];
  if (!lista.length) { lineas.push('Nada anotado todavía.', ''); return lineas.join('\n'); }
  const porBloque = new Map();
  for (const a of lista) { const k = a.bloque ? `Bloque ${a.bloque}` : 'Sin bloque'; if (!porBloque.has(k)) porBloque.set(k, []); porBloque.get(k).push(a); }
  for (const [bloque, items] of [...porBloque.entries()].sort()) {
    lineas.push(`## ${bloque}`, '');
    for (const a of items.sort((x, y) => x.sesion.localeCompare(y.sesion))) lineas.push(`### [[${a.sesion}]]`, '', a.cuerpo, '');
  }
  return lineas.join('\n');
}

// La sección "Estado" de la portada del curso (README.md), calculada desde el disco para que esté siempre al día.
function estadoDelCurso(raiz, hoy = new Date().toISOString().slice(0, 10)) {
  const base = v.baseAlumno(raiz);
  const sesiones = v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_'));
  const conceptos = v.listarConceptos(raiz).length;
  const unidades = new Set();
  for (const s of sesiones) { const fm = v.leerFrontmatter(fs.readFileSync(s, 'utf8')) || {}; if (fm.bloque) unidades.add(String(fm.bloque)); }
  const examenes = v.recorrer(path.join(base, 'examenes'), n => /\.(md|html)$/.test(n)).length;
  const abiertos = pendientes(raiz).length;
  if (!sesiones.length) return 'Configurado, sin clases procesadas todavía.';
  return [
    `- **${sesiones.length} clase${sesiones.length === 1 ? '' : 's'}** procesada${sesiones.length === 1 ? '' : 's'}${unidades.size ? ` en ${unidades.size} bloque${unidades.size === 1 ? '' : 's'} (${[...unidades].sort().join(', ')})` : ''}, **${conceptos} concepto${conceptos === 1 ? '' : 's'}**, ${examenes} ${examenes === 1 ? 'examen' : 'exámenes'}.`,
    `- ${abiertos ? `**${abiertos} pendiente${abiertos === 1 ? '' : 's'}** (ver \`estudio/pendientes.md\`).` : 'Nada pendiente.'}`,
    `- Actualizado el ${hoy}.`,
  ].join('\n');
}
function actualizarEstadoReadme(raiz, hoy) {
  const f = path.join(raiz, 'README.md');
  if (!fs.existsSync(f)) return false;
  const texto = fs.readFileSync(f, 'utf8');
  const m = /^## Estado\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto);
  if (!m) return false;
  const nuevo = texto.slice(0, m.index) + `## Estado\n\n${estadoDelCurso(raiz, hoy)}\n\n` + texto.slice(m.index + m[0].length);
  if (nuevo === texto) return false;
  fs.writeFileSync(f, nuevo);
  return true;
}

const ETIQUETA = { 'falta-info': 'Falta material del curso', todo: 'Pendiente del profesor', duda: 'Duda tuya sin responder' };
function markdownPendientes(raiz) {
  const lista = pendientes(raiz);
  const lineas = ['# Pendientes', '', '> Lo genera tu profesor cada vez que guarda: **no lo edites**, se vuelve a escribir solo.',
    '> Cada línea dice qué falta y en qué nota. Para resolver una duda, dile "tengo dudas"; para lo que falta',
    '> del material, búscalo en la plataforma del curso o cuéntale lo que recuerdes de clase.', ''];
  if (!lista.length) { lineas.push('Nada pendiente. 🎉', ''); return lineas.join('\n'); }
  const porBloque = new Map();
  for (const p of lista) { const k = p.bloque ? `Bloque ${p.bloque}` : 'Sin bloque'; if (!porBloque.has(k)) porBloque.set(k, []); porBloque.get(k).push(p); }
  for (const [bloque, items] of [...porBloque.entries()].sort()) {
    lineas.push(`## ${bloque} (${items.length})`, '');
    for (const p of items) {
      const nombre = p.fichero.replace(/\.md$/, '');
      const enlace = p.fichero.endsWith('.md') ? `[[${nombre}]]` : `\`${p.fichero}\``;
      lineas.push(`- [ ] **${ETIQUETA[p.tipo]}** · ${enlace}${p.texto ? ` — ${p.texto}` : ''}`);
    }
    lineas.push('');
  }
  return lineas.join('\n');
}

module.exports = {
  escaparRegex, pendientes, markdownPendientes, auditorias, markdownAuditoria, estadoDelCurso, actualizarEstadoReadme,
};
