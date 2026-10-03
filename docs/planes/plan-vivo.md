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
  - **Cambiado el 2026-10-02 (rama `aviso-varias-clases`, `d2ff86d`, sin PR todavía):** ya no se ofrece. Con 2 clases
    o más, una detrás de otra; a la vez solo si el alumno lo pide, con aviso de cuota y su sí. Pendiente: línea en el
    CHANGELOG de la próxima versión, y `AGENTS.md:261` (el comando `--clase` sigue en la tabla de Herramientas).
  - **Cuándo (como salió en la 0.29.0):** desde 2 clases nuevas, el profesor pregunta antes (validación del alumno: con poca cuota, dos
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
    bandas). Y el curso de una prueba con fallos ya no se borra al salir. `--solo` del lanzar, sobre 6820b75: 3/3
    (juntada sin choque; interés compuesto y tasa de ahorro, una nota cada uno con las dos sesiones y una fila).
  - **Prueba real con Codex en macOS (2026-10-02, 9006a4b, primera vez en Mac):** parcial, se da por buena en lo de la
    #56 (decisión de Roberto: la cuota de Codex no da para otra entera). Bien: las dos clases del módulo 1, la trampa,
    `/dudas`, `/ejercicio`, lanzar y juntar 02-01 + 02-02 y los conceptos compartidos. Sin probar por cuota de Codex
    agotada: examen (generar, corregir, oráculo) y repaso. Encontrado: Codex añadía `referencia` y `notas` a
    `config/examenes.json`; `/examen` ya dice que ahí no va nada más (la ambigüedad era de la skill).
  - **Prueba real entera con Claude (2026-10-02, 7e72469): 15/16.** Solo falló "conceptos compartidos": la 02-02
    enlazó interés compuesto sin ampliarlo (decisión válida). Criterio nuevo (Roberto, 2026-10-02, en
    `CONTRIBUTING.md`): rojo solo lo que estaría mal lo hiciera como lo hiciera; las decisiones del modelo, observación.
    Revisadas con ese criterio las comprobaciones de la prueba real: `visto_en`, las palabras de la auditoría de la
    trampa, la marca "del centro", qué falladas vuelven, el repaso regenerado y la propiedad escrita a su manera pasan
    a observación o se relajan a lo que fija la skill.
  - **Prueba real entera con Claude (2026-10-02, 207705c): 16/16**, corrección 6/6, 0 permisos denegados. Lista para el
    PR. Codex en macOS, parcial (arriba).
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

## Siguiente: recortar las llamadas de `/sesion` (hecho y medido el 2026-10-03; en la PR #88)

**La pregunta:** cómo hace `/sesion` su trabajo en menos llamadas, sin perder calidad del material. El piloto de
lectura (abajo, cerrado) ahorró poco porque tocaba la parte barata.

**Lo que ya se sabía** (detalle en «prueba real por piezas», abajo):
- Cada llamada arrastra un suelo fijo de contexto: 27 K con Claude aislado (36 K con la configuración personal), 19 K
  con Codex. Suelo × llamadas ≈ 51–61 % del gasto **en tokens brutos** (ver el punto 5 de abajo).
- `/sesion 01-01`: 10–12 llamadas, 441–551 K; `/sesion 01-02`: 14, 772–786 K (Claude, Sonnet). Leer ya está en 2–4.
- Dispersión alta entre ejecuciones iguales (355–608 K y 512–879 K en la misma clase).
- Restricción: Claude Code solo deja editar un fichero leído con su herramienta (comprobado el 2026-10-03).

**Lo que faltaba medir, sacado de los logs que ya había** (2026-10-03; las 16 ejecuciones de `/sesion` del piloto y
de las dos enteras aisladas: 8 de la 01-01 y 8 de la 01-02; guiones en `pruebas-local/medida-sesion/`, sin subir).

1. **Rondas de `comprobar.js` → corregir** (era el TODO): 13 de 16 fallan al menos una vez (14 rondas), **siempre
   por `patron-prohibido`** (23 líneas; más 2 de `ejercicio` en una). Cada ronda son 2–5 llamadas.
   - De las 23 líneas: **15 son la auditoría citando o describiendo el material** («la hoja muestra "35%"»), 4 son
     porcentajes que no son una tasa («sube un 20 %», «100 % líquido») y 4 son «el 3 %» de la inflación sin periodo.
     La regla del curso de ejemplo dice «tasa de interés»; su patrón caza cualquier `N %`.
   - **Corregirlo empeora el material:** en 2 ejecuciones la cita pasó a decir «"35% mensual"», que el material no
     dice. Es el fallo que la 0.28.0 arregló para la respuesta del alumno (`comprobar.js:202`), ahora con el material.
   - El error solo da el número de línea: 6 de 16 gastan una llamada en ir a mirarla (9 lecturas, 1 denegada).
2. **`comprobar.js` bueno y, en otra llamada, `guardar.js`** (que vuelve a comprobar por dentro): 14 de 16. En las 16
   no salió ningún aviso pedagógico: solo `todo` y `falta-info`, que no se arreglan.
3. **Escribir:** 1–4 llamadas (todo en una, 2 de 16). Los ficheros vivos en llamada propia, 6 de 16; un `Edit`
   fallido sobre ellos, 1 de 16.
4. **El entregable cambia entre ejecuciones iguales:** hace ejercicio en 2 de 8 (01-01) y en 6 de 8 (01-02); lo
   escrito va de 8,9 a 18 K caracteres y de 12 a 21 K. Con ejercicio, ~+25 % de coste (01-02: 222 K sin, 280 K con;
   n = 2 y 6). Es la mayor fuente de dispersión y no es ineficiencia. Corrige al piloto: en su segunda vuelta la 01-01
   hizo ejercicio en 2 de 3 (0 de 5 antes); el +28 % no era solo el paquete grande.
5. **La métrica.** A precio de API (leer de caché ×0,1 · escribir en caché ×2, que el TTL es de 1 h · salida ×5), una
   `/sesion` es 19–29 % leer de caché (el suelo × llamadas), 40–50 % escribir en caché y 28–33 % salida. Las dos
   primeras llamadas (`AGENTS.md`, la skill, `config/`) son el 14–32 %, fijo. El mismo recorte baja un 45 % en
   brutos y un 23 % ponderado. **TODO: cómo pondera la cuota de la suscripción; no sale en los logs.**

Contrafactual sobre las 16 (qué costaron las llamadas que cada corte quitaría; mediana, coste ponderado):

| Corte | Qué quita | 01-01 | 01-02 |
|---|---|---|---|
| B. Que no falle a la primera | las rondas ✗ → corregir | −16 % | −10 % |
| A. Cerrar con un comando | el `comprobar.js` bueno antes de `guardar.js` | −4 % | −3 % |
| D. Ficheros vivos por herramienta | sus `Edit` y su llamada propia | −2 % | −4 % |
| C. Escribir todo en una tanda | 1–2 llamadas de escribir | −2 % | −2 % |
| Los cuatro | de 10 a 6 llamadas · de 14 a 8 | −23 % (−45 % brutos) | −20 % (−41 % brutos) |

**Cómo se mide sin que la dispersión lo tape.**

- **Primero el contrafactual, que es gratis y no tiene ruido:** el techo de cada corte sale de contar las llamadas que
  ya ocurrieron (tabla de arriba). Un corte con techo por debajo del ruido no se ejecuta (C y D, por coste).
- **Lo que se ejecuta mide si el profesor toma el camino nuevo, que es sí o no por ejecución**, no una media de
  tokens: de 13/16 a ≤ 1/6 se ve con 6 ejecuciones; un −9 % de tokens con 3, no.
- **El total, por estratos del entregable** (con y sin ejercicio, contra las de su mismo estrato) y en coste
  ponderado. Sin estratos la 01-01 va de 160 a 297 K; sin ejercicio, de 160 a 208 K (mediana 186 K).
- **Calidad, con una huella por ejecución sacada de lo escrito** (`pruebas-local/medida-sesion/huella.js`): mismos conceptos, secciones de cada
  nota, cobertura sin huecos, hallazgos de la auditoría, avisos de `comprobar.js`, y **citas del material alteradas
  al corregir** (hoy ≥ 2 de 16).
- **Sin resolver:** qué métrica sigue la cuota de la suscripción (decidido abajo: no se calibra) · Codex (una sola ejecución).

**Diseño (borrador, tras la ronda corta del diablo).**

**Lo que dice la medida, antes que el diseño:** las «7–9 llamadas de escribir, comprobar y corregir» son, sobre todo,
el patrón del curso de ejemplo saltando sobre la auditoría. Recortar llamadas en el **producto** da un −3–4 % seguro
(corte 2); el −10–16 % del corte 1 solo existe en cursos con un patrón mal afinado, y hoy solo consta en la prueba.
Lo que pesa de verdad queda en «Fuera»: lo fijo (14–32 %), la salida (28–33 %, que es el material) y el ejercicio.

*Corte 1 (B): que no falle a la primera.* Dos partes, con su etiqueta:
- **Arreglo del curso de ejemplo (abarata la prueba, no el producto):** su patrón se estrecha a lo que dice su regla
  (el `%` solo cuenta si la línea habla de interés, TAE, TIN o tipo antes de la cifra).
- **Producto:**
  1. `comprobar.js`: cada error con línea trae **el texto de la línea**, no solo el número.
  2. `/configurar` (su punto de `patrones_prohibidos`) pide probar el patrón contra frases que **no** incumplen la
     regla antes de proponerlo.
  3. `patrones_prohibidos` no mira lo que va **entre comillas** («…», "…"): es la cita literal del material, como la
     respuesta del alumno (`sinRespuestaDelAlumno`). Por comillas y no por sección: en `## Auditoría del material` el
     profesor también afirma cosas suyas. Sin esto, con el patrón ya estrecho, «la hoja muestra la tasa como "35%"»
     sigue saltando y la cita se sigue falseando.
  4. `leer.js --para sesion` añade al paquete los `mensaje` de `patrones_prohibidos` («esto lo comprueba una
     máquina»): una línea por patrón; sin patrones, nada. Solo si con 1–3 sigue fallando a la primera.

