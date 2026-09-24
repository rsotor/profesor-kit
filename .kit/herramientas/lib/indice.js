'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');
const { leerEstructura, unidadDe } = require('../organizar');
const repaso = require('./repaso');

const INICIO = 'inicio.md';
const APROBADO_POR_DEFECTO = 5;
const OTRAS_HOJAS = ['mi-perfil', 'mapa-del-curso', 'progreso', 'formulario', 'test-inicial', 'como-usar-tu-profesor'];
const MARCA = { repasar: () => '🔁 repasar', superada: () => '✅ superada', faltan: e => `📝 faltan ${e.faltan}`, vacio: () => '' };

// El índice del curso: estudio/inicio.md y el pie de navegación de cada sesión. Aquí solo se calcula; quien
// escribe es guardar.js. Todo sale de lo que ya hay en disco: nadie rellena el índice a mano.

const ESTADO = /(✅|🟡|🔴|⬜)/u;
const SIN_EVALUAR = { teoria: '⬜', aplicacion: '⬜' };
const FALLADO = e => e === '🟡' || e === '🔴';
// Destino de un [[enlace]]: sin alias (| o \|), sin #sección, sin carpeta.
const destino = crudo => path.posix.basename(crudo.split(/\\?\|/)[0].split('#')[0].trim());

function conceptosDe(texto) {
  const m = /^## Conceptos\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(sinPie(texto));
  if (!m) return [];
  return [...new Set([...m[1].matchAll(/\[\[([^\]]+)\]\]/g)].map(x => destino(x[1])).filter(Boolean))];
}

function tituloDe(texto, id) {
  const cuerpo = texto.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const m = /^#\s+(.+)$/m.exec(cuerpo);
  return m ? m[1].replace(/^\S+\s+·\s+/, '').trim() : id;
}

function leerSesiones(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const texto = fs.readFileSync(abs, 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    const id = path.basename(abs, '.md');
    const num = /^(\d+(?:-\d+)*)(?=-|$)/.exec(id);
    const clases = Array.isArray(fm.clases) ? fm.clases.map(String) : (fm.clases ? [String(fm.clases)] : []);
    return {
      id,
      rel: v.aPosix(path.relative(base, abs)),
      titulo: tituloDe(texto, id),
      clases,
      numeros: num ? num[1].split('-').map(Number) : null,
      clave: num ? num[1] : null,
      orden: v.numero(fm.orden),
      estudiada: v.esCierto(fm.estudiada),
      trabajada: String(fm.trabajada || ''),
      conceptos: conceptosDe(texto),
    };
  });
}

function compararNumeros(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Orden del temario: cifras del id; si empatan, `orden:`; el slug solo como último recurso (comprobar avisa).
function compararSesiones(a, b) {
  if (a.numeros && !b.numeros) return -1;
  if (!a.numeros && b.numeros) return 1;
  if (a.numeros) {
    const n = compararNumeros(a.numeros, b.numeros);
    if (n) return n;
    const oa = a.orden ?? Infinity;
    const ob = b.orden ?? Infinity;
    if (oa !== ob) return oa < ob ? -1 : 1;
  } else if (a.trabajada !== b.trabajada) {
    return a.trabajada < b.trabajada ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

function ordenAmbiguo(sesiones) {
  const grupos = new Map();
  for (const s of sesiones) if (s.clave) grupos.set(s.clave, [...(grupos.get(s.clave) || []), s]);
  return [...grupos.values()].filter(g => g.length > 1 && g.some(s => s.orden === null)).flat();
}

function leerProgreso(raiz) {
  const estados = new Map();
  const f = path.join(v.baseAlumno(raiz), 'progreso.md');
  if (!fs.existsSync(f)) return estados;
  const estado = celda => (ESTADO.exec(celda || '') || [null, '⬜'])[1];
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const celdas = linea.split(/(?<!\\)\|/).map(c => c.trim());   // la \| de un alias no separa celdas
    const m = /^\[\[([^\]]+)\]\]/.exec(celdas[1] || '');
    if (!m) continue;
    estados.set(destino(m[1]), { teoria: estado(celdas[2]), aplicacion: estado(celdas[3]) });
  }
  return estados;
}

// Lo que el profesor tiene probado de una sesión. Un concepto está probado con la teoría en ✅ y nada fallado.
// Dominado: la teoría en ✅ y nada fallado. La misma vara que "superada" en una sesión.
const dominado = e => e.teoria === '✅' && !FALLADO(e.aplicacion);

function estadoProfesor(conceptos, progreso) {
  const estados = conceptos.map(c => progreso.get(c) || SIN_EVALUAR);
  if (estados.some(e => FALLADO(e.teoria) || FALLADO(e.aplicacion))) return { marca: 'repasar' };
  const probados = estados.filter(e => e.teoria === '✅').length;
  if (probados === 0) return { marca: 'vacio' };
  if (probados === conceptos.length) return { marca: 'superada' };
  return { marca: 'faltan', faltan: conceptos.length - probados };
}

function leerExamenes(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'examenes'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const fm = v.leerFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    const fecha = String(fm.fecha || '');
    return {
      rel: v.aPosix(path.relative(base, abs)),
      unidades: (Array.isArray(fm.unidad) ? fm.unidad : [fm.unidad]).filter(Boolean).map(String),
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
      nota: v.numero(fm.nota),
      parcial: v.esCierto(fm.parcial),
    };
  });
}

