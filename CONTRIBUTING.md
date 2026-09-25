# Cómo se cambia el kit

Lo que se publica llega a **todos los cursos** con `/actualizar`. Por eso a `main` solo se llega de una
forma, y de `main` solo sale lo que se publica como release:

1. **Rama** desde `main` (`git checkout -b <tema>`).
2. **Tests en local** antes de subir: `npm test` (o `node --test ".kit/herramientas/tests/*.test.js"`). El hook
   de pre-push los lanza solo; se activa una vez por copia del repo: `git config core.hooksPath .githooks`.
3. **Pull request.** Cada PR lanza el CI: todos los tests en Linux (hace de Mac; Linux no se soporta) y Windows, con Node 24, y una
   **cobertura mínima del 80 %** de las herramientas. Mac no está en el CI a propósito (cuesta 10 minutos
   facturables por minuto): los tests corren en tu Mac en el hook de pre-push. Un push nuevo cancela el run
   anterior de la misma rama.
4. **Merge solo con el check `tests-ok` en verde.** Compruébalo: `gh pr checks <número> --watch`.
   Un PR en rojo no se mezcla, tampoco "para arreglarlo luego": se arregla en la rama.
5. **Si el alumno va a notar el cambio:** una línea en `.kit/CHANGELOG.md` **y `.kit/VERSION` subido** (ver
   Versiones). Si cambia el formato de los datos: migración en `.kit/herramientas/migraciones/` (sin ella,
   el test de coherencia falla).
6. **Tras mezclar, comprueba que la release existe.** El workflow `release.yml` se lanza cuando los tests de
   `main` terminan en verde tras un merge, y publica ese mismo commit si `.kit/VERSION` tiene una versión sin
   release (tarda lo que tarden los tests, unos minutos): crea la etiqueta `vX.Y.Z` y la release con la sección de esa versión del
   CHANGELOG. `actualizar.js` descarga **la última release**, nunca `main`: hasta que la release existe, los
   cursos no ven la versión nueva. Compruébalo con `gh release list`. Si Actions no la creó (sin minutos, un
   fallo), hazlo a mano desde `main` actualizada:

       node .github/release-notas.js $(cat .kit/VERSION) > /tmp/notas.md
       gh release create v$(cat .kit/VERSION) --title v$(cat .kit/VERSION) --notes-file /tmp/notas.md

   Un merge que no sube `.kit/VERSION` no publica nada: se acumula para la siguiente versión.
7. **Toda mejora de la que un alumno antiguo se pueda beneficiar le tiene que llegar.** Si el cambio vive en un
   sitio por el que un curso ya configurado no vuelve a pasar (la sesión 0, una plantilla que solo se copia al
   configurar…), la entrada del CHANGELOG lleva una línea `- **Si ya tenías tu curso:** <qué te ofrece tu
   profesor>`. `/actualizar` la lee y se lo ofrece al alumno tras actualizar; él puede decir que no. Si no
   se le puede ofrecer (porque hace falta cambiar sus datos sí o sí), no es una oferta: es una migración.

## Tests: nada se queda en el disco

Toda carpeta temporal de un test se crea con `temporal()` o `cursoTemporal()` de `tests/ayuda.js`, que la borran
al terminar (también si el test la renombra a `<carpeta>-algo`). Nunca `fs.mkdtempSync` directo. Un test tampoco
escribe en la carpeta personal real: si toca el perfil de la shell o el PATH, recibe una `casa` temporal o una
función falsa (`ejecutarPs`).


**Ni se escapa al repo del kit.** Dentro de un hook, git fija `GIT_DIR` y otras variables apuntando al repo; si
un test las hereda, sus `git commit`, `git config` o `reset` escriben en el repo del kit y no en su temporal
(pasó el 2026-09-23: commits de prueba en una rama, `core.bare=true`, identidad `Test` y el remoto cambiado).
`tests/ayuda.js` y `.githooks/pre-push` las quitan (`git rev-parse --local-env-vars`). Un test nuevo que lance
git sin pasar por `ayuda.js` tiene que hacer lo mismo.
## Prueba real del profesor

Los tests de `.kit/herramientas/tests/` comprueban el código. Nadie comprueba con ellos si una skill
**explica bien**, si un examen sale razonable o si `/dudas` de verdad resuelve lo que el alumno dejó
anotado — eso solo lo ve un LLM de verdad trabajando en un curso de verdad. Para eso está la prueba real.

**Cuándo es obligatoria.** Si tu PR toca `.kit/skills/`, `AGENTS.md` o `.kit/plantillas/` (cualquier cosa
que cambie cómo trabaja el profesor, no cómo funciona una herramienta), tiene que traer
`pruebas/curso-ejemplo/resultado/RESUMEN.md` actualizado tras ejecutarla. El CI lo exige
(`.github/cambio-grande.js`, solo en `pull_request`): un PR que toque esas rutas sin ese fichero no
pasa. Tampoco pasa con un resumen de `--sin-llm`, ni con uno **anterior** al último commit que toca esas rutas:
si cambias una skill después de la prueba, hay que repetirla. Si tu cambio es solo de una herramienta
(`.kit/herramientas/`), no hace falta: lo cubren los tests y `npm run prueba-actualizar`.

