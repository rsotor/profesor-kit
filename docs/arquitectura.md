# Arquitectura del kit

Documento vivo para quien vaya a **cambiar el kit**: el mantenedor dentro de tres meses, o un LLM que
no ha visto este repo. No es para el alumno (eso es `estudio/como-usar-tu-profesor.md` y el `README.md`
del curso) ni para el profesor-LLM en marcha (eso es `AGENTS.md` y las skills). Se lee en unos 10
minutos. Todo lo de aquí está verificado leyendo el código en el momento de escribirlo — si algo cambia,
este fichero se actualiza en el mismo PR (ver `CONTRIBUTING.md`, tabla "Documentación viva").

## 1. Qué es el kit

`profesor-kit` convierte un LLM de terminal (Claude Code, y en principio cualquier otro) en el profesor
personal de un alumno para un curso concreto: procesa el material de clase, genera notas, ejercicios y
exámenes en una bóveda de Obsidian, y guarda todo con git. Tres audiencias, tres documentos distintos:

| Audiencia | Qué lee | Quién lo escribe |
|---|---|---|
| El alumno | `README.md` del curso, `estudio/como-usar-tu-profesor.md`, `estudio/inicio.md` | El profesor-LLM (los dos últimos), el propio kit (README, sección Estado) |
| El profesor (el LLM, en marcha dentro de un curso) | `AGENTS.md`, `.kit/skills/*/SKILL.md`, `config/*.md` | Nosotros (el motor); el profesor (`config/`) |
| El mantenedor del kit (tú, ahora) | este fichero, `CONTRIBUTING.md`, el código de `.kit/herramientas/` | Nosotros |

## 2. Motor y datos

```
profesor-kit/
├── AGENTS.md, CLAUDE.md, .gitignore, .claude/settings.json, .kit/   ← MOTOR (lista exacta: .kit/motor.json)
├── config/                                                          ← DATOS: cómo es el curso, el profesor, el alumno
├── estudio/                                                         ← DATOS: todo el material del alumno (bóveda de Obsidian)
└── README.md                                                        ← DATOS: portada del curso en GitHub
```

- **`.kit/motor.json`** (`{ repo, version_datos, ficheros }`) es la lista exacta de lo que `/actualizar`
  sustituye: hoy `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.claude/settings.json` y `.kit` entero. Todo lo
  demás del repo del curso lo deja tal cual.
- **`config/`** y **`estudio/`** son datos: `/actualizar` nunca los toca. `config/` es de quien instala y
  del profesor (`ajustes.json`, `curso.md`, `profesor.md`, `alumno.md`, `estructura.json`,
  `adaptador-llm.json`, `diario.md`); `estudio/` es la bóveda que el alumno abre en Obsidian.
- **Lo que nunca se puede romper al actualizar** lo impone el código, no la convención:
  `actualizar.js#validarMotor()` rechaza cualquier ruta del `motor.json` nuevo que sea absoluta, lleve
  `..` o **empiece por una ruta de `vault.js#RUTAS_PROTEGIDAS`** (`config`, `estudio`, `README.md`) — si
  algún día alguien listara `estudio/` en el motor por error, `actualizar.js` lanza una excepción antes de
  tocar nada.
- **`.gitignore` se fusiona, no se sustituye** (`actualizar.js#SE_FUSIONAN` +
  `fusionarGitignore()`): es parte del motor, pero el alumno (o su LLM) puede haber añadido sus propias
  líneas, así que al actualizar solo se añaden los patrones que falten, con un comentario que marca la
  versión que los trajo.
- **Adaptadores locales**: si el LLM del curso no es uno de los que ya trae el kit
  (`.kit/adaptadores/<llm>.json`), el propio curso escribe `config/adaptador-llm.json` — vive en `config/`,
  así que `/actualizar` nunca lo pisa, y manda sobre el del kit si ambos existen (`vault.js#leerAdaptador`).

## 3. Mapa de herramientas

Todas se ejecutan como `node .kit/herramientas/<nombre>.js` y arrancan por `lib/arranque.js` (atrapa
fallos inesperados y dice que es del kit, no del curso). "Quién la llama" es la skill, otra herramienta, o
el alumno/instalador a través del LLM.

`.kit/herramientas/*.js`:

