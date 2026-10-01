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
- **0.29.0, por publicar** (no antes del 2026-10-02: la 0.28.0 salió el 2026-10-01). En `main` ya está la #65: el
  revisor independiente de exámenes (#56), el aviso de `actualizar.js` cuando se disparan los avisos (#54, punto 2) y
  nada de `>>` en `/sesion` y `/ejercicio`; prueba real 15/15 sobre ella, 0 permisos denegados. Se espera a Codex
  (@sarainieto, en la #45: prueba real en Windows, selector de la #59 y subagentes de la #56) para meter lo que salga
  en esta release; si el 2026-10-02 por la tarde no hay nada, o necesita más de un día, se publica sin ello. Si lo de
  Codex cambia adaptadores o skills, prueba real de Claude otra vez antes de publicar, con todo junto.

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
2. **`actualizar.js` avisa si los avisos se disparan** tras actualizar (la #54: de 40 a 147). Hecho en la rama de la
   #56 (sale en la 0.29.0): compara los avisos del `comprobar.js` viejo con los del nuevo y, con 10 más o la mitad
   más, lo dice en una línea; `/actualizar` le cuenta al alumno qué hacer.
   - **Fuera:** bloquear la actualización por avisos.
   - **Cómo sabremos:** test con un curso que pasa de N a muchos más avisos → el resumen lo dice.
3. **El formato de `progreso.md` fijado en una plantilla**, para que el profesor no se invente columnas.
   - **Fuera:** TODO: decidir con Roberto.
   - **Cómo sabremos:** TODO: decidir con Roberto.

## Issues abiertas por decidir

- **#56** subagentes con roles: el revisor independiente, ya en `main` (#65); Codex declara `spawn_agent` (#66, falta
  su prueba real larga). Quedan, para otra sesión y con plan propio (mejor una release aparte, no con la 0.30):
  - **Preparación en paralelo** (punto 2; ~900.000 tokens por módulo). Propuesta, por decidir con Roberto: no con
    subagentes, sino lanzando varias `preparar.js --lanzar` a la vez (una rama `preparacion/*` por clase) y que
    `--juntar` cierre al final `_index.md`, `progreso.md` y `mapa-del-curso.md` (el "coordinador" de la issue). Vale
    para cualquier asistente con `segundo_plano`. Antes de nada: comprobar si `--juntar` resuelve dos ramas que tocan
    esos ficheros, y cómo se evita que dos clases creen el mismo concepto (`candidatos.js`). Avisar del coste antes.
  - **Auditor de material** (punto 3): un subagente en `/sesion` que reproduce las cifras de los Excel y lista
    discrepancias; entrega algo comprobable.
  - El punto 4 (dudas y conversación, no como rol aparte) no pide trabajo. Encaja con K6 (base-kit).
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
4. **El profesor escribe con `>>` aunque `AGENTS.md` lo prohíbe** (tres pruebas reales seguidas). Hecho en la rama de
   la #56: `/sesion` y `/ejercicio` lo dicen donde se añaden filas. Se mide en "Permisos denegados" del RESUMEN.
5. **0.29.0:** el revisor independiente (#56, en curso) y, después, plan con calendario (E2 + E9) y examen acumulativo (E7).
   - **Fuera:** TODO: decidir con Roberto al abrir el plan.
   - **Cómo sabremos:** TODO: decidir con Roberto al abrir el plan.

## Hecho

- **#65** fusionada: revisor independiente de exámenes (#56), avisos disparados al actualizar (#54, punto 2) y
  nada de `>>` en `/sesion` y `/ejercicio`. Sale en la 0.29.0.
- **0.28.0** fusionada (#64) y publicada (release `v0.28.0`, 2026-10-01). #55 y #39 cerradas.
- **#55** fusionada (#63): `/examen` por ángulos; la CI comprueba el commit que probó la prueba real y
  `prueba-real.js` no arranca sobre una copia atrasada. Sale en la 0.28.0.
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