*Corte 2 (A): cerrar con un comando.* `guardar.js "<mensaje>"` es el cierre: comprueba y, si hay errores, no guarda y
**los enseña** (hoy dice «ejecuta comprobar.js para verlos»). **Cambia el producto para todas las skills**
(`AGENTS.md`: «Avisos pedagógicos» y la tabla de Herramientas; el punto 8 de `/sesion`): hoy un aviso pedagógico no
bloquea `guardar.js` (`guardar.js:173-174`) y la regla «se arreglan antes de guardar» depende de que el profesor
pase antes por `comprobar.js`. Dos formas (decidida la (b) reducida, abajo): **(a)** `guardar.js` tampoco guarda si los ficheros tocados
traen avisos pedagógicos o `no-se-vera-bien` nuevos, los enseña, y con `--con-avisos` guarda igualmente (el «motivo
concreto» de `AGENTS.md`) · **(b)** guarda y enseña los avisos; si los hay, se arreglan y se guarda otra vez (dos
guardados; `deshacer.js` solo desharía el segundo).

*Aparte, no por coste (D):* que `guardar.js` genere `conceptos/_index.md` y las filas ⬜ nuevas de `progreso.md` desde
las notas (la plantilla ya dice que «En una frase» va literal al índice). Ahorra poco (−2–4 %) pero quita los `Edit`
fallidos, la restricción de leer antes de editar y fija el formato por código: es el punto 3 de «que no se repita la
#54». Pide migración de cursos reales: plan propio.

*No (C):* pedir en la skill que escriba todo en una tanda. Techo −2 %, y el precedente de pedir un orden en la skill es
0 de 6 (`guardar.js --empezar` con las primeras notas).

- **El piloto de ayer, vuelto a mirar con esta medida (2026-10-03, noche):** la huella de calidad es la misma antes
  y después (mismos conceptos, secciones completas, cobertura, y la trampa del material cazada en 16 de 16). En
  coste ponderado, 01-01 sin ejercicio: 178 y 194 K antes, 208, 164 y 160 K después: no se distingue. Se queda por
  lo que no es ruido (6 de 6 lo usan, es la forma permitida de leer y va en los dos asistentes), no por ahorro. La
  huella mira estructura, no si la explicación es buena: eso pide leerlas.
- **Fuera:** el bucle de `verificar-ejercicio.js` dentro de `/sesion` (lo siguiente que pesa en la 01-02) · recortar
  lo fijo (`AGENTS.md`, 14–32 %) · el corte D · el coordinador de varias clases · medir Codex.
- **Cómo sabremos:**
  - **Sin gastar cuota, y antes de ejecutar nada (tests):** un incumplimiento real plantado **dentro y fuera** de la
    auditoría sigue saltando; una cita entre comillas no; con el patrón estrecho, ninguna de las 23 líneas de los
    logs salta (ninguna es una tasa de interés) y una tasa de interés plantada sin periodo, sí; el error trae el
    texto de la línea. Y el guion
    de la huella de calidad (`pruebas/coste.js`), escrito y pasado por las 16 ejecuciones de hoy.
  - **Con 3 × `--solo "/sesion 01-01"` y 3 × `--solo "/sesion 01-02"`** (una tanda, Sonnet, aislado): la huella de
    calidad, sin pérdidas, y 0 citas del material alteradas (lo que decide) · el profesor toma el camino nuevo: rondas
    ✗ por `patron-prohibido` de 13/16 a ≤ 1/6 y `comprobar.js` suelto antes de guardar de 14/16 a ≤ 1/6 (dicen si
    lo ha adoptado, no si ha salido bien) · el coste ponderado por estrato se apunta como dato: con n = 1–2 por
    estrato no es puerta.
- **Decisiones (Roberto, 2026-10-03, noche):**
  1. **El curso real no tiene patrones** (`patrones_prohibidos: []`; en sus logs, 6
     guardados de sesión y ningún `comprobar.js` con errores). Las rondas ✗ eran del curso de ejemplo: en el curso
     real `/sesion` ya va por el camino corto. Otros cursos sí pueden tenerlos (`/configurar` los propone si una
     regla se puede comprobar con un patrón). Queda del corte 1: el arreglo del curso de ejemplo (la prueba deja de
     medir un bucle que el curso real no tiene) y los puntos 1–3, por calidad. **El punto 4 se cae.**
  2. **Decide el coste ponderado.** La sonda de la cuota no se hace: con un −3–4 % en juego no cambia ninguna
     decisión; solo si una futura depende de brutos contra ponderado.
  3. **Corte 2, forma (b) reducida** (cambiado tras la ronda completa del diablo, 2026-10-03, noche; antes (a), que
     era recomendación mía): `guardar.js`, en su vía normal, **enseña los errores** y sigue sin guardar con ellos; si
     guarda y lo tocado trae avisos pedagógicos o `no-se-vera-bien`, **los enseña al guardar**, y el profesor los
     arregla y guarda otra vez (o le dice al alumno por qué se quedan, como hoy). No bloquea por avisos, no hay
     `--con-avisos`, sale con 0. Los guardados internos (`--traer`, `--juntar`, `actualizar.js`) y el segundo plano
     no cambian. El ahorro es el mismo que con (a): sale de no llamar a `comprobar.js` aparte.
     - **Se cambian a la vez, o el ahorro no llega:** `AGENTS.md:90-91`, `:101-104` («antes de guardar» pasa a
       «antes de dar nada por cerrado»), `:250`, `:272` · `.kit/skills/sesion/SKILL.md:171` y `:193` ·
       `.kit/skills/ejercicio/SKILL.md:134-137` · `.kit/skills/dudas/SKILL.md:18` · `.kit/skills/actualizar/SKILL.md:53` ·
       `.kit/guias/segundo-plano.md:86`. Y un test de coherencia: falla si una skill pide `comprobar.js` justo antes
       de `guardar.js`.
     - **Cómo sabremos (se añade):** tests de los cinco guardados internos sin cambio de comportamiento · sobre una
       copia del curso real en `pruebas-local/`, un guardado que toca `progreso.md` no llena la pantalla de avisos
       viejos (medido el 2026-10-03 sobre una copia: 31 avisos, 5 pedagógicos en 2 ficheros, 0 en `progreso.md`; tope de
       10 líneas y «y N más») · la huella cuenta los segundos guardados por avisos.
  - **Paso 1, hecho (2026-10-03, noche; sin commit):** `comprobar.js` (`sinCitas`, texto de la línea en
    `patron-prohibido`), `/configurar`, el patrón del curso de ejemplo (`\\b(inter[eé]s(es)?|TAE|TIN)\\b` antes de la
    cifra; sin «tipo», que saltaba con «este tipo de gasto») y 5 tests. `npm test`: 849 de 850, 0 fallos, 1 saltado
    (de antes). Las 23 líneas de los logs (recortadas a 170 caracteres), contra el patrón nuevo: 0 saltan. **Falta su
    línea en el CHANGELOG de la siguiente versión** (no hay sección de lo no publicado).
  - **Pasos 3 y 4, hechos (2026-10-03, noche; sin commit).** Corte 2, forma (b) reducida: `guardar.js` enseña errores
    y, al guardar, los avisos de calidad de lo tocado (tope 10); `AGENTS.md`, `/sesion`, `/ejercicio` y `/actualizar`
    cierran con `guardar.js`; test de coherencia. `npm test`: 855 de 856, 0 fallos (el saltado es el de Windows,
    `lanzar-asistente.test.js:48`). `segundo-plano.md:86` no se toca (el coordinador comprueba y guarda una vez).
    **Medida** (`--solo`, Sonnet, aislado; cuota 5 h del 21 % al 29 % con 9 ejecuciones y esta conversación):

    | | Llamadas | Coste ponderado | Guardar con ✗ | Huella de calidad |
    |---|---|---|---|---|
    | 01-01 antes (8) | 8–15, mediana 10 | sin ejercicio: 160–208 K, mediana 186 | 7 de 8 | — |
    | 01-01 ahora (3) | 6, 6, 6 | 144, 150, 157 K (**−19 %**; las tres por debajo de la mejor de antes) | 0 de 3 | igual; trampa cazada 3 de 3 |
    | 01-02 antes (8) | 9–15, mediana 14 | sin ejercicio 200 y 245 K · con, 229–312 K (mediana 280) | 6 de 8 | — |
    | 01-02 ahora (3) | 9, 8, 9 | sin ejercicio 182 y 192 K · con, 234 K | 0 de 3 | igual; trampa cazada 3 de 3 |

    - Los criterios se cumplen: rondas ✗ por `patron-prohibido` 0 de 6 (antes 13 de 16), `comprobar.js` suelto antes
      de guardar 0 de 6 (antes 14 de 16), citas del material alteradas 0 de 6. El coste cae lo que decía el
      contrafactual (−20 % y −13 %); en la 01-02, con 1–2 por estrato, es dato y no prueba.
    - **De quién es el ahorro:** casi todo, del curso de ejemplo (deja de fallar por su patrón). En un curso sin
      patrones, como el real, queda el corte 2: ~−4 %.
    - **Una tanda de 3 se tiró** (la primera de la 01-02): las copias de `--solo` llevan su `config/`, con el patrón
      viejo. Falló 3 de 3 al guardar, pero sin ir a mirar la línea (0 de 3; antes 6 de 16) y en 10–12 llamadas. Y
      una cita volvió a salir falseada («"35 % mensual"»): el patrón ancho era el problema.
    - **Para vigilar:** hace ejercicio en 2 de 9 (antes, con el mismo paquete de lectura, 3 de 10): sin señal, pero
      son pocas · 2 permisos denegados en 9, los dos por `cat config/ajustes.json; ls -R estudio | head; cat …` antes
      de escribir · un `Edit` fallido sobre `mapa-del-curso.md` costó un segundo guardado (es el corte D).
    - **Prueba real entera (2026-10-03, `cd3c634`): 16/16**, corrección 6/6, 5 permisos denegados (lecturas y
      comandos encadenados por la shell en `/sesion 01-02`, `/examen` y `/repaso`: lo de la #79, no lo tocan estos
      cortes). Cuota de 5 h: del 32 % al 42 %. Informe fijo: `docs/auditoria/2026-10-03-llamadas-de-sesion.md`.
    - **Bandeja:** el nombre del curso real se coló en este plan (repo público); corregido, y `generico.test.js` ya
      lo vigila en `docs/`, `pruebas/`, `.github/` y la raíz · `--solo` y `--desde` no refrescan `config/` de la copia: un cambio en
      `pruebas/curso-ejemplo/config/` no llega hasta la siguiente entera · `pruebas/coste.js` sigue sin existir (los
      guiones están en `pruebas-local/medida-sesion/`) · falta la línea del CHANGELOG de los dos cortes.
  - **Orden:** 1) arreglo del curso de ejemplo + puntos 1–3 del corte 1, con sus tests · 2) ronda completa del
    diablo sobre el corte 2 (hecha) · 3) corte 2, forma (b) reducida · 4) una tanda de 3 + 3. Lo siguiente que pesa, en «Fuera».
