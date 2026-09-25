'use strict';
const path = require('node:path');
const g = require('./lib/git');
const { leerAjustes, leerMotor } = require('./lib/vault');
const { escanearSalientes } = require('./lib/secretos');
const { ejecutar } = require('./lib/proceso');
const { consultaPrivacidadAnonima } = require('./lib/red');
const fs = require('node:fs');
const { comprobar } = require('./comprobar');
const { pendientes, markdownPendientes, markdownAuditoria, markdownFormulario, markdownEjercicios, actualizarEstadoReadme } = require('./lib/generados');
const { CARPETA_ALUMNO } = require('./lib/vault');
const indice = require('./lib/indice');
const perfil = require('./lib/perfil');
const repaso = require('./lib/repaso');
const { configurarUnionParaDiario, resolverConflictos, ficherosEnConflicto, volcarVersionAjena, limpiarVolcadoAnterior } = require('./lib/mezcla');

// Cuando abortarMerge tuvo que rescatar algo sin guardar antes de descartarlo (revisión de la 0.27, media 1),
// se dice dónde, para que quien lo lea sepa que no se ha perdido nada.
const notaRescate = r => (r && r.rescatado) ? ` (lo que había sin guardar se puso a salvo en ${r.rescatado})` : '';

// ¿Hay una operación de git a medias (un merge, un rebase, un cherry-pick) o entradas del índice sin resolver?
// (revisión de la 0.27, alta 4). Puede quedar así por un fallo anterior (un corte de luz, una excepción que no
// se cazó a tiempo): ni guardar.js ni --traer siguen sobre eso sin que alguien lo mire primero — un `git add -A`
// a ciegas metería en el commit los marcadores de conflicto que hubiera. `--git-path` da la ruta real también
// dentro de una copia de trabajo (`git worktree`, como las de preparar.js), donde no está bajo `.git/` a secas.
function mergeEnCurso(raiz) {
  for (const rel of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'rebase-merge', 'rebase-apply']) {
    const r = g.intentarGit(raiz, ['rev-parse', '--git-path', rel]);
    if (r.ok && fs.existsSync(path.resolve(raiz, r.stdout.trim()))) return true;
  }
  return ficherosEnConflicto(raiz).length > 0;
}

const DIARIO_CABECERA = `# Diario del curso

> Una línea por cada vez que tu profesor guarda. La escribe él (\`guardar.js\`) y la lee al abrir para saber por
> dónde ibais. Si una línea dice **en curso** y no hay otra después que lo cierre, algo se quedó a medias.

`;

// Anota en config/diario.md qué se guarda. Va antes del commit para que forme parte de él.
function anotarEnDiario(raiz, mensaje, hoy = new Date().toISOString().slice(0, 10)) {
  const f = path.join(raiz, 'config', 'diario.md');
  const previo = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : DIARIO_CABECERA;
  // Respeta el fin de línea que ya tenga el fichero: en Windows (\r\n), mezclar los dos lo estropea y git lo da
  // entero por cambiado en cada guardado.
  const eol = previo.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(f, previo.replace(/(\r?\n)*$/, eol) + `- ${hoy} · ${mensaje}${eol}`);
}