// La nota de una unidad es la de su último examen completo: nunca la media, que castiga haber mejorado.
function notaDeUnidad(prefijo, examenes) {
  const validos = examenes
    .filter(e => !e.parcial && e.nota !== null && e.fecha && e.unidades.includes(prefijo))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.rel.localeCompare(b.rel));
  return validos.length ? validos[validos.length - 1] : null;
}

// E3: el progreso de inicio (conceptos dominados y módulos superados) se quita con `progreso_en_inicio: no` en
// config/profesor.md. Por defecto, sí.
function progresoEnInicio(raiz) {
  const f = path.join(raiz, 'config', 'profesor.md');
  const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) : null;
  const valor = fm ? fm.progreso_en_inicio : undefined;
  return !(valor === false || /^(no|false)$/i.test(String(valor ?? '').trim()));
}

function leerAprobado(raiz) {
  const f = path.join(raiz, 'config', 'curso.md');
  const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) : null;
  return v.numero(fm && fm.aprobado) ?? APROBADO_POR_DEFECTO;
}

const textoNota = (e, aprobado) =>
  `📝 ${e.nota.toFixed(1).replace('.', ',')}${e.nota < aprobado ? ' suspenso' : ''} (${e.fecha})`;

function aliasDe(s) {
  const clases = s.clases.join('-');
  // Si el centro ya pone el título en la etiqueta ("Clase 1.1 · El dinero…"), no se repite.
  const conTitulo = clases.toLowerCase().includes(s.titulo.toLowerCase()) ? clases : `${clases ? clases + ' ' : ''}${s.titulo}`;
  return conTitulo.replace(/[[\]|\\]/g, '').trim();
}

function enlace(s, enTabla = false) {
  const alias = aliasDe(s);
  return `[[${s.id}${enTabla ? '\\|' : '|'}${alias}]]`;
}

// El pie va entre comentarios de Obsidian, que no se ven al leer. La línea en blanco antes de `---` es obligatoria:
// sin ella, Markdown lee la línea de arriba como un título.
const MARCA_INICIO = '%% navegación: la genera guardar.js; no se edita a mano %%';
const MARCA_FIN = '%% fin de la navegación %%';

// El pie de navegación no es contenido de la nota: se quita antes de leer sus secciones.
function sinPie(texto) {
  const i = texto.indexOf(MARCA_INICIO);
  const f = texto.indexOf(MARCA_FIN);
  return i >= 0 && f > i ? texto.slice(0, i) + texto.slice(f + MARCA_FIN.length) : texto;
}

function pieDeSesion(anterior, siguiente) {
  const partes = [];
  if (anterior) partes.push(`← ${enlace(anterior)}`);
  partes.push('[[inicio|🏠 Inicio]]');
  if (siguiente) partes.push(`${enlace(siguiente)} →`);
  return [MARCA_INICIO, '', '---', partes.join(' · '), MARCA_FIN].join('\n');
}

const ocurrencias = (texto, marca) => texto.split(marca).length - 1;

