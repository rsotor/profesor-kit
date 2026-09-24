# Diagnóstico de skills y AGENTS.md · 2026-09-24

Solo lectura, con los criterios de skill-creator (disparadores, tamaño y carga progresiva, repeticiones y
contradicciones, ambigüedades que llevan a comandos improvisados, reglas sin porqué, trabajo repetido,
portabilidad). Rama `mi-perfil-y-evolucion` (0.23.0). Punto de partida de la revisión de skills de la **0.24.0**.

## Resumen

1. **Base buena**: las siete skills cumplen Agent Skills, casi todas las reglas explican su porqué y ninguna está
   cerca del límite. Hay que podar y desambiguar, no reescribir.
2. **Riesgo principal: `AGENTS.md` = 27,6 KB, el 84 % de los 32 KiB que Codex lee** (lo que pase de ahí se corta sin
   avisar; cuentan también las instrucciones globales del usuario). **Por confirmar** con la documentación de Codex.
3. **Contradicciones reales**: `progreso.md` (AGENTS dice que nunca cambia al procesar; `/sesion` añade filas ⬜ y
   `comprobar.js` lo exige), rutas de flashcards y ejercicios (por unidad frente a plano), quién escribe el README.
4. **Comandos improvisados** (0.24.0): leer PDF/Excel/PPTX, verificar un ejercicio HTML, abrir en el navegador,
   escribir en `diario.md`. Los cuatro deberían ser herramientas del kit.
5. **Disparadores que se cruzan**: "repaso" (página de `/repaso` y preguntas orales de AGENTS), "tengo dudas" /
   "tengo una duda de X" en el chat, "hazme unas preguntas".

## Por fichero

| Fichero | Tamaño | Problema principal | Prioridad |
|---|---|---|---|
| AGENTS.md | 369 líneas · 27,6 KB | Cerca del límite de Codex; carga siempre secciones de uso raro; contradice a `/sesion` y a `guardar.js` | Alta |
| sesion | 216 · 12,9 KB | Rutas contradictorias; leer PDF/Excel sin herramienta | Alta |
| ejercicio | 139 · 8,0 KB | La verificación del HTML se hace con scripts improvisados | Alta |
| examen | 176 · 10,4 KB | Mucho trabajo mecánico a mano; "2+ fallos" ambiguo; reparto sin caso "alumno nuevo" | Media |
| configurar | 251 · 16,4 KB | La mitad se usa solo a veces (podría ir a `references/`) | Media |
| dudas | 101 · 4,7 KB | No se activa con "tengo dudas"; las dudas del chat no suben el registro | Media |
| repaso | 72 · 3,2 KB | Choca con el repaso oral; `dificultad` mal situada; sin "Del kit" | Media |
| actualizar | 82 · 4,7 KB | Pide reinstalar skills, que ya hace `actualizar.js` | Baja |

## Hallazgos (de más a menos impacto)

Alta:
1. AGENTS.md al 84 % del límite de Codex → mover a `.kit/guias/` "Si el alumno cambia de asistente", "Si no eres
   Claude Code", el procedimiento de "Feedback al kit", "Si trabajas en segundo plano" y "Cuando el alumno escribe a
   su manera" (AGENTS solo los nombra: "si pasa X, lee Y"); test que falle por encima de ~24 KB.
2. Contradicción de `progreso.md` → "al procesar solo se añaden filas en ⬜; ningún estado cambia sin una respuesta
   del alumno" (ya dio un falso fallo en la prueba real del 2026-09-24).
3. Rutas de flashcards y ejercicios contradictorias (`sesion:104-107` frente a `sesion:142`, `ejercicio:117-118`).
4. Leer PDF/Excel/PPTX sin herramienta → `leer.js <fichero>` (texto por páginas, fórmulas de cada celda). Es P8.
5. Verificar un ejercicio HTML obliga a improvisar → `verificar-ejercicio.js <html>`.

Media:
6. La ruta de cada fichero se calcula a mano → `organizar.js --ruta <id> <tipo>` o "escríbelo y ejecuta organizar".
7. "Repaso" con dos sentidos; "ponme un test" / "ponme un ejercicio" / "hazme unas preguntas".
8. Dudas del chat: la descripción de `/dudas` sin "tengo dudas"; no suben el registro (el tercer tropiezo solo cuenta `@@`).
9. `AGENTS.md:20` dice que el README lo mantiene el profesor; el Estado lo escribe `guardar.js`.
10. "He dejado la clase": primer plano o segundo plano no está claro entre AGENTS y `/sesion`.
11. `/examen`: "2+ fallos" (¿en este examen o acumulados?) y el reparto 40/25/20/15 con un alumno nuevo.
12. La nota de sesión "~15-20 líneas" no cabe con Cobertura, Auditoría y Para pensarlo despacio.
13. Trabajo mecánico del examen → `examen.js --registrar` (el modelo solo aporta los veredictos); falta `intentos:` en el frontmatter de ejemplo.
14. Arranque y cierre con comandos sueltos (`tail` del diario, `git status`, `echo >>`, `open`/`start`) →
    `estado.js --json` con la última línea del diario y cambios sin guardar; `guardar.js --empezar "<qué>"`; `abrir.js`.
15. `actualizar:81-82` pide un paso que `actualizar.js` ya hace.

Baja:
16. `repaso:31`: `dificultad` está en la nota del concepto, no en `config/alumno.md`.
17. "Del kit" falta en el cierre de `repaso`, `ejercicio` y `actualizar`.
18. Reglas repetidas (evolución del profesor en `/examen`, `mapa-del-curso` dos veces en `/sesion`, "algo se mueve",
    "Antes de nada: lee config…" en seis skills).
19. `/configurar` y "Versión nueva" de `/examen` → `references/`.
20. Reglas sin porqué: "15-20 preguntas por bloque", "Cinco preguntas sesgan", `estudiada` "nunca tú".
21. Portabilidad: cambiar "Si no eres Claude Code" por "según tu adaptador".

## Qué medir en la 0.24.0

1. Disparadores: ~40 frases reales de alumno → skill esperada (o ninguna), en Claude y en Codex.
2. Comandos que piden permiso por skill (fuera de `node .kit/herramientas/*`), contados en los registros.
3. Tamaño de AGENTS.md (umbral) y secciones clave dentro de los primeros 32 KiB.
4. Invariantes tras `/sesion` (conceptos nuevos en ⬜, nada que organizar, sin errores al primer guardado).
5. Invariantes tras `/examen` (histórico legible, huecos vacíos, `estudiada` solo si aprueba).
6. Ejercicios HTML que pasan la verificación sin retoque.
7. "Del kit" en las siete skills.
8. Tokens y tiempo por skill antes y después de mover secciones a referencias, sin empeorar los avisos.
