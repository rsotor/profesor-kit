'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const { escanearSecretos } = require('./lib/secretos');
const indice = require('./lib/indice');
const generados = require('./lib/generados');

const FUERA_DE_ENLACES = new Set(['.git', '.kit', '.claude', '.github', '.obsidian', 'docs', 'node_modules', 'pruebas-local']);

// Rutas relativas a la carpeta del alumno (`estudio/`), que es lo que él ve.
const leer = (raiz, rel) => fs.readFileSync(path.join(v.baseAlumno(raiz), ...rel.split('/')), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(v.baseAlumno(raiz), ...rel.split('/')));

// Lo que regenera guardar.js en cada guardado: si falta ahora (se borró, o aún no se ha guardado),
// no es un enlace roto, es que toca guardar. `inicio.md` puede llevar más basenames el día que
// GENERADOS_CON_ENLACES crezca; `pendientes` y `auditoria-del-material` no enlazan a otras notas
// (por eso no están en GENERADOS_CON_ENLACES), pero sí los enlaza `inicio.md`.
const BASENAMES_GENERADOS = () => new Set([...v.GENERADOS_CON_ENLACES.map(f => path.basename(f, '.md')), 'pendientes', 'auditoria-del-material']);

function comprobarEnlaces(raiz, notas, informe) {
  const nombres = new Set(
    v.recorrer(v.baseAlumno(raiz), n => n.endsWith('.md'), FUERA_DE_ENLACES).map(r => path.basename(r, '.md'))
  );
  for (const generado of BASENAMES_GENERADOS()) nombres.add(generado);
  for (const nota of notas) {
    const texto = v.sinCodigo(leer(raiz, nota));
    for (const m of texto.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const destino = m[1].split(/\\?\|/)[0].split('#')[0].trim();
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
    const dirEj = path.join(v.baseAlumno(raiz), 'ejercicios');
    const hayEjercicio = v.recorrer(dirEj, n => n === `${fm.ejercicio}.html` || n === `${fm.ejercicio}.md`).length > 0;
    if (!hayEjercicio) {
      informe.errores.push({ regla: 'ejercicio', fichero: `conceptos/${slug}.md`, detalle: `declara ejercicio "${fm.ejercicio}" y no existe ejercicios/${fm.ejercicio}.html ni .md` });
    }
  }
  return declarados;
}

function comprobarPendientes(raiz, informe) {
  const marcador = new RegExp(generados.escaparRegex(v.leerMarcador(raiz)), 'g');
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

// Un alias que apunta a dos notas hace ambigua la pregunta "¿este concepto ya existe?".
function comprobarAlias(raiz, informe) {
  const duenos = new Map();
  for (const slug of v.listarConceptos(raiz)) {
    const fm = v.leerFrontmatter(leer(raiz, `conceptos/${slug}.md`)) || {};
    for (const alias of Array.isArray(fm.alias) ? fm.alias : []) {
      const clave = alias.toLowerCase().trim();
      if (duenos.has(clave) && duenos.get(clave) !== slug) informe.avisos.push({ regla: 'alias-repetido', fichero: `conceptos/${slug}.md`, detalle: `el alias «${alias}» también está en ${duenos.get(clave)} — ¿son el mismo concepto, o el alias sobra en uno?` });
      else duenos.set(clave, slug);
    }
  }
}

// Dos nombres son sospechosos si comparten al menos dos palabras significativas y ninguno es simplemente el
// otro con un calificativo delante o detrás (`renta-variable` / `vehiculos-de-renta-variable` son conceptos
// distintos). Una sola palabra en común («riesgo», «renta») es ruido de dominio, no un duplicado (issue #12).
function comprobarDuplicados(raiz, informe) {
  const slugs = v.listarConceptos(raiz);
  const palabras = s => new Set(s.split('-').filter(p => p.length >= 5));
  for (let i = 0; i < slugs.length; i++) {
    for (let j = i + 1; j < slugs.length; j++) {
      const a = palabras(slugs[i]), b = palabras(slugs[j]);
      const comun = [...a].filter(p => b.has(p));
      const contenido = [...a].every(p => b.has(p)) || [...b].every(p => a.has(p));
      if (comun.length >= 2 && !contenido) informe.avisos.push({ regla: 'posible-duplicado', fichero: `conceptos/${slugs[i]}.md`, detalle: `comparte «${comun.join('», «')}» con ${slugs[j]} — ¿son el mismo concepto?` });
    }
  }
}

function comprobarEjerciciosSueltos(raiz, declarados, informe) {
  const dir = path.join(v.baseAlumno(raiz), 'ejercicios');
  if (!fs.existsSync(dir)) return;
  for (const abs of v.recorrer(dir, n => n.endsWith('.html'))) {
    const n = path.basename(abs);
    if (!declarados.has(n.slice(0, -5))) {
      informe.avisos.push({ regla: 'ejercicio-suelto', fichero: v.aPosix(path.relative(v.baseAlumno(raiz), abs)), detalle: 'ningún concepto lo declara en su frontmatter' });
    }
  }
}

// Cosas que Obsidian no va a dibujar bien. No son del dominio de ningún curso: son límites del motor de
// fórmulas (MathJax) y de las tablas de markdown, y por eso viven en el núcleo y no en `patrones_prohibidos`.
const MONEDA = /[\u20ac\u00a3\u00a5]/;   // símbolos de moneda, escritos por su código: MathJax no los acepta en una fórmula
const PORCENTAJE_SIN_PROTEGER = /(?<!\\)%/;                   // en una fórmula, % abre un comentario: lo que sigue desaparece
const FORMULA_EN_LINEA = /(?<!\$)\$(?![\s$])([^$\n]+?)(?<!\s)\$(?!\$)/g;
const ALIAS_SIN_PROTEGER_EN_TABLA = /\[\[[^\]|\\]*\|[^\]]*\]\]/; // [[nota|texto]] dentro de una tabla descuadra la fila

