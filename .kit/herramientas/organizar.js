'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./lib/vault');
const { motivoRutaNoSegura } = require('./lib/rutas');

// Coloca el material del alumno en carpetas que copian la arquitectura del curso.
// La arquitectura la escribe el profesor en config/estructura.json:
//   { "unidades": [ { "prefijo": "01-01", "carpeta": "modulo-01-conceptos/1.1-mente-del-inversor" }, … ] }
// Un fichero pertenece a la unidad cuyo prefijo coincide con el principio de su nombre (gana el más largo).
// `conceptos/` no se toca: un concepto pertenece a varias unidades a la vez.
const CARPETAS_ORGANIZABLES = ['sesiones', 'flashcards', 'ejercicios', 'examenes', 'repasos'];
const NO_SE_MUEVE = /^(_|\.)/;   // _index.md, .gitkeep…

function leerEstructura(raiz) {
  const f = path.join(raiz, 'config', 'estructura.json');
  if (!fs.existsSync(f)) return null;
  const e = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!Array.isArray(e.unidades)) throw new Error('config/estructura.json: falta la lista "unidades"');
  for (const u of e.unidades) {
    if (!u.prefijo || motivoRutaNoSegura(u.carpeta) || motivoRutaNoSegura(u.prefijo, { unTramo: true })) throw new Error(`config/estructura.json: unidad no válida ${JSON.stringify(u)}`);
  }
  return e;
}

function unidadDe(nombre, estructura) {
  const base = nombre.replace(/\.[^.]+$/, '');
  let mejor = null;
  for (const u of estructura.unidades) {
    if ((base === u.prefijo || base.startsWith(u.prefijo + '-')) && (!mejor || u.prefijo.length > mejor.prefijo.length)) mejor = u;
  }
  return mejor;
}