| Fichero | Qué hace | Quién la llama |
|---|---|---|
| `estado.js` | La foto del curso al abrir (plan 0.22, §3.1): material nuevo en `inbox/` sin procesar, siguiente sesión y sesiones preparadas sin estudiar, sesiones en 🔁, preparaciones en segundo plano (en curso, terminadas sin juntar, fallidas o interrumpidas si el proceso ya no existe) y el caso sugerido (1/2/3) | `AGENTS.md`, "Al empezar cada sesión" |
| `comprobar.js` | Valida el curso entero (estructura, enlaces, secretos, "se verá bien", lint pedagógico, propiedades no estándar) y devuelve `{ errores, avisos }` | Todas las skills de trabajo antes de guardar; internamente `guardar.js`, `actualizar.js` y `diagnostico.js` |
| `guardar.js` | Regenera los ficheros derivados, comprueba, hace `commit` (y `push` si procede) | Toda skill de trabajo al terminar (`sesion`, `dudas`, `examen`, `ejercicio`, `repaso`, `configurar`, `actualizar`) |
| `actualizar.js` | Descarga la última release publicada, sustituye el motor, aplica migraciones pendientes y reinstala skills; vuelve atrás si algo empeora | Skill `/actualizar`; `--comprobar` lo lanza AGENTS.md al empezar cada sesión (silencioso, una vez al día) |
| `organizar.js` | Mueve sesiones/flashcards/ejercicios/exámenes a la carpeta de su unidad según `config/estructura.json` y reescribe los enlaces afectados | Skill `/configurar` (al escribir la estructura) y skill `/sesion` |
| `reparar.js` | Recupera piezas ausentes del motor o del alumno (fichero suelto → su sitio; si no, última versión en git; si no, carpeta vacía), sin pisar nada existente | El profesor, cuando `comprobar.js` da `pieza-ausente` |
| `preparar-curso.js` | Borra lo que es solo del repo del kit (`docs/`, `.github/`…), sustituye el README, quita el remoto del kit y crea `config/ajustes.json` | Solo al instalar (paso 5 de `INSTALAR-AGENTE.md`) |
| `instalar-skills.js` | Copia `.kit/skills/` al destino que diga el adaptador del LLM (`.claude/skills` por defecto solo si el LLM es `claude-code` o no dice nada); sin adaptador ni `--destino` para cualquier otro LLM, se niega y explica qué falta, en vez de instalar en la carpeta de Claude Code | Al instalar (paso 6) y tras cada `/actualizar` (si no hay adaptador para un LLM que no es Claude Code, `actualizar.js` avisa y sigue: no revierte la actualización por esto) |
| `crear-atajo.js` | Escribe el lanzador en `~/.local/bin` (o `.cmd` en Windows) que abre el LLM dentro de este curso, y añade esa carpeta al `PATH` si hace falta | Skill `/configurar` (paso 7 de instalación); `diagnostico.js` lo lee para verificarlo |
| `diagnostico.js` | Repasa toda la instalación (Node, git, `gh`, sesión, acceso al kit, identidad, copia privada, skills, atajo, salud del curso) y dice qué falta; sin adaptador para el LLM del curso, el aviso de skills distingue si ya existe la nota vieja `config/adaptacion-llm.md` (propone convertirla al JSON) de no tener nada | El instalador (paso 8) y cuando algo no va (`AGENTS.md`, "si algo de la instalación no va") |
| `obsidian.js` | Aplica los ajustes recomendados de Obsidian (sin pisar los del alumno) y descarga los complementos fijados por versión y hash | Tras preparar el curso (paso 9) y tras `/actualizar` |
| `preparar.js` | Prepara una clase en segundo plano: `--lanzar` crea un `git worktree` en `.preparacion/<id>/` (rama `preparacion/<id>`) y lanza el asistente sin conversación como proceso aparte (`detached`); `--estado` dice cómo va; `--juntar` mezcla esa copia con la principal (resolviendo sola los choques previstos) y la borra | El profesor, caso 2/3 de `AGENTS.md` ("Al empezar cada sesión"); `--trabajar <id>` es el envoltorio interno que se lanza a sí mismo detached, nunca lo llama el profesor a mano |
| `issue.js` | Prepara (y, con `--enviar`, crea) una issue de feedback al kit; se niega si detecta datos personales | Skills cuando escalan algo ("Feedback al kit") |

`.kit/herramientas/lib/*.js` (no son CLI: las usan las herramientas de arriba):