function revisarFormula(formula, nota, linea, informe) {
  if (MONEDA.test(formula)) informe.avisos.push({ regla: 'no-se-vera-bien', fichero: nota, detalle: `línea ${linea}: símbolo de moneda dentro de una fórmula — Obsidian enseñará el código en vez de la fórmula. La cifra con su moneda va fuera, en texto normal` });
  if (PORCENTAJE_SIN_PROTEGER.test(formula)) informe.avisos.push({ regla: 'no-se-vera-bien', fichero: nota, detalle: `línea ${linea}: % sin proteger dentro de una fórmula — lo que va detrás desaparece. Escribe \\%` });
}

function comprobarQueSeVeraBien(raiz, notas, informe) {
  for (const nota of notas) {
    let enBloque = false;
    let enCodigo = false;
    leer(raiz, nota).split(/\r?\n/).forEach((lineaTexto, i) => {
      if (/^\s*```/.test(lineaTexto)) { enCodigo = !enCodigo; return; }
      if (enCodigo) return;
      const linea = lineaTexto.replace(/`[^`]*`/g, '');
      const marcas = (linea.match(/\$\$/g) || []).length;
      if (marcas === 1) { enBloque = !enBloque; revisarFormula(linea.replace('$$', ''), nota, i + 1, informe); return; }
      if (enBloque) { revisarFormula(linea, nota, i + 1, informe); return; }
      if (marcas >= 2) for (const m of linea.matchAll(/\$\$(.+?)\$\$/g)) revisarFormula(m[1], nota, i + 1, informe);
      for (const m of linea.replace(/\$\$.+?\$\$/g, '').matchAll(FORMULA_EN_LINEA)) revisarFormula(m[1], nota, i + 1, informe);
      if (/^\s*\|/.test(linea) && ALIAS_SIN_PROTEGER_EN_TABLA.test(linea)) {
        informe.avisos.push({ regla: 'no-se-vera-bien', fichero: nota, detalle: `línea ${i + 1}: enlace con alias dentro de una tabla — la barra del alias descuadra la fila. Escribe [[nota\\|texto]]` });
      }
    });
  }
}

// Si el curso tiene estructura (config/estructura.json), lo que queda suelto en la raíz de sesiones/ es un despiste.
function comprobarUnidades(raiz, informe) {
  const estructura = path.join(raiz, 'config', 'estructura.json');
  const dir = path.join(v.baseAlumno(raiz), 'sesiones');
  if (!fs.existsSync(estructura) || !fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir)) {
    if (n.endsWith('.md') && !n.startsWith('_')) informe.avisos.push({ regla: 'sin-unidad', fichero: `sesiones/${n}`, detalle: 'está suelta en sesiones/: node .kit/herramientas/organizar.js la coloca en su unidad (o su nombre no empieza por ningún prefijo de config/estructura.json)' });
  }
}

