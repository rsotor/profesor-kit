# Para continuar · 2026-09-25

Cierre de la sesión del 2026-09-24. Rama **`mi-perfil-y-evolucion`** (solo en local, sin subir), sobre `main` en la
**v0.22.3**. Fuente única de lo pendiente: `docs/planes/2026-09-24-plan-de-accion.md`. Página del plan para Roberto:
https://claude.ai/artifact/5bNRiKXX6e6UbyFyRHYzvC

## Texto para abrir la sesión nueva

> Seguimos con el profesor-kit (repo en ~/Documents/courses/profesor-kit, cuenta de GitHub rsotor, rama
> `mi-perfil-y-evolucion`). Lee `docs/planes/2026-09-25-para-continuar.md` y sigue desde "Siguiente paso".

## Lo hecho el 2026-09-24

- **Publicadas:** 0.22.1 (#35), 0.22.2 (seguridad: #38, H01, H02, H03, H07, H10) y 0.22.3 (segundo plano: H04, H05,
  H06). #36 cerrada (validada en Windows).
- **0.23.0 programada** en esta rama (423 tests en verde): mi perfil y señales, alumno simulado, la prueba real mide la
  corrección, barrera de PR estricta, el material no da órdenes, avisos que crecen, "si algo tarda", "test" en vez
  de "parcial", exámenes que miden entender y distinguir (petición de Roberto), arreglos de la revisión
  independiente, `dudas.js`. Detalle: `docs/planes/2026-09-24-plan-de-accion.md`, sección 5.
- **Diseño de permisos (0.24.0)** decidido y probado en el Mac con Claude Code (de 5 peticiones a 0 desde Obsidian):
  `docs/planes/2026-09-24-permisos-diseno.md`. Windows con Codex: issue #42, pendiente de respuesta.
- **Diagnóstico de skills y AGENTS.md:** `docs/auditoria/2026-09-24-diagnostico-skills.md`.

## El problema que se repite (leer antes de nada)

Tres pruebas reales: 11/12, 7/12 y 8/12. **La corrección salió 6/6 las tres veces**; lo que falla es siempre lo mismo:
**el profesor hace a mano, con comandos de shell, cosas que deberían ser herramientas del kit o sus herramientas de
ficheros**:

- escribir el examen, el repaso o la línea "en curso" del diario con `cat >` / `echo >>` → en la prueba (sin nadie
  que apruebe) se deniega y el paso se queda sin hacer; un alumno de verdad vería una petición de permiso tras otra;
- subir el contador del registro de dudas con un reemplazo en todo el fichero → **rompió `config/alumno.md`**
  (filas en tablas que no eran, registro vacío), y mi-perfil lo habría enseñado al alumno.

Se arreglaron síntomas uno a uno (la prueba ya pasa las reglas del curso y un entorno de alumno; `dudas.js` existe).
**La causa no está arreglada.** Es el punto 4 y 14 del diagnóstico, y es también lo que pide el diseño de permisos.

## Hecho después (2026-09-24, tarde)

- **Paso 1 hecho** (`b5056f1`): regla de `AGENTS.md` (ficheros con las herramientas de ficheros, nunca con shell),
  `guardar.js --empezar`, `/dudas` con `dudas.js`, la contradicción de `progreso.md`, y la prueba real con
  `--output-format json` y la sección "Permisos denegados".
- **Prueba real: 12/12 · corrección 6/6** (`c09e610`), ≈ 17 min de pasos (el "≈1 h" de abajo era de antes de la
  0.22; la preparación en segundo plano gasta cuota aparte). PR de la 0.23.0 abierto; la release, tras revisarlo Roberto.
- **Quedan 4 permisos denegados → 0.24.0:** 3 al verificar el JS de un ejercicio (`sed … > /tmp/ej.js && node
  --check`: hace falta una herramienta que lo verifique, es el punto "verificar ejercicios") y 1 `open` del repaso.
  Además, el profesor encadena `guardar.js --empezar … ; sed …` en un comando: al denegarse, la línea "en curso"
  tampoco se escribe. Regla para `AGENTS.md`: cada herramienta del kit en su propio comando, sin encadenar.

## Siguiente paso: atacar la causa, y después una sola prueba real

1. **Decidir con Roberto el alcance** (propuesta): meter en la 0.23.0 el mínimo que quita la causa, sin esperar a la
   0.24.0:
   - `AGENTS.md`: una regla corta — crear y editar ficheros con las herramientas de ficheros del asistente, nunca con
     comandos de shell (`cat >`, `echo >>`, `sed -i`, `python`); cada comando pide permiso y sin nadie delante se
     deniega.
   - `/dudas`: usar `node .kit/herramientas/dudas.js <concepto> --prueba "<fichero>"` en vez de editar la tabla.
   - La línea "en curso" del diario: `guardar.js --empezar "<qué>"` (herramienta nueva, pequeña) en vez de pedir al
     profesor que la escriba.
   - `AGENTS.md:166` (contradicción de `progreso.md`): "al procesar solo se añaden filas en ⬜".
   - La prueba real apunta qué se denegó (`--output-format json` → `permission_denials`) para no tener que adivinarlo.
2. Tests, y **una sola prueba real** (≈1 h de cuota, con el sí de Roberto). Si da 12/12: guardar el resultado, PR,
   release v0.23.0.
3. Lo demás del diagnóstico (leer PDF/Excel, verificar ejercicios, `examen.js --registrar`, tamaño de AGENTS.md,
   disparadores) y los permisos: 0.24.0, como está en el plan.

## Estado del repo

- Rama `mi-perfil-y-evolucion`, todo guardado salvo `pruebas/curso-ejemplo/resultado/` (resultado de la última prueba
  real, 8/12: **no guardarlo**, se sustituye con la siguiente).
- `.kit/VERSION` = 0.23.0, CHANGELOG escrito. Falta en el CHANGELOG lo que entre en el paso 1.
