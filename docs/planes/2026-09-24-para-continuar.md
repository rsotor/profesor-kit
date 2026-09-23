# Para continuar · 2026-09-24

Estado al cerrar la sesión del 2026-09-23. Rama `mi-perfil-y-evolucion` (**solo en local, sin subir**), sobre
`main` en la v0.22.0.

## Texto para abrir la sesión nueva

> Seguimos con el profesor-kit (repo en ~/Documents/courses/profesor-kit, cuenta de GitHub rsotor, rama
> `mi-perfil-y-evolucion`). Lee `docs/planes/2026-09-24-para-continuar.md` y sigue desde "Siguiente paso".

## Qué se decidió ayer

| Tema | Decisión |
|---|---|
| P4 + E4 | Una sola hoja generada, `estudio/mi-perfil.md`, visible para el alumno. Señales en `estado.js --json` |
| Tono de `config/alumno.md` | Como una evaluación de verdad: sincera, clara, con su prueba, sobre lo que hizo y no sobre cómo es. Si no lo ha entendido, se dice. Sin fichero oculto |
| Alumno simulado (plan 0.22, 5b.4) | Entra en la misma versión (0.23.0): la prueba real hace falta de todas formas |
| P7 | Pasa a "examen final a medida": el profesor pide al alumno un ejemplo o las preguntas que tenga. Vale para cursos con examen oficial, internos o sin certificación |
| P8 | Hay que cubrir PDF, PPTX, fotos o capturas, Excel, audio o vídeo y documentos de texto |
| **Claudian** | **Imprescindible**: un alumno que no usa terminal no usaría el profesor sin él |

Todo está también en la sección 0 de `docs/auditoria/2026-09-23-auditoria-del-kit.md`.

## Siguiente paso: Claudian como profesor (antes que P4+E4)

**El problema.** En el curso de Windows con Codex, Claudian usa la bóveda (`estudio/`) como carpeta de trabajo, así
que no ve `AGENTS.md`, `config/` ni las skills: no es el profesor. Por diseño, `estudio/` es la bóveda para que
el alumno no pueda borrar el motor sin querer.

**Lo que ya se sabe** (del `main.js` de Claudian 2.3.3, la versión que fija el kit):

- La carpeta de trabajo es fija (la bóveda). No hay ningún ajuste para cambiarla.
- Hay tres ajustes que sirven: `systemPrompt` (un prompt propio), `allowExternalAccess` y
  `persistentExternalContextPaths` (carpetas de fuera de la bóveda que el asistente ve siempre).
- Según su README usa el asistente ya instalado (Claude Code o Codex) con la suscripción. La clave de API es
  solo una alternativa. Sin probar en la 2.3.3.

**Prueba A (primero, barata).** Sin mover la bóveda, en una copia de un curso:

1. Escribir a mano los ajustes de Claudian (`estudio/.obsidian/plugins/<id>/data.json`): acceso externo a la
   carpeta del curso y un prompt que diga "eres el profesor de este curso: lee `<ruta>/AGENTS.md` y síguelo;
   ejecuta las herramientas desde `<ruta>`".
2. Probar con Claude Code y con Codex: ¿saluda como el profesor?, ¿encuentra las skills?, ¿`guardar.js` funciona?,
   ¿procesa una clase?
3. Si funciona: `obsidian.js` escribe esos ajustes al instalar y al actualizar, Claudian viene activado y la guía
   del alumno lo explica.

**Prueba B (solo si A no basta).** La bóveda pasa a ser el curso entero. Funciona seguro, pero es una versión
mayor con migración (ajustes de Obsidian, reglas de "rutas relativas a `estudio/`", enlaces con carpeta) y deja
`config/` y `AGENTS.md` a la vista. Esa pérdida la decide Roberto, con la prueba delante.

**Mientras tanto**, en el curso de Windows: abrir el profesor con la palabra del atajo, en una terminal o en el
Terminal de Obsidian. El atajo hace `cd` a la carpeta del curso. Obsidian tiene que abrirse después de instalar
el atajo.

## Después: P4 + E4 y alumno simulado

- Especificación aprobada: `docs/planes/2026-09-23-mi-perfil-y-evolucion.md`.
- Plan de implementación **sin revisar**: `docs/planes/2026-09-23-mi-perfil-y-evolucion-plan.md` (8 tareas).
- Pendiente de Roberto:
  1. Revisar las seis desviaciones de la cabecera del plan.
  2. Elegir cómo se ejecuta. Recomendación: **Native** (todo en la sesión, revisor al final).
- Pequeño añadido para la 0.23.0 si Roberto dice que sí: la guía del alumno explica cómo hablar con el profesor
  dentro de Obsidian (lo que salga de la prueba de Claudian).

## Otros pendientes

- P5 (duplicados por significado), P6 (consolidar al cerrar un módulo; espera al primer módulo real).
- P7 y P8, con las decisiones de arriba.
- E1 a E3 y E5 a E9 sin revisar.
