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
// Ficheros que escribe el propio kit enteros (mismo criterio que `generadoEntero()` en preparar.js, que no
// se importa aquí para no crear un ciclo: preparar.js → guardar.js → generados.js). Su contenido es una
// copia de lo que ya se lee como fuente en la nota original (un concepto, una sesión...): si también se
// miran aquí, cada TODO/FALTA INFO del original sale dos veces (issue #51).
const GENERADOS_ENTEROS = new Set(v.GENERADOS_ENTEROS);
function bloqueDe(raiz, nota, texto) {
  const fm = v.leerFrontmatter(texto) || {};
  if (fm.bloque) return String(fm.bloque);
  if (Array.isArray(fm.bloques) && fm.bloques.length) return String(fm.bloques[0]);
  if (fm.sesion && existe(raiz, `sesiones/${fm.sesion}.md`)) return bloqueDe(raiz, `sesiones/${fm.sesion}.md`, leer(raiz, `sesiones/${fm.sesion}.md`));
  return null;
}
// Corta en la siguiente barra sin escapar: dentro de una fila de tabla, lo que sigue de ahí en adelante son
// las demás celdas, no parte de la marca. Una barra escapada (`\|`, la de un alias de enlace) no cuenta.
const hastaBarraSinEscapar = texto => {
  const m = /(?<!\\)\|/.exec(texto);
  return m ? texto.slice(0, m.index) : texto;
};
// Un `)` o un `**` sueltos al final: se abrieron antes de la marca, en una parte de la celda que no se
// capturó. Se quitan, de fuera hacia dentro, hasta que no sobre ninguno.
function limpiarSueltos(texto) {
  let t = texto.trim();
  for (;;) {
    const antes = t;
    t = t.replace(/\*\*\s*$/, '').trim();
    const abiertos = (t.match(/\(/g) || []).length;
    const cerrados = (t.match(/\)/g) || []).length;
    if (cerrados > abiertos && t.endsWith(')')) t = t.slice(0, -1).trim();
    if (t === antes) return t;
  }
}
// Las celdas de una fila de tabla, respetando las barras escapadas de los enlaces con alias (`[[a\|b]]`).
function celdasDeFila(linea) {
  const partes = linea.split(/(?<!\\)\|/).map(c => c.trim());
  if (partes[0] === '') partes.shift();
  if (partes.length && partes[partes.length - 1] === '') partes.pop();
  return partes;
}
function pendientes(raiz) {
  const lista = [];
  const marcador = new RegExp(escaparRegex(v.leerMarcador(raiz)) + '\\s*(.*)');
  for (const nota of v.listarNotas(raiz, { conInbox: true })) {
    if (GENERADOS_ENTEROS.has(nota)) continue;
    const texto = leer(raiz, nota);
    const bloque = bloqueDe(raiz, nota, texto);
    v.sinCodigo(texto).split(/\r?\n/).forEach((linea, i) => {
      for (const [tipo, regex] of [...PENDIENTES, ['duda', marcador]]) {
        const m = regex.exec(linea);
        if (!m) continue;
        let cuerpo = (m[1] || m[2] || '').replace(/^[*_\s]+|[*_\s]+$/g, '');
        // Una marca dentro de una fila de tabla (`| ... | FALTA INFO: ... |`) pierde de qué va sin su
        // primera celda, y arrastra el resto de la fila si no se corta en la barra.
        if ((tipo === 'falta-info' || tipo === 'todo') && /^\s*\|/.test(linea)) {
          cuerpo = limpiarSueltos(hastaBarraSinEscapar(cuerpo));
          const contexto = (celdasDeFila(linea)[0] || '').replace(/\\\|/g, '|');
          if (contexto && !regex.test(contexto)) cuerpo = `${contexto}: ${cuerpo}`;   // la marca en la 1.ª celda: sin contexto
        }
        lista.push({ bloque, fichero: nota, linea: i + 1, tipo, texto: cuerpo });
        break;
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

// Dentro de una tabla, una barra sin escapar (de un alias de enlace o de texto libre) descuadra la fila.
const enCelda = texto => (texto || '').replace(/\|/g, '\\|');
// Un enlace con alias dentro de una tabla necesita la barra escapada (regla de AGENTS.md: "para que se vea
// bien en Obsidian"); fuera de una tabla, no.
const enlaceConcepto = (slug, titulo, enTabla = false) => `[[${slug}${enTabla ? '\\|' : '|'}${enCelda(titulo)}]]`;

// La sección "## La fórmula" de una nota de concepto, o null si no la tiene: la plantilla dice que se borra
// la sección entera cuando el concepto no tiene fórmula.
function seccionFormula(texto) {
  const m = /^## La fórmula\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto);
  const cuerpo = m ? m[1].trim() : '';
  return cuerpo || null;
}

// Una fórmula por concepto que la tiene, con el bloque para agrupar (el primer valor de `bloques:`).
function formulas(raiz) {
  const lista = [];
  for (const slug of v.listarConceptos(raiz)) {
    const texto = leer(raiz, `conceptos/${slug}.md`);
    const cuerpo = seccionFormula(texto);
    if (!cuerpo) continue;
    const fm = v.leerFrontmatter(texto) || {};
    const bloque = Array.isArray(fm.bloques) && fm.bloques.length ? String(fm.bloques[0]) : null;
    lista.push({ slug, bloque, titulo: indice.tituloDe(texto, slug), cuerpo });
  }
  return lista;
}
// La definición de una línea de cada concepto: la de su nota (`> **En una frase:**`) o, si no la tiene, la de
// su línea en conceptos/_index.md, que siempre la lleva.
function definiciones(raiz) {
  const delIndice = new Map();
  const ficheroIndice = path.join(v.baseAlumno(raiz), 'conceptos', '_index.md');
  if (fs.existsSync(ficheroIndice)) {
    for (const linea of fs.readFileSync(ficheroIndice, 'utf8').split(/\r?\n/)) {
      const m = /^([a-z0-9][a-z0-9-]*) *\| *([^|]+?) *\|/.exec(linea);
      if (m) delIndice.set(m[1], m[2]);
    }
  }
  const lista = [];
  for (const slug of v.listarConceptos(raiz)) {
    const texto = leer(raiz, `conceptos/${slug}.md`);
    const enNota = (/^>\s*\*\*En una frase:\*\*\s*(.+)$/m.exec(texto) || [])[1];
    const cuerpo = (enNota && !/^<.*>$/.test(enNota.trim()) ? enNota.trim() : delIndice.get(slug)) || '';
    if (!cuerpo) continue;
    const fm = v.leerFrontmatter(texto) || {};
    const bloque = Array.isArray(fm.bloques) && fm.bloques.length ? String(fm.bloques[0]) : null;
    lista.push({ slug, bloque, titulo: indice.tituloDe(texto, slug), cuerpo });
  }
  return lista;
}

// estudio/formulario.md: lo que hay que saberse de cada concepto, por bloque. Si el concepto tiene fórmula, su
// fórmula; si no, su definición en una frase. Un curso con fórmulas también tiene conceptos sin ellas, y uno de
// historia no tiene ninguna: así ninguno se queda fuera.
function markdownFormulario(raiz) {
  const conFormula = new Map(formulas(raiz).map(f => [f.slug, f]));
  const lista = definiciones(raiz).filter(d => !conFormula.has(d.slug)).map(d => ({ ...d, tipo: 'definicion' }))
    .concat([...conFormula.values()].map(f => ({ ...f, tipo: 'formula' })))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const lineas = ['# Formulario', '',
    '> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por',
    '> bloque: su fórmula si la tiene, y si no, su definición en una frase.', ''];
  if (!lista.length) { lineas.push('Nada todavía.', ''); return lineas.join('\n'); }
  const porBloque = new Map();
  for (const f of lista) { const k = f.bloque ? `Bloque ${f.bloque}` : 'Sin bloque'; if (!porBloque.has(k)) porBloque.set(k, []); porBloque.get(k).push(f); }
  for (const [bloque, items] of [...porBloque.entries()].sort()) {
    lineas.push(`## ${bloque}`, '');
    const defs = items.filter(x => x.tipo === 'definicion');
    for (const x of items.filter(y => y.tipo === 'formula')) lineas.push(`### ${enlaceConcepto(x.slug, x.titulo)}`, '', x.cuerpo, '');
    if (defs.length) {
      if (defs.length < items.length) lineas.push('### Definiciones', '');
      for (const x of defs) lineas.push(`- ${enlaceConcepto(x.slug, x.titulo)}: ${x.cuerpo}`);
      lineas.push('');
    }
  }
  return lineas.join('\n');
}

// La sección "## Practícalo" de una nota de concepto, sin la línea del enlace (empieza por →): solo el texto
// de "qué cambiar y qué debería sorprender" (lo que pide la plantilla de concepto).
function loQueSeDescubre(texto) {
  const m = /^## Practícalo\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto);
  if (!m) return '';
  return m[1].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('→') && !/^<.*>$/.test(l)).join(' ');
}

// El fichero real del ejercicio dentro de estudio/ejercicios/ (puede estar en una subcarpeta de unidad, si
// organizar.js ya lo colocó), con su ruta relativa a esa carpeta: desde ahí enlaza _index.md.
function ficheroDeEjercicio(raiz, slug) {
  const dir = path.join(v.baseAlumno(raiz), 'ejercicios');
  const [abs] = v.recorrer(dir, n => n === `${slug}.html` || n === `${slug}.md`);
  return abs ? v.aPosix(path.relative(dir, abs)) : null;
}

// Un ejercicio por concepto que lo declara (`ejercicio:` en su frontmatter). Si el mismo ejercicio lo declaran
// varios conceptos, hay una fila por cada uno: cada uno "descubre" algo distinto (regla de /ejercicio, paso 6).
function ejercicios(raiz) {
  const lista = [];
  for (const slug of v.listarConceptos(raiz)) {
    const texto = leer(raiz, `conceptos/${slug}.md`);
    const fm = v.leerFrontmatter(texto) || {};
    if (!fm.ejercicio) continue;
    lista.push({
      concepto: slug, titulo: indice.tituloDe(texto, slug), ejercicio: fm.ejercicio,
      ruta: ficheroDeEjercicio(raiz, fm.ejercicio), descubre: loQueSeDescubre(texto),
    });
  }
  return lista;
}
// estudio/ejercicios/_index.md: qué practica cada ejercicio, en las dos tablas que pide la skill /ejercicio.
function markdownEjercicios(raiz) {
  const lista = ejercicios(raiz);
  const lineas = ['# Índice de ejercicios', '', '> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne, desde el frontmatter de cada',
    '> concepto y los ficheros de `estudio/ejercicios/`, qué practica cada ejercicio.', ''];
  if (!lista.length) { lineas.push('Ningún ejercicio todavía.', ''); return lineas.join('\n'); }
  const enlaceEjercicio = e => e.ruta ? `[${enCelda(e.ejercicio.replace(/-/g, ' '))}](${e.ruta})` : `\`${e.ejercicio}\` (no se encuentra el fichero)`;
  lineas.push('## Por ejercicio', '', '| Ejercicio | Concepto | Lo que se descubre fallándolo |', '|---|---|---|');
  for (const e of [...lista].sort((a, b) => a.ejercicio.localeCompare(b.ejercicio) || a.concepto.localeCompare(b.concepto))) {
    lineas.push(`| ${enlaceEjercicio(e)} | ${enlaceConcepto(e.concepto, e.titulo, true)} | ${enCelda(e.descubre)} |`);
  }
  lineas.push('', '## Por concepto', '', '| Concepto | Ejercicio | Lo que se descubre fallándolo |', '|---|---|---|');
  for (const e of lista) lineas.push(`| ${enlaceConcepto(e.concepto, e.titulo, true)} | ${enlaceEjercicio(e)} | ${enCelda(e.descubre)} |`);
  lineas.push('');
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
  formulas, definiciones, markdownFormulario, ejercicios, markdownEjercicios,
};
