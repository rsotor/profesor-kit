'use strict';
// Prepara el curso montado para un "caso de guía" de pruebas/disparadores.js: una situación en la que
// AGENTS.md espera que el profesor abra una guía concreta de .kit/guias/ (segundo-plano.md,
// cuando-escribe-a-su-manera.md...). Cada preparador deja el curso ya montado en el estado que dispara esa
// situación, sin lanzar ningún LLM ni tocar git de verdad: disparadores.js nunca llega a --juntar, solo
// mide si el profesor la abre al verla.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { recorrerMd } = require('./pasos');

// El alumno ha escrito "estudiada" a su manera (sí, en vez de true/false) en la sesión de una clase
// concreta, como lo haría desde Obsidian: dispara el aviso `propiedad-no-estandar` de comprobar.js.
// Busca la sesión por `clases: [<clase>]` en el frontmatter (formato de pruebas/curso-ejemplo).
function marcarEstudiadaASuManera(destino, { clase = '1.1' } = {}) {
  // `clases:` puede venir como `1.1`, `[1.1]` o `["1.1"]` (las tres valen; la prueba real de la 0.26.0 dejó la primera).
  const esLaClase = texto => {
    const m = /^clases:\s*(.*)$/m.exec(texto);
    return !!m && m[1].replace(/[[\]"']/g, '').split(',').map(c => c.trim()).includes(clase);
  };
  for (const f of recorrerMd(path.join(destino, 'estudio', 'sesiones'))) {
    const texto = fs.readFileSync(f, 'utf8');
    if (!esLaClase(texto) || !/^estudiada:\s*(true|false)\s*$/m.test(texto)) continue;
    fs.writeFileSync(f, texto.replace(/^estudiada:\s*(true|false)\s*$/m, 'estudiada: sí'));
    return { ok: true, fichero: path.relative(path.join(destino, 'estudio'), f).split(path.sep).join('/') };
  }
  return { ok: false, motivo: `no hay ninguna sesión de la clase ${clase} con la propiedad "estudiada"` };
}

// Un pid que ya no está vivo, para simular una preparación interrumpida (el ordenador se apagó o se
// durmió a medio camino): un proceso node que se lanza y termina al instante. Mismo patrón que
// .kit/herramientas/tests/estado.test.js.
function pidMuerto() {
  return spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' }).pid;
}

// Escribe `.preparacion/<id>/estado.json` a mano: el contrato fijo que lee estado.js (preparar.js,
// "estado.json: el contrato fijo que lee estado.js"). No hace falta un `git worktree` real: disparadores.js
// nunca llega a --juntar, solo mide si el profesor la menciona y abre la guía al verla en `estado.js --json`.
function crearPreparacion(destino, { id = '02-02', ficheros = ['clase-2-2.pdf'], resultado }) {
  if (resultado !== 'terminada' && resultado !== 'en-curso') throw new Error(`resultado desconocido: ${resultado}`);
  const dir = path.join(destino, '.preparacion', id);
  fs.mkdirSync(dir, { recursive: true });
  const ahora = new Date().toISOString();
  const estado = {
    id, ficheros, entradas: [], base: null, pid: pidMuerto(), inicio: ahora,
    fin: resultado === 'terminada' ? ahora : null, resultado, rama: `preparacion/${id}`,
  };
  fs.writeFileSync(path.join(dir, 'estado.json'), JSON.stringify(estado, null, 2) + '\n');
  return { ok: true, id };
}

// Los nombres que puede llevar el campo "preparar" de un caso de guía en disparadores.json.
// "preparacion-interrumpida" escribe resultado "en-curso" con un pid muerto: es justo lo que hace que
// estado.js la lea como "interrumpida" (el contrato nunca escribe "interrumpida" tal cual).
const PREPARADORES = {
  'estudiada-a-su-manera': destino => marcarEstudiadaASuManera(destino),
  'preparacion-terminada': destino => crearPreparacion(destino, { resultado: 'terminada' }),
  'preparacion-interrumpida': destino => crearPreparacion(destino, { resultado: 'en-curso' }),
};

function preparar(destino, nombre) {
  const fn = PREPARADORES[nombre];
  if (!fn) throw new Error(`preparador de caso de guía desconocido: ${nombre}`);
  return fn(destino);
}

module.exports = { PREPARADORES, preparar, marcarEstudiadaASuManera, crearPreparacion, pidMuerto };
