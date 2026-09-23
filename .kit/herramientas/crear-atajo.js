'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ejecutar } = require('./lib/proceso');
const v = require('./lib/vault');

const MARCA = 'profesor-kit: lanzador de curso';
const NOMBRE_VALIDO = /^[a-z][a-z0-9-]{1,19}$/;
// La ruta del curso se escribe dentro del lanzador entre comillas: estos caracteres la romperían o
// ejecutarían lo que hubiera dentro (`$(…)`, `%VAR%`). Ninguna carpeta de cursos los necesita.
const RUTA_PELIGROSA = /["$`%\r\n]/;
// Respaldo si no hay adaptador (`v.leerAdaptador`) para el LLM del curso: cómo se llama en la terminal.
// Si el de `ajustes.json` no está ni en el adaptador ni aquí, se usa tal cual.
const COMANDO_LLM = { 'claude-code': 'claude', 'codex-cli': 'codex' };

// Un atajo es un lanzador en ~/.local/bin, donde el instalador de Claude Code ya deja su comando: entra en la
// carpeta del curso y abre el LLM. Si esa carpeta no está en el PATH (otro LLM instalado por npm, por ejemplo),
// se añade sola: quien instala no sabe hacerlo, y sin eso la palabra no abre nada.
function contenido({ raiz, comando, plataforma }) {
  if (plataforma === 'win32') {
    return ['@echo off', `rem ${MARCA} (no editar)`, `rem curso: ${raiz}`,
      `cd /d "${raiz}" || (echo No encuentro la carpeta de este curso. Si la has movido, diselo a quien te lo instalo: se arregla en un momento. Estaba en: ${raiz} & exit /b 1)`, `${comando} %*`, ''].join('\r\n');
  }
  return ['#!/bin/sh', `# ${MARCA} (no editar)`, `# curso: ${raiz}`,
    `cd "${raiz}" || { echo "No encuentro la carpeta de este curso. Si la has movido, díselo a quien te lo instaló: se arregla en un momento. Estaba en: ${raiz}"; exit 1; }`, `exec ${comando} "$@"`, ''].join('\n');
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

// ── El PATH, para siempre (no solo en esta ventana) ─────────────────────────────────────────────────────────
const MARCA_PATH = '# profesor-kit: la carpeta de los atajos de tus cursos';

// El fichero que lee la terminal del alumno al abrirse. En Mac es zsh salvo que haya cambiado de shell.
function perfilDeShell({ plataforma, entorno, casa }) {
  const shell = path.basename(entorno.SHELL || (plataforma === 'darwin' ? 'zsh' : 'sh'));
  if (shell === 'zsh') return path.join(casa, '.zshrc');
  if (shell === 'bash') return path.join(casa, plataforma === 'darwin' ? '.bash_profile' : '.bashrc');
  return path.join(casa, '.profile');
}

function powershell(script) {
  return ejecutar('powershell', ['-NoProfile', '-NonInteractive', '-Command', script]);
}
const comillasPs = t => `'${t.replace(/'/g, "''")}'`;

// ¿Queda en el PATH de las ventanas que se abran a partir de ahora? (La ventana actual no cambia nunca.)
function pathGuardado({ carpetaBin, plataforma, entorno, casa, ejecutarPs = powershell }) {
  if (plataforma === 'win32') {
    const r = ejecutarPs("[Environment]::GetEnvironmentVariable('Path','User')");
    return r.ok && r.salida.split(';').some(d => d && path.win32.resolve(d).toLowerCase() === path.win32.resolve(carpetaBin).toLowerCase());
  }
  const perfil = perfilDeShell({ plataforma, entorno, casa });
  return fs.existsSync(perfil) && fs.readFileSync(perfil, 'utf8').includes(carpetaBin);
}

// Añade la carpeta al PATH del usuario, una sola vez. En Mac y Linux, una línea marcada al final de su perfil
// de shell; en Windows, en la variable Path del usuario (no la del sistema: no pide administrador).
function anadirAlPath({ carpetaBin, plataforma, entorno, casa, ejecutarPs = powershell }) {
  if (pathGuardado({ carpetaBin, plataforma, entorno, casa, ejecutarPs })) return { anadido: false, yaEstaba: true };
  if (plataforma === 'win32') {
    const script = `$p = [Environment]::GetEnvironmentVariable('Path','User'); if (-not $p) { $p = '' }; `
      + `[Environment]::SetEnvironmentVariable('Path', (($p.TrimEnd(';') + ';' + ${comillasPs(carpetaBin)}).TrimStart(';')), 'User')`;
    const r = ejecutarPs(script);
    return r.ok ? { anadido: true, donde: 'la variable Path de tu usuario' } : { anadido: false, fallo: r.salida };
  }
  const perfil = perfilDeShell({ plataforma, entorno, casa });
  const previo = fs.existsSync(perfil) ? fs.readFileSync(perfil, 'utf8') : '';
  const separador = previo === '' || previo.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(perfil, `${previo}${separador}\n${MARCA_PATH}\nexport PATH="${carpetaBin}:$PATH"\n`);
  return { anadido: true, donde: perfil };
}

function crearAtajo({ raiz, nombre, actualizar = false, carpetaBin = path.join(os.homedir(), '.local', 'bin'), plataforma = process.platform,
  entorno = process.env, casa = os.homedir(), ejecutarPs = powershell }) {
  if (!NOMBRE_VALIDO.test(nombre || '')) return { creado: false, motivo: 'nombre-no-valido' };
  if (RUTA_PELIGROSA.test(raiz)) return { creado: false, motivo: 'ruta-no-valida' };

  const fichero = path.join(carpetaBin, plataforma === 'win32' ? `${nombre}.cmd` : nombre);
  if (fs.existsSync(fichero)) {
    const actual = fs.readFileSync(fichero, 'utf8');
    if (!actual.includes(MARCA)) return { creado: false, motivo: 'fichero-ajeno', fichero };
    if (!actual.includes(`curso: ${raiz}`)) {
      // Un curso que se ha movido: su atajo apunta a una carpeta que ya no existe. Solo entonces se re-apunta.
      const anterior = (/curso: (.+)/.exec(actual) || [])[1];
      const seHaMovido = actualizar && anterior && !fs.existsSync(anterior.trim());
      if (!seHaMovido) return { creado: false, motivo: 'atajo-de-otro-curso', fichero };
    }
  }
  if (existeComando(nombre, { entorno, plataforma, salvo: fichero })) return { creado: false, motivo: 'comando-existente' };

  const ajustes = v.leerAjustes(raiz);
  const adaptador = v.leerAdaptador(raiz, ajustes.llm);
  const comando = (adaptador && adaptador.comando) || COMANDO_LLM[ajustes.llm] || ajustes.llm;
  fs.mkdirSync(carpetaBin, { recursive: true });
  fs.writeFileSync(fichero, contenido({ raiz, comando, plataforma }));
  if (plataforma !== 'win32') fs.chmodSync(fichero, 0o755);
  v.escribirAjustes(raiz, { ...ajustes, atajo: nombre });

  const enPath = carpetasDelPath(entorno).some(dir => path.resolve(dir) === path.resolve(carpetaBin));
  const alPath = enPath ? null : anadirAlPath({ carpetaBin, plataforma, entorno, casa, ejecutarPs });
  return { creado: true, fichero, enPath, alPath };
}

const EXPLICACION = {
  'nombre-no-valido': 'El atajo tiene que ser una sola palabra corta: minúsculas, números o guiones, sin acentos ni espacios (por ejemplo: historia).',
  'fichero-ajeno': 'Ya existe un fichero con ese nombre que no es del kit. No lo toco: elige otra palabra.',
  'atajo-de-otro-curso': 'Esa palabra ya abre otro de tus cursos. Elige otra para este. (Si es este mismo curso y lo has movido de carpeta, repite con --actualizar.)',
  'comando-existente': 'Esa palabra ya es un programa de tu ordenador. Elige otra para no taparlo.',
  'ruta-no-valida': 'La carpeta del curso tiene en su nombre un carácter que el atajo no puede llevar (comillas, $, % o acento grave). Cambia el nombre de la carpeta y repite con --actualizar.',
};

function cli(args, raiz, opciones = {}) {
  const i = args.indexOf('--nombre');
  const r = crearAtajo({ raiz, nombre: i >= 0 ? args[i + 1] : undefined, actualizar: args.includes('--actualizar'), ...opciones });
  if (!r.creado) { console.log(EXPLICACION[r.motivo]); return 1; }
  console.log(`Atajo creado: a partir de ahora, escribir "${args[i + 1]}" en la terminal abre este curso.`);
  if (!r.enPath && r.alPath && (r.alPath.anadido || r.alPath.yaEstaba)) {
    console.log('Para que funcione, cierra esta ventana de terminal y abre una nueva: las ventanas que ya estaban abiertas no lo ven.');
    if (r.alPath.anadido) console.log(`(He añadido la carpeta de los atajos en ${r.alPath.donde}; solo hacía falta una vez.)`);
  } else if (!r.enPath) {
    console.log(`Aviso: no he podido añadir la carpeta ${path.dirname(r.fichero)} al PATH (${r.alPath.fallo || 'motivo desconocido'}). Sin eso, la palabra no abre el curso: hay que añadirla a mano.`);
  }
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'crear-atajo.js');

module.exports = { crearAtajo, cli, MARCA, anadirAlPath, pathGuardado, perfilDeShell };