| Fichero | Qué hace |
|---|---|
| `vault.js` | El núcleo de datos: rutas protegidas, listar notas/conceptos, leer/escribir `frontmatter` y `ajustes.json`, detectar propiedades no estándar, piezas ausentes, leer el adaptador. Lo importa casi todo lo demás |
| `arranque.js` | Punto de entrada común: atrapa una excepción inesperada; si es del sistema (`EACCES`/`EPERM`/`EIO`: permiso denegado; `ENOENT`: comando inexistente) lo explica como tal, y solo si no lo es le dice al LLM que abra una issue |
| `proceso.js` | Lanza un proceso externo (`git`, `gh`, `node`, `powershell`) y clasifica por qué falló (`ok` / `permiso` / `no-existe` / `fallo`), para que ningún mensaje se quede vacío o con "undefined" cuando el proceso ni llega a arrancar. Lo usan `git.js`, `actualizar.js`, `crear-atajo.js`, `diagnostico.js` e `issue.js` |
| `git.js` | Envoltorio fino sobre `git` (estado, commit, identidad, remoto), sobre `proceso.js` |
| `indice.js` | Calcula `estudio/inicio.md` y el pie de navegación de cada sesión, a partir de las sesiones, el progreso y los exámenes en disco |
| `generados.js` | Calcula el resto de ficheros que escribe `guardar.js`: pendientes, auditoría del material, formulario, índice de ejercicios y la sección "Estado" del README |
| `secretos.js` | Escanea los ficheros candidatos a `git` en busca de patrones de tokens y claves conocidos |
| `obsidian.js` | Aplica los ajustes recomendados de Obsidian sin pisar los del alumno, y descarga complementos verificados por sha256 |

## 4. Qué genera `guardar.js`, y en qué orden

`regenerarGenerados(raiz)` (dentro de `guardar.js`) escribe, en este orden, solo lo que cambia:

1. El **pie de navegación** de cada sesión (`indice.piesDeSesion` → `indice.ponerPie`).
2. `estudio/formulario.md` — **antes** que `inicio.md` porque "Otras hojas" mira si ya existe en disco.
3. `estudio/ejercicios/_index.md`.
4. `estudio/inicio.md` (`indice.markdownInicio`).
5. `estudio/pendientes.md`.
6. `estudio/auditoria-del-material.md`.

Después de regenerar, se llama a `comprobar(raiz)`. **Por qué generar antes de comprobar** (comentario
literal del código): así un curso al que aún le falta `inicio.md` no se queda sin poder guardar, y lo
generado se comprueba en el mismo guardado — nunca se guarda algo que `comprobar.js` no ha visto.

Lo que **no** regenera `guardar.js` (se mantiene a mano):

- `estudio/progreso.md` y `estudio/mapa-del-curso.md` (`vault.js#FICHEROS_VIVOS`): el primero solo cambia
  con respuestas del alumno, nunca al procesar una sesión; el segundo es la única cobertura del material
  que `inicio.md` no cubre.
- `estudio/conceptos/_index.md`, todas las notas de `estudio/conceptos/`, `sesiones/`, `ejercicios/`,
  `examenes/`, `flashcards/`: las escribe el profesor-LLM siguiendo su skill.
- Todo `config/*`, y la sección "Estado" del README (esa sí la toca `guardar.js`, pero solo si hay algo
  más que guardar: un curso quieto no cambia de fecha).

## 5. `comprobar.js`: errores frente a avisos

Un **error** bloquea `guardar.js` (salvo `permitirErrores: true`, que usa `actualizar.js` para poder
guardar el estado previo a una actualización). Un **aviso** no bloquea nunca.

**Estructura y navegación del curso (error)**: `pieza-ausente` (falta motor o carpeta/fichero vivo del
alumno) · `enlace-roto` (`[[...]]` a una nota que no existe) · `indice` (concepto sin entrada en
`_index.md`, o al revés) · `frontmatter` (falta `tipo: concepto` o `alias:`) · `progreso` (concepto que no
sale en `progreso.md`) · `ejercicio` (un concepto declara un ejercicio que no existe) · `html-roto` (un
enlace a `.html` que no existe).