**Cómo se lanza.** En tu Mac, con tu suscripción — **nunca en el CI** (gasta cuota de verdad):

    npm run prueba-real

Monta un curso de verdad (el motor de tu copia de trabajo + `pruebas/curso-ejemplo/`, un curso corto e
inventado — finanzas personales para empezar, con fórmulas en unas clases y sin ellas en otras, y algo
de desorden real de alumno) en una carpeta temporal, y le hace pasar, con `claude -p` en modo no
interactivo, por las cinco skills de trabajo en orden: `/sesion` de las clases del módulo del examen,
`preparar.js --lanzar` de la clase que no hace falta para ese examen (en segundo plano, justo antes de
`/dudas`), `/dudas` (tras simular que el alumno dejó dos dudas y marcó una casilla "a su manera"),
`/ejercicio`, `/examen` (generar, contestar y corregir: las respuestas las da un alumno simulado con el perfil de
`pruebas/curso-ejemplo/alumno/perfil.md`, sin ver las soluciones; la nota tiene que quedar entre 3 y 8), `preparar.js --juntar` de esa preparación y
`/repaso`. Es el caso de verdad con choques posibles del plan 0.22 (§4): dos ramas trabajando a la vez
sobre el mismo curso. Cada paso es una llamada a `claude` independiente (sesión nueva), y si uno falla o
no encuentra lo que esperaba, se anota como fallo de **ese** paso y la prueba sigue con los demás — nunca
revienta sin resumen. Al terminar, borra la carpeta temporal (también si algo falla) y sustituye
`pruebas/curso-ejemplo/resultado/` entero por: el `estudio/` que quedó (sin `.obsidian/` ni `inbox/`),
`config/alumno.md`, y `RESUMEN.md` (fecha, versión del kit, modelo, qué pasó en cada paso, los errores y
avisos de `comprobar.js` agrupados por regla —con ojo a `no-se-vera-bien` y los pedagógicos—, y cuánto
material salió). Revisa ese resumen a mano: es la parte que ningún test automático puede juzgar por ti.

Opciones: `--modelo <id>` para probar otro modelo que el recomendado del adaptador; `--limite-ms <n>`
para el tiempo máximo por llamada a `claude` (20 minutos por defecto). `--sin-llm` monta el curso y
prueba el propio ejecutor sin llamar a `claude`, en una carpeta temporal (nunca pisa el resultado de la
última prueba real): es lo que corre en los tests del repo (nunca cuesta
cuota), y lo único que **tú** deberías ejecutar salvo que quieras de verdad una prueba real.

**Con otro asistente que Claude Code** (issue #45): `--asistente <id>` (el id de `.kit/adaptadores/<id>.json`,
p. ej. `codex`) monta el curso con ese `llm` y lo lanza con `pruebas/lib/asistentes/<id>.js`. El resultado no
pisa el de Claude: va a `pruebas/curso-ejemplo/resultado-<id>-<sistema>/`. `--volcar <dir>` guarda el stream
crudo de cada llamada — obligatorio la primera vez que se mide un asistente nuevo, para poder revisar a mano
qué llegó de verdad. Con un asistente sin lanzador propio, el error lo dice: "la prueba no sabe lanzar
`<id>`: añade `pruebas/lib/asistentes/<id>.js`".

    npm run prueba-real -- --asistente codex --volcar /tmp/volcado-codex

**Si un paso falla a media prueba, no hace falta repetirla entera.** Tras cada paso se guarda una copia del
curso (y de lo que necesitan los siguientes) en una carpeta temporal `prueba-real-pasos-XXXX/`; si algo falla,
se queda ahí (con la ruta impresa) en vez de borrarse. `npm run prueba-real -- --desde "<paso>"` restaura la
copia del paso anterior y sigue desde ahí hasta el final, con el mismo orden y sin repetir los que ya salieron
bien (`--copias <carpeta>` para indicar cuál, si no es la más reciente del temporal). Si la clase en segundo
plano se había quedado a medias (el proceso de la ejecución anterior ya no existe), se relanza sola antes de
juntarla. El `RESUMEN.md` que deja marca los pasos de antes como "de la ejecución anterior" y, aunque todo
salga bien, **no cuenta como prueba real completa para el PR** (`cambio-grande.js` lo rechaza): hace falta una
`npm run prueba-real` entera y seguida.

**Cuánto tarda y cuánto gasta.** Primera ejecución (2026-09-23, kit 0.21.0, Sonnet): **unos 49 minutos** en total.
Cada clase, entre 10 y 12 minutos; dudas, ejercicio, examen y repaso, entre 1,5 y 5 minutos cada uno. Son unas
ocho sesiones seguidas del asistente con tu suscripción: lánzala cuando no vayas a necesitar la cuota.

