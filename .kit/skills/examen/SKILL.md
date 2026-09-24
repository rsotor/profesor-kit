---
name: examen
description: Use when the student wants an exam or test to check what they have mastered, including the final exam or the next step of it. Triggers on "/examen", "vamos a validar los bloques 1 y 2", "ponme un test", "prepárame el examen", "examen final", "vamos a prepararnos", "quiero hacer el siguiente escalón". Not for two or three quick questions in the chat ("hazme unas preguntas"), which is the warm-up in conversation, no skill.
---

# Modo examen

**Antes de nada:** lee `config/curso.md`, `config/profesor.md`, `config/alumno.md` y `config/examenes.json`
(regla común de `AGENTS.md`). Si `config/examenes.json` no existe, usa los valores por defecto de
`.kit/herramientas/lib/examenes.js` (`POR_DEFECTO`) tal cual: no hace falta crearlo a mano, `examen.js` los
aplica solo.

**Solo tipo test.** Todo examen nuevo se contesta con casillas (`- [ ] a) …`); lo corrige el código, no tú.
Los exámenes de antes de esta versión (con huecos `✍️ **Tu respuesta:**`) siguen existiendo tal cual: si el
alumno quiere corregir uno de esos, sigue el apartado "Exámenes de antes" al final. **Solo se lanza cuando
lo pide** — no forma parte del ciclo normal de una sesión.

## 1. Qué tipo de examen

`config/examenes.json` tiene los tipos con nombre (`opciones`, `resta_fallo` y, por tipo, `preguntas` y
`aprobado` — el final trae `escalones`, una lista con `preguntas` y `aprobado` crecientes). Elige según lo
que pida o el momento:

| El alumno dice… | Tipo | Cuándo se ofrece tú, sin que lo pida |
|---|---|---|
| "de lo que me falta de la 1.2" | `lo-que-falta` | Cuando `estudio/inicio.md` enseña "📝 faltan N" en una sesión |
| "el examen del módulo 1" | `modulo` | Al terminar un módulo (todas sus sesiones estudiadas) |
| "quiero examinarme de todo el trimestre" | `trimestre` | Rara vez lo ofreces tú: casi siempre lo pide el alumno |
| "examen final", "vamos a prepararnos" | `final` | Todas las sesiones del curso estudiadas, o a 30 días o menos de la fecha de examen de `config/curso.md` (## Fechas) |

**El examen final es aparte.** No pone nota a ninguna unidad, no marca `estudiada`, no cuenta para el 🏁 de
`estudio/inicio.md` ni para "mi perfil". Se puede pedir sin haber hecho los exámenes de módulo — puedes
decir que lo desaconsejas ("todavía no has hecho el examen del módulo 2; puedes ir al final igual, pero
tendrás menos hecho"), nada te lo impide.

**Escalera del final.** `estudio/inicio.md` enseña, en la línea 🎯, el escalón pendiente y su aprobado, o la
fecha en que se superó el último. Si el alumno pide "el siguiente escalón" o "prepararme para el final" sin
más, es ese escalón pendiente. Si suspende un escalón, se repite (versión nueva, mismo escalón) hasta
aprobarlo; solo entonces se pasa al siguiente.

**Si el alumno quiere cambiar la configuración** ("que el examen del módulo sean 20 preguntas", "que reste
medio punto por fallo"), edítala en `config/examenes.json` con tu herramienta de ficheros. Solo afecta a los
exámenes que se creen desde ahora: los ya escritos guardan su propia configuración en su clave (más abajo).

## 2. Alcance

En los bloques del temario de `config/curso.md` (usa el nombre que allí se emplee: bloques, módulos,
semanas…). `/examen 1-3` = bloques 1 a 3. `/examen 7` = bloque 7. Si no lo dice, pregunta qué bloques.

**"Lo que me falta".** El alcance son **solo** los conceptos de esa sesión o unidad que en
`estudio/progreso.md` no tienen la teoría en ✅. Al alumno llámalo siempre "test", nunca "examen": mueve
`estudio/progreso.md`, pero no pone nota a la unidad, y al terminar **no** le ofrezcas las dos preguntas de
"el alumno también corrige al profesor" (apartado 6) — para 3-5 preguntas no hay muestra suficiente.

## 3. Componer las preguntas

Todas de opción múltiple, con las opciones de `config/examenes.json` (`opciones`, 4 por defecto). Lee las
notas de los bloques y `config/alumno.md`. Reparto:

| Origen | Peso | Por qué |
|---|---|---|
| Errores repetidos de `config/alumno.md` | 40 % | Es lo que va a fallar de verdad |
| Conceptos `dificultad: 3` | 25 % | Aún no están fijados |
| Fórmulas de `estudio/formulario.md` | 20 % | Se olvidan con el tiempo |
| Cobertura del resto | 15 % | Que no quede un hueco entero sin tocar |

Si `estudio/formulario.md` está vacío, su 20 % pasa a cobertura (35 %). Si el alumno es nuevo y no tiene
errores repetidos, su 40 % pasa también a cobertura (55 %).

**Máximo 3 preguntas por concepto** en todo el examen (en un curso pequeño, salen menos).

**Distractores de verdad**: la opción incorrecta es el error típico de la nota o el concepto cercano con el
que se confunde — nunca una opción absurda que se descarta sola. Marca `*(elige una)*` cuando solo una
opción es correcta, `*(varias)*` cuando lo son dos o más (el alumno acierta solo si marca **todas** las
correctas y ninguna más).

**Dificultad según el propósito**: `lo-que-falta` < `modulo` < `trimestre` < `final`, y dentro del final,
cada escalón más que el anterior. Más difícil es **un caso más concreto o rebuscado** (2×2 frente a
132×122, una cesta de más productos, un periodo más largo), **nunca una trampa de redacción** — una
palabra que cambia todo el sentido y que un alumno que domina el concepto también pasaría por alto.

**Mide entender y distinguir, no memorizar la letra** ("Cuando preguntas para medir", `AGENTS.md`): el
caso antes que la pregunta, una cosa por pregunta, y las opciones se parecen entre sí (nunca una tan
distinta que se adivina sin saber el concepto).

**Todas las preguntas salen de las notas del curso**, salvo que hagan falta preguntas de más para llegar al
número del tipo: entonces, y **solo sobre conceptos que ya están en el temario**, puedes traer un caso de
internet, contrastado con las propias notas del curso y marcado como fuente externa en la explicación de la
clave (nunca en el enunciado, que el alumno sí ve). El examen tiene que poder hacerse sin conexión: la
consulta es cosa tuya al escribirlo, no del alumno al contestarlo.

## 4. Escribir el examen y su clave

**El examen**, en `estudio/examenes/<carpeta de la unidad>/<prefijo>-examen-YYYY-MM-DD.md` (o
`-final-YYYY-MM-DD.md` para el final). Sin estructura, directamente en `estudio/examenes/`.

Frontmatter:

    ---
    tipo: examen
    unidad: 01-02          # prefijo de la unidad; si abarca varias, lista: [01-02, 01-03]. En el final, no hace falta
    fecha: 2026-10-02
    nota:                   # la rellena examen.js al corregir
    intentos: 0             # la sube examen.js en cada corrección
    tipo_examen: modulo     # lo-que-falta · modulo · trimestre · final
    escalon: 1              # solo en tipo_examen: final
    aprobado: 6             # el aprobado de este tipo (o de este escalón) en config/examenes.json, copiado tal cual
    parcial: true            # solo en lo-que-falta
    ---

Cada pregunta, **numerada así, literal** (lo exige `comprobar.js` y `examen.js`):

    **1.** Un depósito de 1.500 unidades reparte 300 unidades de interés en un año.

    ¿Qué tipo de interés anual paga? *(elige una)*

    - [ ] a) 10 %
    - [ ] b) 20 %
    - [ ] c) 30 %
    - [ ] d) 300 %

