'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');
const indice = require('./indice');
const g = require('./git');

// estudio/mi-perfil.md y las señales de estado.js: lo que el profesor sabe del alumno y cómo va, juntado desde
// config/alumno.md, config/profesor.md, los exámenes y progreso.md. Aquí solo se calcula; quien escribe es
// guardar.js. No se inventa nada: lo que no está escrito sale como "Todavía nada".

const ESTADOS = ['✅', '🟡', '🔴', '⬜'];
const SEPARADOR = /^\|[\s:|-]+\|$/;

function leerConfig(raiz, nombre) {
  const f = path.join(raiz, 'config', nombre);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '';
}

// El cuerpo de `## <titulo>` hasta el siguiente `## ` (o el final), sin los comentarios de la plantilla.
function seccion(texto, titulo) {
  const escapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^## ${escapado}[ \\t]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(texto);
  return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : '';
}

// Una tabla con solo cabecera y separador (la de la plantilla) no cuenta como contenido.
function tieneContenido(cuerpo) {
  const lineas = cuerpo.split('\n').map(l => l.trim()).filter(Boolean);
  const filas = lineas.filter((l, i) => l.startsWith('|') && !SEPARADOR.test(l) && !SEPARADOR.test(lineas[i + 1] || ''));
  return lineas.some(l => !l.startsWith('|')) || filas.length > 0;
}

// Una nota sobre 10: "6,5", "7" o "7/10". null si no se entiende.
function leerNota(celda) {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:\/\s*10)?\s*$/.exec(String(celda ?? ''));
  return m ? Number(m[1].replace(',', '.')) : null;
}

// La tabla "## Histórico de intentos" que escribe /examen: | Intento | Fecha | Nota | … |
function intentosDe(texto) {
  const intentos = [];
  for (const linea of seccion(texto.replace(/\r\n/g, '\n'), 'Histórico de intentos').split('\n')) {
    const c = linea.split('|').map(x => x.trim());
    if (c.length < 5 || !/^\d+$/.test(c[1]) || !/^\d{4}-\d{2}-\d{2}$/.test(c[2])) continue;
    const nota = leerNota(c[3]);
    if (nota !== null) intentos.push({ intento: Number(c[1]), fecha: c[2], nota });
  }
  return intentos.sort((a, b) => a.intento - b.intento);
}

// Los exámenes completos con sus intentos. Sin histórico (un examen corregido antes de que existiera), el
// frontmatter cuenta como único intento.
// El frontmatter (`nota` y `fecha`) es el del último intento, según /examen: manda sobre una fila del histórico que
// no se entienda o que falte (revisión de la 0.23.0).
function examenesConIntentos(raiz) {
  const base = v.baseAlumno(raiz);
  return indice.leerExamenes(raiz).filter(e => !e.parcial).map(e => {
    const texto = fs.readFileSync(path.join(base, ...e.rel.split('/')), 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    const intentos = intentosDe(texto);
    const ultimo = intentos[intentos.length - 1];
    const declarados = v.numero(fm.intentos);
    if (e.nota !== null && e.fecha) {
      if (!ultimo || (Number.isInteger(declarados) && declarados > intentos.length && e.fecha >= ultimo.fecha)) {
        intentos.push({ intento: Number.isInteger(declarados) ? declarados : intentos.length + 1, fecha: e.fecha, nota: e.nota });
      } else if (e.fecha >= ultimo.fecha && ultimo.nota !== e.nota) ultimo.nota = e.nota;
    }
    const anterior = fm.anterior ? path.posix.basename(String(fm.anterior).replace(/^\[\[|\]\]$/g, '').split('|')[0], '.md') : null;
    return { ...e, intentos, anterior };
  }).filter(e => e.intentos.length)
    .sort((a, b) => a.intentos[0].fecha.localeCompare(b.intentos[0].fecha) || a.rel.localeCompare(b.rel));
}

// "## Registro de dudas" de config/alumno.md: | Concepto | Nº de dudas | Última |. La celda del concepto puede
// ser un slug, un [[enlace\|alias]] o texto libre (una sesión): se deja legible, sin corchetes ni alias.
function leerDudas(raiz) {
  const dudas = [];
  for (const linea of seccion(leerConfig(raiz, 'alumno.md'), 'Registro de dudas').split('\n')) {
    const c = escaparAlias(linea).split(/(?<!\\)\|/).map(x => x.trim());
    if (c.length < 4) continue;
    const veces = Number((/^\d+/.exec(c[2]) || [])[0]);
    if (!Number.isInteger(veces) || veces <= 0) continue;
    const concepto = c[1].replace(/^\[\[/, '').replace(/\]\]$/, '').split(/\\?\|/)[0].trim();
    dudas.push({ concepto, veces, ultima: c[3] });
  }
  return dudas.sort((a, b) => b.veces - a.veces || a.concepto.localeCompare(b.concepto));
}

// En una tabla, el | de un [[enlace|alias]] parte la fila si no va escapado. config/ no se abre en Obsidian, así que
// nadie lo ve descuadrado allí: se escapa al leerlo y al copiarlo a mi-perfil.md.
function escaparAlias(linea) {
  return linea.replace(/\[\[[^\]]*\]\]/g, enlace => enlace.replace(/(?<!\\)\|/g, '\\|'));
}
const escaparTablas = texto => texto.split('\n').map(l => (l.trimStart().startsWith('|') ? escaparAlias(l) : l)).join('\n');

