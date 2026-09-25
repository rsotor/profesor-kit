'use strict';
// Lo que sabe resolver solo un conflicto de git en este curso (plan §3.3, y B.2 del plan 0.27): lo usan
// `preparar.js` (--juntar, la copia de trabajo con la clase preparada en segundo plano) y `guardar.js`
// (--traer, lo que llegó a GitHub desde otro sitio). Vive aquí, en vez de en cualquiera de los dos, para
// que ninguno duplique al otro y el comportamiento de --juntar no cambie al añadir --traer.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const g = require('./git');
const v = require('./vault');
const indice = require('./indice');

// Ficheros que se resuelven solos al mezclar. Dos clases:
//  - generados enteros (lo que escribe regenerarGenerados()): se toma cualquier lado y se regeneran después;
//  - con una parte generada y otra escrita (las sesiones con su pie de navegación, el README con su sección
//    Estado): se quita lo generado y el resto se fusiona a tres bandas. Si los dos lados cambiaron la misma parte
//    escrita, es un choque de verdad y se para, nunca se queda un lado entero (issue #39, H04).
function generadoEntero(rel) {
  if (rel === 'estudio/ejercicios/_index.md') return true;
  const base = path.posix.basename(rel);
  return rel.startsWith('estudio/') && !rel.startsWith('estudio/sesiones/') && v.GENERADOS_ENTEROS.includes(base);
}
const sinEstadoReadme = texto => texto.replace(/^## Estado\s*\n[\s\S]*?(?=^## |(?![\s\S]))/m, '## Estado\n\n');
function parteEscrita(rel) {
  if (rel === 'README.md') return sinEstadoReadme;
  if (rel.startsWith('estudio/sesiones/') && rel.endsWith('.md')) return indice.sinPie;
  return null;
}
function ficheroResoluble(rel) {
  return generadoEntero(rel) || parteEscrita(rel) !== null;
}

// Fusión a tres bandas de la parte escrita de un fichero en conflicto. true si se ha podido sin choque.
function fusionarParteEscrita(raiz, rel) {
  const quitar = parteEscrita(rel);
  const version = etapa => { const r = g.intentarGit(raiz, ['show', `:${etapa}:${rel}`]); return r.ok ? quitar(r.stdout) : ''; };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-juntar-'));
  try {
    const [nuestra, comun, suya] = ['nuestra', 'comun', 'suya'].map(n => path.join(dir, n));
    fs.writeFileSync(nuestra, version(2));
    fs.writeFileSync(comun, version(1));
    fs.writeFileSync(suya, version(3));
    const r = spawnSync('git', ['merge-file', '-p', nuestra, comun, suya], { encoding: 'utf8' });
    if (r.status !== 0) return false;
    fs.writeFileSync(path.join(raiz, ...rel.split('/')), r.stdout);
    g.git(raiz, ['add', '--', rel]);
    return true;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Ficheros que los dos lados tocan a la vez con filas, una por concepto: la tutoría cambia el estado de filas que
// ya existían (un examen) y la preparación (o el otro sitio) añade filas nuevas al final. Si quedan pegadas, git
// no sabe juntarlas (visto en la prueba real de la 0.22). Se juntan por concepto: todas las filas del curso
// principal (que llevan lo que el alumno ha demostrado) y, detrás de la última, las filas nuevas del otro lado.
const POR_FILAS = {
  'estudio/progreso.md': linea => (/^\|\s*\[\[([^\]|\\#]+)/.exec(linea) || [])[1],
  'estudio/conceptos/_index.md': linea => (/^([a-z0-9][a-z0-9-]*) *\|/.exec(linea) || [])[1],
};

// Con la versión común (`base`), una fila que existe en los dos lados y que solo cambió en uno se queda con ese
// cambio (la preparación añade un alias a un concepto que ya existía); si cambió en los dos, es un choque (null).
// Sin `base`, mandan las filas del curso principal.
function juntarPorFilas(ours, theirs, clave, base = null) {
  const eol = ours.includes('\r\n') ? '\r\n' : '\n';
  const porClave = texto => new Map(texto.split(/\r?\n/).filter(l => clave(l)).map(l => [clave(l), l]));
  const suyas = porClave(theirs);
  const comunes = base === null ? null : porClave(base);
  const nuestras = ours.split(/\r?\n/);
  for (let i = 0; i < nuestras.length; i++) {
    const k = clave(nuestras[i]);
    if (!k || !comunes || !suyas.has(k) || suyas.get(k) === nuestras[i]) continue;
    const comun = comunes.get(k);
    if (comun === nuestras[i]) nuestras[i] = suyas.get(k);
    else if (comun !== suyas.get(k)) return null;
  }
  const tenemos = new Set(nuestras.map(clave).filter(Boolean));
  const nuevas = theirs.split(/\r?\n/).filter(l => clave(l) && !tenemos.has(clave(l)));
  let ultima = -1;
  nuestras.forEach((l, i) => { if (clave(l)) ultima = i; });
  if (ultima < 0) return null;   // sin filas propias: no se sabe dónde van; que decida una persona
  nuestras.splice(ultima + 1, 0, ...nuevas);
  return nuestras.join(eol);
}

function resolverPorFilas(raiz, rel) {
  const ours = g.intentarGit(raiz, ['show', `:2:${rel}`]);
  const theirs = g.intentarGit(raiz, ['show', `:3:${rel}`]);
  if (!ours.ok || !theirs.ok) return false;
  const comun = g.intentarGit(raiz, ['show', `:1:${rel}`]);
  const texto = juntarPorFilas(ours.stdout, theirs.stdout, POR_FILAS[rel], comun.ok ? comun.stdout : null);
  if (texto === null) return false;
  fs.writeFileSync(path.join(raiz, ...rel.split('/')), texto.endsWith('\n') ? texto : texto + '\n');
  g.git(raiz, ['add', '--', rel]);
  return true;
}

// El driver "union" es de git de fábrica (no hace falta declarar merge.union.driver): basta con la
// marca en .git/info/attributes. No toca .gitattributes del curso, así que no es nada que el alumno vea.
function configurarUnionParaDiario(raiz) {
  const linea = 'config/diario.md merge=union';
  const fichero = path.join(raiz, '.git', 'info', 'attributes');
  const previo = fs.existsSync(fichero) ? fs.readFileSync(fichero, 'utf8') : '';
  if (previo.split(/\r?\n/).includes(linea)) return;
  fs.mkdirSync(path.dirname(fichero), { recursive: true });
  fs.writeFileSync(fichero, previo.replace(/\n*$/, '') + (previo ? '\n' : '') + linea + '\n');
}

// ¿Tiene este fichero una versión en esa etapa del índice (1=común, 2=ours/aqui, 3=theirs/alla)? Sin ella, ese
// lado borró el fichero: es un conflicto DU/UD, no uno de contenido (revisión de la 0.27, media 3).
function existeEnEtapa(raiz, fichero, etapa) {
  return g.intentarGit(raiz, ['cat-file', '-e', `:${etapa}:${fichero}`]).ok;
}
const ETAPA = { '--ours': 2, '--theirs': 3 };

// Se queda con un lado entero de un fichero en conflicto. Si ese lado borró el fichero (DU/UD: no tiene
// versión en su etapa), quedarse con él es borrarlo (`git rm`) — no un fallo (revisión, media 3): antes se
// intentaba `checkout` igualmente, que no tiene nada que hacer sin versión y siempre fallaba, tratando un
// borrado legítimo como si fuera un choque sin resolver. Nunca lanza: un checkout que sí falla (raro, con
// versión pero sin poder escribirla) es un "no se ha podido" más, como cualquier otro choque.
function quedarseConLado(raiz, fichero, lado) {
  if (!existeEnEtapa(raiz, fichero, ETAPA[lado])) {
    const r = g.intentarGit(raiz, ['rm', '-f', '--', fichero]);
    return r.ok;
  }
  const r1 = g.intentarGit(raiz, ['checkout', lado, '--', fichero]);
  if (!r1.ok) return false;
  const r2 = g.intentarGit(raiz, ['add', '--', fichero]);
  return r2.ok;
}

// Fusión a tres bandas de un fichero en conflicto, resolviendo cada TROZO que choque de verdad con el lado
// elegido — no el fichero entero (revisión de la 0.27, media 4): lo que cada lado cambió sin chocar (otra
// línea, otro párrafo) se queda tal cual de los dos, como en cualquier merge normal; solo el trozo que de
// verdad se pisa se decide con `--ours`/`--theirs` de `git merge-file`, que nunca deja marcadores. Sin versión
// en una de las dos etapas de contenido (un DU/UD: no hay dos lados que fusionar por trozos), null.
function resolverPorTrozos(raiz, fichero, lado) {
  if (!existeEnEtapa(raiz, fichero, 2) || !existeEnEtapa(raiz, fichero, 3)) return null;
  const version = etapa => { const r = g.intentarGit(raiz, ['show', `:${etapa}:${fichero}`]); return r.ok ? r.stdout : ''; };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-conservar-'));
  try {
    const [nuestra, comun, suya] = ['nuestra', 'comun', 'suya'].map(n => path.join(dir, n));
    fs.writeFileSync(nuestra, version(2));
    fs.writeFileSync(comun, version(1));
    fs.writeFileSync(suya, version(3));
    const bandera = lado === 'alla' ? '--theirs' : '--ours';
    const r = spawnSync('git', ['merge-file', bandera, '-p', nuestra, comun, suya], { encoding: 'utf8' });
    return r.status === 0 || r.status === 1 ? r.stdout : null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Resuelve lo que se pueda de una lista de ficheros en conflicto (tras `git merge --no-commit`), en el orden que
// menos sorprende: primero lo que el profesor ha elegido a mano (--conservar), luego lo que va por filas, después
// la parte escrita a tres bandas, y al final lo generado entero (que gana el lado que exista — en un DU/UD, el
// otro lo borró — porque se regenera después). Lo que no sabe resolver, lo dice.
// `conservar`: { "<ruta>": "aqui" | "alla" } — plan 0.27 (revisión, "salida para el choque"): un choque de
// verdad ya no se queda solo en "resuélvelo a mano"; --traer --conservar repite la mezcla con esos ficheros
// decididos, resolviendo por trozos (resolverPorTrozos) cuando hay dos lados que fusionar, o quedándose con el
// lado entero (quedarseConLado, que también sabe borrar) cuando es un DU/UD.
function resolverConflictos(raiz, conflictos, { conservar = {} } = {}) {
  const elegidos = conflictos.filter(f => conservar[f]);
  for (const f of elegidos) {
    const lado = conservar[f];
    const porTrozos = resolverPorTrozos(raiz, f, lado);
    if (porTrozos !== null) {
      fs.writeFileSync(path.join(raiz, ...f.split('/')), porTrozos);
      g.git(raiz, ['add', '--', f]);
      continue;
    }
    if (!quedarseConLado(raiz, f, lado === 'alla' ? '--theirs' : '--ours')) return { ok: false, ficheros: [f] };
  }
  const resto = conflictos.filter(f => !conservar[f]);
  const noResolubles = resto.filter(f => !ficheroResoluble(f) && !POR_FILAS[f]);
  if (noResolubles.length) return { ok: false, ficheros: noResolubles };
  for (const f of resto.filter(x => POR_FILAS[x])) {
    if (!resolverPorFilas(raiz, f)) return { ok: false, ficheros: [f] };
  }
  for (const f of resto.filter(x => !POR_FILAS[x] && parteEscrita(x))) {
    if (!fusionarParteEscrita(raiz, f)) return { ok: false, ficheros: [f] };
  }
  for (const f of resto.filter(x => generadoEntero(x))) {
    const lado = existeEnEtapa(raiz, f, 2) ? '--ours' : (existeEnEtapa(raiz, f, 3) ? '--theirs' : null);
    if (!lado || !quedarseConLado(raiz, f, lado)) return { ok: false, ficheros: [f] };
  }
  return { ok: true };
}

// Marcador de cuál fue el último volcado de un choque, dentro de ESTE curso (no del sistema): para borrarlo
// antes de crear uno nuevo (revisión, media 4c) y no dejar carpetas de mentira acumuladas en el temporal del
// sistema cada vez que se repite --traer.
function marcadorDeVolcado(raiz) { return path.join(raiz, '.git', 'kit-ultimo-choque'); }
function limpiarVolcadoAnterior(raiz) {
  const marcador = marcadorDeVolcado(raiz);
  if (!fs.existsSync(marcador)) return;
  const anterior = fs.readFileSync(marcador, 'utf8').trim();
  if (anterior) fs.rmSync(anterior, { recursive: true, force: true });
  fs.rmSync(marcador, { force: true });
}

// La versión "del otro sitio" de cada fichero que no se ha podido resolver solo, volcada fuera del curso (en
// una carpeta temporal del sistema) para que el profesor se la pueda enseñar al alumno sin tocar git a mano
// (plan 0.27, revisión "salida para el choque"). `stage 3` es "theirs" en el índice durante un merge — si no
// existe ahí, es que en el otro sitio se BORRÓ el fichero (un DU/UD), que es distinto de no haber podido leer
// su contenido por otra razón (revisión, media 3): se dice cuál de los dos es.
function volcarVersionAjena(raiz, ficheros) {
  limpiarVolcadoAnterior(raiz);
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-choque-'));
  fs.writeFileSync(marcadorDeVolcado(raiz), carpeta);
  const detalle = ficheros.map(rel => {
    const destino = path.join(carpeta, rel.replace(/[\\/]/g, '__'));
    if (!existeEnEtapa(raiz, rel, 3)) {
      return { ruta: rel, otroLado: null, borradoEnElOtroSitio: true };
    }
    const r = g.intentarGit(raiz, ['show', `:3:${rel}`]);
    if (!r.ok) { fs.writeFileSync(destino, '(no se ha podido leer la versión del otro sitio de este fichero)'); return { ruta: rel, otroLado: destino, noSePudoLeer: true }; }
    fs.writeFileSync(destino, r.stdout);
    return { ruta: rel, otroLado: destino };
  });
  return { carpeta, detalle };
}

// Los ficheros en conflicto tras un `git merge --no-commit`, a partir de `git status --porcelain -z` (issue
// #39, H04; revisión de la 0.27, media 2: sin `-z`, una ruta con espacios o tildes sale entrecomillada y con
// los acentos escapados — `"Clase 3 \303\201lgebra.md"` — y no se reconoce luego como el mismo fichero).
function ficherosEnConflicto(raiz) {
  const registros = g.intentarGit(raiz, ['status', '--porcelain', '-z']).stdout.split('\0').filter(Boolean);
  return registros.filter(r => /^(UU|AA|DD|AU|UA|UD|DU) /.test(r)).map(r => r.slice(3));
}

module.exports = {
  generadoEntero, parteEscrita, ficheroResoluble, fusionarParteEscrita,
  POR_FILAS, juntarPorFilas, resolverPorFilas, configurarUnionParaDiario, resolverConflictos, ficherosEnConflicto,
  volcarVersionAjena, limpiarVolcadoAnterior, resolverPorTrozos, quedarseConLado, existeEnEtapa,
};