**Navegación del curso (aviso, no bloquean)**: `huerfano` (concepto que ninguna nota enlaza) ·
`alias-repetido` · `posible-duplicado` (slugs sospechosamente parecidos) · `sin-unidad` (fichero suelto
que `organizar.js` colocaría) · `orden-ambiguo` · `navegacion-rota` (pie con un marcador `%%` roto) ·
`examen-sin-nota` · `ejercicio-suelto` (`.html` que ningún concepto declara).

**Secretos (error)**: `secreto` — un fichero de secretos sin ignorar (`.env`, `.pem`, `.key`) o un patrón
de token/clave conocido (`lib/secretos.js#PATRONES`) en cualquier línea de un fichero candidato a `git`.

**Se verá bien en Obsidian (aviso, pero "se arregla siempre antes de guardar")**: `no-se-vera-bien`
(símbolo de moneda o `%` sin proteger dentro de una fórmula, `[[nota|alias]]` sin escapar dentro de una
tabla) · `obsidian-oculta-ejercicios` (falta activar "Detectar todas las extensiones" y hay `.html`).

**Lint pedagógico (aviso, "se arreglan siempre antes de guardar salvo motivo concreto")**: `nota-larga`
(no cabe en una pantalla) · `concepto-sin-ejemplo` (falta o está vacía "## El ejemplo") ·
`sesion-incompleta` (falta "Cobertura", "Auditoría" o "Para pensarlo despacio") ·
`flashcards-fuera-de-rango` · `requiere-vacio` (dificultad 3 sin prerrequisito declarado) ·
`pregunta-doble` (≥2 signos `?` en una pregunta de examen) · `falta-info-mal-usado` (`FALTA INFO` dentro de
"## El error típico" de un concepto: eso no es material que el curso tuviera que entregar).

**Propiedades no estándar (aviso)**: `propiedad-no-estandar` — el alumno escribió una propiedad conocida
(`estudiada`, `nota`, `dificultad`…) de una forma que el kit no sabe interpretar (`vault.js#ESPERADO`).

**Pendientes y patrones del curso (aviso salvo `patron-prohibido`, que es error)**: `duda-pendiente` ·
`todo` · `falta-info` · `patron-prohibido` (regex de `config/ajustes.json#patrones_prohibidos`) ·
`patron-invalido` (esa regex no compila).

## 6. Invariantes que no se rompen nunca

| Invariante | Dónde se hace cumplir |
|---|---|
| Un concepto = una nota, para siempre (se lee `_index.md` entero antes de crear una) | **Solo skill/AGENTS.md** (regla 1). El código solo detecta síntomas ya escritos: `indice` (nota sin entrada o al revés), `posible-duplicado`, `alias-repetido`, `huerfano` — todos avisos, no bloquean |
| Cada cosa lleva la marca de su origen (sin marca / cita del alumno / ampliación / conocimiento general) | Solo skill/AGENTS.md (regla 2). Ninguna herramienta comprueba callouts de origen |
| Nunca inventar contenido del curso (`**TODO:**` / `⚠️ FALTA INFO:`) | Skill/AGENTS.md (regla 3); el código solo **hace visible** lo pendiente: `comprobarPendientes` (aviso) y `generados.js#pendientes()` en `estudio/pendientes.md` |
| Ningún marcador de duda se borra sin responderlo | Solo skill/AGENTS.md (regla 4) |
| `estudio/progreso.md` solo cambia con respuestas del alumno, nunca al procesar una sesión | **Código**: no está en la lista de lo que `regenerarGenerados()` escribe (`vault.js#FICHEROS_VIVOS`) |
| El motor nunca toca `config/`, `estudio/` ni `README.md` | **Código**: `actualizar.js#validarMotor()` lanza una excepción si el `motor.json` nuevo lista algo bajo `RUTAS_PROTEGIDAS` |
| Las migraciones transforman, nunca borran contenido del alumno | Convención documentada en `migraciones/LEEME.md` y aplicada en `004-formulario-y-ejercicios-generados.js` (renombra en vez de sobrescribir si el contenido no coincide). **No hay test que lo verifique automáticamente**: lo vigila la revisión del PR |
| Un cambio de formato de datos siempre lleva migración | **Código + test**: `coherencia.test.js` falla si `version_datos` del motor no es igual al número de migración más alto |
| `.kit/adaptadores/<llm>.json` solo lo escribe el kit, tras validar una issue con datos reales | Convención (`ESTANDARES.md`); el código solo decide cuál gana si ambos existen (`leerAdaptador`) |
| Deshacer lo último = `git revert` del commit, nunca reescribir historia subida | Solo skill/AGENTS.md (regla 6) |