- **Abogado del diablo:** ronda corta 2026-10-03, 5 objeciones, las 5 aplicadas: 1) eximir la auditoría por sección
  escondía incumplimientos del profesor → solo lo que va entre comillas, y después de estrechar el patrón · 2)
  «cerrar con `guardar.js`» guardaba antes de arreglar los avisos y decía no tocar las skills → el cambio de
  `AGENTS.md` declarado y la decisión 3 · 3) criterios cumplidos por construcción → casos plantados y huella de
  calidad antes de ejecutar; la adopción ya no es el éxito · 4) el corte 1 abarata la prueba y no el producto →
  etiquetado así, y la decisión 1 va primero · 5) 3 + 3 no sostienen un umbral de coste → el coste es dato, no
  puerta. **Ronda completa sobre el corte 2, 2026-10-03 (noche), 5 objeciones, las 5 aceptadas;
  veredicto: la forma (a) no compensa un 3–4 %** y se pasa a la (b) reducida: 1) en segundo plano nadie puede decidir
  `--con-avisos`: o la preparación falla (una `/sesion` perdida) o se salta la regla en silencio · 2) saber si un
  aviso es «nuevo» no tiene definición barata que aguante los datos reales (el detalle lleva números que se mueven;
  `progreso-sin-prueba` va siempre a `progreso.md`) · 3) cinco guardados internos con `permitirErrores` quedarían
  bloqueados o sin decidir · 4) `--con-avisos` acabaría siendo lo normal y se tragaría los avisos · 5) la lista de
  sitios que piden `comprobar.js` antes de guardar estaba incompleta. Comprobado que no rompe: la prueba real no
  mira si se llamó a `comprobar.js`; los permisos ya cubren `guardar.js`.

## Siguiente: un curso de ejemplo que mida más (revisado el 2026-10-03, tres rondas del diablo; sin empezar)

**Decisión de Roberto (2026-10-03):** no se publica versión hasta tener un curso de ejemplo mejor para las pruebas
reales. La PR #88 no sube `.kit/VERSION`: se acumula. La próxima release depende de esto y del punto 1 de «que no se
repita la #54» (el curso real como prueba).

**Revisión con ojos nuevos** (un agente sin el contexto de la sesión): `docs/auditoria/2026-10-03-revision-curso-de-ejemplo.md`,
con su tabla «qué promete el producto → qué lo comprueba» y la ronda del diablo al final.

**Veredicto:** el curso de ejemplo basta para el examen y la corrección (anclados por código y oráculo). No basta para
notas, índice de sesión, flashcards, ejercicios ni `/repaso`: esos pasos solo exigen que el asistente termine y que
`comprobar.js` no dé errores. La explicación mala pero bien formada no la ve nada, y no se va a cubrir con esto: se
dice así en el informe de la release.

**Lo que se hace, en orden** (reescrito tras la tercera ronda del diablo; cada comprobación dice si es rojo u
observación y cómo se ve en rojo):

1. **Comprobaciones sobre lo que queda en disco.** Funciones de `pruebas/lib/pasos.js` con su test en
   `.kit/herramientas/tests/pasos.test.js`. Se escriben y se calibran sin gastar cuota.

   | Comprobación | Veredicto | Se ve en rojo si se estropea a mano… |
   |---|---|---|
   | La respuesta del alumno aparece literal en la tabla del intento | rojo | dejando la celda en blanco |
   | Tras `/dudas`, el marcador pasa a `> [!question]- Duda` con respuesta | rojo | quitando la respuesta |
   | Examen: tope de 3 preguntas por concepto, y el concepto de la clave existe en la unidad | rojo | con una cuarta pregunta del mismo concepto; con una clave de un concepto que no existe |
   | `no-se-vera-bien` (`AGENTS.md` no le da excepción) y progreso al procesar, en cada `/sesion` | rojo | con un `%` sin proteger en una fórmula; quitando una fila de `progreso` |
   | Auditoría de la hoja de la 01-02, con la cifra normalizada (`742` o `27`, con o sin decimales) | rojo | borrando la cifra de la auditoría |
   | `97,09` y la diapositiva 6 de la 01-01 en la auditoría | observación | — |
   | Cobertura: cada diapositiva u hoja con destino | observación, hasta ver que no da falsos positivos | — |
   | Ejercicios: `config/casos/*.json` con `verificar-ejercicio.js --casos` | rojo si hay `.html` con casos y falla; sin casos a mano, observación (`--barrer` es al azar) | cambiando un `esperado` |
   | **Caso 1 en `/sesion`** (genera lo que toca): la 01-02 sale con al menos un ejercicio | rojo (dos fórmulas con parámetros: `ejercicio/SKILL.md:59`). No se exige formato | **el `resultado/` actual ya lo incumple** (`01-02-01-presupuesto-personal.md:89`, un TODO «Crear un ejercicio…»): es un rojo esperado, de la frase vieja |
   | **Caso 2 en `/sesion`** (falta información): la sesión 01-01 lleva `FALTA INFO:` en la línea del «patrón oro» | rojo: es el marcador de la regla 3. Anclada a ese fichero y a ese texto (la 01-02 tiene otro `FALTA INFO` con «diapositiva 6»). Lo que el profesor amplíe por su cuenta no se valida | quitando esa línea |
   | **`/ejercicio`** deja un ejercicio del concepto pedido | rojo. Cuenta un fichero nuevo **o modificado** desde que empieza el paso (como `pasoRepaso`, `prueba-real.js:570-575`) y enlazado desde `ejercicio:` o `## Practícalo` de la nota: con la frase nueva, `/sesion` puede haberlo creado ya y `/ejercicio` lo amplía o dice «ya tienes uno» | sin tocar ningún ejercicio en el paso |
   | **Sinónimo** «fondo de emergencia» (comprobación propia: `conceptoCompartido` busca por título contenido y no lo caza, `pasos.js:669-675`) | rojo si una nota distinta de la del colchón financiero lo lleva en el título o en un alias. Verde si la nota del colchón lleva ese alias o hay un `TODO` que pregunta si son lo mismo (la 02-02 se prepara con el prompt de segundo plano del producto, `preparar.js:154-157`, que manda TODO ante la duda) | creando una nota `fondo-de-emergencia.md` |

2. **Antes de tocar el curso, sin cuota:** probar `fusionarNotaDeConcepto` a mano con tres versiones de
   `colchon-financiero.md` (base · con la duda del alumno al final · con el alias y una línea en `## Historial`). El
   paso de `/dudas` escribe en el primer concepto por orden alfabético (`pasos.js:34-38`), que es el colchón, y la
   02-02 se lanza antes: si las dos ramas añaden al final, `--juntar` puede chocar (`lib/mezcla.js:103-104`) y saldría
   un rojo de la mezcla que parece de la regla 1. Si choca: TODO, decidir con Roberto entre arreglar la mezcla (es un
   caso real: un alumno escribe una duda en una nota que la preparación amplía), mover la simulación a otro concepto,
   o cambiar de sinónimo.
3. **Cambios en el curso y en la prueba:**
   - Clase 02-02: una diapositiva que define «fondo de emergencia» (dinero líquido para cubrir unos meses de gastos
     ante un imprevisto) sin decir que es el colchón financiero.
   - `PROMPT_COMUN` (`prueba-real.js:286`) pasa a «No me preguntes nada: decide tú. Al terminar, guarda.» en todos
     los pasos de primer plano. El de segundo plano es del producto y no se toca.
   - `no-se-vera-bien` también tras `/dudas` y `/ejercicio`, sin siembra (ver «Estado»).
   - `config/claves/` y `config/revisiones/` se guardan en el `resultado/` de la prueba.
4. **Una prueba real entera con todo**, con Claude. Lo único obligatorio que gasta cuota.
5. **Opcional, al final (Roberto, 2026-10-03): dos pasos sueltos con Codex**, solo donde el resultado depende del
   modelo: `--asistente codex --solo "/sesion 01-02"` (¿crea el ejercicio con la frase nueva?) y
   `--asistente codex --solo "preparar.js --lanzar 02-01, 02-02"` (el sinónimo; `--solo` ejecuta también juntar y
   los compartidos). No una entera: la cuota de Codex es la más corta, y el examen y la corrección no cambian con
   este plan. Sin esto, de Codex solo hay la calibración sobre su resultado guardado del 2026-10-02 (frase vieja).

