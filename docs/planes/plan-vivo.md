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
- **#56, revisor independiente de exámenes** (rama `claude/epic-feynman-5sxy9o`; 0.28.0 ya publicada). Cada
  examen tipo test nuevo lo resuelve a ciegas alguien sin el contexto de quien lo escribió: un subagente (adaptador
  `subagentes`), si no un proceso en segundo plano (`examen.js --revisar`), si no el profesor de la sesión siguiente
  (`estado.js` → `examenesSinRevisar`). La revisión va a `config/revisiones/`; el examen no se ofrece hasta resolverla
  y el alumno no se entera. `examen.js --corregir` no corrige la primera vez sin ella (`--sin-revision` la salta y
  marca el intento). Van en la misma rama el punto 2 de la #54 y el `>>` (Siguiente, 4). Falta: prueba real entera sobre el commit, y Codex (`subagentes` pendiente en su adaptador).
  - **Fuera:** la preparación en paralelo con subagentes; el auditor del material; revisar exámenes de respuesta
    libre; revisar exámenes que ya tienen intentos.
  - **Cómo sabremos:** en la prueba real, los dos exámenes generados tienen su revisión resuelta por `subagente`
    antes de contestarse (`pasos.js#revisionDelExamen`); un examen sin revisión sale en `estado.js` y en
    `comprobar.js` (`examen-sin-revisar`) y `--corregir` se niega.

- **#56, puntos 2 y 3: preparar en paralelo y auditor del material** (rama `claude/issue-56-puntos-2-3-a8aaf8`).
  Decidido con Roberto (2026-10-01):
  - **Dónde:** un solo `preparar.js --lanzar` con varias clases; el proceso en segundo plano coordina y lanza los
    subagentes. Sin `segundo_plano`, coordina el profesor desde la conversación. Probado: `claude -p` con los
    argumentos del adaptador lanza un subagente que escribe; Codex solo sin `--ephemeral` (openai/codex#41474),
    ya quitado del adaptador y de la prueba real.
  - **Reparto en dos fases:** 1) cada subagente lee sus clases y devuelve conceptos (nombre + definición en una
    frase); 2) el coordinador cruza con `candidatos.js`, fija slugs y un dueño por nota, y los subagentes escriben.
    Los ficheros compartidos (`_index`, `progreso`, `mapa-del-curso`, `README`, `config/alumno.md`) solo los
    escribe el coordinador; `comprobar.js` y `guardar.js`, solo él y al final.
  - **Cuándo:** desde 2 clases nuevas, el profesor pregunta antes (validación del alumno: con poca cuota, dos
    clases a la vez pueden fundírsela). Coste en genérico, sin cifras: «a la vez, más rápido pero gasta varias veces
    más cuota; una detrás de otra, más lento y gasta menos; si te queda poca cuota, mejor una a una». Con 1, como hoy.
  - **Fuera:** dudas y conversación con subagentes; varias preparaciones a la vez (el cerrojo se queda); cifras de
    coste en el aviso; paralelo en asistentes sin `subagentes` (una a una, como hoy); el auditor del material
    (punto 3, aparcado: ver "Issues abiertas por decidir").
  - **Tras el diablo (2026-10-01, 5 objeciones, todas aceptadas):**
    - **Cuota a mitad:** cambiado al diseñar (2026-10-01): guardar por clase no funciona con subagentes escribiendo a
      la vez (`guardar.js` comprueba el curso entero y vería las notas a medias de los otros). Queda: si falla, no
      se borra nada (lo escrito sin guardar se guarda en la rama descartada; hoy `descartarCopia` lo tira,
      `preparar.js:96-104`) y se relanza entera; si el fallo es de cuota, el profesor propone relanzarla otro día,
      no prepararla en la conversación. Juntar solo las clases terminadas → Fuera.
    - **CLI:** `--clase <id> <ficheros…>` repetible; `sesionGuardada` por cada id; el commit de `--juntar` nombra
      todas las clases; el prompt deja de decir "son la misma clase".
    - **Fase 1** devuelve también qué aporta cada clase a cada concepto y de qué fichero; el dueño recibe todas las
      fuentes e ids (`visto_en`, `bloques:`, `## Historial`).
    - **Prueba real:** el módulo 1 (01-01, 01-02) y su examen, como hoy, en primer plano. Clase nueva 02-02
      ("ahorro a largo plazo") en `pruebas/curso-ejemplo/`, que reutiliza a propósito interés compuesto (de 02-01:
      dos subagentes, un concepto) y tasa de ahorro (de 01-02: amplía una nota existente). El paso de segundo plano
      (`prueba-real.js:634-672`) lanza 02-01 y 02-02 juntas.
    - **Auditor:** fuera del plan (aparcado).
  - **Diablo corto sobre `segundo-plano.md` (2026-10-01, 4 objeciones, todas aplicadas):** el subagente no se cree
    coordinador ni guarda; devuelve secciones fijas (`_index`, `progreso`, `mapa-del-curso`, notas ajenas, unidad
    nueva); el cierre añade `estructura.json` y `organizar.js`; si un subagente falla, no se guarda nada; la cuota se
    reconoce en las líneas del registro que enseña `--estado`.
  - **Diablo completo sobre toda la rama (2026-10-01, 5 objeciones, todas aplicadas):** `--solo` del lanzar arrastra
    juntar y compartidos, no relanza preparaciones en otros pasos y, al acabar la prueba, se para toda preparación en
    curso; juntar espera el límite de una preparación (90 min); las descartadas se conservan por fecha, no por nombre;
    una copia solo se restaura si es de ese paso; `conceptoCompartido` busca también por alias, caza la nota duplicada
    con el nombre dentro y cuenta filas exactas; las copias no llevan las skills y se guardan aunque falle algún paso.
  - **Prueba real entera (2026-10-01, f2a6ac0): 14/16.** Falló `--juntar`: choque en `tasa-de-ahorro.md` (el examen
    subió `dificultad` y la 02-02 amplió la nota: campos distintos en líneas contiguas). Bug del kit, no solo del
    paralelo. Arreglo: `lib/mezcla.js` junta las notas de concepto por cabecera (campo a campo) y cuerpo (a tres
    bandas). Y el curso de una prueba con fallos ya no se borra al salir. Se comprueba con `--solo` del lanzar.
  - **Cómo sabremos:** tests de `preparar.js`: varias clases en un lanzamiento, sesión guardada por cada id, un
    una preparación fallida conserva en su rama descartada lo que escribió, y el prompt del coordinador con las dos fases. Prueba real:
    02-01 y 02-02 en un solo lanzamiento → interés compuesto en una sola nota con las dos sesiones en `visto_en`,
    tasa de ahorro ampliada (01-02 y 02-02 en `visto_en`), una fila de `progreso` por concepto nuevo y `comprobar.js` sin errores. Gasta más: se pasa una vez,
    sobre el commit de la release.

