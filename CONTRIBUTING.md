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
6. **Tras mezclar, comprueba que la release existe.** El workflow `release.yml` se lanza en cada merge a
   `main` que cambie `.kit/VERSION`: crea la etiqueta `vX.Y.Z` y la release con la sección de esa versión del
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
| Auditorías | `docs/auditoria/` (una por fecha: estado, hallazgos y propuestas) | Se escribe una nueva; las anteriores no se editan |

Regla: **si un PR añade o cambia una herramienta, una skill o un paso, toca la fuente viva de cada audiencia
afectada en el mismo PR.** El CI lo vigila en parte (`coherencia-skills.test.js`): toda herramienta tiene que
estar explicada en `AGENTS.md` o en `INSTALAR-AGENTE.md`, toda plantilla tiene que usarla alguna skill, y
lo que las skills citan tiene que existir. Lo que el CI no ve —que la explicación sea buena— lo ve la
revisión del PR.

Lo que solo es del repo del kit (`docs/`, `.github/`, `.githooks/`, este fichero, `package.json`) lo borra
`preparar-curso.js` al crear un curso.

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
