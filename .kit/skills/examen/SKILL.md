---
name: examen
description: Use when the student wants an exam or test to check what they have mastered, including the final exam, the next step of it, or a reference exam from the school to match its format. Triggers on "/examen", "vamos a validar los bloques 1 y 2", "ponme un test", "prepárame el examen", "examen final", "vamos a prepararnos", "quiero hacer el siguiente escalón", "te dejo un examen de otros años", "este es el modelo de examen de la certificación", "te dejo el examen de referencia del centro". Not for two or three quick questions in the chat ("hazme unas preguntas"), which is the warm-up in conversation, no skill.
---

# Modo examen

**Lee también `config/examenes.json`.** Si no existe, `examen.js` aplica `POR_DEFECTO` de
`.kit/herramientas/lib/examenes.js`: no lo crees a mano.

**Solo tipo test.** Todo examen nuevo se contesta con casillas (`- [ ] a) …`); lo corrige el código, no tú
(huecos ✍️ → "Exámenes de antes", al final). **Solo se lanza cuando lo pide** — no forma parte del ciclo
normal de una sesión.

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

**Si solo pregunta** ("¿cuándo puedo hacer el examen final?", "¿cuántas preguntas tiene?"), contéstale con esta tabla
y `config/examenes.json` y ofrécelo; no escribas ningún examen hasta que diga que sí.

**El final es aparte:** no pone nota a ninguna unidad ni marca `estudiada`, no cuenta para el 🏁 ni para *mi
perfil*. Se puede pedir sin los de módulo: puedes desaconsejarlo, no impedirlo.

**Escalera del final.** `estudio/inicio.md` enseña, en la línea 🎯, el escalón pendiente y su aprobado, o la
fecha en que se superó el último. Si el alumno pide "el siguiente escalón" o "prepararme para el final" sin
más, es ese escalón pendiente. Si suspende un escalón, se repite (versión nueva, mismo escalón) hasta
aprobarlo; solo entonces se pasa al siguiente.