const cero = () => Object.fromEntries(ESTADOS.map(e => [e, 0]));

// Cuántos conceptos hay en cada estado, por eje y por bloque (el primero de `bloques:`, como formulario.md).
function conceptosPorBloque(raiz) {
  const base = v.baseAlumno(raiz);
  const bloques = new Map();
  for (const [slug, estado] of indice.leerProgreso(raiz)) {
    const f = path.join(base, 'conceptos', `${slug}.md`);
    const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) || {} : {};
    // Un número ("2") sale como "Bloque 2"; un nombre ("modulo-01") sale tal cual, sin "Bloque" delante.
    const primero = Array.isArray(fm.bloques) && fm.bloques.length ? String(fm.bloques[0]) : null;
    const bloque = primero === null ? 'Sin bloque' : /^\d/.test(primero) ? `Bloque ${primero}` : primero;
    if (!bloques.has(bloque)) bloques.set(bloque, { teoria: cero(), aplicacion: cero() });
    bloques.get(bloque).teoria[estado.teoria]++;
    bloques.get(bloque).aplicacion[estado.aplicacion]++;
  }
  return [...bloques.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
}

const UMBRAL_TROPIEZO = 3;
const fmt = n => n.toFixed(1).replace('.', ',');
const nombreExamen = e => `examen ${e.unidades.join(', ') || path.posix.basename(e.rel, '.md')}`;

// Lo que dice que algo no funciona, calculado. El profesor las lee en estado.js --json (arranque, /examen, /dudas).
// Un examen deja de contar si es la versión anterior de otro, o si hay otro posterior que cubre sus mismas unidades
// (una versión nueva, o el examen del módulo tras el de una de sus unidades): lo que vale es el último.
const ultimoIntento = e => e.intentos[e.intentos.length - 1];
function cubre(despues, antes) {
  return antes.unidades.length > 0 && antes.unidades.every(u => despues.unidades.some(m => u === m || u.startsWith(`${m}-`)));
}
function sustituido(e, examenes) {
  const nombre = path.posix.basename(e.rel, '.md');
  if (examenes.some(x => x.anterior === nombre)) return 'versión anterior';
  const posterior = examenes.find(x => x !== e && cubre(x, e)
    && (ultimoIntento(x).fecha > ultimoIntento(e).fecha || (ultimoIntento(x).fecha === ultimoIntento(e).fecha && x.rel > e.rel)));
  return posterior ? 'superado por un examen posterior' : null;
}