- **Estado (2026-10-03, noche):**
  - Punto 1, hecho y sin enganchar en `prueba-real.js`: las funciones están en `pruebas/lib/pasos.js`
    (`sesionConEjercicio`, `respuestasEnLaTabla`, `dudasRespondidas`, `conceptosDelExamen`, `procesarClase`,
    `auditoriaRecoge`, `coberturaDelMaterial`, `ejerciciosConCasos`, `faltaInfoEnSesion`, `fotoDeEjercicios`,
    `ejercicioDelConcepto`, `sinonimoDelConcepto`), con 23 tests en `pasos.test.js`. Calibradas sobre `resultado/`,
    `resultado-codex-macos/` y las copias por paso de `pruebas-local/prueba-real-pasos-*/`: verdes salvo dos rojos
    verdaderos (la 01-02 de Claude sin ejercicio; el examen de Codex sin tabla de intento, porque su corrección
    falló aquel día). Un rojo falso corregido al calibrar: la cobertura no reconocía filas «| 2 · El trueque |».
    Estropeando a mano una copia del `resultado/` se ponen en rojo las filas 4, 5, 8 y 10 (comprobado).
  - Afinado al revisar: si `/sesion` ya creó y enlazó el ejercicio del concepto que pide el paso de `/ejercicio`, un
    buen profesor puede contestar «ya tienes uno» sin tocar nada, y `ejercicioDelConcepto` daría rojo falso. Al
    enganchar: el paso pide el ejercicio de un concepto con fórmula que aún no tenga ejercicio enlazado; si todos
    lo tienen, vale el enlace que ya existe, con observación.
  - Punto 2, hecho: **la mezcla choca.** Con la nota del colchón de la última prueba (base: tras `/sesion 01-02`;
    un lado: tras `/dudas`, con la duda respondida al final; el otro: alias nuevo y una línea al final de
    `## Historial`), `git merge` choca y `resolverConflictos` devuelve `ok: false`. Si la preparación solo añade el
    alias y `visto_en` (cabecera), se junta sin choque. Es un fallo del kit con un caso real (el alumno deja una
    duda en una nota que la preparación amplía): los dos lados añaden al final del cuerpo. **Decidido (Roberto):
    se arregla la mezcla ahora** («es un fallo que se puede dar y no podemos mirar para otro lado»). La duda
    simulada se queda en el colchón y el sinónimo también: así la prueba real cubre el caso. En marcha, en
    `.kit/herramientas/lib/mezcla.js`; al tocar el git del alumno, lleva revisión independiente antes de darlo
    por bueno.
  - Mezcla arreglada (`lib/mezcla.js`, `juntarCuerpo`): cuando los dos lados solo añaden en el mismo punto del
    cuerpo de una nota de concepto, se quedan los dos añadidos (primero el del otro lado, después el del curso
    principal); si alguno cambia o borra lo que ya existía, sigue siendo choque. 6 tests en `mezcla.test.js` y 1 en
    `traer.test.js`. Con la nota real del colchón: alias, `visto_en`, línea de historial y el callout de la duda
    entero, sin marcadores. Falta su línea en el CHANGELOG de la siguiente release (hoy el CHANGELOG no tiene
    sección sin publicar).
  - Punto 3, hecho salvo la siembra: comprobaciones enganchadas en `prueba-real.js` (22 pasos: «lo que deja
    /sesion <id>» tras cada clase, «sinónimo de un concepto que ya existe» y «ejercicios con casos» nuevos; el resto
    dentro de los pasos que ya había), `PROMPT_COMUN` nuevo, claves y revisiones al `resultado/`, la diapositiva 5
    de la 02-02 con el «fondo de emergencia» y `sinonimos` en `clases.json`. `npm test` 888 de 889 (1 omitido) antes
    del sinónimo; después, `prueba-real.test.js` y `pasos.test.js` 126 de 126. Los nombres de los pasos cambian:
    las copias guardadas de `--desde`/`--solo` ya no valen hasta la próxima entera.
  - **Decidido (Roberto): sin siembra del `%`.** El diseño no decía en qué nota iba ni si la fórmula era del
    alumno, y exigir al profesor que reescriba texto del alumno no es regla explícita. En su lugar, `no-se-vera-bien`
    se mira también tras `/dudas` y `/ejercicio` (`sinNoSeVeraBien`): mide lo que escribe el profesor y no cuesta nada.
  - Revisión independiente de la mezcla, hecha: 1 bloqueante (una nota con líneas que parecen marcadores de git
    quedaba rota y se daba por buena) y 2 menores (línea repetida con añadidos de prefijo común; línea de lista
    huérfana tras un callout). Corregidos: marcadores de tamaño 31, prefijo común una sola vez y el orden según la
    lista. Repasados los casos con el montaje de la revisión: se juntan bien, y siguen chocando los dos lados que
    cambian la misma línea y un contenido con marcadores de 31.
  - Antes de la prueba entera: mezclar la rama local `arreglos-89-90-92` (#89, #90, #92; cambia `AGENTS.md`:
    formato de `fuente:` y `pregunta-doble`). Mirado: no choca con lo de esta rama (solo coinciden en
    `docs/arquitectura.md`, en zonas distintas), y su `comprobar.js` no da `fuente-inexistente` sobre los dos
    resultados guardados. En el resultado de la entera no debe salir `fuente-inexistente`.
- **Fuera:** un LLM juez que puntúe la explicación (la explicación mala pero bien formada no la ve nada: se dice así
  en el informe de la release) · un curso grande (más clases, índice lleno) · tocar el texto de las clases 01-01 y
  01-02 · un patrón de «euros con dos decimales» en `patrones_prohibidos` (es otra vez el patrón ancho: la regla dice
  «todo ejemplo», y un patrón por línea no sabe qué es un ejemplo) · un paso nuevo de «ordenar avisos» (mide el
  camino fácil y pondría en rojo lo que `AGENTS.md` permite dejar) · un ancla en la 02-02 por su «10 %», que es una
  tasa de ahorro y no incumple nada.
- **Cómo sabremos:** cada comprobación da el veredicto esperado, no «todo en verde». Sin cuota: sobre el
  `resultado/` actual y los logs de `pruebas-local/medida-sesion/`, cero rojos falsos (el caso 1 sale en rojo y es
  correcto) y cada una se ve en rojo con el estropeo de su fila. Esos datos son de la frase vieja y sin sinónimo:
  el caso 2 y el sinónimo nacen en verde trivial, y solo los mide de verdad la prueba entera. En la prueba entera,
  un rojo que venga del kit (p. ej. la 01-02 vuelve a salir sin ejercicio) abre su propio punto en este plan: no se
  ablanda la comprobación ni se cuenta como fallo de la medida. «Mejor» = esas comprobaciones activas y calibradas,
  no «más pasos».
- **Decidido (Roberto, 2026-10-03):**
  - `config/claves/` y `config/revisiones/` al `resultado/` (el curso es inventado), para releer si una clave está mal.
  - La 02-02 se puede tocar: es un curso de ejemplo y se puede evolucionar.
  - La frase nueva, en todos los pasos: cuándo va un TODO o un FALTA INFO lo dice `AGENTS.md`, y la prueba lo mide
    en vez de dictarlo. Su criterio: donde un paso se da por bueno solo con terminar (`/ejercicio` solo miraba el
    código de salida, `prueba-real.js:425-426`; `/dudas` acepta cualquier respuesta), la frase vieja deja pasarlo
    con un TODO. Coste asumido: `/sesion` y `/ejercicio` hacen más llamadas y dejan de ser comparables con lo medido.
  - Dos casos de uso: el profesor genera lo que toca, y cuando le falta información deja el marcador que define la
    regla (el término da igual mientras sea el de la regla: es lo que permite buscar luego dónde falta).
  - El sinónimo: «fondo de emergencia» = colchón financiero (01-02, diapositiva 6).
  - El orden: comprobaciones calibradas sin cuota → cambios en el curso y la prueba → una prueba entera.
- **Decidido (Roberto, 2026-10-03, tras la tercera ronda):** el caso «falta información» no se mide dentro de
  `/ejercicio`. Se había decidido pedir en la misma petición un ejercicio del patrón oro; la tercera ronda lo tumba: `ejercicio/SKILL.md:26-39` ya manda parar si
  nada se mueve, y un hecho histórico no se mueve, haya material o no. Que no nazca no mide la regla, y ponerlo en
  rojo si nace como ampliación contradice «las ampliaciones no se validan». En este curso no hay un concepto sin
  material que sí se pueda practicar (el M1 de la diapositiva 7 también es una definición). Se quita de la
  petición: la regla queda medida en `/sesion` (caso 2), y `/ejercicio` mide solo «genera lo que toca».
- **Observaciones del kit, sin decidir:** `comprobar.js:166` cuenta `TBD` como aviso, pero `lib/generados.js:16-17`
  solo lleva a **pendientes** `FALTA INFO:` y `TODO:` · `ejercicio/SKILL.md` no dice qué hacer cuando el concepto se
  puede practicar pero no tiene material.
- **Rama:** `curso-ejemplo-mide-mas` (local, sobre `main` con la #88 mezclada: rebase hecho el 2026-10-03).
- **Abogado del diablo:**
  - Ronda completa 2026-10-03 (primera sesión), 5 objeciones, las 5 aceptadas: 1) las anclas de la auditoría
    incluían un defecto inventado (el «10 %» de la 02-02) y una cifra que no está en el material (97,09), y no
    coincidían con la huella ya usada → rojo solo la hoja de la 01-02, normalizada · 2) la comprobación de
    ejercicios no cazaba el caso que citaba, `--barrer` es al azar, y la causa estaba en el prompt de la prueba ·
    3) el patrón de euros, fuera · 4) el paso de avisos sembrados, fuera: una siembra dentro de `/dudas` · 5) faltaba
    el duplicado con otro nombre, calibrar contra los logs, y 3 de las 5 dudas «del autor» se resolvían leyendo.
  - Ronda corta 2026-10-03 (segunda sesión) sobre tocar la 02-02, la frase nueva y los dos casos, 4 objeciones:
    1) caso 2 anclado a la sesión 01-01 y a «patrón oro», aceptada; que no sea rojo si amplía con 💬, rechazada (el
    marcador es regla explícita) · 2) caso 1 sin exigir formato, aceptada; pasarlo a observación, rechazada · 3)
    frase nueva solo en `/sesion`, rechazada por Roberto (ver «Decidido») · 4) el sinónimo, de un concepto del
    módulo 1, inequívoco y fuera de los compartidos de `clases.json`, aceptada.
  - Ronda completa 2026-10-03 (segunda sesión) antes de implementar, 5 objeciones: 1) el sinónimo no lo cazaba
    `conceptoCompartido` y la 02-02 usa el prompt de segundo plano → comprobación propia, aceptada · 2) el colchón es
    el concepto donde escribe `/dudas` y puede chocar al juntar → probar la mezcla a mano antes, aceptada · 3) el
    patrón oro en `/ejercicio` sale verde por la razón equivocada → se quita de la petición (Roberto), aceptada · 4) «ejercicio nuevo»
    daba rojo falso si `/sesion` ya lo creó → nuevo o modificado y enlazado, aceptada · 5) «Lo que se hace» y «Cómo
    sabremos» no recogían lo de hoy y la meta «en verde» chocaba con un rojo ya conocido → sección reescrita,
    aceptada.

## Siguiente: prueba real por piezas

**Rumbo (Roberto, 2026-10-02, tarde): primero la raíz.** Mover la entera de sitio (al PR, a la noche) «mueve el
polvo»: se gasta lo mismo. La prueba es cara porque cada interacción del producto es cara, y eso lo paga también el
alumno. Orden: 1) abaratar cada interacción, empezando por un piloto en `/sesion` (darle al profesor de una vez lo
que necesita al arrancar, en vez de lecturas sueltas), medido contra la línea base de abajo · 2) con ese dato, decidir
la estructura de la prueba. Decidido ya: la release espera a una entera en verde (opción A) y con el clic de
Roberto; un PR solo paga su pieza. **El diseño por piezas de más abajo queda en espera** hasta tener el piloto; sus
5 objeciones siguen abiertas.