Aparte, `npm run prueba-actualizar` comprueba que **la release anterior** (la más alta por debajo de
`.kit/VERSION`) se actualiza sin perder nada a la copia de trabajo actual. El curso de partida sale entero de esa
etiqueta: su motor y el curso que dejó su prueba real (`pruebas/curso-ejemplo/resultado/` tal como estaba en ella).
Compara por contenido: sin migraciones, ninguna nota del alumno cambia; con ellas, ninguna encoge; el diario solo
crece y los ajustes no pierden claves (los ficheros que regenera `guardar.js` solo tienen que seguir ahí). No usa
ningún LLM —es mecánica de ficheros y de `actualizar.js`—, así que **sí** corre en el CI, en cada PR.

Es la garantía de que **actualizar va en secuencia**: `actualizar.js --aplicar` nunca salta versiones, aplica la
siguiente release y deja seguir al `actualizar.js` recién instalado. Si cada release se prueba desde la anterior,
un alumno que va varias versiones atrás pasa por pasos probados, uno a uno. Por eso cada release tiene que llevar
su `resultado/`: es el curso del que partirá la prueba de la siguiente.

## Las dos barreras de `main`

`main` tiene protección de rama en GitHub con el check `tests-ok` obligatorio (se aplica mientras el repo sea
público; en un repo privado del plan gratuito GitHub deja crearla pero **no la aplica**). El hook
`.githooks/pre-push` es la segunda barrera y la única que no depende de GitHub: rechaza el push directo a
`main` y no sube nada con los tests en rojo. Es un seguro contra despistes, no una cárcel: se salta a
propósito con `PERMITIR_PUSH_A_MAIN=1` o `SALTAR_TESTS=1`.

## Documentación viva: quién es la fuente de verdad de qué

| Para quién | Fuente viva | Quién la mantiene |
|---|---|---|
| El alumno | `estudio/como-usar-tu-profesor.md` (hoja) y `README.md` del curso (portada) | El profesor: la hoja al configurar; la portada, "Estado" lo escribe `guardar.js` solo |
| El profesor (el LLM) | `AGENTS.md` y `.kit/skills/*/SKILL.md`; `.kit/guias/INSTALAR-AGENTE.md` al instalar; `.kit/ESTANDARES.md` si no es Claude Code | Nosotros, en cada PR que cambie comportamiento |
| Quien instala | `.kit/guias/INSTALACION.md` | Nosotros |
| Nosotros | este fichero y `.kit/CHANGELOG.md` | Nosotros, en cada PR |
| Quien cambia el kit | `docs/arquitectura.md` | Nosotros, en cada PR que cambie la estructura |
| Auditorías | `docs/auditoria/` (una por fecha: estado, hallazgos y propuestas) | Se escribe una nueva; las anteriores no se editan |

Regla: **si un PR añade o cambia una herramienta, una skill o un paso, toca la fuente viva de cada audiencia
afectada en el mismo PR** — incluida `docs/arquitectura.md` si cambia el mapa de herramientas, el ciclo de
guardado o alguna invariante. El CI lo vigila en parte (`coherencia-skills.test.js`): toda herramienta tiene
que estar explicada en `AGENTS.md` o en `INSTALAR-AGENTE.md`, toda plantilla tiene que usarla alguna skill,
y lo que las skills citan tiene que existir. Lo que el CI no ve —que la explicación sea buena— lo ve la
revisión del PR.

Lo que solo es del repo del kit (`docs/`, `.github/`, `.githooks/`, `pruebas/`, este fichero,
`package.json`) lo borra `preparar-curso.js` al crear un curso.

## Versiones

`0.x` mientras el kit esté en pruebas. `1.0.0` solo cuando se valide que sustituye al curso con el que
nació. A partir de la `1.0.0`, la regla es **qué le pasa al alumno**, no cuánto código cambió:

- **Mayor (`X.0.0`)** si cambia el formato de los datos (`version_datos` sube, hay migración) **o** el alumno
  tiene que hacer o decidir algo tras actualizar (una estructura nueva, reinstalar, un paso manual). El
  CHANGELOG de una mayor lleva un apartado *Qué tienes que hacer*.
- **Menor (`x.Y.0`)** si hay algo nuevo y actualizar no pide nada.
- **Parche (`x.y.Z`)** si solo se arregla algo.

`actualizar.js` aplica las migraciones solo; lo que hace mayor a una versión es que el alumno **note** el
cambio o tenga que intervenir.

## Código de terceros que el kit descarga

Los complementos de Obsidian (`.kit/herramientas/lib/obsidian.js`) van fijados a una versión y a un sha256 por
fichero. Para subir uno: cambia `version`, recalcula los hashes (`shasum -a 256` de cada fichero de esa
release) y una línea en el CHANGELOG. Sin hash correcto no se instala nada.
