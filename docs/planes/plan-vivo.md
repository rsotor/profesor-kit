# Plan vivo del kit

El único plan abierto del kit. Se actualiza mientras se trabaja, no al cerrar. Lo que se termina baja a
**Hecho**; los planes anteriores están en `docs/planes/_archivo/` (el último cierre:
`_archivo/2026-09-26-para-continuar.md`).

Para abrir una sesión:

> Seguimos con el profesor-kit (repo en ~/Documents/courses/profesor-kit, cuenta rsotor). Lee
> `docs/planes/plan-vivo.md` y dime por dónde seguimos.

## En curso

- **forma-de-trabajar** (plan en `~/Documents/workspace/initiatives/forma-de-trabajar/plan-phase-1.md`,
  sección "profesor-kit"). Rama `forma-de-trabajar`. Hecho: K1, G5, K2. Queda: K3, K4, K5 (PR, con OK), K6 (con OK).
  **No se sube versión** hasta que Roberto lo diga: hay más cosas pendientes que irán en la misma release
  (no habrá versión nueva hasta tener base-kit en el kit).
- **#54 arreglada en la rama** (migración 009: la columna `Última prueba` pasa a la cita de sus casillas y se
  quita; `version_datos` 9; y el mensaje de título de `issue.js`). **Al publicar:** línea en `.kit/CHANGELOG.md`
  (cambia la forma de `progreso.md`) y cerrar la #54 con el enlace a la release. Pendiente de la #54, menor:
  `issue.js --enviar` sigue necesitando `gh`.

## Issues abiertas por decidir

- **#55** `/examen` por ángulos, no la definición literal. Recomendado para el alcance de la 0.28.0.
- **#56** subagentes con roles: primero el revisor independiente de exámenes (verifica los ángulos de la #55);
  la preparación en paralelo después (~900.000 tokens por módulo). Encaja con K6 (base-kit).
- **#39** se puede cerrar: H12 salió en la 0.26 y H09 lo sigue la #45. Cerrarla necesita el OK de Roberto.
- **#46**, **#47**: peticiones sin cambios.

## Siguiente

1. **"¿qué es la liquidez?"** (disparadores): de momento vale `dudas` o contestar en el chat (decisión de Roberto,
   2026-09-25). En el próximo cambio de skills, decidir si se refuerza la descripción de `/dudas` para que la
   registre (así cuenta para el tercer tropiezo) y medir.
2. **Claude en la nube (#50, issue cerrada):** verificar de verdad que `guardar.js` sube y `--traer` trae con el
   proxy local (`http://…@127.0.0.1:PORT/git/<owner>/<repo>`), y trabajar en una rama `claude/…`. Lo prueba Roberto.
3. **Codex en el Mac (#45, abierta):** `codex login` y los pasos del comentario de la #45 (9 supuestos).
4. **0.28.0:** plan con calendario (E2 + E9) y examen acumulativo (E7).
   - **Fuera:** TODO: decidir con Roberto al abrir el plan.
   - **Cómo sabremos:** TODO: decidir con Roberto al abrir el plan.

## Hecho

- **0.27.0** fusionada (#53) y publicada (release `v0.27.0`, 2026-09-25).

## Cómo se trabaja (lo que funcionó)

- Prueba real **una sola vez al final**; entre cambios, lo rápido (tests, lint, lectura en frío, disparadores).
- Si la prueba real falla en un paso: `npm run prueba-real -- --desde "<paso>"` repite desde ahí con las copias
  (se quedan si algo falla). El resumen de `--desde` no vale para el PR: al final, una completa.
- Antes de aflojar una comprobación que falla, buscar la causa (0.27.0: tres pruebas con el mismo paso en rojo;
  la causa era la skill, que no decía de dónde salía el valor).
- Revisión independiente de todo lo que toca git del alumno o la decisión de subir (0.27.0: dos rondas, cada una
  encontró fallos graves).