// Fecha (AAAA-MM-DD) del último guardado que tocó un fichero del curso; null sin git o sin guardados.
function ultimoGuardado(raiz, rel) {
  const r = g.intentarGit(raiz, ['log', '-1', '--format=%cs', '--', rel]);
  return r.ok && /^\d{4}-\d{2}-\d{2}/.test(r.stdout.trim()) ? r.stdout.trim().slice(0, 10) : null;
}

function senales(raiz) {
  const aprobado = indice.leerAprobado(raiz);
  const examenes = examenesConIntentos(raiz);
  const lista = [];
  for (const e of examenes.filter(x => !sustituido(x, examenes))) {
    const ultimo = e.intentos[e.intentos.length - 1];
    if (ultimo.nota < aprobado) {
      lista.push({ tipo: 'examen-suspenso', examen: e.rel, detalle: `${nombreExamen(e)}: ${fmt(ultimo.nota)} en el intento ${ultimo.intento} (aprobado: ${fmt(aprobado)})` });
    }
  }
  for (const e of examenes.filter(x => x.intentos.length > 1)) {
    const [antes, ahora] = e.intentos.slice(-2);
    if (ahora.nota < antes.nota) lista.push({ tipo: 'nota-baja', examen: e.rel, detalle: `${nombreExamen(e)}: de ${fmt(antes.nota)} a ${fmt(ahora.nota)}` });
  }
  for (const [slug, estado] of indice.leerProgreso(raiz)) {
    const ejes = [estado.teoria === '🔴' && 'teoría', estado.aplicacion === '🔴' && 'aplicación'].filter(Boolean);
    if (ejes.length) lista.push({ tipo: 'concepto-rojo', concepto: slug, detalle: `${slug}: falló dos veces (${ejes.join(' y ')})` });
  }
  // A la tercera duda el profesor reescribe la nota (AGENTS.md): si ya la reescribió después de la última duda, la
  // señal ya cumplió y no se repite en cada sesión.
  const yaReescrita = d => {
    const duda = (/\d{4}-\d{2}-\d{2}/.exec(d.ultima) || [])[0];
    const nota = ultimoGuardado(raiz, `${v.CARPETA_ALUMNO}/conceptos/${d.concepto}.md`);
    return Boolean(duda && nota && nota >= duda);
  };
  for (const d of leerDudas(raiz).filter(x => x.veces >= UMBRAL_TROPIEZO && !yaReescrita(x))) {
    lista.push({ tipo: 'tercer-tropiezo', concepto: d.concepto, detalle: `${d.concepto}: ${d.veces} dudas` });
  }
  return lista;
}

const PERFIL = 'mi-perfil.md';
const TODAVIA_NADA = '*Todavía nada: se irá llenando con tus exámenes y tus dudas.*';
const MAX_DUDAS = 5;

// Qué se copia y bajo qué título. [fichero de config/, sección de origen, subtítulo en la hoja (null: sin subtítulo)].
// Lo que no está aquí no se enseña: "Cómo escribe en sus notas" es para las herramientas; "Nivel de partida" ya
// está en la hoja del test inicial; "Quién es" lo dijo el propio alumno.
const GRUPOS = [
  ['Cómo te explico y por qué', [
    ['profesor.md', 'Tono', 'Tono'],
    ['profesor.md', 'Qué le funciona a este alumno al explicar', 'Lo que te funciona'],
    ['alumno.md', 'Cómo explicarle', 'Cómo explicarte'],
    ['alumno.md', 'Qué funcionó', 'Lo que te desbloqueó algo'],
  ]],
  ['Lo que te cuesta', [
    ['alumno.md', 'Conceptos que costaron', 'Conceptos que te costaron'],
    ['alumno.md', 'Errores repetidos', 'Errores que se repiten'],
  ]],
  ['Lo que te entró a la primera', [['alumno.md', 'Conceptos que entraron a la primera', null]]],
];
const HISTORIAL = ['Cambios en cómo te explico', [['profesor.md', 'Historial de cambios', null]]];

