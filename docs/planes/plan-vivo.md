# Plan vivo del kit

El único plan abierto del kit. Se actualiza mientras se trabaja, no al cerrar. Lo que se termina baja a
**Hecho**; los planes anteriores están en `docs/planes/_archivo/` (el último cierre:
`_archivo/2026-09-26-para-continuar.md`).

Para abrir una sesión:

> Seguimos con el profesor-kit (repo en ~/Documents/personal/formacion/profesor-kit, cuenta rsotor). Lee
> `docs/planes/plan-vivo.md` y dime por dónde seguimos.

## En curso

- **forma-de-trabajar** (plan en `~/Documents/workspace/initiatives/forma-de-trabajar/plan-phase-1.md`,
  sección "profesor-kit"). Hecho, ya en `main`: K1, G5, K2. Queda: K3, K4, K5 (PR, con OK), K6 (con OK).
- **#55, para la 0.28.0** (rama `claude/epic-feynman-5sxy9o`): `/examen` pregunta cada concepto desde ángulos
  distintos. Seis ángulos fijos en la clave (`angulo`: reconocer, distinguir, predecir, detectar-error, transferir,
  definicion); al menos 3 distintos por examen (2 en `lo-que-falta`), como mucho una de definición; la dificultad
  es de profundidad (el final, más predecir, detectar-error y transferir). Avisos nuevos en `comprobar.js`, solo en
  un examen recién escrito (`intentos: 0`) y sin contar las del centro: `examen-sin-angulos`, `definicion-de-mas`,
  `pregunta-calcada` (8 palabras seguidas de la nota). La prueba real falla si el examen no cubre los ángulos. El
  20 % de fórmulas pasa a cobertura si `config/profesor.md` dice que son de apoyo. "Exámenes de antes" pasa a
  `.kit/guias/examenes-de-antes.md` (la skill estaba al límite de 18 KB).
  - **Fuera:** el revisor independiente (#56); prerrequisitos fuera del temario que no puntúan (cambia
    `examen.js`); otros formatos (#46); tocar los exámenes viejos de los cursos.
  - **Cómo sabremos:** tests de los tres avisos en `revisor-pedagogico.test.js` y de `angulosDelExamen` en
    `prueba-real.test.js`; la prueba real en verde con su reparto de ángulos; en el curso real, el siguiente examen
    deja de ser "¿qué es X?".

## Siguiente: que no se repita la #54

Por qué no la cazó ninguna prueba: la columna `Última prueba` nunca estuvo en el kit (ni skills, ni plantillas,
ni `AGENTS.md`); la inventó el profesor de un curso real. La prueba real y `prueba-actualizar` parten siempre de
cursos hechos por el kit tal cual, así que nunca ven cómo se desvían los datos con el uso. Por orden de valor:

1. **El curso real de Roberto como prueba antes de cada release:** en una copia, todas las migraciones +
   `comprobar.js`; sin errores ni avisos nuevos. La copia vive en `pruebas-local/` (ignorado por git), **nunca
   en el repo, que es público**. Paso obligatorio en `.claude/rules/desarrollo.md`, como la prueba real.
   Falta: dónde está el curso real y cómo se trae a este Mac.
   - **Fuera:** subir datos de un alumno al repo; anonimizar.
   - **Cómo sabremos:** con la copia del curso de antes de la 0.27.1, la comprobación falla con la 0.27.0 y pasa
     con la 0.27.1.
2. **`actualizar.js` avisa si los avisos se disparan** tras actualizar (la #54: de 40 a 147); hoy solo compara
   errores.
   - **Fuera:** bloquear la actualización por avisos.
   - **Cómo sabremos:** test con un curso que pasa de N a muchos más avisos → el resumen lo dice.
3. **El formato de `progreso.md` fijado en una plantilla**, para que el profesor no se invente columnas.
   - **Fuera:** TODO: decidir con Roberto.
   - **Cómo sabremos:** TODO: decidir con Roberto.

## Issues abiertas por decidir

- **#56** subagentes con roles: primero el revisor independiente de exámenes (verifica los ángulos de la #55);
  la preparación en paralelo después (~900.000 tokens por módulo). Encaja con K6 (base-kit).
- **#39** se puede cerrar: H12 salió en la 0.26 y H09 lo sigue la #45. Cerrarla necesita el OK de Roberto.
- **#46**, **#47**: peticiones sin cambios.
- **#59** abierta: falta que quien la abrió diga si su Codex tiene una herramienta de opciones (para quitar el
  `pendiente` del adaptador).
- De la #54 (cerrada), menor: `issue.js --enviar` sigue necesitando `gh`.

## Siguiente

1. **"¿qué es la liquidez?"** (disparadores): de momento vale `dudas` o contestar en el chat (decisión de Roberto,
   2026-09-25). En el próximo cambio de skills, decidir si se refuerza la descripción de `/dudas` para que la
   registre (así cuenta para el tercer tropiezo) y medir.
2. **Claude en la nube (#50, issue cerrada):** verificar de verdad que `guardar.js` sube y `--traer` trae con el
   proxy local (`http://…@127.0.0.1:PORT/git/<owner>/<repo>`), y trabajar en una rama `claude/…`. Lo prueba Roberto.
3. **Codex en el Mac (#45, abierta):** `codex login` y los pasos del comentario de la #45 (9 supuestos). Y el
   `pendiente` de `preguntar_con_opciones` (#59).
4. **0.28.0:** plan con calendario (E2 + E9) y examen acumulativo (E7).
   - **Fuera:** TODO: decidir con Roberto al abrir el plan.
   - **Cómo sabremos:** TODO: decidir con Roberto al abrir el plan.

## Hecho

- **#58 y #59** fusionadas (#62), salen en la 0.28.0: `preparar.js --lanzar` con carpeta de inbox; en el chat,
  opciones con la herramienta del asistente o «1b, 2a», y el examen largo se contesta como elija el alumno.
- **0.27.0** fusionada (#53) y publicada (release `v0.27.0`, 2026-09-25).
- **0.27.1** fusionada (#57) y publicada (release `v0.27.1`). Repo público presentable fusionado (#60); queda el
  vídeo y las capturas (`docs/capturas/LEEME.md`).

## Cómo se trabaja (lo que funcionó)

- Prueba real **una sola vez al final**; entre cambios, lo rápido (tests, lint, lectura en frío, disparadores).
- Si la prueba real falla en un paso: `npm run prueba-real -- --desde "<paso>"` repite desde ahí con las copias
  (se quedan si algo falla). El resumen de `--desde` no vale para el PR: al final, una completa.
- Antes de aflojar una comprobación que falla, buscar la causa (0.27.0: tres pruebas con el mismo paso en rojo;
  la causa era la skill, que no decía de dónde salía el valor).
- Revisión independiente de todo lo que toca git del alumno o la decisión de subir (0.27.0: dos rondas, cada una
  encontró fallos graves).