**Siguiente paso: el piloto de `/sesion` (sin empezar; es también el arreglo de la #79).** Una herramienta del kit
que entregue de una vez lo que `/sesion` necesita leer (configuración, plantillas, índice de conceptos, material de
la clase), permitida en los permisos del curso, y que `/sesion` la use en vez de lecturas sueltas. Con la prueba
aislada, el profesor ya intenta leer varios ficheros de una vez por la shell (7 permisos denegados en dos enteras,
todos lecturas): la necesidad existe y el kit no le da una forma permitida.

- **Fuera:** las demás skills, hasta ver el dato · recortar `AGENTS.md` · el coordinador de varias clases · cambiar
  la estructura de la prueba real.
- **Cómo sabremos:** `--solo "/sesion 01-01"` tres veces después del cambio, contra las dos enteras aisladas de hoy
  (10 y 12 llamadas; 441 K y 551 K tokens). Vale si baja más que la variación entre ejecuciones iguales (±9 %) y
  si, en una entera, los permisos denegados por lecturas con la shell pasan de 3–4 a 0. Si no, se descarta.
- **Antes de implementar:** ronda corta del abogado del diablo sobre el diseño de la herramienta (abajo).
- **PR #83** (abierto 2026-10-02): los tres arreglos de la auditoría de prompts del producto y la prueba aislada.
- **Rama `piloto-sesion`** (2026-10-02): sale de las ramas de los PR #83 y #84 juntas; los dos ya están en `main` (2026-10-02, noche).

**Diseño de la herramienta (2026-10-02; sí de Roberto e implementado el 2026-10-03, sin commit; ver «Estado del piloto», abajo).**

*Lo que dicen los logs* de las dos enteras aisladas (`gBoraO`, `XXr15w`), llamada a llamada:

| Paso | Llamadas · tokens | Llamadas antes del primer fichero escrito |
|---|---|---|
| `/sesion 01-01` | 10 · 441 K y 12 · 551 K | 3 y 4 |
| `/sesion 01-02` | 14 · 772 K y 14 · 786 K | 3 y 6 |

- La primera llamada (cargar la skill + los tres `config/`, a la vez) no se puede quitar: `AGENTS.md` manda leer
  `config/` antes que nada y el profesor lo hace junto con la skill. El mínimo es 2: esa y la herramienta.
- **Lo que se ahorra son 1–2 llamadas de 10–12 en la 01-01 y 1–4 de 14 en la 01-02**, a ~40 K cada una: entre
  −9 % y −20 %. Está en el borde del ruido (±9 %). El grueso del gasto es el suelo × las 7–9 llamadas de escribir,
  comprobar y guardar, que esta herramienta no toca.
- Qué lee: el material de `inbox`, `config/estructura.json`, `conceptos/_index.md`, `auditoria-del-material.md`,
  `mapa-del-curso.md`, `progreso.md` y las tres plantillas. En la 01-02, además, la skill `/ejercicio` (8,7 K
  caracteres) y `ejercicios/_index.md`. Y explora sin necesidad: `grep` y `sed -n` sobre el código de las
  herramientas, `ls -R estudio`.
- En una ejecución llamó a `leer.js` con un `.md`, recibió «léelo tú» y gastó la llamada: ya espera que `leer.js`
  lea cualquier cosa.
- `cat a b c` no se deniega; se deniegan `for … cat` y `cd … && cat`.
- **Los 7 permisos denegados, por paso:** `/repaso` 2 (`for … cat` de todo el módulo) · `/examen (generar)` 1
  (`cd … && cat` de los conceptos) · `/sesion` 1 (`for … cat` de las plantillas) · `/examen (corregir)` 2
  (`node -e` sobre la clave) · corrección fija 1 (`sed -i`, que es **editar**, no leer). Corrige a la auditoría, que
  decía «los siete son lecturas»: son 6. Y **solo 1 de 7 está en `/sesion`**: el piloto solo no arregla la #79.

*La herramienta.*

1. **Vive en `leer.js`, no en una herramienta nueva.** `leer.js` ya está permitida en todos los cursos y en los dos
   asistentes. Una nueva no lo estaría para el alumno que ya aceptó los permisos: `permisos.js --aplicar` escribe
   una regla por herramienta el día que se acepta y `/actualizar` no la vuelve a aplicar (desde `estudio/` con
   Claude y siempre con Codex, le saldría una petición).
2. **Dos usos nuevos:**
   - `node .kit/herramientas/leer.js --para sesion <material…>`: el paquete de `/sesion` y después el material.
   - `node .kit/herramientas/leer.js <f1> <f2> …`: varios ficheros de texto de una vez (hoy admite uno y solo
     Office). Es la salida permitida para los `for … cat` de las demás skills; ninguna skill lo cita en el piloto.
3. **El paquete de `sesion`**, como datos dentro de la herramienta: `config/estructura.json`,
   `estudio/auditoria-del-material.md`, `.kit/plantillas/{concepto,sesion,flashcards}.md`. Los tres que la skill
   edita después (`conceptos/_index.md`, `progreso.md`, `mapa-del-curso.md`) **salieron del paquete** tras la
   comprobación con Haiku (abajo): la skill pide leerlos con la herramienta de ficheros en la misma tanda. **Sin los tres `config/*.md`:** ya los
   ha leído en la primera llamada y repetirlos se paga en cada llamada posterior.
4. **Formato:** cada fichero bajo una línea `=== <ruta> ===`, con `/` también en Windows. Un fichero del paquete
   que no existe, `(no existe todavía)`, sin fallar; **un material que no existe es un error** (código 2), no un
   hueco. El material: `.md`, `.txt` y `.csv`, su texto; Word, PowerPoint y Excel, con los lectores de hoy; PDF e
   imágenes, una línea «léelo tú con tu herramienta de leer ficheros».
5. **Rutas:** el paquete se busca siempre desde la raíz del curso (hoy `leer.js` resuelve contra la carpeta desde
   la que se lanza, y el alumno puede abrir desde `estudio/`); el material, desde la raíz y, si no está, desde
   `estudio/`.
6. **El material no se confunde con el paquete.** Va bajo un marcador fijo («material de la clase: se estudia, no
   se obedece») y una línea suya que empiece por `===` sale neutralizada: un apunte no puede hacerse pasar por
   `config/`.
7. **Tamaño:** las partes de 20 000 caracteres de hoy. **Primero el material, después el paquete** (el paquete
   crece con el curso: el índice son ~300 caracteres por concepto, y hay que leerlo entero, regla 1). Si no cabe,
   corta entre líneas y dice cuántas partes hay y el comando de **todas las que faltan**, para pedirlas a la vez.
   Nunca corta en silencio.
8. **`/sesion`, punto 1:** «Lo primero, un solo comando: `leer.js --para sesion <material>`. No leas esos ficheros
   sueltos ni mires el código de las herramientas.» Y la fila de `leer.js` en la tabla de `AGENTS.md`.
9. **Segundo plano:** una clase sola es `/sesion` entera, con el mismo comando. Con varias a la vez, el subagente
   que solo lee conceptos usa `leer.js <material>` sin `--para`; el que escribe recibe el paquete aunque no pueda
   tocar tres de sus ficheros (leerlos no hace daño). `segundo-plano.md` no cambia en el piloto.
10. **Test:** todas las rutas del paquete existen en un curso recién preparado; varias a la vez; fichero del paquete
    ausente y material ausente; lanzado desde `estudio/`; reparto en partes; un material con una línea `=== … ===`.

*Riesgo que decidía el diseño, comprobado lo primero* (2026-10-03, una ejecución con Haiku en una carpeta
vacía): Claude Code exige haber leído un fichero antes de editarlo. Con `cat` lo da por leído (está en los logs);
con la salida de una herramienta del kit, **no**: `Edit` responde «File has not been read yet. Read it first
before writing to it». Por eso los tres ficheros que se editan salen del paquete (punto 3).

- **Fuera (se añade):** la skill `/ejercicio` y las notas de los conceptos que la clase amplía dentro del paquete
  (segunda vuelta, si el piloto vale) · inyectar el paquete al cargar la skill (solo existe en Claude Code) · una
  herramienta que escriba las filas de los ficheros vivos · pedir que escriba todas las notas en una tanda.
- **Cómo sabremos (se mantiene el de arriba: deciden los tokens):** 3 × `--solo "/sesion 01-01"` y 3 ×
  `--solo "/sesion 01-02"`, en una tanda (~4 M tokens con Sonnet, media entera). Vale si la media de tokens baja
  más del 9 % en las dos clases, contra 441 K / 551 K y 772 K / 786 K. Las llamadas antes del primer fichero
  escrito (hoy 3–4 y 3–6; se espera 2 en la 01-01 y hasta 3 en la 01-02, que lee además `/ejercicio`) se apuntan
  para explicar el resultado, no para decidirlo. **Previsión: en el borde; puede salir «se descarta».**
- **Lo que el piloto no mide (por decidir con Roberto):** los permisos denegados (1 caso en 4 ejecuciones de
  `/sesion`: el «de 3–4 a 0 en una entera» queda para cuando `/repaso` y `/examen` usen `leer.js` con varios
  ficheros) · un curso grande (las dos clases de la prueba tienen el índice casi vacío; TODO: tamaño del paquete
  en un curso real de Roberto antes de extenderlo).
**Estado del piloto (2026-10-03, 00:01–00:10; rama `piloto-sesion`, sin commit).** Implementado: `leer.js` con
`--para sesion` y varios ficheros (17 tests), punto 1 de `/sesion`, fila de `AGENTS.md`. Medido con `--solo`, Sonnet,
aislado; las copias de la 01-02 salen de la entera de `auditoria-producto` (`3b077b9`). Cuota: 5 h del 31 % al 38 %,
semanal del 13 % al 14 % (seis ejecuciones y la sonda de Haiku).

| Clase | Línea base (llamadas · K) | Con la herramienta (llamadas · K) | Media de tokens |
|---|---|---|---|
| 01-01 | 10 · 441 y 12 · 551 | 13 · 608, 8 · 355, 9 · 386 | 496 → 450 K (**−9 %**) |
| 01-02 | 14 · 772 y 14 · 786 | 12 · 643, 11 · 526, 15 · 807 | 779 → 659 K (**−15 %**) |

- El criterio se cumple por los pelos en la 01-01 (justo el 9 %) y con margen en la 01-02; pero con tres ejecuciones
  y una dispersión de 355 a 608 K en la misma clase, **los tokens no deciden**. Lo que sí se ve: no empeora, y el
  profesor usó el comando en las 6 de 6, como se diseñó (en la 01-01, 2 de 3 veces escribió a la segunda llamada).
- **Lo que sigue leyendo antes de escribir, en la 01-02** (1–4 llamadas de `cat … | head`, no denegadas): la skill
  `/ejercicio` y `ejercicios/_index.md`; una nota de concepto, la sesión anterior y sus flashcards **como ejemplo de
  formato** (prefiere lo hecho a la plantilla); `config/ajustes.json`; y en 2 de 3, `config/curso.md` y
  `config/profesor.md` por `cat`, porque esa vez no los leyó junto a la skill (la suposición de dejarlos fuera del
  paquete falla en 2 de 6: incluirlos cuesta ~2 K tokens por llamada; dejarlos fuera, una llamada de ~45 K cuando
  pasa). `guardar.js --empezar` fue a veces en llamada propia.
- **Permisos denegados en `/sesion`: 2 en 6** (`cd … && sed -n` para mirar las líneas que marcó `comprobar.js`; un
  `sed -i`). Ninguno es lectura del arranque: la herramienta no los toca, como estaba previsto.
- **Segunda vuelta (Roberto, 2026-10-03: «adelante»).** El paquete pasa a llevar lo que los logs decían: los tres
  `config/*.md`, `ajustes.json` y `estructura.json`, la auditoría, las tres plantillas, **la última sesión ya hecha
  con sus flashcards y uno de sus conceptos** (el formato real, que el profesor prefiere a la plantilla) y, al final,
  `ejercicios/_index.md` y la skill `/ejercicio` (lo más largo y lo último que se usa: si no cabe en una parte, que
  falte eso). La skill dice que `guardar.js --empezar` va con las primeras notas, no en llamada aparte, y que no
  busque más ejemplos ni liste carpetas. Con el curso de ejemplo terminado, el paquete solo ya son 2 partes.
  Medida: 3 + 3 otra vez, misma línea base (00:16–00:29; cuota 5 h del 41 % al 47 %).

  | Clase | Línea base | Primera vuelta | Segunda vuelta |
  |---|---|---|---|
  | 01-01 | 496 K (10, 12 llamadas) | 450 K (13, 8, 9) · **−9 %** | 513, 879, 512 → 635 K (10, 15, 10) · **+28 %** |
  | 01-02 | 779 K (14, 14) | 659 K (12, 11, 15) · **−15 %** | 847, 494, 908 → 750 K (14, 9, 15) · **−4 %** |

  **La segunda vuelta sale peor que la primera.** Lo que se gana en lecturas (en la 01-01 escribe a la 2.ª o 3.ª
  llamada, el mínimo; en la 01-02 a la 3.ª o 4.ª) lo pierde el paquete grande: con la skill `/ejercicio` y los
  ejemplos ya son 2 partes (una llamada más) y cada llamada posterior arrastra ~8 K tokens más de contexto, unas 10
  veces. `guardar.js --empezar` siguió en llamada propia en 6 de 6, aunque la skill dice lo contrario. Y la
  dispersión (512 a 879 K en la misma clase, por lo que pasa al escribir y corregir) hace que 3 ejecuciones no
  distingan un ±9 %.
  **Lo que decide:** cada K que entra en el paquete se paga en todas las llamadas de después; solo compensa lo que
  evita una llamada entera. **Recomendación (sin aplicar; Roberto cerró por hoy):** volver al paquete de la primera
  vuelta (estructura, auditoría, plantillas; los tres `config/*.md` fuera, porque suelen venir ya con la skill) y
  quitar los ejemplos y la skill `/ejercicio` del paquete; dejar `leer.js` con varios ficheros para `/repaso` y
  `/examen`. Luego, lo que de verdad pesa: las 7–9 llamadas de escribir, comprobar y corregir.
- **Vuelta al paquete pequeño (2026-10-03, tarde; sí de Roberto; sin commit).** `PAQUETES.sesion` = estructura,
  auditoría y las tres plantillas; fuera los `config/*.md`, `ajustes.json`, los ejemplos y `/ejercicio` (el punto 6
  vuelve a «léela antes del primero»). Quitada la frase de `guardar.js --empezar` (0 de 6 la siguió). `leer.test.js`
  18/18. La suite entera falla en `preparar.test.js` (y `guardar` solo dentro de la suite) por el entorno, no por
  esto: el curso de los tests ve `M .claude/worktrees/prueba-aislada`, un worktree que sigue en el disco. **Arreglado:**
  `preparar.test.js` y `extremo-a-extremo.test.js` no copian `.claude/worktrees/` (suite 843/844, 0 fallos). Los
  worktrees se quedan como histórico (Roberto); se borran al cerrar esta línea de trabajo. Ojo: `prueba-aislada`
  (`4b3bb2a`) no está en ninguna rama remota ni en `piloto-sesion`.
- **Codex, `--solo "/sesion 01-01"` con el paquete pequeño (2026-10-03, 16:41):** 1/1, 0 permisos denegados, 0
  errores de `comprobar.js`, 208 s, 283 K tokens (sin línea base de Codex: dato, no resultado). Usó `leer.js --para
  sesion` en su 2.ª llamada y los tres ficheros que edita en la misma tanda. El primer intento falló por el sandbox
  de Codex (no por el kit). **Piloto cerrado: se queda.** Ahorra poco (−9 % / −15 % con Claude, en el borde del
  ruido), no empeora y funciona en los dos asistentes. Lo que pesa son las 7–9 llamadas de escribir: siguiente diseño.
- **Bandeja:** con Codex, `AGENTS.md` («Otro asistente») le hace leer `cambiar-de-asistente.md` y `ESTANDARES.md`
  en cada `/sesion`, aunque no cambie de asistente.
- **Bandeja:** analizador de incumplimientos de `AGENTS.md` (shell para editar, `&&`, `git commit` a mano, sin
  `guardar.js`) sobre el log de `prueba-real`, en vez del mod de Claude Code que se propuso en otra conversación
  (el mod solo sirve en `pruebas-local` interactivo). Después del piloto.

- **Abogado del diablo:** ronda corta 2026-10-02, 5 objeciones, las 5 aplicadas al diseño de arriba: 1) el paquete
  crece con el curso → material primero, todas las partes a la vez, y el límite declarado (no se recorta el
  índice: la regla 1 pide leerlo entero) · 2) «de 3–6 llamadas a 2» era una medida hecha a la medida de la
  herramienta e imposible en la 01-02 → vuelven a decidir los tokens · 3) material y paquete en una salida con un
  separador que el material puede imitar → marcador fijo y neutralizar · 4) rutas según desde dónde se lance y
  material ausente que pasaba por hueco → raíz del curso y error · 5) el segundo plano no estaba → punto 9, y la
  comprobación con Haiku incluye editar tras el comando.