**Si el alumno quiere cambiar la configuración** ("que el examen del módulo sean 20 preguntas", "que reste
medio punto por fallo"), edítala en `config/examenes.json` con tu herramienta de ficheros. Solo afecta a los
exámenes que se creen desde ahora: los ya escritos guardan su propia configuración en su clave (más abajo).

Si trae un examen de referencia del centro: sigue "Examen de referencia del centro", más abajo, antes de seguir.

## 2. Alcance

En los bloques del temario de `config/curso.md` (usa el nombre que allí se emplee: bloques, módulos,
semanas…). `/examen 1-3` = bloques 1 a 3. `/examen 7` = bloque 7. Si no lo dice, pregunta qué bloques.

**"Lo que me falta".** El alcance son **solo** los conceptos de esa sesión o unidad que en
`estudio/progreso.md` no tienen la teoría en ✅. Al alumno llámalo siempre "test", nunca "examen": mueve
`estudio/progreso.md`, pero no pone nota a la unidad.

## 3. Componer las preguntas

Todas de opción múltiple, con las opciones de `config/examenes.json` (`opciones`, 4 por defecto).

**Antes de escribir nada nuevo, reutiliza — en este orden**:

1. **Lo que el alumno falló** en exámenes anteriores de esta unidad. Ejecuta:

       node .kit/herramientas/examen.js --falladas <unidad>

   (`<unidad>` es un prefijo, como `01`; sin él, todo el curso). Su segunda línea es un JSON
   `{ "falladas": […], "centroUsadas": […] }`. Reutiliza `falladas` tal cual: cada entrada trae `enunciado`
   (con sus opciones, del propio `.md`), `correctas`, `explicacion`, `concepto` y `examen` (de dónde sale).
   En la clave del examen nuevo, marca cada una con `origen: "examen anterior"` y `de: "<examen>, p.<n>"` (apartado
   4), para poder trazarla; si la fallada trae `origen: "centro"`, se queda `"centro"` (cuenta para el tope de la
   mitad) y lleva también su `de`. **No leas el histórico de intentos a mano**: es justo lo que calcula este comando.
2. **Las del examen de referencia del centro que todavía no han salido**, si el alumno trajo uno: `falladas`
   ya trae marcadas `origen: "centro"` si las falló; `centroUsadas` (del mismo JSON) trae **todas** las que ya
   salieron, las haya fallado o no — prioriza las que no estén en ninguna de las dos. Ver "Examen de
   referencia del centro" más abajo.
3. **Nuevas, solo para completar** lo que falte hasta el número de preguntas del tipo, con el reparto de
   abajo.

Se respeta siempre: el máximo de 3 preguntas por concepto (cuenta lo reutilizado), el tope de la mitad del
examen para las de referencia del centro (apartado de abajo) y que un escalón del final sea más difícil que
el anterior — las preguntas reutilizadas cuentan para el nivel que ya tenían; si con ellas el examen no
llega al nivel que le toca, añade preguntas nuevas más difíciles hasta que sí.

**Reparto de las preguntas nuevas** (paso 3 de arriba). Lee las notas de los bloques y `config/alumno.md`:

| Origen | Peso |
|---|---|
| Errores repetidos de `config/alumno.md` | 40 % |
| Conceptos `dificultad: 3` | 25 % |
| Fórmulas de `estudio/formulario.md` | 20 % |
| Cobertura del resto | 15 % |

Si `estudio/formulario.md` está vacío, su 20 % pasa a cobertura (35 %). Si el alumno es nuevo y no tiene
errores repetidos, su 40 % pasa también a cobertura (55 %).

**Distractores de verdad** ("Cuando preguntas para medir", `AGENTS.md`): la opción incorrecta es el error
típico o el concepto con que se confunde; las opciones se parecen entre sí y ninguna se adivina sin saber el
concepto. `*(elige una)*` / `*(varias)*` (acierta solo si marca todas las correctas y ninguna más).

**Dificultad según el propósito**: `lo-que-falta` < `modulo` < `trimestre` < `final`, y dentro del final,
cada escalón más que el anterior. Más difícil es **un caso más concreto o rebuscado** (2×2 frente a
132×122, una cesta de más productos, un periodo más largo), **nunca una trampa de redacción** — una
palabra que cambia todo el sentido y que un alumno que domina el concepto también pasaría por alto.

**Todas las preguntas salen de las notas del curso**, salvo que falten para completar el número del tipo:
entonces, solo sobre conceptos ya en el temario, puedes traer un caso de internet, contrastado con las
notas del curso y marcado como fuente externa en la explicación de la clave, nunca en el enunciado. El
examen se hace sin conexión: la consulta es cosa tuya al escribirlo.

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

Una entrada de `preguntas` por pregunta, **en el mismo orden**: `correctas` (la letra o letras que valen,
minúscula), `explicacion` (por qué la correcta es correcta; si viene de internet, aquí la fuente externa),
`concepto` (el slug de `estudio/conceptos/`, o `null`). Si está reutilizada (apartado 3), añade
`origen: "examen anterior"` con `de: "<ruta del examen>, p.<n>"`, o `origen: "centro"` si es literal del test de
referencia; sin ninguna, es nueva.

**En el final**, la clave lleva además `"escalones"`: el array completo de `tipos.final.escalones` tal como
estaba, para que la escalera siga coherente si luego cambia la configuración.

## 5. Corregir

Cuando el alumno diga "he terminado el examen" (o "corrígelo"), sus casillas ya están marcadas en la propia
nota. Ejecuta:

    node .kit/herramientas/examen.js --corregir <ruta del examen>

Corrige el código: nota, histórico de intentos, desmarca las casillas y, si aprueba un examen de módulo,
marca `estudiada`. La segunda línea de su salida es un JSON:

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
   → `🔴`. Cada casilla cita este examen y la pregunta: `🟡 flojo · examen 1, p.3: confunde con liquidez`.
4. Guarda:

       node .kit/herramientas/guardar.js "examen: <alcance>"

Toda entrada que este examen añada a `config/alumno.md` cita como prueba el fichero del examen.

## 6. Versión nueva de un examen

El examen limpio se queda para repasar. Si el alumno pide "otra versión", o si el mismo examen ya lleva dos
intentos y la nota puede ser memoria (propónlo; decide él), o si toca repetir un escalón del final que
suspendió: crea un fichero nuevo en la misma carpeta, con `version: 2` (3, 4…) y `anterior:` con el enlace
a la versión anterior en el frontmatter. Mismos conceptos y reparto, **otras cifras y otro orden de
opciones**, clave rehecha. Su histórico empieza vacío; la versión anterior no se toca.

## Examen de referencia del centro

Un examen o test del centro (de otros años, el modelo de la certificación, un test de autoevaluación de la
plataforma…), en cualquier momento del curso — no hace falta esperar a `/configurar`. Trátalo así:

1. **Léelo entero y actualiza `config/examenes.json`** con lo que declare: número de opciones, si resta los
   fallos y cuánto, número de preguntas, tiempo y el aprobado, si lo dice. Ajusta el tipo que corresponda
   (normalmente `modulo`; crea o ajusta uno con nombre propio como `certificacion` si el ejemplo es del
   examen final o de la certificación). **Lo que el ejemplo no diga, no se inventa:** se queda el valor que
   ya había, y se lo dices al alumno.
2. **Reutiliza sus preguntas, literales**: el enunciado y las opciones entran sin reescribirlos (paso 2 del
   orden del apartado 3, después de lo que el alumno falló). Antes de componer un examen nuevo de esa
   unidad, comprueba si hay una referencia guardada y aplícala; si aún le quedan preguntas suyas sin salir,
   no escribas el examen entero sin ninguna.
3. **Marca cada una como del centro, en las dos capas**: en el examen, un sufijo visible tras el enunciado
   —`*(del centro)*`, o lo que encaje con el formato de la pregunta— y en su entrada de la clave,
   `origen: "centro"` (apartado 4).
4. **Como mucho la mitad del examen** sale de la referencia; el resto son preguntas nuevas del mismo estilo
   (apartado 3, paso 3). Que no se convierta en memorizar el test del centro.
5. **Su respuesta correcta sale de la clave del propio ejemplo**, si la trae (como el fixture de prueba, con
   la clave de soluciones al final). Si no la trae, la decides tú, contrastando con las notas del curso, y
   se lo dices al alumno.
6. **Rota**: en una versión nueva o un escalón nuevo, prioriza las que no han salido (`centroUsadas`, §3
   paso 1; no leas las claves a mano).
7. **Deja constancia de la referencia** en el examen que generes a partir de ahí: `referencia:` en su
   frontmatter (el nombre del fichero de origen), o en la clave.

**Al preparar un examen final o de certificación, pide referencias si no las tienes.** Pregúntalo una vez,
sin insistir: "¿tienes algún examen de otros años o el modelo de la certificación? así el mío se parece más
al oficial". Si no tiene ninguno, sigue con el formato por defecto de `config/examenes.json` y dile que,
sin una referencia real, no puedes garantizar que se parezca al oficial.

## Después de corregir: el alumno también corrige al profesor (si quiere)

Salvo en "lo que me falta" (muestra pequeña): al terminar, **ofrece** sin insistir dos preguntas en llano
sobre cómo le has explicado este bloque: "¿qué te ha ayudado más?" y "¿qué te ha estorbado?". **Se puede
saltar**, y si la salta no se repite en ese examen. Lo que conteste va a `config/profesor.md` →
**Historial de cambios**, con la prueba (`examen: <fichero>`); si contradice una preferencia, **propón** el
cambio y aplícalo solo con su sí.

## Al cerrar, una línea más

Después de las dos preguntas (o si las salta), cierra con `Del kit: nada` o `Del kit: <qué>` (ver "Feedback
al kit" en `AGENTS.md`).

## Exámenes de antes de esta versión

Un examen sin `tipo_examen` en el frontmatter y con huecos `✍️ **Tu respuesta:**` en vez de casillas es del
formato libre de antes: se sigue registrando igual que siempre, con tu propio juicio pregunta a pregunta. Escribe
la corrección en `correccion-examen.json`, **en la raíz del curso** (nunca en `/tmp` ni fuera del curso: se
deniega), y regístrala; `examen.js` la borra al terminar:

    node .kit/herramientas/examen.js --registrar <examen.md> --correccion correccion-examen.json

(`nota`, `veredicto` y `preguntas` con `resultado` empezando por `✅ Correcta` · `⚠️ Le falta: <qué>` ·
`❌ Incorrecta`, como antes). No lo migres a tipo test tú mismo: si el alumno quiere repetirlo, ofrécele
mejor un examen nuevo, de test, sobre el mismo alcance.

Después, igual que en el apartado 5: da el veredicto en el chat y **guarda**:

    node .kit/herramientas/guardar.js "examen: <alcance>"