// Lo que se escribe solo en cada guardado. Va ANTES de comprobar: así un curso al que aún le falta inicio.md no se
// queda sin poder guardar, y lo generado se comprueba en el mismo guardado. Solo se escribe lo que cambia: si no,
// un curso quieto parecería tener cambios.
function regenerarGenerados(raiz, hoy = new Date().toISOString().slice(0, 10)) {
  const base = path.join(raiz, CARPETA_ALUMNO);
  const escribirSiCambia = (fichero, texto) => {
    if (!fs.existsSync(fichero) || fs.readFileSync(fichero, 'utf8') !== texto) {
      fs.mkdirSync(path.dirname(fichero), { recursive: true });
      fs.writeFileSync(fichero, texto);
    }
  };
  // E1: las tarjetas se mueven de caja en el curso, nunca en una copia de preparación en segundo plano: chocaría con
  // el curso al juntar, y lo que la copia trae (una clase nueva) aún no está estudiado. Se hace al juntar.
  const rama = g.intentarGit(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!(rama.ok && rama.salida.trim().startsWith('preparacion/'))) {
    repaso.procesar(raiz, { hoy, estudiadas: new Set(indice.leerSesiones(raiz).filter(s => s.estudiada).map(s => s.id)) });
  }
  for (const [rel, pie] of indice.piesDeSesion(raiz)) {
    const fichero = path.join(base, ...rel.split('/'));
    escribirSiCambia(fichero, indice.ponerPie(fs.readFileSync(fichero, 'utf8'), pie));
  }
  // Antes que inicio.md: "Otras hojas" mira si formulario.md y mi-perfil.md existen en disco, y tiene que verlos ya escritos
  // la primera vez que se genera (si no, la próxima vez que se guarde cambiaría solo por eso).
  escribirSiCambia(path.join(base, 'formulario.md'), markdownFormulario(raiz));
  escribirSiCambia(path.join(base, perfil.PERFIL), perfil.markdownPerfil(raiz));
  escribirSiCambia(path.join(base, 'ejercicios', '_index.md'), markdownEjercicios(raiz));
  escribirSiCambia(path.join(base, indice.INICIO), indice.markdownInicio(raiz, { pendientes: pendientes(raiz).length, hoy }));
  escribirSiCambia(path.join(base, 'pendientes.md'), markdownPendientes(raiz));
  escribirSiCambia(path.join(base, 'auditoria-del-material.md'), markdownAuditoria(raiz));
}

// Timeout para lo que toca red (fetch/push): nunca se queda colgado esperando una contraseña, una huella SSH o
// una conexión muerta (revisión de la 0.27, media 6). Una acción explícita del profesor (--traer, un push): más
// margen que el chequeo silencioso de estado.js (que nunca debe notarse).
const TIMEOUT_RED_MS = 20000;

const NO_PRIVADO = 'tu repositorio de GitHub no es privado: ponlo privado con gh repo edit --visibility private --accept-visibility-change-consequences';