**Línea base (medida en los logs, 2026-10-02).** Claude: `~/.claude/projects/*profesor-kit-prueba-<id>*`
(`usage` de cada respuesta). Codex: `~/.codex/sessions/2026/10/02/` (`token_count` y `rate_limits`). Los guiones
de medida no están en el repo todavía (TODO: `pruebas/coste.js`, en la rama del piloto).

- **Claude (Sonnet), entera 16/16, `88ada91`:** 17,5 min · 162 llamadas · 9,5 M tokens de entrada (0,94 M escritos
  en caché, 8,56 M leídos de caché) · 182 K de salida. Otras 4 enteras del 1 y 2 de octubre: 14–27 min, 130–217
  llamadas, 7,6–13 M. No dura 1 h. El % de cuota no sale en los logs (TODO: `/cuota` antes y después).
- **Contexto fijo por llamada («suelo»):** 36 K con Claude (29 K en subagentes), 19 K con Codex. Suelo × llamadas
  = 61 % del total con Claude, 51 % con Codex. La prueba lanza `claude -p` con la configuración personal de Roberto
  (su `CLAUDE.md` global, sus skills y conectores), que un alumno no tiene.
- **De qué está hecho el suelo de 36 K con Claude** (medido 2026-10-02 con `claude -p` en una carpeta vacía, Sonnet,
  una llamada por caso): Claude Code solo, 15,9 K (`--setting-sources project,local --strict-mcp-config`) · la
  configuración personal de Roberto, 9,2 K (7,1 K de usuario + 2,1 K de conectores; tal cual son 25,1 K) · el kit
  (`AGENTS.md`, listado de skills), ~11 K por diferencia. Un alumno sin configuración propia: ~27 K. Aislar la
  prueba con esos dos flags (`pruebas/lib/asistentes/claude-code.js:13`) quitaría ~9 K × 162 llamadas ≈ 15 % del
  total y la haría representativa.
- **Comprobado con una entera aislada (rama `prueba-aislada`, `4b3bb2a`, 2026-10-02):** 16/16, corrección 6/6, 14 min ·
  151 llamadas · 7,47 M de entrada (antes 9,5 M: −21 %, parte por menos llamadas, que varían solas) · suelo 27 K en
  primer plano (antes 36 K); la preparación en segundo plano sigue en 36 K, porque la lanza el kit y no la prueba.
  Cuota de Claude: la ventana de 5 h pasó del 2 % al 13 % y la semanal del 10 % al 11 %, **con esta conversación y
  otra gastando a la vez**: una entera con Sonnet cuesta como mucho 11 puntos de ventana en el plan de Roberto.
  Salieron 3 permisos denegados (antes 1): el profesor lanzó `node -e`, `sed -i` y un `cd … && for … cat`, justo lo
  que `AGENTS.md` prohíbe. TODO: ver si la configuración personal los tapaba o es variación entre ejecuciones.
- **PR #82** (`aviso-varias-clases`): mezclado el 2026-10-02 (`c675760`). No sube versión: falta su línea en el
  CHANGELOG de la siguiente.
- **Informe de toda la sesión, con el registro de pruebas:** `docs/auditoria/2026-10-02-coste-de-la-prueba-real.md`.
- **Por paso, Claude** (llamadas · tokens · segundos): `/sesion 01-01` 10 · 527 K · 76 · `/sesion 01-02` 15 ·
  1.044 K · 171 · `/dudas` 9 · 424 K · 49 · `/ejercicio` 11 · 591 K · 84 · referencia del centro 5 · 239 K · 19 ·
  examen (generar + revisor) 18 · 1.212 K · 223 · corregir 12 · 634 K · 49 · examen otra vez (+ revisor) 18 ·
  1.238 K · 171 · corrección fija 15 · 838 K · 72 · `/repaso` 10 · 652 K · 132 · preparar 02-01 y 02-02
  (coordinador 19 + subagentes 20) 39 · 2.095 K · ~4 min.