- **Prueba real más barata** (hecho en la rama de la #56, 2026-10-01; falta probarla con una prueba entera de verdad): `prueba-real.js --solo "<paso>"` (restaura la copia
  del paso anterior, ejecuta ese paso y para) y las copias de la última prueba entera guardadas en `pruebas-local/`.
  Mientras se desarrolla, se paga solo el paso que cambia; la entera, solo antes de la release (sin cambios).
  - **Fuera:** saltarse la prueba entera antes de una release; cambiar de modelo para abaratarla.
  - **Cómo sabremos:** tras una prueba entera, `--solo "preparar.js --lanzar 02-01, 02-02"` ejecuta lanzar, juntar y
    compartidos sobre la copia guardada, sin ningún otro paso, y su resultado coincide con el de la prueba entera.

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

- **#56** subagentes con roles: el revisor independiente, en curso (arriba); la preparación en paralelo después
  (~900.000 tokens por módulo). Encaja con K6 (base-kit).
- **#56, punto 3 (auditor del material), aparcado** (2026-10-01): el paso 1b de `/sesion` ya caza la discrepancia
  del curso de ejemplo y no hay ningún caso en que fallara. **Se reabre** con un caso real en que una cifra o fórmula
  de una hoja esté mal y la `## Auditoría del material` de esa sesión no lo diga. Datos que hacen falta: fichero y
  hoja/celda; cifra mala y la buena; qué dice (o calla) la auditoría; quién lo descubrió y cuándo. Diseño ya
  pensado: lo lanza el coordinador o el profesor (un subagente no lanza otro), marca de origen como el revisor de
  exámenes, y la prueba real exige las cifras.
- **#68** (sarainieto, Codex en Windows, kit 0.27.1, 2026-10-01): el examen se escribe en `estudio/examenes/` pero la
  clave no puede ir a `config/claves/` porque el asistente solo puede escribir en `estudio/`; `examen.js --corregir`
  dice que falta la clave y no se registra nada. Pide detectarlo antes de crear un examen a medias y una forma soportada
  de guardar la clave. Sin decidir.
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