// ¿Es seguro subir a este remoto? (issue #39, H07). Una carpeta del disco no sale del ordenador. En GitHub, solo
// un repositorio privado que no sea el del kit. `gh` es la vía normal (si está y responde); sin él (issue #50: un
// asistente en la nube no lo trae), una segunda vía sin credenciales, la API pública de GitHub: un repo que no es
// visible así (404, con el cuerpo que de verdad manda GitHub — revisión de la 0.27, grave 1) es privado, o no
// existe. Si ninguna de las dos sabe decirlo (sin red, límite de la API sin autenticar…), no se sube: el trabajo
// ya está guardado en local y sube en el siguiente guardado (fail-closed: nunca sube si no está seguro de que es
// privado). `url` es SIEMPRE el destino real del push (`git remote get-url --push`, no el de lectura: pueden ser
// distintos). Otro servidor que no sea GitHub, o "github.com" en cualquier parte de la URL menos como host de
// verdad (`gitlab.com/github.com/...`): el kit no sabe comprobarlo, así que tampoco sube (revisión, grave 1).
// Una URL "parece remota" si tiene un esquema (`https://…`), la forma SSH larga (`user@host:ruta`) o la
// forma SSH corta SIN usuario (`host:ruta`, `github.com:ana/curso.git`) — cualquier prefijo `algo:` que no sea
// una letra de unidad de Windows (`C:\…`, `C:/…`). La versión anterior solo reconocía las dos primeras: un
// remoto corto sin `usuario@` (revisión de la 0.27, segunda ronda, grave 1) se colaba como si fuera una
// carpeta local, sin comprobar nada, y subía sin más.
function pareceRemota(url) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return true;
  if (/^[^@/\\]+@[^:]+:/.test(url)) return true;
  if (/^[A-Za-z]:[\\/]/.test(url)) return false;   // letra de unidad de Windows: eso sí es local
  return /^[^/\\]+:/.test(url);
}
function destinoSeguro(url, repoKit, ejecutarGh = (args) => ejecutar('gh', args), consultarAnonimo = consultaPrivacidadAnonima) {
  const esLocal = !pareceRemota(url);
  if (esLocal || /^file:\/\//i.test(url)) return { ok: true };
  if (g.esUrlDelKit(url, repoKit)) return { ok: false, motivo: 'el remoto es el repositorio del kit, no el tuyo' };
  const repo = g.repoGithubDe(url);
  if (!repo) return { ok: false, motivo: 'el remoto no está en GitHub y el kit no sabe comprobar si es privado' };
  const r = ejecutarGh(['repo', 'view', repo, '--json', 'visibility', '--jq', '.visibility']);
  if (r.ok) return r.salida.trim() === 'PRIVATE' ? { ok: true } : { ok: false, motivo: NO_PRIVADO };
  const anon = consultarAnonimo(repo);
  if (anon.conocido) return anon.privado ? { ok: true } : { ok: false, motivo: NO_PRIVADO };
  return { ok: false, motivo: 'no se ha podido comprobar que tu repositorio de GitHub sea privado (¿sin red, sin sesión de gh, o límite de la API de GitHub sin identificarse?)' };
}

// El repositorio del kit, para no subir nunca a él. Un curso a medio reparar puede no tener motor.json.
function repoDelKit(raiz) {
  try { return leerMotor(raiz).repo; } catch { return null; }
}

// Decide si lo que hay en HEAD se sube, y lo sube si procede. Mismo criterio para un guardado que para
// un deshacer (deshacer.js la reutiliza): sin subir_a_github, con un secreto o sin remoto, se queda en local.
// Una copia de trabajo de preparar.js (rama `preparacion/<id>`) nunca sube: es una rama aparte que nadie
// más ve hasta que `--juntar` la mezcla con la principal, y esa mezcla es la que sube (con sus reglas
// normales), no cada guardado suelto de la preparación. Solo un `true` de verdad sube: "false" en texto, o
// no tener el ajuste, se queda en local (issue #39, H07).
// Un push que falla porque alguien subió algo entre medias (otro sitio, u otra ventana de este mismo profesor):
// no es lo mismo que un push que falla sin más (sin red, sin permiso). Se puede resolver solo, trayendo primero
// (revisión de la 0.27, baja "push rechazado").
const RECHAZADO_POR_OTRO_SITIO = /\[rejected\]|non-fast-forward|fetch first|Updates were rejected/i;

function subirSiProcede(raiz, informe, { ejecutarGh, consultarAnonimo } = {}) {
  const resultado = { subido: false };
  const subir = leerAjustes(raiz).subir_a_github;
  const url = g.urlPush(raiz);
  let salientes;
  let destino;
  if (subir !== true) {
    resultado.motivoSubida = subir === false ? 'subir_a_github está desactivado'
      : 'subir_a_github en config/ajustes.json no es true ni false: no se sube hasta arreglarlo';
  } else if (g.ramaActual(raiz).startsWith('preparacion/')) resultado.motivoSubida = 'esto es una copia de preparación en segundo plano: se sube cuando el profesor la junte con --juntar';
  else if (informe.errores.some(e => e.regla === 'secreto')) resultado.motivoSubida = 'hay un posible secreto: no se sube hasta quitarlo';
  else if (!url) resultado.motivoSubida = 'no hay remoto configurado';
  else if ((salientes = escanearSalientes(raiz)).length) {
    const s = salientes[0];
    resultado.motivoSubida = `hay un posible secreto (${s.tipo}) en un guardado que aún no se ha subido (${s.commit}, ${s.fichero}): ` +
      'aunque ya no esté en los ficheros, subiría con la historia. No se sube; el trabajo sigue guardado en local';
  } else if (!(destino = destinoSeguro(url, repoDelKit(raiz), ejecutarGh, consultarAnonimo)).ok) resultado.motivoSubida = `${destino.motivo}. El trabajo está guardado en local`;
  else {
    const push = g.intentarGitRed(raiz, ['push', '-q', 'origin', 'HEAD'], { timeoutMs: TIMEOUT_RED_MS });
    if (push.ok) resultado.subido = true;
    else if (RECHAZADO_POR_OTRO_SITIO.test(push.salida)) {
      resultado.rechazadoPorOtroSitio = true;
      resultado.motivoSubida = 'el push falló porque alguien subió algo entre medias (el trabajo está guardado en local): '
        + 'ejecuta node .kit/herramientas/guardar.js --traer y repite';
    } else resultado.motivoSubida = `el push falló (el trabajo está guardado en local): ${push.salida}`;
  }
  return resultado;
}

function guardar({ raiz, mensaje, permitirErrores = false, hoy }) {
  if (!g.esRepo(raiz)) return { guardado: false, motivo: 'sin-repo', subido: false, informe: comprobar(raiz) };
  // Revisión de la 0.27 (alta 4): un merge/rebase/cherry-pick a medias (de un fallo anterior, nunca del
  // profesor a mano) no se guarda por encima. Antes de tocar nada.
  if (mergeEnCurso(raiz)) return { guardado: false, motivo: 'merge-en-curso', subido: false, informe: comprobar(raiz) };
  regenerarGenerados(raiz, hoy);
  const informe = comprobar(raiz);
  if (informe.errores.length && !permitirErrores) return { guardado: false, motivo: 'errores', subido: false, informe };
  // La portada solo cambia de fecha si hay algo más que guardar: si no, un curso quieto parecería tener cambios.
  if (g.hayCambios(raiz)) actualizarEstadoReadme(raiz, hoy);
  if (!g.hayCambios(raiz)) return { guardado: false, motivo: 'sin-cambios', subido: false, informe };
  if (!g.tieneIdentidad(raiz)) return { guardado: false, motivo: 'sin-identidad', subido: false, informe };

  anotarEnDiario(raiz, mensaje, hoy);
  g.git(raiz, ['add', '-A']);
  g.git(raiz, ['commit', '-q', '-m', mensaje]);

  return { guardado: true, informe, ...subirSiProcede(raiz, informe) };
}

// Compara qué errores hay, no cuántos (como actualizar.js): arreglar uno y romper otro distinto sigue contando
// como "algo nuevo". Un secreto siempre cuenta, aunque ya estuviera antes: no se deja pasar un merge con uno.
const claveError = e => `${e.regla} · ${e.fichero}`;
function erroresNuevos(antes, informe) {
  return informe.errores.filter(e => e.regla === 'secreto' || !antes.includes(claveError(e)));
}

// Trae los cambios del remoto de la rama actual (plan 0.27, B.2): el curso vive en más de un sitio, y nada
// más los traía. Primero guarda lo que hubiera pendiente (como --juntar; ahí se niega también si hay un
// merge/rebase/cherry-pick a medias — alta 4). Si solo está detrás, avance rápido; si divergieron, la misma
// maquinaria de --juntar (lib/mezcla.js): generados enteros se regeneran, la parte escrita se funde a tres
// bandas, progreso.md y los índices por fila. `conservar` (revisión, "salida para el choque"): un fichero que
// no se resuelve solo, decidido a mano (--traer --conservar <ruta>=aqui|alla), se resuelve con ese lado. Lo que
// siga sin resolverse es un choque de verdad: se aborta, el curso queda exactamente como estaba, con la versión
// del otro sitio volcada fuera del curso para enseñársela al alumno, y el comando exacto para repetir.
function traer(raiz, { hoy = new Date().toISOString().slice(0, 10), conservar = {} } = {}) {
  if (!g.esRepo(raiz)) return { traido: false, motivo: 'sin-repo' };
  const url = g.urlOrigen(raiz);
  if (!url) return { traido: false, motivo: 'sin-remoto' };
  // Revisión, media 7: nunca se sincroniza con el repositorio del kit (por ejemplo, si `origin` se quedó
  // apuntando ahí por error): mismo criterio que destinoSeguro, sin distinguir mayúsculas.
  if (g.esUrlDelKit(url, repoDelKit(raiz))) return { traido: false, motivo: 'remoto-del-kit' };
  const rRama = g.intentarGit(raiz, ['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!rRama.ok) return { traido: false, motivo: 'error-git', detalle: rRama.salida };
  const rama = rRama.stdout.trim();
  if (!rama || rama === 'HEAD') return { traido: false, motivo: 'detached' };
  if (rama.startsWith('preparacion/')) return { traido: false, motivo: 'en-preparacion' };

  const previo = guardar({ raiz, mensaje: 'guardado antes de traer', permitirErrores: true, hoy });
  if (!previo.guardado && previo.motivo !== 'sin-cambios') {
    return { traido: false, motivo: 'sin-guardar', detalle: `no se pudo guardar tu trabajo pendiente antes de traer (${previo.motivo}); no se toca nada` };
  }
  const antes = previo.informe.errores.map(claveError);

  const rFetch = g.intentarGitRed(raiz, ['fetch', 'origin', rama], { timeoutMs: TIMEOUT_RED_MS });
  if (!rFetch.ok) return { traido: false, motivo: 'fetch-fallo', detalle: rFetch.salida };
  if (!g.intentarGit(raiz, ['rev-parse', '--verify', `refs/remotes/origin/${rama}`]).ok) {
    return { traido: false, motivo: 'sin-rama-remota' };
  }

  const contar = rango => { const n = parseInt(g.git(raiz, ['rev-list', '--count', rango]).trim(), 10); return Number.isFinite(n) ? n : 0; };
  const detras = contar(`HEAD..origin/${rama}`);
  if (!detras) return { traido: true, motivo: 'al-dia' };
  const delante = contar(`origin/${rama}..HEAD`);

  if (!delante) {
    const ff = g.intentarGit(raiz, ['merge', '--ff-only', '-q', `origin/${rama}`]);
    if (!ff.ok) return { traido: false, motivo: 'error-merge', detalle: ff.salida };
    const posterior = guardar({ raiz, mensaje: `traer: avance rápido con origin/${rama}`, permitirErrores: true, hoy });
    const informe = posterior.informe;
    const subida = posterior.guardado
      ? { subido: posterior.subido, motivoSubida: posterior.motivoSubida, rechazadoPorOtroSitio: posterior.rechazadoPorOtroSitio }
      : subirSiProcede(raiz, informe);
    return { traido: true, motivo: 'avance-rapido', informe, ...subida };
  }

  // Revisión, alta 3: una excepción entre el merge y el commit (una carpeta donde se esperaba un fichero, un
  // checkout que no encuentra su lado en un conflicto DU/UD…) nunca deja MERGE_HEAD colgado: se aborta y se
  // dice qué pasó, como cualquier otro "no se ha podido traer". `commitHecho` evita abortar algo que ya se
  // completó: si lo que falla es DESPUÉS del commit (por ejemplo la subida), la mezcla sí se guardó de verdad
  // — no es un fallo de traer, es un aviso aparte (revisión, media 5).
  configurarUnionParaDiario(raiz);
  let commitHecho = false;
  try {
    const rMerge = g.intentarGit(raiz, ['merge', '--no-commit', '--no-ff', `origin/${rama}`]);
    const conflictos = ficherosEnConflicto(raiz);
    if (!rMerge.ok && !conflictos.length) {
      const abortado = g.abortarMerge(raiz);
      return { traido: false, motivo: 'error-merge', detalle: `${rMerge.salida}${notaRescate(abortado)}` };
    }
    if (conflictos.length) {
      const r = resolverConflictos(raiz, conflictos, { conservar });
      if (!r.ok) {
        const volcado = volcarVersionAjena(raiz, r.ficheros);
        const abortado = g.abortarMerge(raiz);
        return { traido: false, motivo: 'choque', ficheros: r.ficheros, volcado, rescatado: abortado.rescatado };
      }
    }

    regenerarGenerados(raiz, hoy);
    actualizarEstadoReadme(raiz, hoy);
    const informe = comprobar(raiz);
    // Coherente con el avance rápido (media 8): no se aborta por errores que ya estaban antes de traer, solo
    // por los que trae la mezcla (o un secreto, siempre).
    const nuevos = erroresNuevos(antes, informe);
    if (nuevos.length) {
      const abortado = g.abortarMerge(raiz);
      return { traido: false, motivo: 'errores', informe: { ...informe, errores: nuevos }, rescatado: abortado.rescatado };
    }

    const mensaje = `traer: fusión con origin/${rama}`;
    anotarEnDiario(raiz, mensaje, hoy);
    g.git(raiz, ['add', '-A']);
    g.git(raiz, ['commit', '-q', '-m', mensaje]);
    commitHecho = true;
    limpiarVolcadoAnterior(raiz);
    const subida = subirSiProcede(raiz, informe);
    return { traido: true, motivo: 'mezclado', mensaje, informe, ...subida };
  } catch (error) {
    if (!commitHecho) {
      const abortado = g.abortarMerge(raiz);
      return { traido: false, motivo: 'error', detalle: `${error.message}${notaRescate(abortado)}` };
    }
    return { traido: true, motivo: 'mezclado', aviso: `la mezcla se guardó, pero algo falló justo después (revísalo): ${error.message}` };
  }
}

const EXPLICACION = {
  'errores': 'No se ha guardado: hay errores que arreglar primero (ejecuta comprobar.js para verlos).',
  'sin-cambios': 'No había nada nuevo que guardar.',
  'sin-identidad': 'Git no sabe quién eres todavía. Hay que configurar user.name y user.email (ver INSTALAR-AGENTE.md, paso de identidad).',
  'sin-repo': 'La carpeta del curso no es la raíz de su propio repositorio git (no tiene uno, o está dentro de otro): no se toca nada. Ejecuta node .kit/herramientas/diagnostico.js para ver cómo arreglarlo.',
  'merge-en-curso': 'Hay un merge, un rebase o un cherry-pick sin terminar de antes (de un corte, o de algo que falló a medias): revísalo tú, no se guarda por encima. node .kit/herramientas/diagnostico.js puede ayudar a verlo.',
};

// El comando para repetir --traer resolviendo cada fichero que no se resolvió solo (revisión, "salida para el
// choque"): con "?" de marcador — nunca elige un lado por defecto (revisión, media 4b) — para que el profesor
// lo sustituya por "aqui" o "alla" tras enseñarle al alumno las dos versiones y decidir con él. La ruta va
// entrecomillada (revisión, media 2): con espacios o tildes, sin comillas se rompería en dos argumentos.
const comandoConservar = ficheros => `node .kit/herramientas/guardar.js --traer ${ficheros.map(f => `--conservar "${f}=?"`).join(' ')}`;

const EXPLICACION_TRAER = {
  'sin-repo': EXPLICACION['sin-repo'],
  'sin-remoto': 'no hay remoto configurado: no hay nada que traer.',
  'remoto-del-kit': 'el remoto configurado es el repositorio del kit, no el tuyo: no se sincroniza con él.',
  'detached': 'el curso no está en ninguna rama (detached HEAD): no se puede traer así.',
  'en-preparacion': 'esto es una copia de preparación en segundo plano: no se trae aquí (--juntar es lo que la mezcla con el curso principal).',
  'error-git': r => `no se ha podido saber en qué rama estás: ${r.detalle}`,
  'sin-guardar': r => r.detalle,
  'fetch-fallo': r => `no se ha podido conectar con GitHub para traer los cambios: ${r.detalle}`,
  'sin-rama-remota': 'esta rama nunca se ha subido a GitHub: no hay nada que traer.',
  'error-merge': r => `no se ha podido traer: ${r.detalle}`,
  'error': r => `algo falló a medio camino trayendo los cambios; el curso ha quedado exactamente como estaba: ${r.detalle}`,
  'choque': r => {
    const lineas = (r.volcado ? r.volcado.detalle : r.ficheros.map(f => ({ ruta: f, otroLado: null })))
      .map(d => {
        if (d.borradoEnElOtroSitio) return `  - ${d.ruta} — en el otro sitio se borró (aquí sigue tal cual)`;
        if (d.otroLado) return `  - ${d.ruta} — la versión del otro sitio, para enseñársela al alumno: ${d.otroLado}`;
        return `  - ${d.ruta}`;
      });
    return `hay un choque real que no se resuelve solo, en:\n${lineas.join('\n')}\n`
      + `El curso sigue exactamente como estaba (nada se ha perdido)${notaRescate({ rescatado: r.rescatado })}. Decide con el `
      + `alumno, enseñándole las dos versiones, y repite eligiendo un lado en cada uno, por ejemplo:\n  ${comandoConservar(r.ficheros)}\n`
      + '(sustituye cada "?" por "aqui" o "alla", según con qué lado se quede ese fichero).';
  },
  'errores': r => `tras traer, comprobar.js da errores nuevos que no estaban antes: no se ha guardado nada de la mezcla. El curso sigue como estaba${notaRescate({ rescatado: r.rescatado })}.\n${r.informe.errores.map(e => `  [${e.regla}] ${e.fichero} — ${e.detalle}`).join('\n')}`,
};
function explicarTraer(r) {
  const e = EXPLICACION_TRAER[r.motivo];
  return typeof e === 'function' ? e(r) : e || r.motivo;
}

// `--empezar "<qué>"`: la línea "en curso" del diario, antes de algo de varios pasos. Sin commit: se guarda con el
// trabajo. La escribe la herramienta y no el profesor a mano: con `echo >>` pide permiso, y sin nadie delante (la
// prueba real, el segundo plano) se deniega y el paso se queda sin hacer.
function cli(args, raiz) {
  if (args[0] === '--empezar') {
    const que = (args[1] || '').trim();
    if (!que) { console.error('Uso: node .kit/herramientas/guardar.js --empezar "<qué vas a hacer>"'); return 2; }
    anotarEnDiario(raiz, `en curso: ${que}`);
    console.log(`Anotado en el diario: en curso: ${que}.`);
    return 0;
  }
  if (args[0] === '--traer') {
    const conservar = {};
    for (let i = 1; i < args.length; i++) {
      if (args[i] !== '--conservar') continue;
      const par = args[++i] || '';
      const m = /^(.+)=(aqui|alla|\?)$/.exec(par);
      if (!m) { console.error(`Uso: --conservar <ruta>=aqui|alla, no "${par}"`); return 2; }
      // Revisión, media 4b: el comando que se propone en el mensaje de choque no elige lado por defecto — un
      // "?" sin decidir se rechaza explícitamente, en vez de dejar que alguien lo ejecute sin darse cuenta.
      if (m[2] === '?') {
        console.error(`--conservar ${m[1]}=? — hay que elegir "aqui" o "alla": enséñale al alumno las dos versiones `
          + '(el mensaje del choque da la ruta de la del otro sitio) y decide con él antes de repetir.');
        return 2;
      }
      conservar[m[1]] = m[2];
    }
    const r = traer(raiz, { conservar });
    if (!r.traido) { console.log(`No se ha traído nada: ${explicarTraer(r)}`); return 1; }
    if (r.motivo === 'al-dia') { console.log('Ya tenías todo lo que hay en GitHub.'); return 0; }
    if (r.rechazadoPorOtroSitio) { console.log(`Traído, pero no subido: ${r.motivoSubida}.`); return 4; }
    console.log(`Traído.${r.subido ? ' Subido a GitHub.' : ` No se ha subido: ${r.motivoSubida}.`}`);
    return 0;
  }
  const mensaje = args[0];
  if (!mensaje) { console.error('Uso: node .kit/herramientas/guardar.js "<mensaje>"  ·  --empezar "<qué>"  ·  --traer [--conservar <ruta>=aqui|alla]...'); return 2; }
  const r = guardar({ raiz, mensaje });
  if (!r.guardado) { console.log(EXPLICACION[r.motivo]); return r.motivo === 'sin-cambios' ? 0 : 1; }
  if (r.rechazadoPorOtroSitio) { console.log(`Guardado, pero no subido: ${r.motivoSubida}.`); return 4; }
  console.log(r.subido ? 'Guardado y subido a GitHub.' : `Guardado en local. No se ha subido: ${r.motivoSubida}.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'guardar.js');

module.exports = { guardar, regenerarGenerados, anotarEnDiario, subirSiProcede, destinoSeguro, traer, cli };