## 7. Ciclos

**Instalación** (`.kit/guias/INSTALAR-AGENTE.md`, tabla de 10 pasos): 1) Node/Git/`gh` · 2) sesión de
`gh` con la cuenta invitada · 3) crear el curso desde la plantilla · 4) identidad de git local ·
5) `preparar-curso.js` (curso limpio + `ajustes.json`) · 6) `instalar-skills.js` · 7) `crear-atajo.js` ·
8) `diagnostico.js` hasta "Todo listo" (repasa 1-7 de un tirón) · 9) `obsidian.js` + abrir `estudio/` como
bóveda · 10) cerrar, reabrir con el atajo y decir "empezamos" (skill `/configurar`).

**Arranque de sesión** (plan 0.22, tutoría y preparación; `AGENTS.md`, "Al empezar cada sesión"): saludo desde
`config/diario.md` → `actualizar.js --comprobar` en silencio → `estado.js --json` da el caso sugerido (1
estudiar lo ya preparado, 2 al día con material nuevo, 3 atrasado con material nuevo) y, si la hay, una
preparación en segundo plano terminada sin juntar o interrumpida, que se resuelve primero → el profesor lo
confirma con el alumno, nunca lo impone, y ofrece el calentamiento (dos preguntas) en los casos 1 y 3, y en
el 2 si el alumno se queda mientras se prepara la clase.

**Una clase**: el alumno deja material en `estudio/inbox/` → skill `/sesion` escribe las notas →
`organizar.js` si hay `config/estructura.json` → `comprobar.js` → `guardar.js` (regenera, comprueba de
nuevo, commit y push).

**Actualización**: PR → merge a `main` → `release.yml` publica `vX.Y.Z` (ver más abajo) → el alumno pide
"actualiza el kit" (o se lo avisa `actualizar.js --comprobar` al abrir sesión) → skill `/actualizar` →
`actualizar.js` descarga la última release con `gh`, guarda primero lo que hubiera sin guardar (para tener
un punto exacto al que volver), sustituye los ficheros del motor (fusionando `.gitignore`), aplica las
migraciones pendientes, reinstala skills y vuelve a comprobar. **Vuelta atrás automática**: si tras
actualizar hay más errores que antes, `restaurar()` deja el curso exactamente en el commit previo
(`git read-tree --empty` + `reset --hard` + `clean -fd`, para que git reescriba todo por contenido y no se
fíe de fechas/tamaños) y reinstala las skills viejas.

**Publicación** (`CONTRIBUTING.md`): rama desde `main` → tests en local (hook `pre-push`) → PR → CI
(`tests.yml`: Linux + Windows, Node 24, cobertura ≥80 %) → check `tests-ok` obligatorio → merge a `main`
→ si `.kit/VERSION` cambió, `release.yml` crea la etiqueta `vX.Y.Z` con las notas de esa versión del
CHANGELOG (`.github/release-notas.js`). `actualizar.js` **solo** descarga releases publicadas, nunca
`main` a secas: hasta que la release existe, ningún curso ve la versión nueva.

## 8. Multi-LLM

El adaptador de un LLM tiene cinco campos obligatorios (`comando`, `skills`, `puente`, `permisos`,
`probado`) y hasta dos opcionales (`modelo_recomendado`, `segundo_plano`) y vive en
`.kit/adaptadores/<llm>.json` (motor: solo lo escribimos nosotros, tras validar una issue con datos
reales) o en `config/adaptador-llm.json` (datos del curso: lo escribe el propio curso cuando su LLM no
tiene el del kit, y manda si existen los dos). `vault.js#leerAdaptador()` es el único punto de lectura;
lo usan `instalar-skills.js`, `crear-atajo.js` y `diagnostico.js`. Hoy `claude-code` y `codex` tienen
adaptador de kit (`codex-cli` — el nombre que anuncia `codex --version` — es alias de `codex` en
`leerAdaptador()`, para los cursos que ya tenían ese `llm`).