// Obsidian oculta por defecto todo lo que no es una nota: los ejercicios web (.html) no aparecen en su lista
// y el alumno no los encuentra. Se arregla activando "Detectar todas las extensiones de archivo".
function comprobarObsidianVeEjercicios(raiz, informe) {
  const base = v.baseAlumno(raiz);
  const hayHtml = v.recorrer(path.join(base, 'ejercicios'), n => n.endsWith('.html')).length > 0;
  const appJson = path.join(base, '.obsidian', 'app.json');
  if (!hayHtml || !fs.existsSync(appJson)) return;
  let ajustes = {};
  try { ajustes = JSON.parse(fs.readFileSync(appJson, 'utf8')); } catch { return; }
  if (ajustes.showUnsupportedFiles !== true) {
    informe.avisos.push({ regla: 'obsidian-oculta-ejercicios', fichero: '.obsidian/app.json', detalle: 'Obsidian no enseña los ejercicios web: pon "showUnsupportedFiles": true en ese fichero (o Ajustes → Archivos y enlaces → Detectar todas las extensiones de archivo) y que reinicie Obsidian' });
  }
}

// El índice del curso (inicio.md y los pies) sale de las sesiones y los exámenes: aquí se avisa de lo que haría
// que saliera mal. No son errores: el índice se genera igual.
function comprobarIndiceDelCurso(raiz, informe) {
  const sesiones = indice.leerSesiones(raiz);
  for (const s of indice.ordenAmbiguo(sesiones)) {
    informe.avisos.push({ regla: 'orden-ambiguo', fichero: s.rel, detalle: 'comparte cifras con otra sesión y el grupo no tiene `orden:` en todas: pon `orden: 1`, `orden: 2`… en su frontmatter para que la navegación siga el temario' });
  }
  for (const s of sesiones) {
    if (indice.marcadoresRotos(leer(raiz, s.rel))) informe.avisos.push({ regla: 'navegacion-rota', fichero: s.rel, detalle: 'el pie de navegación tiene un marcador %% sin el otro: guardar.js no lo toca hasta que se arregle (borra el pie entero y se vuelve a generar)' });
  }
  for (const e of indice.leerExamenes(raiz)) {
    // La skill crea el examen con `nota:` vacía a propósito (se rellena al corregir): eso solo es
    // aviso si ya hay un intento corregido y sigue sin nota. `unidad:` y `fecha:` sí hacen falta desde el principio.
    if (!e.unidades.length || !e.fecha) {
      informe.avisos.push({ regla: 'examen-sin-nota', fichero: e.rel, detalle: 'le falta `unidad:` o `fecha:` (AAAA-MM-DD) en el frontmatter: sin ellas no sale en inicio' });
    } else if (e.nota === null && /^## Histórico de intentos/m.test(leer(raiz, e.rel))) {
      informe.avisos.push({ regla: 'examen-sin-nota', fichero: e.rel, detalle: 'ya tiene un intento corregido en "## Histórico de intentos" y sigue sin `nota:` (sobre 10) en el frontmatter: sin ella no sale en inicio' });
    }
  }
}

function comprobarPiezas(raiz, informe) {
  for (const p of v.piezasAusentes(raiz)) {
    informe.errores.push({ regla: 'pieza-ausente', fichero: p.ruta, detalle: 'falta (¿borrado o movido sin querer?) → node .kit/herramientas/reparar.js lo recupera' });
  }
}

function comprobar(raiz) {
  const informe = { errores: [], avisos: [] };
  comprobarPiezas(raiz, informe);
  const notas = v.listarNotas(raiz);
  comprobarEnlaces(raiz, notas, informe);
  comprobarIndice(raiz, informe);
  comprobarFrontmatter(raiz, informe);
  comprobarProgreso(raiz, informe);
  const declarados = comprobarEjercicios(raiz, notas, informe);
  comprobarEjerciciosSueltos(raiz, declarados, informe);
  comprobarPatrones(raiz, notas, informe);
  comprobarQueSeVeraBien(raiz, notas, informe);
  comprobarPendientes(raiz, informe);
  comprobarHuerfanos(raiz, notas, informe);
  comprobarDuplicados(raiz, informe);
  comprobarAlias(raiz, informe);
  comprobarUnidades(raiz, informe);
  comprobarIndiceDelCurso(raiz, informe);
  comprobarObsidianVeEjercicios(raiz, informe);
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

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'comprobar.js');

module.exports = { comprobar, slugsDelIndice, cli };