function evolucion(raiz) {
  const aprobado = indice.leerAprobado(raiz);
  const examenes = examenesConIntentos(raiz);
  const bloques = conceptosPorBloque(raiz);
  const dudas = leerDudas(raiz).slice(0, MAX_DUDAS);
  const l = ['## Tu evolución', ''];
  if (!examenes.length && !bloques.length && !dudas.length) return [...l, TODAVIA_NADA, ''];
  if (examenes.length) {
    l.push('### Exámenes', '', '| Examen | Intentos | Último |', '|---|---|---|');
    for (const e of examenes) {
      const ultimo = ultimoIntento(e);
      const motivo = sustituido(e, examenes);
      const nombre = `Examen ${e.unidades.join(', ') || path.posix.basename(e.rel, '.md')}`;
      const intentos = e.intentos.map(i => `${fmt(i.nota)} (${i.fecha})`).join(' → ');
      l.push(`| [[${e.rel.replace(/\.md$/, '')}\\|${nombre}]] | ${intentos} | ${motivo ? `↪ ${motivo}` : ultimo.nota >= aprobado ? '✅ aprobado' : '❌ suspenso'} |`);
    }
    l.push('');
  }
  if (bloques.length) {
    l.push('### Conceptos, por bloque', '', 'Cuántos hay en cada estado: ✅ sólido · 🟡 flojo · 🔴 falló dos veces · ⬜ sin evaluar.', '',
      '| Bloque | Teoría ✅ · 🟡 · 🔴 · ⬜ | Aplicación ✅ · 🟡 · 🔴 · ⬜ |', '|---|---|---|');
    for (const [b, c] of bloques) l.push(`| ${b} | ${ESTADOS.map(e => c.teoria[e]).join(' · ')} | ${ESTADOS.map(e => c.aplicacion[e]).join(' · ')} |`);
    l.push('');
  }
  if (dudas.length) {
    l.push('### Donde más dudas', '');
    for (const d of dudas) l.push(`- ${d.concepto}: ${d.veces} ${d.veces === 1 ? 'duda' : 'dudas'} (última: ${d.ultima})`);
    l.push('');
  }
  return l;
}

// estudio/mi-perfil.md: lo que el profesor sabe del alumno, con su prueba, y cómo va. Se copia literal lo que
// escribió el profesor en config/ (el alumno ve lo mismo que él: una sola verdad) y se calcula la evolución.
function markdownPerfil(raiz) {
  const textos = { 'alumno.md': leerConfig(raiz, 'alumno.md'), 'profesor.md': leerConfig(raiz, 'profesor.md') };
  const l = ['# Mi perfil', '',
    '> Lo que tu profesor sabe de ti, con la prueba de cada cosa, y cómo vas. Lo genera él cada vez que guarda:',
    '> **no lo edites**. Si algo no es verdad, **díselo** y lo corrige.', ''];
  const grupo = ([titulo, partes]) => {
    l.push(`## ${titulo}`, '');
    const llenas = partes.map(([f, s, sub]) => [sub, seccion(textos[f], s)]).filter(([, c]) => tieneContenido(c));
    if (!llenas.length) { l.push(TODAVIA_NADA, ''); return; }
    for (const [sub, c] of llenas) { if (sub) l.push(`### ${sub}`, ''); l.push(escaparTablas(c), ''); }
  };
  GRUPOS.forEach(grupo);
  l.push(...evolucion(raiz));
  grupo(HISTORIAL);
  return l.join('\n');
}

module.exports = {
  PERFIL, TODAVIA_NADA, ESTADOS, leerConfig, seccion, tieneContenido, intentosDe, examenesConIntentos, leerDudas,
  conceptosPorBloque, senales, fmt, markdownPerfil,
};
