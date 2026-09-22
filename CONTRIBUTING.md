# Cómo se cambia el kit

Lo que entra en `main` llega a **todos los cursos** con `/actualizar`. Por eso a `main` solo se
llega de una forma:

1. **Rama** desde `main` (`git checkout -b <tema>`).
2. **Tests en local** antes de subir: `node --test ".kit/herramientas/tests/*.test.js"`.
3. **Pull request.** Cada PR (y cada push) lanza el CI: todos los tests en Mac, Windows y Linux,
   con Node 22 y 24, y una **cobertura mínima del 80 %** de las herramientas.
4. **Merge solo con el check `tests-ok` en verde.** Compruébalo: `gh pr checks <número> --watch`.
   Un PR en rojo no se mezcla, tampoco "para arreglarlo luego": se arregla en la rama.
5. Si el alumno va a notar el cambio: una línea en `.kit/CHANGELOG.md`. Si cambia el formato de
   los datos: migración en `.kit/herramientas/migraciones/` (sin ella, el test de coherencia falla).

## Por qué hay un hook y no una regla de GitHub

El repo es privado y de plan gratuito: GitHub deja crear la regla de protección de `main`, pero
**no la aplica**. El bloqueo lo ponemos nosotros con `.githooks/pre-push`, que rechaza el push
directo a `main`. Se activa una vez por copia del repo:

    git config core.hooksPath .githooks

Es un seguro contra despistes, no una cárcel: el repo es nuestro y se puede saltar a propósito con
`PERMITIR_PUSH_A_MAIN=1`. Si algún día el repo pasa a GitHub Pro, se marca `tests-ok` como check
obligatorio en la regla de `main` y el hook pasa a ser la segunda barrera.

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
