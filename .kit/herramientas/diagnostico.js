'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ejecutar } = require('./lib/proceso');
const v = require('./lib/vault');
const g = require('./lib/git');
const { comprobar } = require('./comprobar');
const { MARCA, pathGuardado } = require('./crear-atajo');

const NODE_MINIMO = 24;

function ejecutarReal(comando, args, cwd) {
  return ejecutar(comando, args, { cwd });
}

// Repasa la instalación entera y devuelve una lista de comprobaciones. Es la respuesta objetiva a
// "¿está todo instalado?": no depende del criterio del LLM que esté instalando.
function diagnostico({ raiz, ejecutar = ejecutarReal, versionNode = process.versions.node, plataforma = process.platform,
  entorno = process.env, carpetaBin = path.join(os.homedir(), '.local', 'bin'), casa = os.homedir(), ejecutarPs }) {
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
    'No se puede leer el kit en GitHub: comprueba la conexión a internet y la sesión (gh auth status).');

  // En un entorno restringido que no deja ejecutar git (#36), se dice en una línea y se sigue con lo demás.
  let repo = null;
  try { repo = g.esRepo(raiz); } catch (error) { if (error.code !== 'EPERM') throw error; }
  if (repo === null) {
    anota('entorno-git', false, 'El entorno deja ejecutar git',
      'Tu asistente está en un entorno restringido que no deja ejecutar git: autoriza la ejecución fuera de ese entorno y repite el diagnóstico.');
  }
  anota('identidad-git', repo === true && g.tieneIdentidad(raiz), 'Git sabe quién eres', 'Configura user.name y user.email en este curso (paso 4 de la guía).');

  // El chat de Obsidian (Claudian) abre el asistente en la bóveda, no en la raíz del curso. Codex busca AGENTS.md
  // y las skills hacia arriba solo hasta la raíz del git: si esa raíz no es la del curso, allí no es el profesor
  // (issue #36). Se mira desde la bóveda, que es desde donde lo lanza Claudian.
  const boveda = existe(v.CARPETA_ALUMNO) ? path.join(raiz, v.CARPETA_ALUMNO) : raiz;
  const gitEnBoveda = fs.existsSync(path.join(boveda, '.git'));
  anota('raiz-del-git', repo === true && !gitEnBoveda, 'El curso es la raíz de su repositorio git',
    gitEnBoveda
      ? `La carpeta ${v.CARPETA_ALUMNO} tiene su propio git (${v.CARPETA_ALUMNO}/.git): así, el asistente abierto desde Obsidian no encuentra al profesor. Si nadie lo usa aparte, bórralo; si guarda historial que el alumno quiere, pregúntale antes.`
      : 'El curso no tiene su propio repositorio git: sin él no se guarda nada y, desde Obsidian, el asistente no encuentra al profesor. Ejecuta git init en la carpeta del curso y guarda con guardar.js.');

  const hayAjustes = existe('config/ajustes.json');
  anota('curso-preparado', hayAjustes && !existe('docs') && !existe('.github'), 'Curso preparado', 'Ejecuta preparar-curso.js (paso 5 de la guía).');
  const ajustes = v.leerAjustes(raiz);

  if (ajustes.subir_a_github === true) {
    const url = repo === true ? g.urlOrigen(raiz) : null;
    const propio = Boolean(url) && !url.includes(motor.repo);
    anota('copia-en-github', propio, 'Tu curso tiene su copia en GitHub', 'El curso no tiene remoto propio: créalo con gh repo create --private (paso 3).');
    if (propio) {
      const visibilidad = ejecutar('gh', ['repo', 'view', '--json', 'visibility', '--jq', '.visibility'], raiz);
      anota('copia-privada', visibilidad.ok && visibilidad.salida.trim() === 'PRIVATE', 'La copia en GitHub es privada',
        'La copia NO es privada (o no se ha podido comprobar). Dentro hay material del curso y tu perfil: ponla privada con gh repo edit --visibility private --accept-visibility-change-consequences');
    }
  }

  // Con adaptador (el del kit, o el que el curso escribió en config/adaptador-llm.json), se comprueba
  // que las skills existen de verdad en su carpeta. Sin adaptador para este LLM, no se puede verificar:
  // es un aviso, no un ✗, y dice cómo resolverlo.
  const adaptador = v.leerAdaptador(raiz, ajustes.llm);
  if (adaptador && adaptador.skills) {
    anota('skills', existe(`${adaptador.skills}/sesion/SKILL.md`), 'Skills instaladas', 'Ejecuta instalar-skills.js (paso 6).');
  } else {
    // Un curso puede llevar la nota vieja en prosa (config/adaptacion-llm.md, de antes de que existiera
    // el JSON) sin haberla convertido nunca al formato que leen las herramientas: no es lo mismo que no
    // tener nada, así que el arreglo se lo dice.
    const notaVieja = existe('config/adaptacion-llm.md') && !existe('config/adaptador-llm.json');
    anota('skills', false, `Skills de ${ajustes.llm}: no se puede verificar`,
      notaVieja
        ? `Este curso tiene config/adaptacion-llm.md (la nota antigua, en prosa) pero no config/adaptador-llm.json, y "${ajustes.llm}" no tiene adaptador en el kit. Convierte esa nota al JSON que pide .kit/ESTANDARES.md (comando, skills, puente, permisos, probado) y, al terminar, propón devolverlo al kit con una issue.`
        : `No hay un adaptador para ${ajustes.llm}. Sigue .kit/ESTANDARES.md: escribe config/adaptador-llm.json en este curso y, al terminar, propón devolverlo al kit con una issue.`,
      false);
  }

  const lanzador = ajustes.atajo ? path.join(carpetaBin, plataforma === 'win32' ? `${ajustes.atajo}.cmd` : ajustes.atajo) : null;
  const lanzadorBueno = Boolean(lanzador) && fs.existsSync(lanzador) && fs.readFileSync(lanzador, 'utf8').includes(MARCA)
    && fs.readFileSync(lanzador, 'utf8').includes(`curso: ${raiz}`);
  anota('atajo', lanzadorBueno, ajustes.atajo ? `Atajo "${ajustes.atajo}"` : 'Atajo para abrir el curso', 'Crea el atajo con crear-atajo.js --nombre <palabra> (paso 7). Si has movido el curso, añade --actualizar.');
  if (lanzadorBueno) {
    // Vale si esta ventana ya lo ve, o si ya está guardado para las ventanas nuevas (crear-atajo.js lo añade).
    const enPath = (entorno.PATH || entorno.Path || '').split(path.delimiter).some(d => d && path.resolve(d) === path.resolve(carpetaBin))
      || pathGuardado({ carpetaBin, plataforma, entorno, casa, ...(ejecutarPs ? { ejecutarPs } : {}) });
    anota('atajo-en-path', enPath, 'El atajo se puede escribir desde cualquier sitio', `La carpeta ${carpetaBin} no está en el PATH: repite crear-atajo.js, que la añade sola, y abre una ventana nueva.`);
  }

  anota('obsidian', existe(`${v.CARPETA_ALUMNO}/.obsidian/workspace.json`), 'La carpeta estudio está abierta en Obsidian', 'Falta abrir la carpeta estudio como bóveda en Obsidian (paso 9).', false);
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

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'diagnostico.js');

module.exports = { diagnostico, cli };
