# Ficha del proyecto: profesor-kit

Mapa de una página para entender el proyecto sin leerlo entero. No es la fuente de verdad: lo que importe se
comprueba en el código. Se actualiza cuando cambian las rutas clave de abajo.

**Última actualización:** 2026-10-05

## Qué hace

Kit público para montar un profesor particular de un curso concreto dentro del ordenador del alumno: convierte sus
apuntes en notas de estudio, ejercicios, exámenes y flashcards (en Obsidian), resuelve dudas y sigue su progreso.
Lo específico de cada curso sale de una configuración al instalar.

## Cómo funciona

- **Motor y datos:** `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` y `.kit/` son el motor (no se editan en un
  curso; los reemplaza `/actualizar`); `config/` y `estudio/` son los datos del alumno.
- **Un curso nace del repo:** `preparar-curso.js` borra lo que solo es del kit (`SOLO_DEL_KIT`) y deja la portada del
  curso. Después, `actualizar.js` trae la última release, nunca `main`.
- **Agentes:** Claude Code y Codex, con un adaptador por agente (`.kit/adaptadores/`).
- **Desarrollo:** rama → PR con título `tipo: …` o `X.Y.Z: …` → CI en Mac, Windows y Linux con el check `tests-ok`
  → squash. Publicar = subir `.kit/VERSION`; `release.yml` crea la release. Tests: `npm test`; antes de cada release,
  `npm run prueba-real`.

## Depende de / lo usan

- **Depende de:** Claude Code o Codex en el ordenador del alumno; las releases de GitHub para actualizar.
  base-kit, instalado aquí en modo `project --distribute` (issue #99): los cursos reciben `.base-kit/` por el motor
  (el feedback al kit, `kit-issue.js`, y la protección de claves, `secret-guard`); las reglas y los agentes de
  desarrollo (`.claude/rules/base-kit.md`, `.claude/agents/`) se quedan aquí.
- **Lo usan:** los cursos creados a partir de él, que se actualizan con `/actualizar`.

## Piezas clave

| Pieza | Dónde |
|---|---|
| Instrucciones del profesor | `AGENTS.md`, `.kit/skills/*/SKILL.md` |
| Herramientas (guardar, actualizar, dudas, exámenes…) y sus tests | `.kit/herramientas/`, `.kit/herramientas/tests/` |
| Qué ficheros son motor | `.kit/motor.json` |
| Instalación | `.kit/guias/INSTALACION.md`, `.kit/guias/INSTALAR-AGENTE.md` |
| CI, release, mantenimiento nocturno, bot | `.github/workflows/` |
| Arquitectura y plan | `docs/arquitectura.md`, `docs/planes/plan-vivo.md` |
| Cómo se cambia y se publica | `CONTRIBUTING.md` |

## Decisiones que vale la pena copiar

- **Motor separado de los datos:** actualizar nunca toca lo del alumno.
- **Toda mejora llega al alumno antiguo:** o como oferta tras `/actualizar`, o como migración.
- **El título del PR es el historial:** squash y comprobación del título en el CI.
- **Dos barreras para `main`:** protección de rama con `tests-ok` y hook `pre-push` local.
- **Mantenimiento nocturno sin red:** Claude edita sin `gh` ni red; un paso sin LLM publica con el bot.
- **Dependabot mensual:** se mezclan solos los parches y menores de npm; las Actions y las mayores, a mano.

## Rutas clave que describe esta ficha

`AGENTS.md`, `.kit/motor.json`, `.kit/herramientas/preparar-curso.js`, `.kit/herramientas/actualizar.js`,
`.kit/adaptadores/`, `.github/workflows/`, `CONTRIBUTING.md`, `docs/arquitectura.md`.
