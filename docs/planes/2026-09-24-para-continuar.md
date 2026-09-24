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

## Siguiente paso: confirmar Claudian en el curso de Windows

**Resuelto el 2026-09-23 (issue #36, release 0.22.1):**

- Claudian abre el asistente en `estudio/`. **Con Claude Code funciona**: busca `CLAUDE.md` y las skills en las
  carpetas superiores. Así lo usa Roberto en su curso, y de ahí salió la issue #35.
- **Codex busca `AGENTS.md` y `.agents/skills` solo hasta la raíz del git.** Sin git en el curso, o con un git propio
  en `estudio/`, no ve ni al profesor ni las skills. Probado con `codex debug prompt-input`.
- Las pruebas A (`systemPrompt`) y B (mover la bóveda) **sobran**: la estructura del kit sirve con los dos.
- En la 0.22.1, `diagnostico.js` avisa si la raíz del git no es la del curso. En la misma versión, la #35:
  `actualizar.js` ya no se corta en cursos grandes. Probado con una copia del curso de Roberto (0.18.0 → 0.22.1).

**Pendiente:**

1. En el curso de Windows: actualizar a la 0.22.1, pasar `diagnostico.js` y arreglar lo que diga. Lo más
   probable es que el curso no tenga git en la raíz. Después, probar Claudian con Codex: ¿saluda como el profesor?,
   ¿encuentra las skills?, ¿`guardar.js` funciona? Cerrar la #36 con lo que salga.
2. Actualizar el curso de Roberto a la 0.22.1 (con su profesor: `/actualizar`).

## Pendiente sin decidir: permisos al trabajar desde Obsidian

**Visto el 2026-09-23** al actualizar el curso de Roberto desde Claudian: decenas de peticiones de permiso parecidas.

- Claudian abre el asistente en `estudio/`. Claude Code, desde ahí, solo aplica `estudio/.claude/settings.json`: la
  lista de herramientas que el kit pone en la raíz no cuenta, y todo lo de fuera de `estudio/` (`config/`, `.kit/`)
  pregunta. El modo normal de Claudian es `acceptEdits`, así que las notas de `estudio/` no preguntaban.
- Los comandos improvisados (`python3`, `sed`, `cat`, `pdftotext`) preguntan siempre. Un comodín para ellos
  (`python3 *`) equivale a darle vía libre: descartado.
- Probado y válido **solo para Claude Code**: `estudio/.claude/settings.json` con `additionalDirectories: [".."]` y la
  lista de herramientas del kit → cero permisos pedidos.

**Decisión de Roberto:** no se hace un ajuste solo para Claude Code. Tiene que ser igual para todos: el alumno
acepta una vez y el profesor puede editar todas sus notas y sesiones. Idea a pensar: que el profesor, cuando vea
que le piden demasiados permisos, delegue en "su servicio técnico", que lo configura para el entorno de ese
alumno (encaja con el campo `permisos` del adaptador de cada asistente, que hoy solo cubre la terminal).
Relacionado: menos comandos improvisados (`AGENTS.md` y P8, lectura de PPTX y Excel con una herramienta del kit).

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