**Nunca escribas la solución dentro del examen** — ni en un callout, ni al final: toda la clave vive fuera
de la bóveda. Un examen de módulo o trimestre puede llevar, si el curso tiene lente activada, la lectura
desde ese punto de vista al final; nunca decide qué se pregunta ni puntúa.

**La clave**, en `config/claves/<misma ruta relativa a estudio/examenes, en .json>` — por ejemplo, el examen
de arriba en `config/claves/modulo-01.../01-02-examen-2026-10-02.json`. Con la configuración con la que
nace el examen:

    {
      "opciones": 4,
      "resta_fallo": 0,
      "aprobado": 6,
      "preguntas": [
        { "correctas": ["b"], "explicacion": "300 ÷ 1.500 = 20 %.", "concepto": "tipo-de-interes" }
      ]
    }

Una entrada de `preguntas` por pregunta, **en el mismo orden**. `correctas`: la letra o letras que valen
(minúscula). `explicacion`: lo que lee el alumno al fallar (por qué la correcta es correcta; si la pregunta
viene de internet, aquí va la marca de fuente externa). `concepto`: el slug de `estudio/conceptos/`, o
`null` si la pregunta no es de un concepto concreto.

**En el examen final**, la clave lleva además `"escalones"` — el array **completo** de
`config/examenes.json → tipos.final.escalones` tal como estaba al escribir este examen (no solo el
`aprobado` de este escalón): así, si el alumno repite un escalón más adelante y mientras tanto cambia la
configuración, la escalera entera sigue siendo coherente consigo misma.

## 5. Corregir

Cuando el alumno diga "he terminado el examen" (o "corrígelo"), sus casillas ya están marcadas en la propia
nota. Ejecuta:

    node .kit/herramientas/examen.js --corregir <ruta del examen>

Corrige el código: compara las casillas con la clave, pone la nota (aciertos, menos `resta_fallo` por
fallo, sobre 10, truncada), escribe el histórico de intentos con la respuesta de cada pregunta y su
explicación, desmarca las casillas para poder repetirlo y, si aprueba un examen de módulo, marca
`estudiada: true` en las sesiones de su unidad. La segunda línea de su salida es un JSON:

    { "nota": 6.5, "aprobado": 6, "aprobo": true, "fallosPorConcepto": { "liquidez": 2, "inflacion": 1 } }