// Reescribe en `texto` las rutas afectadas por los movimientos. `movidos` = { 'sesiones/a.md': 'sesiones/u/a.md', … }
// (relativas a estudio/); `viejoRel`/`nuevoRel` = dónde estaba y dónde está el fichero que contiene el texto.
//  - Un [[enlace/con/ruta]] es relativo a la raíz de la bóveda: basta cambiar la ruta vieja por la nueva.
//  - Un enlace markdown o HTML (`](…)`, `href="…"`, `src="…"`) es relativo al fichero: se resuelve desde donde
//    estaba, se sigue el movimiento del destino si lo hubo, y se vuelve a expresar desde donde está ahora.
const RELATIVO = /(\]\(|href="|src="|href='|src=')([^)"'#?\s]+)/g;
const EXTERNO = /^(https?:|mailto:|data:|\/|#)/;
function reescribirEnlaces(texto, movidos, viejoRel, nuevoRel = viejoRel) {
  const sinExt = r => r.replace(/\.md$/, '');
  for (const [viejo, nuevo] of Object.entries(movidos)) texto = texto.split(`[[${sinExt(viejo)}`).join(`[[${sinExt(nuevo)}`);
  const dirViejo = path.posix.dirname(viejoRel);
  const dirNuevo = path.posix.dirname(nuevoRel);
  return texto.replace(RELATIVO, (todo, abre, rel) => {
    if (EXTERNO.test(rel)) return todo;
    const destino = path.posix.normalize(path.posix.join(dirViejo === '.' ? '' : dirViejo, rel));
    const destinoFinal = movidos[destino] || destino;
    const relNuevo = path.posix.relative(dirNuevo === '.' ? '' : dirNuevo, destinoFinal) || '.';
    return abre + (relNuevo === path.posix.normalize(rel) ? rel : relNuevo);
  });
}

// Un fichero sin prefijo (un ejercicio nombrado por concepto, un examen con fecha) se coloca por lo que dice
// de sí mismo (`sesion:` o `unidad:` en el frontmatter) o, si no dice nada, por quién lo enlaza: si todos
// los ficheros con unidad que lo enlazan son de la misma unidad, es de esa. Los conceptos no cuentan como
// enlazadores: son de varias unidades a la vez.
function unidadDeducida(abs, nombre, estructura, base) {
  if (nombre.endsWith('.md')) {
    const fm = v.leerFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    if (fm.sesion) return unidadDe(`${fm.sesion}.md`, estructura);
    if (fm.unidad) return unidadDe(`${fm.unidad}-x.md`, estructura);
  }
  const sinExt = nombre.replace(/\.[^.]+$/, '');
  const unidades = new Set();
  for (const carpeta of CARPETAS_ORGANIZABLES) {
    for (const otro of v.recorrer(path.join(base, carpeta), n => n.endsWith('.md') && !NO_SE_MUEVE.test(n))) {
      if (otro === abs) continue;
      const texto = fs.readFileSync(otro, 'utf8');
      if (!texto.includes(nombre) && !texto.includes(`[[${sinExt}`) && !texto.includes(`/${sinExt}]]`) && !texto.includes(`/${sinExt}|`) && !texto.includes(`/${sinExt}#`)) continue;
      const u = unidadDe(path.basename(otro), estructura);
      if (u) unidades.add(u.carpeta);
    }
  }
  return unidades.size === 1 ? estructura.unidades.find(u => u.carpeta === [...unidades][0]) : null;
}

function organizar({ raiz }) {
  const estructura = leerEstructura(raiz);
  const base = v.baseAlumno(raiz);
  const resultado = { movidos: {}, sinUnidad: [], enlacesReescritos: 0 };
  if (!estructura) return resultado;

  for (const carpeta of CARPETAS_ORGANIZABLES) {
    const dir = path.join(base, carpeta);
    if (!fs.existsSync(dir)) continue;
    for (const abs of v.recorrer(dir, n => !NO_SE_MUEVE.test(n))) {
      const nombre = path.basename(abs);
      const u = unidadDe(nombre, estructura) || unidadDeducida(abs, nombre, estructura, base);
      const relActual = v.aPosix(path.relative(base, abs));
      if (!u) { if (path.dirname(abs) === dir) resultado.sinUnidad.push(relActual); continue; }
      const relNuevo = `${carpeta}/${u.carpeta}/${nombre}`;
      if (relNuevo === relActual) continue;
      const destino = path.join(base, ...relNuevo.split('/'));
      if (fs.existsSync(destino)) throw new Error(`ya existe ${relNuevo}: no se pisa`);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.renameSync(abs, destino);
      resultado.movidos[relActual] = relNuevo;
    }
  }
  if (!Object.keys(resultado.movidos).length) return resultado;

  // Todo lo que pueda enlazar: notas del alumno y HTML de ejercicios/repasos.
  const ficheros = [...v.recorrer(base, n => /\.(md|html)$/.test(n), new Set(['.obsidian']))];
  const origenDe = Object.fromEntries(Object.entries(resultado.movidos).map(([viejo, nuevo]) => [nuevo, viejo]));
  for (const abs of ficheros) {
    const rel = v.aPosix(path.relative(base, abs));
    const antes = fs.readFileSync(abs, 'utf8');
    const despues = reescribirEnlaces(antes, resultado.movidos, origenDe[rel] || rel, rel);
    if (despues !== antes) { fs.writeFileSync(abs, despues); resultado.enlacesReescritos++; }
  }
  // Carpetas que se han quedado vacías, fuera (salvo la raíz de cada tipo).
  for (const carpeta of CARPETAS_ORGANIZABLES) {
    const dir = path.join(base, carpeta);
    if (!fs.existsSync(dir)) continue;
    for (const d of fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => path.join(dir, e.name))) {
      if (!v.recorrer(d, () => true).length) fs.rmSync(d, { recursive: true, force: true });
    }
  }
  return resultado;
}

function cli(args, raiz) {
  let r;
  try { r = organizar({ raiz }); } catch (e) { console.log(`No se ha podido organizar: ${e.message}`); return 1; }
  const n = Object.keys(r.movidos).length;
  if (!leerEstructura(raiz)) { console.log('No hay config/estructura.json: el material se queda como está.'); return 0; }
  console.log(n ? `Colocados ${n} fichero(s) en su unidad; ${r.enlacesReescritos} fichero(s) con enlaces actualizados.` : 'Todo estaba ya en su sitio.');
  if (r.sinUnidad.length) console.log(`Sin unidad (no coinciden con ningún prefijo de la estructura): ${r.sinUnidad.join(', ')}`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'organizar.js');

module.exports = { organizar, unidadDe, leerEstructura, reescribirEnlaces, cli, CARPETAS_ORGANIZABLES };
