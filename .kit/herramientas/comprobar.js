'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const v = require('./lib/vault');
const { escanearSecretos } = require('./lib/secretos');
const indice = require('./lib/indice');
const generados = require('./lib/generados');
const paginasWeb = require('./lib/paginas-web');

const FUERA_DE_ENLACES = new Set(['.git', '.kit', '.claude', '.github', '.obsidian', 'docs', 'node_modules', 'pruebas-local']);

// Rutas relativas a la carpeta del alumno (`estudio/`), que es lo que él ve.
const leer = (raiz, rel) => fs.readFileSync(path.join(v.baseAlumno(raiz), ...rel.split('/')), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(v.baseAlumno(raiz), ...rel.split('/')));

// Lo que regenera guardar.js en cada guardado: si falta ahora (se borró, o aún no se ha guardado),
// no es un enlace roto, es que toca guardar. `inicio.md` puede llevar más basenames el día que
// GENERADOS_CON_ENLACES crezca; `pendientes` y `auditoria-del-material` no enlazan a otras notas
// (por eso no están en GENERADOS_CON_ENLACES), pero sí los enlaza `inicio.md`.
const BASENAMES_GENERADOS = () => new Set([...v.GENERADOS_CON_ENLACES.map(f => path.basename(f, '.md')), 'pendientes', 'auditoria-del-material']);

// Los [[enlaces]] de una nota que no llevan a ningún sitio.
function enlacesRotos(raiz, nota, nombres) {
  const rotos = [];
  for (const m of v.sinCodigo(leer(raiz, nota)).matchAll(/\[\[([^\]]+)\]\]/g)) {
    const destino = m[1].split(/\\?\|/)[0].split('#')[0].trim();
    if (!destino) continue;
    const ext = path.posix.extname(destino);
    const ok = ext && ext !== '.md'
      ? existe(raiz, destino)
      : existe(raiz, destino.replace(/\.md$/, '') + '.md') || nombres.has(path.posix.basename(destino, '.md'));
    if (!ok) rotos.push(destino);
  }
  return rotos;
}

function nombresDeNotas(raiz) {
  const nombres = new Set(v.recorrer(v.baseAlumno(raiz), n => n.endsWith('.md'), FUERA_DE_ENLACES).map(r => path.basename(r, '.md')));
  for (const generado of BASENAMES_GENERADOS()) nombres.add(generado);
  return nombres;
}

function comprobarEnlaces(raiz, notas, informe) {
  const nombres = nombresDeNotas(raiz);
  for (const nota of notas) {
    for (const destino of enlacesRotos(raiz, nota, nombres)) informe.errores.push({ regla: 'enlace-roto', fichero: nota, detalle: `[[${destino}]] no existe` });
  }
}