- **Codex (Plus), `62c67a4`, 12 de 16 pasos:** 18 min · 122 llamadas · 4,64 M · 98 % de la ventana de 5 h y ~16 %
  de la semanal. `/sesion 01-01`: 9 llamadas · 314 K · 8 % de ventana. Coordinador de dos clases: 40 llamadas ·
  1,83 M + 0,86 M de sus subagentes = 58 % del total (con Claude, el 22 %: el problema del coordinador es de Codex).

**Lo que dice la documentación de Claude (consultada 2026-10-02; sin doc oficial para Codex):**

- Memoria (`CLAUDE.md`/`AGENTS.md`): objetivo < 200 líneas; el nuestro tiene 310. Los `@imports` no ahorran (se
  cargan al inicio); sí ahorra mover flujos concretos a skills o guías que se leen bajo demanda.
  <https://code.claude.com/docs/en/memory>
- Skills: `SKILL.md` < 500 líneas, el resto en ficheros de referencia a un nivel; mejor un script que se ejecuta y
  devuelve todo (solo su salida gasta) que lecturas sueltas. Es el piloto de `/sesion`.
  <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>
- Evaluar: escenarios antes que la skill, al menos 3, y probar con Haiku, Sonnet y Opus (misma página).
- Medir: `claude -p --output-format json` ya trae `usage` y `total_cost_usd` por ejecución, y la prueba real ya lo
  lanza así: el coste por paso puede ir al `RESUMEN.md` sin guiones aparte. <https://code.claude.com/docs/en/headless>
- Analizar sin ejecutar: `/doctor prompt-audit` busca contradicciones y referencias rotas entre `AGENTS.md`, reglas
  y skills (una llamada). `/skill-doctor` solo da uso y coste de listado. `claude plugin eval` exige empaquetar las
  skills como plugin: en espera. <https://code.claude.com/docs/en/plugin-evals>

**Borrador del diseño por piezas (2026-10-02, mañana), en espera:** faltan las decisiones D1–D5 y aplicar la ronda
del abogado del diablo. Sustituiría al punto 5 del mantenimiento nocturno y cambiaría la regla «prueba real entera
antes de cada release» de `.claude/rules/desarrollo.md` (Roberto, 2026-10-02: «nos está matando en el desarrollo»).

**Por qué.** La prueba real comprueba por código propiedades de lo que queda en disco (`pruebas/lib/pasos.js`); lo
caro no es comprobar, es volver a generar el curso entero con el LLM para poder comprobarlo.

- `cambio-grande.js` exige la entera en cada PR que toca `.kit/skills/`, `AGENTS.md` o `.kit/plantillas/`, y
  `AGENTS.md` cambió en 6 de las 8 últimas releases (0.22.3 → 0.29.0).
- Con Codex (plan Plus, 2026-10-02, `62c67a4`): la entera llegó al 98 % de la ventana de 5 h con 4 pasos por hacer,
  y gasta un 16–20 % de la cuota semanal. No cabe en una ventana. Con Claude: TODO medir (Roberto: ~1 h).
- Los PR automáticos del mantenimiento nocturno no pueden pagar una entera.

**La idea.** Cada pieza de la prueba parte de un estado del curso guardado en el repo, no de lo que generó el paso
anterior en esa misma ejecución. Se paga solo la pieza que el cambio toca.

1. **Referencias en el repo.** El curso tal como queda tras cada paso (`config/` + `estudio/`, sin `.git`), en
   `pruebas/curso-ejemplo/referencias/<paso>/`. Hoy esas copias existen, pero en `pruebas-local/` (ignorado por git)
   y solo valen para `--solo` y `--desde`. Las genera una prueba entera («regenerar referencias»). Pasan por las
   migraciones como el curso de un alumno (`prueba-actualizar`).
2. **Piezas.** `prueba-real.js --pieza <nombre>`: restaura la referencia de entrada, ejecuta los pasos de la pieza
   con el LLM y pasa las mismas comprobaciones de hoy. Propuesta inicial (TODO: contrastar con
   `construirDefinicionDePasos`): `sesion` (01-01 + la trampa) · `sesion-siguiente` (01-02) · `segundo-plano`
   (lanzar, juntar, conceptos compartidos) · `dudas` · `ejercicio` · `examen-generar` (referencia + generar) ·
   `examen-corregir` (contestar, corregir, progreso con prueba) · `examen-otra-vez` · `correccion-fija` · `repaso`.
3. **Mapa de dependencias**, como datos (`pruebas/piezas.json`): qué rutas invalidan qué piezas. `.kit/skills/<x>/`
   → las piezas de `<x>`; cada plantilla y cada guía → las piezas que la usan; `AGENTS.md` → según D2.
4. **`cambio-grande.js` por piezas.** Para cada pieza que el diff del PR invalida, el `RESUMEN.md` trae una línea
   `pieza · modelo · commit · resultado` en verde, de un commit que incluye el último cambio de sus dependencias.
   Las piezas que el PR no toca no se repiten.
5. **Tres niveles** (la idea de Roberto del 90 / 75–90 / <75, sobre comprobaciones por código y no sobre un
   porcentaje de parecido): todas las comprobaciones de la pieza pasan → vale · pasan, pero `comprobar.js` da más
   avisos pedagógicos que la referencia → alerta en el PR, no bloquea, se valora una entera · falla → se repite la
   pieza una vez; si vuelve a fallar, bloquea, y si no se explica, toca la entera.
6. **Modelos** (D3): la pieza se ejecuta con dos modelos de los extremos del rango. Antes, línea base: todas las
   piezas con Haiku sobre `main` sin cambios; la que Haiku no pasa hoy no se le exige (queda apuntada, no se «arregla»).
7. **Codex: prueba corta**, con las piezas que dependen del asistente (`sesion`, `segundo-plano` con una clase,
   `examen-generar`, `examen-corregir`). Obligatoria solo si el PR toca `.kit/adaptadores/`, `pruebas/lib/asistentes/`
   o las guías de segundo plano y de cambio de asistente; el resto, entera periódica que no bloquea (TODO: cada
   cuánto). La prueba para al primer límite de uso y el `RESUMEN.md` dice el motivo (hoy dice «código 1»).
8. **La entera** deja de ser de cada release. Se lanza para regenerar las referencias (D4) y cuando una pieza falla
   dos veces sin explicación. La release exige todas las piezas en verde contra sus dependencias actuales (prueba
   acumulada entre PRs), no una ejecución entera ese día.

**Fases.** 0) Medir, en una sola tanda y sin cambiar ninguna regla: tamaño de las referencias; cada pieza desde su
referencia sobre `main` sin cambios, 3 veces con el modelo recomendado y 3 con Haiku → cuántas pasan (lo que varía
solo) y qué cuesta cada una · 1) referencias al repo, `--pieza` y `piezas.json` · 2) `cambio-grande.js` por piezas,
`RESUMEN.md` por pieza, y las reglas (`.claude/rules/desarrollo.md`, `CONTRIBUTING.md`, puntos 5 y 6 del
mantenimiento nocturno) · 3) segundo modelo y nivel de alerta · 4) prueba corta de Codex y parada por límite de uso ·
5) `AGENTS.md` (D2).

- **Fuera:** un porcentaje de parecido con la referencia o un LLM que juzgue, como puerta (parecido no es correcto:
  un examen con la clave mal sale casi igual; y el juez cuesta y también varía) · abaratar el coordinador de varias
  clases (rama propia, midiendo antes y después; el aviso al alumno va en la rama `aviso-varias-clases`) · que corra
  en Actions (fase 3 del mantenimiento nocturno, que se apoya en esto) · cambiar qué comprueba cada paso · pagar la
  prueba de Codex por API.
- **Cómo sabremos:**
  - Un PR que solo toca `.kit/skills/examen/` pasa el CI con las piezas de examen y nada más (TODO tras la fase 0:
    tiempo y cuota objetivo).
  - **Fallo plantado:** se quita a propósito una regla de una skill (p. ej. las 4 opciones del examen) y su pieza
    falla; lo mismo con una sección de `AGENTS.md` y las piezas que le tocan. Si no falla, el método no vale.
  - Una pieza sin cambios pasa al menos 9 de cada 10 veces (medido en la fase 0); la que no, se arregla su
    comprobación antes de usarla como puerta.
  - Sale una release sin lanzar una entera ese día.
  - La prueba corta de Codex queda por debajo de media ventana de 5 h (se lee en `rate_limits`, en `~/.codex/sessions`).
  - En la siguiente regeneración de referencias (una entera), se cuenta cuántas piezas fallan estando en verde por
    piezas: eso mide lo que este método deja pasar.
- **Riesgos que se aceptan:** un fallo de interacción entre pasos se ve en la regeneración, no en el PR (no llega al
  alumno si la regeneración va antes de la release que toque, D4); las referencias envejecen (las escribió un motor
  anterior), que es justo como vive el curso de un alumno.
- **Decisiones abiertas** (de una en una, con Roberto):
  - **D1. Cuándo cambia una referencia.** Fija hasta la siguiente regeneración (recomendada: sin ruido en los diffs
    ni choques entre PRs en paralelo, y la pieza siguiente no cambia de entrada sin haberse probado) · o se actualiza
    cada vez que su pieza pasa (lo que propuso Roberto: «el siguiente paso parte de ahí»).
  - **D2. `AGENTS.md`.** Mapa por secciones `##` → piezas, sin mover texto (recomendada: no cambia el producto) · o
    mover a guías lo que es de un momento concreto. Solo «Cuando preguntas para medir» (38 de 310 líneas) es
    claramente separable; «Al empezar cada sesión» corre en todas las piezas y moverla no quita dependencia.
  - **D3. Modelos.** El recomendado del adaptador + Haiku tras la línea base (recomendada) · o Haiku + Opus siempre.
  - **D4. Cuándo es obligatoria la entera.** TODO: cada N releases, o cuando cambie el formato de los datos (migración).
  - **D5. Codex.** La prueba corta no bloquea la release salvo que el PR toque lo suyo (punto 7).
