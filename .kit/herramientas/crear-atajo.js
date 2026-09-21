'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const v = require('./lib/vault');

const MARCA = 'profesor-kit: lanzador de curso';
const NOMBRE_VALIDO = /^[a-z][a-z0-9-]{1,19}$/;
// Cómo se llama en la terminal cada LLM. Si el de `ajustes.json` no está aquí, se usa tal cual.
const COMANDO_LLM = { 'claude-code': 'claude', 'codex-cli': 'codex', 'gemini-cli': 'gemini' };

// Un atajo es un lanzador en la carpeta donde ya vive el comando del LLM (está en el PATH en Mac y en
// Windows): entra en la carpeta del curso y abre el LLM. No se toca el perfil de la shell del alumno.
function contenido({ raiz, comando, plataforma }) {
  if (plataforma === 'win32') {
    return ['@echo off', `rem ${MARCA} (no editar)`, `rem curso: ${raiz}`,
      `cd /d "${raiz}" || (echo No encuentro la carpeta del curso: ${raiz} & exit /b 1)`, `${comando} %*`, ''].join('\r\n');
  }
  return ['#!/bin/sh', `# ${MARCA} (no editar)`, `# curso: ${raiz}`,
    `cd "${raiz}" || { echo "No encuentro la carpeta del curso: ${raiz}"; exit 1; }`, `exec ${comando} "$@"`, ''].join('\n');
}

// El PATH se parte con el separador de la máquina real (`path.delimiter`), no con el de `plataforma`:
// `plataforma` solo decide el formato del lanzador, y así se puede probar cualquiera en cualquier sistema.
const carpetasDelPath = entorno => (entorno.PATH || entorno.Path || '').split(path.delimiter).filter(Boolean);

function existeComando(nombre, { entorno, plataforma, salvo }) {
  const extensiones = plataforma === 'win32' ? ['', ...(entorno.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';')] : [''];
  for (const dir of carpetasDelPath(entorno)) {
    for (const ext of extensiones) {
      const candidato = path.join(dir, nombre + ext.toLowerCase());
      if (path.resolve(candidato) !== path.resolve(salvo) && fs.existsSync(candidato)) return true;
    }
  }
  return false;
}

function crearAtajo({ raiz, nombre, carpetaBin = path.join(os.homedir(), '.local', 'bin'), plataforma = process.platform, entorno = process.env }) {
  if (!NOMBRE_VALIDO.test(nombre || '')) return { creado: false, motivo: 'nombre-no-valido' };

  const fichero = path.join(carpetaBin, plataforma === 'win32' ? `${nombre}.cmd` : nombre);
  if (fs.existsSync(fichero)) {
    const actual = fs.readFileSync(fichero, 'utf8');
    if (!actual.includes(MARCA)) return { creado: false, motivo: 'fichero-ajeno', fichero };
    if (!actual.includes(`curso: ${raiz}`)) return { creado: false, motivo: 'atajo-de-otro-curso', fichero };
  }
  if (existeComando(nombre, { entorno, plataforma, salvo: fichero })) return { creado: false, motivo: 'comando-existente' };

  const ajustes = v.leerAjustes(raiz);
  const comando = COMANDO_LLM[ajustes.llm] || ajustes.llm;
  fs.mkdirSync(carpetaBin, { recursive: true });
  fs.writeFileSync(fichero, contenido({ raiz, comando, plataforma }));
  if (plataforma !== 'win32') fs.chmodSync(fichero, 0o755);
  v.escribirAjustes(raiz, { ...ajustes, atajo: nombre });

  const enPath = carpetasDelPath(entorno).some(dir => path.resolve(dir) === path.resolve(carpetaBin));
  return { creado: true, fichero, enPath };
}

const EXPLICACION = {
  'nombre-no-valido': 'El atajo tiene que ser una sola palabra corta: minúsculas, números o guiones, sin acentos ni espacios (por ejemplo: historia).',
  'fichero-ajeno': 'Ya existe un fichero con ese nombre que no es del kit. No lo toco: elige otra palabra.',
  'atajo-de-otro-curso': 'Esa palabra ya abre otro de tus cursos. Elige otra para este.',
  'comando-existente': 'Esa palabra ya es un programa de tu ordenador. Elige otra para no taparlo.',
};

function cli(args, raiz, opciones = {}) {
  const i = args.indexOf('--nombre');
  const r = crearAtajo({ raiz, nombre: i >= 0 ? args[i + 1] : undefined, ...opciones });
  if (!r.creado) { console.log(EXPLICACION[r.motivo]); return 1; }
  console.log(`Atajo creado: a partir de ahora, escribir "${args[i + 1]}" en la terminal abre este curso.`);
  if (!r.enPath) console.log(`Aviso: la carpeta ${path.dirname(r.fichero)} no está en el PATH de esta terminal. Cierra y vuelve a abrir la terminal; si sigue sin funcionar, hay que añadirla.`);
  return 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { crearAtajo, cli, MARCA };