Con ese JSON, sin inventar nada más (el "por qué" de cada fallo ya está en el histórico, en la propia nota):

1. **Agrupa por concepto**, no por número de pregunta, y da el veredicto en el chat, en tres bloques:

   ```
   ✅ Dominado          → tasa-de-ahorro, funciones-del-dinero
   ⚠️ Hay que repasar   → inflacion (1 fallo)
   🔴 Vuelve a la nota  → liquidez (2 fallos)
   ```

   Un concepto con **2 o más fallos en este mismo examen** es "vuelve a la nota"; con exactamente 1, "hay
   que repasar"; sin ninguno entre sus preguntas, dominado. "2+ fallos" se cuenta siempre dentro de este
   examen — no acumulado con exámenes anteriores.
2. Los conceptos de "vuelve a la nota" van a `## Errores repetidos` de `config/alumno.md`, citando este
   examen como prueba, y su `dificultad` sube en la nota.
3. **Actualiza `estudio/progreso.md`**: por cada concepto que preguntó el examen, acertó (todas sus
   preguntas bien) → `teoría ✅`; falló alguna → `🟡`, y si es el segundo fallo (el de "vuelve a la nota")
   → `🔴`.
4. Guarda:

       node .kit/herramientas/guardar.js "examen: <alcance>"

Toda entrada que este examen añada a `config/alumno.md` cita como prueba el fichero del examen.

**El examen final y el de "lo que me falta" no ponen nota a ninguna unidad**: el JSON lo dice igual
(`aprobo`), pero no marques ninguna sesión ni la cuentes en el 🏁 (eso ya lo hace `examen.js` solo, no
marca `estudiada` fuera de un examen de módulo).

## 6. Versión nueva de un examen

El examen limpio se queda para repasar. Si el alumno pide "otra versión", o si el mismo examen ya lleva dos
intentos y la nota puede ser memoria (propónlo; decide él), o si toca repetir un escalón del final que
suspendió: crea un fichero nuevo en la misma carpeta, con `version: 2` (3, 4…) y `anterior:` con el enlace
a la versión anterior en el frontmatter. Mismos conceptos y reparto, **otras cifras y otro orden de
opciones**, clave rehecha. Su histórico empieza vacío; la versión anterior no se toca.

## Al cerrar, una línea más

`Del kit: nada` o `Del kit: <qué>`. Si no es "nada", sigue "Feedback al kit" de `AGENTS.md`.

## Después de corregir: el alumno también corrige al profesor (si quiere)

Salvo en un test de "lo que me falta" (muestra demasiado pequeña): al terminar la corrección **ofrece**,
sin insistir, dos preguntas en llano: "de cómo te he explicado este bloque, ¿qué te ha ayudado más y qué
te ha estorbado?". **Se puede saltar**: si dice que no o no contesta, sigues sin más y no lo vuelves a
preguntar en ese examen. Lo que conteste va a `config/profesor.md` → **Historial de cambios**, con la
prueba (`examen: <fichero>`); si contradice una preferencia, **propón** el cambio y aplícalo solo con su sí.

## Cuando hay señal de que algo no funciona: revisa cómo explicas

No es un paso fijo ni un bloqueo: es lo que haces cuando **los datos lo piden**. Señales: un concepto
acumula fallos o dudas (`config/alumno.md`, `estudio/progreso.md` en 🔴), un examen sale mal en general,
varias notas del mismo bloque han necesitado reescritura, o el alumno dice que algo le estorba. Entonces:

Empieza por `node .kit/herramientas/estado.js --json` → `senales`: ahí están ya calculadas (examen
suspendido, nota que baja entre intentos, concepto en 🔴, tercera duda). No sustituyen tu juicio, te dicen
dónde mirar.

- **Qué cambiar aquí, para este alumno y este temario:** ajustes concretos en `config/profesor.md` (largo,
  orden, tipo de ejemplo, peso de la lente…), con su sí. Cada alumno y cada curso son distintos: lo que
  aprendas es, casi siempre, mejora de *este* profesor.
- **Qué es del kit, no de este curso:** una skill ambigua, una herramienta que falló, algo que tuviste que
  hacer a mano dos veces, un patrón que se repetiría con cualquier alumno. Eso **no** se arregla aquí: abre
  una issue siguiendo "Feedback al kit" de `AGENTS.md` (con su permiso, sin contenido del curso). Así lo
  que aprendes con un alumno llega a todos.

## Exámenes de antes de esta versión

Un examen sin `tipo_examen` en el frontmatter y con huecos `✍️ **Tu respuesta:**` en vez de casillas es del
formato libre de antes: se sigue registrando igual que siempre, con tu propio juicio pregunta a pregunta y

    node .kit/herramientas/examen.js --registrar <examen.md> --correccion <fichero.json>

(`nota`, `veredicto` y `preguntas` con `resultado` empezando por `✅ Correcta` · `⚠️ Le falta: <qué>` ·
`❌ Incorrecta`, como antes). No lo migres a tipo test tú mismo: si el alumno quiere repetirlo, ofrécele
mejor un examen nuevo, de test, sobre el mismo alcance.
