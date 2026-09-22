'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const v = require('./lib/vault');
const g = require('./lib/git');
const { comprobar } = require('./comprobar');
const { MARCA } = require('./crear-atajo');

const NODE_MINIMO = 22;

function ejecutarReal(comando, args, cwd) {
  const r = spawnSync(comando, args, { cwd, encoding: 'utf8' });
  return { ok: r.status === 0, salida: ((r.stdout || '') + (r.stderr || '')).trim() };
}

// Repasa la instalación entera y devuelve una lista de comprobaciones. Es la respuesta objetiva a
// "¿está todo instalado?": no depende del criterio del LLM que esté instalando.
function diagnostico({ raiz, ejecutar = ejecutarReal, versionNode = process.versions.node, plataforma = process.platform,
  entorno = process.env, carpetaBin = path.join(os.homedir(), '.local', 'bin') }) {
  const lista = [];
  const anota = (id, ok, texto, arreglo, obligatorio = true) => lista.push({ id, ok: Boolean(ok), texto, arreglo: ok ? '' : arreglo, obligatorio });
  const existe = rel => fs.existsSync(path.join(raiz, ...rel.split('/')));

  anota('node', parseInt(versionNode, 10) >= NODE_MINIMO, `Node ${versionNode}`, `Hace falta Node ${NODE_MINIMO} o superior: instala la versión LTS.`);
  anota('git', ejecutar('git', ['--version'], raiz).ok, 'Git', 'Instala Git. Si acabas de instalarlo, abre una ventana de terminal nueva.');
  const hayGh = ejecutar('gh', ['--version'], raiz).ok;
  anota('gh', hayGh, 'GitHub CLI (gh)', 'Instala GitHub CLI. Si acabas de instalarlo, abre una ventana de terminal nueva.');

  const motor = v.leerMotor(raiz);
  const sesion = hayGh && ejecutar('gh', ['auth', 'status'], raiz).ok;
  anota('sesion-github', sesion, 'Sesión de GitHub iniciada', 'Inicia sesión: gh auth login --web -h github.com -p https (ver la guía: en segundo plano o en otra ventana).');
  anota('acceso-al-kit', sesion && ejecutar('gh', ['api', `repos/${motor.repo}`, '--jq', '.name'], raiz).ok, 'Acceso al kit (para recibir mejoras)',
    'La cuenta de GitHub activa no ve el kit: o es otra cuenta (gh auth switch) o falta aceptar la invitación.');

  anota('identidad-git', g.esRepo(raiz) && g.tieneIdentidad(raiz), 'Git sabe quién eres', 'Configura user.name y user.email en este curso (paso 4 de la guía).');

  const hayAjustes = existe('config/ajustes.json');
  anota('curso-preparado', hayAjustes && !existe('docs') && !existe('.github'), 'Curso preparado', 'Ejecuta preparar-curso.js (paso 5 de la guía).');
  const ajustes = v.leerAjustes(raiz);

  if (ajustes.subir_a_github) {
    const url = g.esRepo(raiz) ? g.urlOrigen(raiz) : null;
    const propio = Boolean(url) && !url.includes(motor.repo);
    anota('copia-en-github', propio, 'Tu curso tiene su copia en GitHub', 'El curso no tiene remoto propio: créalo con gh repo create --private (paso 3).');
    if (propio) {
      const visibilidad = ejecutar('gh', ['repo', 'view', '--json', 'visibility', '--jq', '.visibility'], raiz);
      anota('copia-privada', visibilidad.ok && visibilidad.salida.trim() === 'PRIVATE', 'La copia en GitHub es privada',
        'La copia NO es privada (o no se ha podido comprobar). Dentro hay material del curso y tu perfil: ponla privada con gh repo edit --visibility private --accept-visibility-change-consequences');
    }
  }

  if (ajustes.llm === 'claude-code') {
    anota('skills', existe('.claude/skills/sesion/SKILL.md'), 'Skills instaladas', 'Ejecuta instalar-skills.js (paso 6).');
  } else {
    anota('skills', existe('config/adaptacion-llm.md'), `Skills adaptadas a ${ajustes.llm}`, 'Sigue .kit/ESTANDARES.md y anota lo que hagas en config/adaptacion-llm.md.');
  }

  const lanzador = ajustes.atajo ? path.join(carpetaBin, plataforma === 'win32' ? `${ajustes.atajo}.cmd` : ajustes.atajo) : null;
  const lanzadorBueno = Boolean(lanzador) && fs.existsSync(lanzador) && fs.readFileSync(lanzador, 'utf8').includes(MARCA)
    && fs.readFileSync(lanzador, 'utf8').includes(`curso: ${raiz}`);
  anota('atajo', lanzadorBueno, ajustes.atajo ? `Atajo "${ajustes.atajo}"` : 'Atajo para abrir el curso', 'Crea el atajo con crear-atajo.js --nombre <palabra> (paso 7). Si has movido el curso, añade --actualizar.');
  if (lanzadorBueno) {
    const enPath = (entorno.PATH || entorno.Path || '').split(path.delimiter).some(d => d && path.resolve(d) === path.resolve(carpetaBin));
    anota('atajo-en-path', enPath, 'El atajo se puede escribir desde cualquier sitio', `La carpeta ${carpetaBin} no está en el PATH de esta ventana: abre una nueva; si sigue igual, hay que añadirla al PATH.`);
  }

  anota('obsidian', existe(`${v.CARPETA_ALUMNO}/.obsidian`), 'La carpeta estudio está abierta en Obsidian', 'Falta abrir la carpeta estudio como bóveda en Obsidian (paso 9).', false);
  const errores = comprobar(raiz).errores.length;
  anota('curso-sano', errores === 0, 'El curso está sano', `comprobar.js da ${errores} error(es): ejecútalo para verlos.`);
  return lista;
}

function cli(args, raiz, opciones = {}) {
  const lista = diagnostico({ raiz, ...opciones });
  if (args.includes('--json')) { console.log(JSON.stringify(lista)); return lista.some(c => !c.ok && c.obligatorio) ? 1 : 0; }
  for (const c of lista) {
    console.log(`  ${c.ok ? '✓' : (c.obligatorio ? '✗' : '⚠')} ${c.texto}`);
    if (!c.ok) console.log(`      → ${c.arreglo}`);
  }
  const faltan = lista.filter(c => !c.ok && c.obligatorio).length;
  const avisos = lista.filter(c => !c.ok && !c.obligatorio).length;
  console.log(faltan ? `\nFaltan ${faltan} cosa(s) para dar la instalación por terminada.` : `\nTodo listo.${avisos ? ` (${avisos} aviso(s) que no bloquean)` : ''}`);
  return faltan ? 1 : 0;
}

if (require.main === module) process.exit(cli(process.argv.slice(2), path.resolve(__dirname, '..', '..')));

module.exports = { diagnostico, cli };
