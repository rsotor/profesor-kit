# Cómo se cambia el kit

Lo que entra en `main` llega a **todos los cursos** con `/actualizar`. Por eso a `main` solo se
llega de una forma:

1. **Rama** desde `main` (`git checkout -b <tema>`).
2. **Tests en local** antes de subir: `node --test ".kit/herramientas/tests/*.test.js"`.
3. **Pull request.** Cada PR lanza el CI: todos los tests en Linux (Node 22 y 24) y Windows (Node 24), y una
   **cobertura mínima del 80 %** de las herramientas. Mac no está en el CI a propósito (cuesta 10 minutos
   facturables por minuto; el plan da 2.000 al mes): los tests corren en tu Mac en el hook de pre-push.
   Un push nuevo cancela el run anterior de la misma rama.
4. **Merge solo con el check `tests-ok` en verde.** Compruébalo: `gh pr checks <número> --watch`.
   Un PR en rojo no se mezcla, tampoco "para arreglarlo luego": se arregla en la rama.
5. Si el alumno va a notar el cambio: una línea en `.kit/CHANGELOG.md`. Si cambia el formato de
   los datos: migración en `.kit/herramientas/migraciones/` (sin ella, el test de coherencia falla).
6. **Toda mejora de la que un alumno antiguo se pueda beneficiar le tiene que llegar.** Si el cambio vive en un
   sitio por el que un curso ya configurado no vuelve a pasar (la sesión 0, una plantilla que solo se copia al
   configurar…), la entrada del CHANGELOG lleva una línea `- **Si ya tenías tu curso:** <qué te ofrece tu
   profesor>`. `/actualizar` la lee y se lo ofrece al alumno tras actualizar; él puede decir que no. Si no
   se le puede ofrecer (porque hace falta cambiar sus datos sí o sí), no es una oferta: es una migración.

## Por qué hay un hook y no una regla de GitHub

El repo es privado y de plan gratuito: GitHub deja crear la regla de protección de `main`, pero
**no la aplica**. El bloqueo lo ponemos nosotros con `.githooks/pre-push`, que rechaza el push
directo a `main`. Se activa una vez por copia del repo:

    git config core.hooksPath .githooks

Es un seguro contra despistes, no una cárcel: el repo es nuestro y se puede saltar a propósito con
`PERMITIR_PUSH_A_MAIN=1`. Si algún día el repo pasa a GitHub Pro, se marca `tests-ok` como check
obligatorio en la regla de `main` y el hook pasa a ser la segunda barrera.

## Documentación viva: quién es la fuente de verdad de qué

| Para quién | Fuente viva | Quién la mantiene |
|---|---|---|
| El alumno | `estudio/como-usar-tu-profesor.md` (hoja) y `README.md` del curso (portada) | El profesor: la hoja al configurar; la portada, "Estado" lo escribe `guardar.js` solo |
| El profesor (el LLM) | `AGENTS.md` y `.kit/skills/*/SKILL.md`; `.kit/guias/INSTALAR-AGENTE.md` al instalar; `.kit/ESTANDARES.md` si no es Claude Code | Nosotros, en cada PR que cambie comportamiento |
| Quien instala | `.kit/guias/INSTALACION.md` | Nosotros |
| Nosotros | este fichero y `.kit/CHANGELOG.md` | Nosotros, en cada PR |
| Historia | `docs/superpowers/` (spec y plan) | Nadie: son el diseño inicial y el plan de la fase 1, y se leen como tales |

Regla: **si un PR añade o cambia una herramienta, una skill o un paso, toca la fuente viva de cada audiencia
afectada en el mismo PR.** El CI lo vigila en parte (`coherencia-skills.test.js`): toda herramienta tiene que
estar explicada en `AGENTS.md` o en `INSTALAR-AGENTE.md`, toda plantilla tiene que usarla alguna skill, y
lo que las skills citan tiene que existir. Lo que el CI no ve —que la explicación sea buena— lo ve la
revisión del PR.

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