function marcadoresRotos(texto) {
  const i = texto.indexOf(MARCA_INICIO);
  const f = texto.indexOf(MARCA_FIN);
  return (i >= 0) !== (f >= 0) || (i >= 0 && f < i) || ocurrencias(texto, MARCA_INICIO) > 1 || ocurrencias(texto, MARCA_FIN) > 1;
}

// Solo toca lo que hay entre los marcadores. Respeta el fin de línea del fichero: si no, en Windows cada
// guardado reescribiría la nota entera.
function ponerPie(texto, pie) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const conEol = pie.split('\n').join(eol);
  if (marcadoresRotos(texto)) return texto;   // comprobar avisa; no se adivina dónde acaba
  const i = texto.indexOf(MARCA_INICIO);
  if (i >= 0) return texto.slice(0, i) + conEol + texto.slice(texto.indexOf(MARCA_FIN) + MARCA_FIN.length);
  return texto.replace(/(\r?\n)*$/, '') + eol + eol + conEol + eol;
}

function piesDeSesion(raiz) {
  const sesiones = leerSesiones(raiz).sort(compararSesiones);
  return new Map(sesiones.map((s, i) => [s.rel, pieDeSesion(sesiones[i - 1] || null, sesiones[i + 1] || null)]));
}

function estructuraSegura(raiz) {
  try { return leerEstructura(raiz); } catch { return null; }   // una estructura rota no puede impedir guardar
}

// E1: las flashcards que tocan, en dos tramos de fechas. El enlace va al fichero de flashcards (con su carpeta: se
// llama igual que la sesión) y lleva el nombre de la sesión.
function lineasRepaso(raiz, hoy, sesiones) {
  const tramos = repaso.tramos(raiz, hoy);
  if (!tramos.length) return [];
  const porId = new Map(sesiones.map(s => [s.id, s]));
  const nombre = fichero => {
    const s = porId.get(path.posix.basename(fichero, '.md'));
    return s ? aliasDe(s) : path.posix.basename(fichero, '.md');
  };
  const l = ['🗂️ Flashcards para repasar:'];
  for (const t of tramos) {
    const n = t.ficheros.reduce((a, f) => a + f.n, 0);
    const cuando = t.desde ? `Del ${repaso.corta(t.desde)} al ${repaso.corta(t.hasta)}` : `Hasta el ${repaso.corta(t.hasta)}`;
    const enlaces = t.ficheros.map(f => `[[${f.fichero.replace(/\.md$/, '')}|${nombre(f.fichero)}]] (${f.n})`).join(' · ');
    l.push(`- ${cuando} · ${n} tarjeta${n === 1 ? '' : 's'}: ${enlaces}`);
  }
  return [...l, ''];
}