// mi-perfil.md copia texto de config/: un enlace roto allí no bloquea el guardado (nadie edita esa hoja), pero se ve
// como aviso para arreglarlo en su origen (desviación 4 del plan de mi perfil; se revisa con los demás avisos).
function comprobarEnlacesDelPerfil(raiz, informe) {
  if (!existe(raiz, 'mi-perfil.md')) return;
  for (const destino of enlacesRotos(raiz, 'mi-perfil.md', nombresDeNotas(raiz))) {
    informe.avisos.push({ regla: 'enlace-roto-en-perfil', fichero: 'mi-perfil.md',
      detalle: `[[${destino}]] no existe: viene de config/alumno.md o config/profesor.md, corrígelo allí` });
  }
  const propio = { errores: [], avisos: [] };
  comprobarQueSeVeraBien(raiz, ['mi-perfil.md'], propio);
  for (const a of propio.avisos) informe.avisos.push({ ...a, detalle: `${a.detalle} (viene de config/alumno.md o config/profesor.md: corrígelo allí)` });
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

// "El error típico" nunca es algo que el curso "tuviera que entregar" (plan 0.22, arreglo 5b.1): si no lo
// trae el material, se propone uno marcado como ampliación, o se borra la sección. Un FALTA INFO ahí es
// casi siempre de más, y llenaba pendientes que el alumno no puede resolver.
function comprobarFaltaInfoMalUsado(raiz, informe) {
  for (const slug of v.listarConceptos(raiz)) {
    const fichero = `conceptos/${slug}.md`;
    const seccion = capturarSeccion(leer(raiz, fichero), 'El error típico');
    if (seccion !== null && /FALTA INFO:/.test(seccion)) {
      informe.avisos.push({ regla: 'falta-info-mal-usado', fichero, detalle: '"## El error típico" lleva FALTA INFO — no es algo que el curso tuviera que entregar: propón uno marcado como ampliación, o borra la sección' });
    }
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
  // Los índices generados enlazan a todos (o casi): que un concepto salga en ellos no dice que alguien lo use.
  const indices = new Set(['conceptos/_index.md', 'formulario.md', 'ejercicios/_index.md', 'progreso.md']);
  const textos = notas.filter(n => !indices.has(n)).map(n => [n, leer(raiz, n)]);
  for (const slug of v.listarConceptos(raiz)) {
    const enlazado = textos.some(([n, t]) => n !== `conceptos/${slug}.md`
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

// Las páginas web del alumno (ejercicios y repasos) tienen que funcionar con doble clic y sin red. El JS de cada
// <script> se compila sin ejecutarse: un error de sintaxis deja la página muerta y en silencio. Lo hace esta
// herramienta, y no el profesor con comandos a mano (prueba real del 2026-09-24: se le denegaban). Ejecutarlo de
// verdad para barrer casos es cosa de verificar-ejercicio.js: aquí solo se comprueba que compila.
function comprobarPaginasWeb(raiz, informe) {
  const base = v.baseAlumno(raiz);
  for (const carpeta of ['ejercicios', 'repasos']) {
    for (const abs of v.recorrer(path.join(base, carpeta), n => n.endsWith('.html'))) {
      const fichero = v.aPosix(path.relative(base, abs));
      const html = fs.readFileSync(abs, 'utf8');
      for (const { codigo, lineaInicial } of paginasWeb.scriptsJs(html)) {
        try {
          new vm.Script(codigo, { filename: fichero });
        } catch (error) {
          const enScript = Number((new RegExp(`${fichero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(\\d+)`).exec(error.stack) || [])[1]) || 1;
          informe.errores.push({ regla: 'ejercicio-con-errores', fichero,
            detalle: `línea ${lineaInicial + enScript}: ${error.message} — con un error así la página no funciona, y no avisa` });
        }
      }
      const fuera = paginasWeb.cargasDeFuera(html);
      if (fuera.length) {
        informe.avisos.push({ regla: 'ejercicio-con-red', fichero,
          detalle: `carga de internet ${fuera.join(', ')}: tiene que funcionar sin red y con doble clic, con todo dentro del fichero` });
      }
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

// --- Lint pedagógico: seis avisos que hacen que la calidad del material no dependa de que el modelo
// siga la skill al pie de la letra. Todo se calcula desde disco (AGENTS.md, §5.3 de la auditoría).

function leerProfesor(raiz) {
  const f = path.join(raiz, 'config', 'profesor.md');
  return fs.existsSync(f) ? (v.leerFrontmatter(fs.readFileSync(f, 'utf8')) || {}) : {};
}

// Sección con su cuerpo crudo (sin el pie de navegación, que no es contenido). null si la sección no existe.
// Con `conAnadido`, también vale el título seguido de un añadido que no sea una letra más ("## El ejemplo, paso a
// paso", "## El ejemplo (del curso)"): cursos anteriores a la 0.21 lo escribían así (issue #38).
function capturarSeccion(texto, titulo, { conAnadido = false } = {}) {
  const resto = conAnadido ? '(?![\\p{L}])[^\\n]*\\n' : '\\s*\\n';
  const re = new RegExp(`^## ${generados.escaparRegex(titulo)}${resto}([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, conAnadido ? 'mu' : 'm');
  const m = re.exec(indice.sinPie(texto));
  return m ? m[1] : null;
}

// El cuerpo real de una sección: sin las líneas que son puro texto de plantilla (`*énfasis*`, `<hueco>`)
// ni las que están en blanco. Mismo criterio que ya usaba `auditorias()` para no contar una plantilla sin tocar.
function cuerpoReal(cuerpo) {
  if (cuerpo === null) return '';
  return cuerpo.split('\n').filter(l => l.trim() && !/^[*_<>].*[*_>]$/.test(l.trim())).join('\n').trim();
}

function seccionVacia(texto, titulo, opciones) {
  const cuerpo = cuerpoReal(capturarSeccion(texto, titulo, opciones));
  return !cuerpo || /^<.*>$/.test(cuerpo);
}

function comprobarConceptoSinEjemplo(raiz, informe) {
  for (const slug of v.listarConceptos(raiz)) {
    const fichero = `conceptos/${slug}.md`;
    if (seccionVacia(leer(raiz, fichero), 'El ejemplo', { conAnadido: true })) {
      informe.avisos.push({ regla: 'concepto-sin-ejemplo', fichero, detalle: 'falta "## El ejemplo" (o está vacía, o tiene el texto de la plantilla) — "ejemplo antes que definición": sin él, la nota explica en el vacío' });
    }
  }
}

// "Lo que distingue una sesión trabajada de unos apuntes pasados a limpio" (skill /sesion): si falta o está
// vacía, se dice por sección — cada una mide algo distinto (cobertura del material, calidad del material,
// preguntas de fondo) y el motivo de arreglarla es distinto en cada caso.
const SECCIONES_SESION_COMPLETA = ['Cobertura del material', 'Auditoría del material', 'Para pensarlo despacio'];
function comprobarSesionIncompleta(raiz, informe) {
  for (const abs of v.recorrer(path.join(v.baseAlumno(raiz), 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_'))) {
    const rel = v.aPosix(path.relative(v.baseAlumno(raiz), abs));
    const texto = fs.readFileSync(abs, 'utf8');
    for (const titulo of SECCIONES_SESION_COMPLETA) {
      if (seccionVacia(texto, titulo)) {
        informe.avisos.push({ regla: 'sesion-incompleta', fichero: rel, detalle: `falta "## ${titulo}" (o está vacía, o tiene el texto de la plantilla)` });
      }
    }
  }
}

// Un `> [!question]-` es un callout **plegado**: en Obsidian no se ve hasta que el alumno lo abre, así que no
// cuenta para "cabe en una pantalla". El pie de navegación tampoco es contenido (ya lo quita `indice.sinPie`).
function sinCalloutsDeDudaPlegados(texto) {
  const salida = [];
  let dentro = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (/^>\s*\[!question\]-/.test(linea)) { dentro = true; continue; }
    if (dentro && /^>/.test(linea)) continue;
    dentro = false;
    salida.push(linea);
  }
  return salida.join('\n');
}

function lineasDeContenido(texto) {
  const sinFrontmatter = texto.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const cuerpo = indice.sinPie(sinCalloutsDeDudaPlegados(sinFrontmatter));
  return cuerpo.split(/\r?\n/).filter(l => l.trim() !== '').length;
}

// "Una nota cabe en una pantalla" (AGENTS.md). 60 líneas de contenido es el límite por defecto: la plantilla
// de concepto.md, ya rellena con un ejemplo y una fórmula normales, ronda las 35-40 líneas; 60 deja margen
// para un ejemplo algo más largo sin dejar pasar un concepto que en realidad son dos. `longitud_nota` en
// `config/profesor.md` lo sustituye cuando es un número; el valor por palabras ("una pantalla") usa este.
const LONGITUD_NOTA_POR_DEFECTO = 60;
function limiteLongitudNota(raiz) {
  const n = v.numero(leerProfesor(raiz).longitud_nota);
  return n && n > 0 ? Math.round(n) : LONGITUD_NOTA_POR_DEFECTO;
}

function comprobarNotaLarga(raiz, informe) {
  const limite = limiteLongitudNota(raiz);
  for (const slug of v.listarConceptos(raiz)) {
    const fichero = `conceptos/${slug}.md`;
    const n = lineasDeContenido(leer(raiz, fichero));
    if (n > limite) {
      informe.avisos.push({ regla: 'nota-larga', fichero, detalle: `${n} líneas de contenido, más de las ${limite} de "longitud_nota" en config/profesor.md — no cabe en una pantalla: probablemente son dos conceptos pegados, o sobra desarrollo` });
    }
  }
}

// `flashcards_por_sesion` es "3-6" (rango) o un número suelto (exactamente ese número).
const RANGO_FLASHCARDS_POR_DEFECTO = [3, 6];
function rangoFlashcards(raiz) {
  const bruto = String(leerProfesor(raiz).flashcards_por_sesion || '').trim();
  const rango = /^(\d+)\s*-\s*(\d+)$/.exec(bruto);
  if (rango) return [Number(rango[1]), Number(rango[2])];
  const n = v.numero(bruto);
  return n !== null ? [n, n] : RANGO_FLASHCARDS_POR_DEFECTO;
}

// Cuenta preguntas como las cuenta la plantilla `.kit/plantillas/flashcards.md`: cada pregunta va seguida de
// un callout plegado `> [!success]- Respuesta`, uno por pregunta y ninguno más en el fichero.
function comprobarFlashcardsFueraDeRango(raiz, informe) {
  const [min, max] = rangoFlashcards(raiz);
  for (const abs of v.recorrer(path.join(v.baseAlumno(raiz), 'flashcards'), n => n.endsWith('.md'))) {
    const rel = v.aPosix(path.relative(v.baseAlumno(raiz), abs));
    const n = (v.sinCodigo(fs.readFileSync(abs, 'utf8')).match(/^>\s*\[!success\]-/gm) || []).length;
    if (n < min || n > max) {
      informe.avisos.push({ regla: 'flashcards-fuera-de-rango', fichero: rel, detalle: `${n} flashcard${n === 1 ? '' : 's'}, fuera del rango ${min}-${max} de "flashcards_por_sesion" en config/profesor.md` });
    }
  }
}

// "La duda revela un prerrequisito flojo" (skill /dudas): si de verdad cuesta (dificultad: 3) y no declara de
// qué depende, casi siempre es que falta nombrar el prerrequisito, no que el concepto sea intrínsecamente duro.
function comprobarRequiereVacio(raiz, informe) {
  for (const slug of v.listarConceptos(raiz)) {
    const fichero = `conceptos/${slug}.md`;
    const fm = v.leerFrontmatter(leer(raiz, fichero)) || {};
    const requiere = Array.isArray(fm.requiere) ? fm.requiere : [];
    if (v.numero(fm.dificultad) === 3 && requiere.length === 0) {
      informe.avisos.push({ regla: 'requiere-vacio', fichero, detalle: 'dificultad: 3 y "requiere:" vacío — si de verdad cuesta, revisa si depende de otro concepto que falta declarar' });
    }
  }
}

// Una "pregunta" es lo que la skill /examen numera (`1. `, `2. `…) hasta su cierre: la línea
// `✍️ **Tu respuesta:**` en el formato libre de antes, o su primera opción con casilla (`- [ ] a) …`) en el
// tipo test (examen v1). Son los dos formatos que exige la propia skill, así que es la única forma fiable de
// saber dónde empieza y acaba una pregunta sin adivinar. Sin ninguno de los dos cierres no se cuenta como
// pregunta (heurística conservadora: mejor no avisar que avisar de un fichero que no sigue ningún formato).
// Las soluciones (y, en el test, el resto de opciones) van después del cierre, así que quedan fuera solas.
const OPCION_CON_CASILLA = /^-\s*\[[ xX]\]\s*[a-zA-Z]\)/;

function preguntasDeExamen(texto) {
  const sinFrontmatter = texto.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const lineas = indice.sinPie(v.sinCodigo(sinFrontmatter)).split(/\r?\n/);
  const preguntas = [];
  let actual = null;
  for (const linea of lineas) {
    if (/✍️\s*\*\*Tu respuesta:\*\*/.test(linea) || OPCION_CON_CASILLA.test(linea)) {
      if (actual) preguntas.push(actual.join('\n'));
      actual = null;
      continue;
    }
    if (/^(\d+\.\s|\*\*\d+\.\*\*)/.test(linea)) { actual = [linea]; continue; }
    if (actual) actual.push(linea);
  }
  return preguntas;
}

// "Una pregunta pregunta una cosa" (AGENTS.md): dos o más `?` en el mismo enunciado son casi siempre dos
// preguntas pegadas. No se intenta detectar la unión con "y" sin un segundo `?` — da demasiados falsos
// positivos en texto de dominio ("¿cuánto mide el lado de un cuadrado de 20 m² de área?" es una sola
// pregunta, con una "y" perfectamente normal en el dato) y aquí conviene más callar que avisar de más.
// Una opción de respuesta ("- a) …" del formato libre, "- [ ] a) …" del tipo test): su texto no es del
// enunciado, así que un "?" ahí no cuenta como una segunda pregunta.
const ES_OPCION = l => /^-\s*(\[[ xX]\]\s*)?[a-zA-Z]\)/.test(l.trim());

function comprobarPreguntaDoble(raiz, informe) {
  for (const abs of v.recorrer(path.join(v.baseAlumno(raiz), 'examenes'), n => n.endsWith('.md'))) {
    const rel = v.aPosix(path.relative(v.baseAlumno(raiz), abs));
    for (const pregunta of preguntasDeExamen(fs.readFileSync(abs, 'utf8'))) {
      const enunciado = pregunta.split('\n').filter(l => !ES_OPCION(l)).join('\n');
      const signos = (enunciado.match(/\?/g) || []).length;
      if (signos >= 2) {
        const resumen = pregunta.replace(/\s+/g, ' ').trim().slice(0, 70);
        informe.avisos.push({ regla: 'pregunta-doble', fichero: rel, detalle: `"${resumen}…" tiene ${signos} signos de interrogación — probablemente son dos preguntas pegadas: sepáralas` });
      }
    }
  }
}

function comprobarPiezas(raiz, informe) {
  for (const p of v.piezasAusentes(raiz)) {
    informe.errores.push({ regla: 'pieza-ausente', fichero: p.ruta, detalle: 'falta (¿borrado o movido sin querer?) → node .kit/herramientas/reparar.js lo recupera' });
  }
}

// Propiedades que el kit no sabe leer, o lee pero no le sirven (`estudiada: sí`, `nota: 7/10`). Aviso, no error:
// el profesor pregunta al alumno qué quería decir y lo reescribe en el estándar.
function comprobarPropiedades(raiz, notas, informe) {
  for (const nota of notas) {
    for (const p of v.revisarPropiedades(leer(raiz, nota))) {
      informe.avisos.push({ regla: 'propiedad-no-estandar', fichero: nota, detalle: `línea ${p.linea}: «${p.texto}» — ${p.motivo}. Entiende qué quería decir el alumno (mira "Cómo escribe en sus notas" en config/alumno.md), pregúntaselo si no lo sabes y reescríbelo en el estándar` });
    }
  }
}

// Un ajuste con el tipo equivocado no se adivina (issue #39, H07): "false" en texto no es false.
function comprobarAjustes(raiz, informe) {
  const fichero = path.join(raiz, 'config', 'ajustes.json');
  if (!fs.existsSync(fichero)) return;
  let ajustes;
  try { ajustes = JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch { return; }
  for (const p of v.revisarAjustes(ajustes)) {
    informe.avisos.push({ regla: 'ajuste-no-valido', fichero: 'config/ajustes.json',
      detalle: `"${p.clave}" vale ${p.valor} y tiene que ser ${p.esperado}: hasta que se arregle, se usa el valor más prudente${p.clave === 'subir_a_github' ? ' (no se sube a GitHub)' : ''}` });
  }
}

function comprobar(raiz) {
  const informe = { errores: [], avisos: [] };
  comprobarPiezas(raiz, informe);
  const notas = v.listarNotas(raiz);
  comprobarEnlaces(raiz, notas, informe);
  comprobarIndice(raiz, informe);
  comprobarFrontmatter(raiz, informe);
  comprobarPropiedades(raiz, notas, informe);
  comprobarProgreso(raiz, informe);
  const declarados = comprobarEjercicios(raiz, notas, informe);
  comprobarEjerciciosSueltos(raiz, declarados, informe);
  comprobarPaginasWeb(raiz, informe);
  comprobarPatrones(raiz, notas, informe);
  comprobarQueSeVeraBien(raiz, notas, informe);
  comprobarPendientes(raiz, informe);
  comprobarFaltaInfoMalUsado(raiz, informe);
  comprobarHuerfanos(raiz, notas, informe);
  comprobarDuplicados(raiz, informe);
  comprobarAlias(raiz, informe);
  comprobarUnidades(raiz, informe);
  comprobarIndiceDelCurso(raiz, informe);
  comprobarConceptoSinEjemplo(raiz, informe);
  comprobarSesionIncompleta(raiz, informe);
  comprobarNotaLarga(raiz, informe);
  comprobarFlashcardsFueraDeRango(raiz, informe);
  comprobarRequiereVacio(raiz, informe);
  comprobarPreguntaDoble(raiz, informe);
  comprobarObsidianVeEjercicios(raiz, informe);
  comprobarAjustes(raiz, informe);
  comprobarEnlacesDelPerfil(raiz, informe);
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
// --revisado: el profesor ha repasado los avisos con el alumno. Se apunta cuándo y cuántos había, y estado.js avisa
// cuando vuelvan a crecer (señal `avisos-acumulados`).
function apuntarRevision(raiz, avisos, hoy = new Date().toISOString().slice(0, 10)) {
  fs.mkdirSync(path.join(raiz, 'config'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'config', 'revision-avisos.json'), JSON.stringify({ fecha: hoy, avisos }, null, 2) + '\n');
}

function cli(args, raizPorDefecto) {
  const i = args.indexOf('--raiz');
  const raiz = i >= 0 ? path.resolve(args[i + 1]) : raizPorDefecto;
  const informe = comprobar(raiz);
  if (args.includes('--revisado')) {
    apuntarRevision(raiz, informe.avisos.length);
    if (args.includes('--json')) console.log(JSON.stringify(informe));
    else console.log(`Revisión apuntada: ${informe.avisos.length} aviso(s) en config/revision-avisos.json.`);
    return informe.errores.length ? 1 : 0;
  }
  if (args.includes('--json')) console.log(JSON.stringify(informe));
  else imprimir(informe);
  return informe.errores.length ? 1 : 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'comprobar.js');

module.exports = { comprobar, slugsDelIndice, cli };