`modelo_recomendado` (`{ modelo, por_que, comprobado }`) es opcional: un adaptador puede existir sin él
si aún no se ha comparado qué modelo conviene con ese asistente (issue #33; caso de `codex`, hoy). Cuando
existe, tiene que coincidir con su fila de `.kit/adaptadores/LEEME.md` (un test lo comprueba); cuando no
existe, esa fila lleva "— (sin comparar)". `segundo_plano` (lista de argumentos con `{prompt}`/`{modelo}`,
sin el `comando`) dice si ese asistente puede trabajar sin conversación: sin él, `preparar.js --lanzar`
se niega. `.kit/adaptadores/LEEME.md` lleva una columna "Segundo plano" que también comprueba
`adaptadores.test.js`.

Un asistente sin comodín para permisos (Codex, por ejemplo: una regla por herramienta, en un fichero de
usuario fuera del curso) no es una carencia del adaptador — es el propio campo `permisos.formato`
contándolo, y `.kit/ESTANDARES.md` lo documenta como ejemplo. Un entorno restringido (sandbox) puede
seguir pidiendo autorización para ejecutar o escribir aunque el alumno ya confíe en la carpeta:
`lib/arranque.js` y las herramientas que lanzan `git`/`gh`/`node` (`lib/proceso.js`) distinguen ese caso
(`EACCES`/`EPERM`/`EIO`) y el de un comando inexistente (`ENOENT`) de un fallo real del kit, y no piden
abrir una issue por ellos.

Si el LLM no tiene adaptador de kit, `.kit/ESTANDARES.md` dice qué hacer: comprobar en su documentación
oficial (nunca inventar), escribir `config/adaptador-llm.json`, instalar skills, crear el atajo, verificar
con `diagnostico.js` (que, si el curso conserva la nota vieja `config/adaptacion-llm.md` sin el JSON
nuevo, lo dice en el aviso de skills), y **proponer devolverlo al kit** con `issue.js --titulo "[adaptador]
<id>"` — así el adaptador vuelve al motor y el siguiente alumno con ese mismo LLM no tiene que montarlo de
cero. Sin adaptador ni `--destino` explícito, `instalar-skills.js` se niega a instalar en `.claude/skills`
para un LLM que no es `claude-code` (issue #33): copiar ahí sin adaptador sería un error silencioso.

## 9. Tests

`.kit/herramientas/tests/*.test.js`, con el runner nativo de Node (`node --test`, sin framework externo).
`tests/ayuda.js` da `temporal()` (carpeta temporal que se borra sola al terminar el proceso, incluidas las
que un test renombró a partir de ella) y `cursoTemporal()` (un curso mínimo ya "guardado" una vez, listo
para modificar en el test). Regla del repo (`CONTRIBUTING.md`): **ningún test usa `fs.mkdtempSync` directo
ni toca la carpeta personal real** — siempre `temporal()`, o una `casa`/`ejecutarPs` falsas si el test
toca el perfil de la shell o el `PATH`.

**Tests de coherencia** (documentación y código no se pueden desincronizar sin que algo falle):

- `coherencia.test.js` — `version_datos` del motor = migración más alta; cada migración cumple su
  contrato (`descripcion` + `migrar()`); la versión del CHANGELOG coincide con `VERSION`.
- `coherencia-skills.test.js` — toda herramienta, plantilla o fichero de `config/` que nombran las skills
  y las guías **existe de verdad**; todo permiso de `.claude/settings.json` corresponde a una herramienta
  real y toda herramienta tiene su permiso; cada skill cita `guardar.js` (nada se queda sin guardar);
  `estudio/inicio.md` sale de `lib/indice.js` como dice `AGENTS.md`; toda propiedad de frontmatter que
  citan las skills la lee alguna herramienta; la oferta "Si ya tenías tu curso" del CHANGELOG usa la
  etiqueta que busca `/actualizar`.
- `kit-limpio.test.js` — el propio repo, pasado por `comprobar()`, sale sin errores ni avisos.
- `generico.test.js` — nada específico de un curso concreto (nombres, empresa, moneda) se ha colado en el
  motor.
- `escalado.test.js` — cada skill de trabajo cierra con "Del kit: nada" (el hueco para escalar está
  siempre delante) y cada herramienta arranca por `lib/arranque.js`.
- `extremo-a-extremo.test.js` — una instalación entera lanzando cada herramienta como proceso real,
  incluido el lanzador `.cmd` en Windows.
- `preparar.test.js` — `preparar.js` con un **asistente de mentira** (`tests/asistente-de-mentira.js`,
  que escribe una nota y llama a `guardar.js`, en vez de un LLM de verdad) sobre un curso real: motor de
  la copia de trabajo actual + `preparar-curso.js`, con git de verdad — hace falta para probar `git
  worktree`, una rama nueva y un `merge` con choques de verdad, que `cursoTemporal()` no puede (no tiene
  historia de git). Lanzar, una sola preparación a la vez, los cuatro estados (incluida `interrumpida`
  con un pid muerto), juntar sin choques, con `config/diario.md` y los generados en conflicto (se
  resuelven solos), un choque real (aborta sin tocar el curso principal), y el fallo del asistente.

El resto son unitarios por fichero (`vault.test.js`, `indice.test.js`, `generados.test.js`,
`organizar.test.js`, `actualizar.test.js`, `guardar.test.js`, `comprobar-estructura.test.js`,
`comprobar-avisos.test.js`, `revisor-pedagogico.test.js`, `propiedades.test.js`, `secretos.test.js`,
`adaptadores.test.js`, `diagnostico.test.js`, `crear-atajo.test.js`, `instalar-skills.test.js`,
`reparar.test.js`, `issue.test.js`, `obsidian.test.js`, `release-notas.test.js`, `cli.test.js`).

**CI** (`.github/workflows/tests.yml`): un job matricial en Linux y Windows con Node 24; falla si algún
test falla o si la cobertura de `.kit/herramientas/**` baja del 80 % (líneas, funciones y ramas); el lint
(`eslint .`) corre una sola vez, en el job de Linux; `tests-ok` agrega toda la matriz y es el check
obligatorio de la rama `main`. **Hook local** (`.githooks/pre-push`, se activa con
`git config core.hooksPath .githooks`): rechaza el push directo a `main` y no sube nada con los tests en
rojo — es la segunda barrera, la que no depende de que GitHub aplique la protección de rama (en un repo
privado del plan gratuito, GitHub deja crearla pero no la aplica). Saltable a propósito con
`PERMITIR_PUSH_A_MAIN=1` / `SALTAR_TESTS=1`. El checkout del job de Linux usa `fetch-depth: 0` (con
etiquetas): lo necesitan `cambio-grande.js` (comparar con la rama base) y `prueba-actualizar.js`
(reconstruir una versión antigua del kit con `git archive`).

**La prueba real del profesor** (`pruebas/`, fuera de `.kit/`: `preparar-curso.js` la borra al crear un
curso, igual que `docs/` o `.github/`) es la única pieza que comprueba **calidad pedagógica**, no solo
código — y por eso es la única que usa un LLM de verdad y nunca corre en el CI:

- `pruebas/curso-ejemplo/` — un curso inventado y corto ("Finanzas personales para empezar", 2 módulos,
  3 clases, con fórmulas en unas y sin ellas en otras, y desorden real de alumno: una cifra que no cuadra
  entre dos ficheros de la misma clase, una diapositiva con solo título, jerga sin explicar) con su
  `config/` ya configurado (como lo dejaría `/configurar`) y valores **no por defecto** a propósito
  (lente activada, marcador de dudas distinto, `flashcards_por_sesion` fijo, `estructura.json` con
  submódulos, `patrones_prohibidos`): así la prueba real ejercita rutas que un curso recién instalado no
  toca. `clases.json` y `alumno/respuestas-examen.md` son metadatos del ejecutor (qué clases procesar y en
  qué orden, cómo "contestar" el examen), no datos del curso.
- `pruebas/lib/montaje.js` monta, en una carpeta temporal autolimpiable, un curso de verdad: el motor de
  la copia de trabajo actual + `preparar-curso.js --subir no` + los datos de `curso-ejemplo/` encima +
  `git init` + `instalar-skills.js`. Lo comparten `prueba-real.js` y `prueba-actualizar.js`.
- `pruebas/prueba-real.js` (`npm run prueba-real`) monta el curso y lanza `claude -p` (una sesión nueva
  por paso) por las cinco skills de trabajo en orden, simulando al alumno entre medias (dudas, casilla
  "a su manera", respuestas de examen). Las clases del módulo del examen se procesan en primer plano; la
  que no hace falta para ese examen se lanza con `preparar.js --lanzar` en segundo plano justo antes de
  `/dudas`, sigue corriendo durante `/ejercicio` y el examen, y se junta con `--juntar` en cuanto el
  examen está corregido — el caso de verdad con choques posibles (plan 0.22, §4). Guarda el resultado en
  `curso-ejemplo/resultado/` (estudio, `config/alumno.md` y `RESUMEN.md`) y borra siempre la temporal.
  `--sin-llm` monta y prueba el propio ejecutor sin gastar cuota (también se salta el `--lanzar`: nunca
  llama a `claude`) — es lo único que corren los tests del repo y el CI nunca la lanza con un LLM de
  verdad. Ver CONTRIBUTING.md, "Prueba real del profesor", para cuándo es obligatoria.
- `pruebas/prueba-actualizar.js` (`npm run prueba-actualizar`) no usa ningún LLM —es mecánica de ficheros
  y de `actualizar.js`—, así que sí corre en el CI en cada PR: reconstruye, con `git archive
  v<versión>` (o la release anterior disponible), el curso tal como quedó en `resultado/`, y comprueba
  que `actualizar.js --aplicar --origen <copia de trabajo actual>` lo deja al día sin perder nada del
  alumno ni dejar las skills desactualizadas.
- `.github/cambio-grande.js` compara los ficheros del PR con la rama base y falla si toca
  `.kit/skills/`, `AGENTS.md` o `.kit/plantillas/` sin traer `resultado/RESUMEN.md` actualizado.

## 10. Dónde tocar para…

| Quiero… | Toco | Y además actualizo |
|---|---|---|
| Añadir una regla a `comprobar.js` | Una función `comprobarX()` en `.kit/herramientas/comprobar.js` + llamarla dentro de `comprobar()` | Un test (`comprobar-estructura.test.js`, `comprobar-avisos.test.js` o `revisor-pedagogico.test.js` según el tipo); si la regla nace de una regla de `AGENTS.md`, esa sección del fichero |
| Añadir una skill | Carpeta nueva en `.kit/skills/<nombre>/SKILL.md`, que cite `guardar.js` al terminar | Permiso en `.claude/settings.json` por cada herramienta nueva que llame; mención en `AGENTS.md` si cambia el flujo de trabajo; `coherencia-skills.test.js` valida sola que lo que nombra existe |
| Añadir un fichero que genera `guardar.js` | Una función `markdownX()` en `lib/generados.js` (o `lib/indice.js` si es navegación) + su llamada en `regenerarGenerados()` | Si tiene enlaces: añadirlo a `vault.js#GENERADOS_CON_ENLACES` o a `comprobar.js#BASENAMES_GENERADOS`; documentarlo en `AGENTS.md` ("qué genera `guardar.js`") |
| Cambiar el formato de un dato del alumno (frontmatter, ubicación de un fichero…) | Migración nueva en `.kit/herramientas/migraciones/NNN-descripcion.js` (transforma, nunca borra) | Subir `version_datos` en `.kit/motor.json`; test con un curso en el formato viejo; entrada en `.kit/CHANGELOG.md` (mayor si el alumno lo nota o tiene que actuar) |
| Añadir o actualizar un adaptador de LLM | `.kit/adaptadores/<id>.json` con los campos de `.kit/ESTANDARES.md` | Fila en `.kit/adaptadores/LEEME.md` con el mismo `modelo_recomendado` (un test exige que coincidan); solo tras validar una issue `[adaptador] <id>` con datos reales |
| Añadir o cambiar una herramienta CLI | `.kit/herramientas/<nombre>.js`, arrancando con `require('./lib/arranque').arrancar(cli, …)` | Permiso en `.claude/settings.json`; explicación en `AGENTS.md` o `.kit/guias/INSTALAR-AGENTE.md`; este fichero (sección 3) si cambia el mapa de herramientas |
| Publicar un cambio | `.kit/CHANGELOG.md` + subir `.kit/VERSION` | Ver `CONTRIBUTING.md` (PR → `tests-ok` → merge → `release.yml`); si el cambio no llega a un curso ya configurado, línea `**Si ya tenías tu curso:**` para que `/actualizar` la ofrezca |
| Cambiar cómo trabaja el profesor (una skill, `AGENTS.md`, una plantilla) | El fichero que toque, y luego `npm run prueba-real` en tu Mac | `pruebas/curso-ejemplo/resultado/RESUMEN.md` actualizado en el mismo PR: `cambio-grande.js` lo exige en el CI (ver CONTRIBUTING.md, "Prueba real del profesor") |