function markdownInicio(raiz, { pendientes = 0, hoy = new Date().toISOString().slice(0, 10) } = {}) {
  const base = v.baseAlumno(raiz);
  const sesiones = leerSesiones(raiz).sort(compararSesiones);
  const progreso = leerProgreso(raiz);
  const examenes = leerExamenes(raiz);
  const aprobado = leerAprobado(raiz);
  const conProgreso = progresoEnInicio(raiz);
  const estado = new Map(sesiones.map(s => [s.id, estadoProfesor(s.conceptos, progreso)]));
  let posLogros = -1;
  const logros = [];
  const l = [`# ${v.leerAjustes(raiz).nombre_curso || 'Mi curso'}`, '',
    '> Lo genera tu profesor cada vez que guarda: **no lo edites**. Cuando estudies una sesión, marca la casilla',
    '> **estudiada** arriba de su nota; aquí se verá la próxima vez que trabajes con tu profesor.', ''];

  const repasar = sesiones.filter(s => estado.get(s.id).marca === 'repasar');
  if (repasar.length) l.push('🔁 Para repasar:', ...repasar.map(s => `- ${enlace(s)}`), '');
  if (sesiones.length) {
    const siguiente = sesiones.find(s => !s.estudiada);
    l.push(siguiente ? `👉 Sigue por aquí: ${enlace(siguiente)}` : '👉 Has estudiado todas las sesiones procesadas.', '');
    l.push(...lineasRepaso(raiz, hoy, sesiones));
    l.push(`Estudiadas ${sesiones.filter(s => s.estudiada).length} de ${sesiones.length} · Pendientes abiertos: ${pendientes} → [[pendientes]]`, '');
    posLogros = l.length;
  } else {
    l.push('Todavía no hay clases procesadas: deja el material de la primera en **inbox** y díselo a tu profesor.', '');
  }

  const tabla = lista => ['| Sesión | Estudiada (tú) | Profesor |', '|---|---|---|',
    ...lista.map(s => `| ${enlace(s, true)} | ${s.estudiada ? '✅' : '⬜'} | ${MARCA[estado.get(s.id).marca](estado.get(s.id))} |`), ''];

  const estructura = estructuraSegura(raiz);
  if (!estructura) {
    if (sesiones.length) l.push('## Sesiones', '', ...tabla(sesiones));
  } else {
    const unidades = estructura.unidades.map(u => ({ ...u, hijas: [], sesiones: [] }));
    const porPrefijo = new Map(unidades.map(u => [u.prefijo, u]));
    const raices = [];
    for (const u of unidades) {
      const padre = unidades.filter(o => u.prefijo.startsWith(o.prefijo + '-')).sort((a, b) => b.prefijo.length - a.prefijo.length)[0];
      (padre ? padre.hijas : raices).push(u);
    }
    const sueltas = [];
    for (const s of sesiones) {
      const u = unidadDe(s.id, estructura);
      (u ? porPrefijo.get(u.prefijo).sesiones : sueltas).push(s);
    }
    const todasBajo = u => [...u.sesiones, ...u.hijas.flatMap(todasBajo)];
    const pintar = (u, nivel) => {
      const todas = todasBajo(u);

      // Si el módulo no tiene sesiones en su árbol, mostrar solo la cabecera y no recorrer hijos
      if (todas.length === 0) {
        const titulo = u.titulo || path.posix.basename(u.carpeta).replace(/-/g, ' ');
        l.push(`${'#'.repeat(Math.min(nivel + 2, 6))} ${titulo} · aún sin sesiones`, '');
        return;
      }

      // Comportamiento normal para módulos con sesiones
      const partes = [u.titulo || path.posix.basename(u.carpeta).replace(/-/g, ' ')];
      partes.push(`${todas.filter(s => s.estudiada).length}/${todas.length} estudiadas`);
      const conceptos = [...new Set(todas.flatMap(s => s.conceptos))];
      if (conProgreso && nivel === 0 && conceptos.length) {
        partes.push(`${conceptos.filter(c => dominado(progreso.get(c) || SIN_EVALUAR)).length}/${conceptos.length} conceptos dominados`);
      }
      const examen = notaDeUnidad(u.prefijo, examenes);
      if (examen) partes.push(textoNota(examen, aprobado));
      else if (nivel === 0) {
        partes.push(todas.every(s => s.estudiada) ? 'listo para el examen del módulo: pídeselo a tu profesor' : 'sin examen de módulo');
      }
      if (conProgreso && nivel === 0 && examen && examen.nota >= aprobado) {
        logros.push(`🏁 ${partes[0]} superado el ${examen.fecha} con un ${examen.nota.toFixed(1).replace('.', ',')}`);
      }
      l.push(`${'#'.repeat(Math.min(nivel + 2, 6))} ${partes.join(' · ')}`, '');
      if (u.sesiones.length) l.push(...tabla(u.sesiones));
      for (const h of u.hijas) pintar(h, nivel + 1);
    };
    for (const u of raices) pintar(u, 0);
    if (sueltas.length) l.push('## Sin unidad', '', ...tabla(sueltas));
  }

  if (logros.length && posLogros >= 0) l.splice(posLogros, 0, ...logros, '');

  const hojas = OTRAS_HOJAS.filter(h => fs.existsSync(path.join(base, `${h}.md`)));
  if (hojas.length) l.push(`Otras hojas: ${hojas.map(h => `[[${h}]]`).join(' · ')}`, '');
  return l.join('\n');
}

module.exports = {
  INICIO, leerSesiones, compararSesiones, ordenAmbiguo, leerProgreso, estadoProfesor,
  leerExamenes, notaDeUnidad, leerAprobado, progresoEnInicio, enlace, tituloDe, markdownInicio,
  MARCA_INICIO, MARCA_FIN, pieDeSesion, ponerPie, marcadoresRotos, piesDeSesion, sinPie,
};