- **Abogado del diablo:** ronda completa 2026-10-02, 5 objeciones, **sin aplicar todavía** (pendiente de que Roberto
  decida si el plan se reduce). `@diablo` abierto: el plan no se cierra.
  1. Las piezas no reproducen los fallos de interacción: el choque de `tasa-de-ahorro.md` del 2026-10-01 (examen en
     primer plano mientras la 02-02 se preparaba) lo cazó la entera, y la pieza `segundo-plano` no lo vería. Las
     referencias necesitan además `.git` y `estado.json`. Y el riesgo aceptado se apoya en D4, que es TODO.
  2. El mapa miente por omisión: no cubre las herramientas que el LLM ejecuta dentro de cada pieza, los adaptadores,
     `motor.json` ni el propio arnés. Arreglo: cerrado por defecto (ruta sin mapear → todas las piezas) y un test.
  3. D2 mal recomendada: `AGENTS.md` se lee entero en cada llamada y sus secciones se citan entre sí. Arreglo:
     `AGENTS.md` invalida todas las piezas; medir sobre los 6 diffs cuántos habrían tocado una sola.
  4. La fase 0 no mide lo que decide: 3 ejecuciones no sostienen «9 de cada 10», reintentar tapa regresiones y el
     fallo plantado solo prueba lo que el mapa ya conecta. Arreglo: revertir los arreglos de fallos conocidos
     (`mezcla.js`, conceptos compartidos, `examenes.json` de Codex, #54) y ver si alguna pieza los caza; reintentar
     solo fallos de infraestructura; una cifra de lo que se escapa que obligue a volver a la entera.
  5. Hay una opción más barata que casi existe: `--solo` de lo tocado como puerta del PR y la entera solo en la
     release (admitiendo `--desde` sobre el mismo commit). Referencias en el repo, dos modelos y quitar la entera de
     la release, solo si la fase 0 lo justifica.

## Siguiente: mantenimiento nocturno con Claude

Decidido con Roberto (2026-10-02). Que los issues y Dependabot avancen solos de noche, con la cuota de la
suscripción y sin el Mac de Roberto, y que la prueba real deje de bloquear cada PR. Piloto: este repo; los demás
(casi todos privados, sin proteger `main`) copian los ficheros cuando funcione aquí. Los cursos solo se actualizan
por release (`actualizar.js`, nunca `main`): un merge automático no llega a ningún alumno hasta que Roberto publica.

1. **Interruptor y cuota.** Variable del repo `CLAUDE_NOCTURNO`: todo workflow que use Claude la mira lo primero
   y, con `off`, termina sin gastar. Se cambia desde el móvil (*Settings → Variables*) o con
   `gh variable set CLAUDE_NOCTURNO --body off`. Claude con la suscripción (`claude setup-token`, el secreto lo pone
   Roberto), `anthropics/claude-code-action` fijada por sha, límite de turnos y timeout por job. Los PRs se crean y
   se mergean con la GitHub App `rsotor-bot` (firma como bot; contents, PRs e issues en escritura, workflows sin
   acceso; secreto `BOT_PRIVATE_KEY` y variable `BOT_CLIENT_ID`; `actions/create-github-app-token` ya no admite bien el App
   ID), comprobado con el workflow `bot`, con un token temporal por
   ejecución (`actions/create-github-app-token`). Nunca con `GITHUB_TOKEN`: lo que este crea no dispara
   `tests.yml` y `tests-ok` no llegaría a correr.
2. **Dependabot sin Claude.** Patch y minor con `tests-ok` en verde → auto-merge (`dependabot/fetch-metadata` +
   `gh pr merge --auto`, con `GITHUB_TOKEN`: un workflow de Dependabot no ve los secretos del repo y su merge no
   tiene que disparar nada). Solo npm; las Actions (tocan `.github/workflows/`) y los major se quedan abiertos. `--auto` solo espera checks
   donde `main` tiene checks obligatorios; en los repos sin proteger, un job comprueba `gh pr checks` en verde y
   después mergea.
3. **Issues: etiquetas** (documentadas en `CONTRIBUTING.md` y en la descripción de cada etiqueta en GitHub):

   | Etiqueta | La pone | Qué pasa |
   |---|---|---|
   | `feedback` / `instalación` / `mejora` | La plantilla | Sin una de ellas, un script sin LLM pide usar la plantilla |
   | `claude:go` | Roberto (o issue abierto por `rsotor`) | Entra en la cola. El workflow comprueba quién la puso. Claude lee el cuerpo del issue y solo los comentarios de `rsotor` |
   | `t:s` / `t:m` / `t:l` | Claude al clasificar (solo con `claude:go`), o Roberto | Tamaño |
   | `p:alta` / `p:baja` | Claude al clasificar (solo con `claude:go`), o Roberto | Prioridad dentro de su grupo |
   | `claude:propuesta` | Claude | `t:l`: propuesta en un comentario con `@rsotor`; para |
   | `claude:aprobado` | Roberto | Implementa la propuesta; el PR lo mergea Roberto |
   | `claude:bloqueado` | Claude | Pregunta en el issue con `@rsotor`; sigue cuando Roberto responde |

4. **Cola nocturna** (cron 03:00 Madrid, concurrencia 1). Presupuesto por noche en puntos: S = 1, M = 3,
   propuesta L = 1, implementar L aprobada = 5, prueba real de un paso = 2; tope inicial 6, y la prueba cuenta
   dentro del tope. Orden: lo que Roberto desbloqueó (aprobado o
   respondido) → `feedback` e `instalación` por prioridad → `mejora`. Rama `claude/issue-<n>`, PR enlazado.
   **Auto-merge** de S y M solo si: `tests-ok` en verde, prueba parcial en verde si toca skills, y diff por debajo
   del umbral (TODO: fijar líneas y ficheros). **Nunca** si toca lo que se ejecuta en el equipo del alumno o decide
   sus permisos: `.github/`, `.claude/`, `.kit/herramientas/`, `.kit/motor.json`, `AGENTS.md`, `package.json` y
   lockfiles. Eso queda en PR para Roberto. Antes de la fase 3 (prueba parcial), tampoco `.kit/skills/` ni
   `.kit/plantillas/`: `cambio-grande.js` exige la prueba entera.
5. **Prueba real por partes** (se apoya en `--solo` y las copias de la rama de la #56):
   - Por PR nocturno: según las rutas, solo el paso de la skill tocada (2 puntos); solo herramientas → ninguna.
     Nunca una entera de noche por un PR: lo que toca `AGENTS.md` o `.kit/plantillas/` espera a la de la release.
     `cambio-grande.js` acepta un resumen `--solo` del paso que toca (cambio de la fase 3).
   - Las copias por paso de la última prueba entera se guardan en GitHub (artifact), no solo en `pruebas-local/`.
     Si esa prueba es de hace más de N commits de skills (TODO: fijar N), toca una entera.
   - Antes de cada release: entera y sobre el commit que se publica, como pide `.claude/rules/desarrollo.md`.
     Corre en Actions, no en el Mac.
6. **Release semiautomática.** Un workflow mantiene abierto el PR de versión (`.kit/VERSION` + notas de
   `release-notas.js`). Solo se puede mergear con la prueba real entera en verde sobre ese commit; Roberto da el
   clic. El PR lista aparte los commits auto-mergeados desde la última release, para que ese clic sea una revisión. Siguen valiendo «nunca dos releases el mismo día» y «los cambios se juntan».
7. **Informe:** un issue fijado por mes (al cambiar de mes se cierra el anterior), con lo que espera a Roberto y una
   línea por noche. Un único comentario vivo que menciona a `@rsotor` solo cuando algo le espera (el email).

Fases: 0) interruptor, etiquetas, documentación y Dependabot (sin Claude) — **hecha** (2026-10-02, PR #71) · 1) cola de issues sin auto-merge,
dos semanas — **en PR**: `.github/workflows/nocturno.yml` + `.github/cola-nocturna.js`; Claude no tiene `gh` ni red y deja `resultado-issue.json`, que publica un paso sin LLM · 2) auto-merge de S y M · 3) prueba real por partes en Actions · 4) release semiautomática · 5) copiar
a los demás repos.

- **Fuera:** los demás repos hasta la fase 5; releases sin el clic de Roberto; auto-merge de L; ejecutar Claude
  sobre código de forks o issues de otros sin `claude:go`; medir la cuota restante (no hay forma con suscripción).
- **Cómo sabremos:** con `CLAUDE_NOCTURNO=off` ningún job llama a Claude (se ve en el log); en la fase 1, la
  clasificación (tamaño, prioridad, propuesta o no) coincide con la de Roberto en 9 de cada 10 issues; en la fase
  2, dos semanas sin revertir un merge automático; un PR que toca solo `/examen` pasa con la prueba del paso del
  examen, sin la entera; la primera release semiautomática sale sin lanzar nada en el Mac.
- **Iterar sobre un PR del bot:** hoy no lee los comentarios del PR (se cierra y la revisión va al issue, ver
  `CONTRIBUTING.md`). Primera prueba: #68, rehecho tras cerrar el #85 (2026-10-03). Si sale bien y pasa a menudo,
  que la cola entre también en issues con PR abierto y revisión nueva de Roberto en el PR.
- **Decisiones abiertas:** TODO: cuánta cuota gasta un punto (se mide la primera semana y se ajusta el
  tope); TODO: umbral de diff y N de la prueba entera.
- **Abogado del diablo:** ronda completa 2026-10-02, 5 objeciones, todas aplicadas (exclusiones del auto-merge,
  orden de fases con `cambio-grande.js`, prueba real dentro del tope, token y `--auto` en GitHub, prueba entera en
  cada release y clasificación solo con `claude:go`).

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
  de guardar la clave. Causa: lo lanzó desde Obsidian con Claudian, que trabaja desde `estudio/` (el atajo del kit
  abre desde la raíz). Propuesta (rama aparte, tras cerrar la #56): `/examen` escribe primero la clave y, si no puede,
  no crea el examen y ofrece `permisos.js --aplicar`; y probar nosotros si Claudian respeta esos permisos (con Claude
  Code aquí; con Codex, en el Mac). Sin comentario en la issue: quien la abrió no sabría contestarlo (Roberto,
  2026-10-01).
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
   - 2026-10-02, prueba real de la 0.29.0 (88ada91): 1 denegado en `/examen (corregir)`,
     `rm estudio/progreso.md.tmp && git status --short` (fichero temporal propio, borrado con shell y encadenado). Misma
     familia; no tumbó el paso.
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
