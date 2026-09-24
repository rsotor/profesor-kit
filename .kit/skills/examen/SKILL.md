---
name: examen
description: Use when the student wants a written exam or test to check what they have mastered across topic blocks. Triggers on "/examen", "vamos a validar los bloques 1 y 2", "ponme un test", "prepárame el examen". Not for two or three quick questions in the chat ("hazme unas preguntas"): that is the warm-up in conversation, no skill.
---

# Modo examen

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`).

Test interno sobre los bloques del temario que pida. **Solo se lanza cuando lo pide** — no forma
parte del ciclo normal de una sesión.

## Checklist

### 1. Alcance

El alcance se expresa en los bloques del temario de `config/curso.md` (usa el nombre que allí se
emplee: bloques, módulos, temas…). `/examen 1-3` = bloques 1 a 3. `/examen 7` = bloque 7. Si no
lo dice, pregunta qué bloques.

**"Lo que me falta".** Si pide un test "de lo que me falta" de una unidad o sesión, el alcance son **solo** los
conceptos de esas sesiones que en `estudio/progreso.md` no tienen la teoría en ✅ (es lo que `estudio/inicio.md`
enseña como "📝 faltan N"). 3-5 preguntas, las justas para cubrirlos. Es un **test**, no un examen: mueve
`estudio/progreso.md`, pero no pone nota a la unidad. Al alumno llámalo siempre así, "test" (en su frontmatter
lleva `parcial: true`, que es solo el nombre interno).

### 2. Componer el test

Lee las notas de esos bloques y `config/alumno.md`. Reparto de las preguntas:

| Origen | Peso | Por qué |
|---|---|---|
| Errores repetidos de `config/alumno.md` | 40 % | Es lo que va a fallar de verdad |
| Conceptos `dificultad: 3` | 25 % | Aún no están fijados |
| Fórmulas de `estudio/formulario.md` | 20 % | Se olvidan con el tiempo |
| Cobertura del resto | 15 % | Que no quede un hueco entero sin tocar |

Si `estudio/formulario.md` está vacío (el curso no tiene fórmulas), su 20 % pasa a cobertura: cobertura
sube a 35 %.

15-20 preguntas por bloque del temario. Mezcla:

- **Opción múltiple** — con distractores que sean el error típico de la nota o **el concepto cercano con el que
  se confunde**, no opciones absurdas. Un distractor tonto no enseña nada.
- **"¿Cuál de los dos?"** — un caso concreto y dos conceptos que se parecen: que diga cuál es y por qué. Es lo
  que más se parece a un examen tipo test de verdad.
- **Cálculo** (si el curso tiene cálculo) — números inventados y redondos, que salgan a mano.
- **"Explica por qué"** — respuesta corta. Es donde se ve si entendió o memorizó.

Cada pregunta, con las reglas de "Cuando preguntas para medir" (`AGENTS.md`): una cosa por pregunta, el caso
antes que la pregunta, y entre paréntesis qué respuesta espera. En las de "explica por qué", di cuánto:
*(en 2-3 líneas)*.

**Mide entender y distinguir, no memorizar la letra** ("Cuando preguntas para medir", `AGENTS.md`): ninguna
pregunta pide copiar una definición del material.

**Todas las preguntas salen de las notas del curso.** Nada de material que no haya visto: el
examen mide lo estudiado, no lo que "debería" saber.

### 3. Formato

`estudio/examenes/<carpeta de la unidad>/<prefijo de la unidad>-examen-YYYY-MM-DD.md`, con las soluciones en
un callout plegado, o una página HTML local autocorregible en la misma carpeta si el alumno lo prefiere.
Es un test interno: se escribe directamente en el repo, no como un documento aparte.

Con este frontmatter, que es lo que lee `estudio/inicio.md`:

    ---
    tipo: examen
    unidad: 01-02          # prefijo de la unidad; si abarca varias, lista: [01-02, 01-03]
    fecha: 2026-10-02
    nota:                  # sobre 10; lo rellena examen.js al corregir
    intentos: 0            # lo sube examen.js en cada corrección
    parcial: true          # solo en los tests de "lo que me falta"
    ---

La carpeta es la de la unidad más amplia que contenga todo el alcance; sin estructura, directamente en
`estudio/examenes/`. **Examen de módulo** es solo el que tiene `unidad:` exactamente el prefijo del módulo: un
examen de 1.2 + 1.3 lleva `unidad: [01-02, 01-03]`, no `01`. Si el alumno lo prefiere como página HTML
autocorregible, va en la misma carpeta **y además** su `.md` con este frontmatter (sin él no sale en inicio).

**Debajo de cada pregunta**, una línea vacía para contestar en la propia nota:

    ✍️ **Tu respuesta:**

El alumno escribe a continuación (en esa línea o en las siguientes, hasta la siguiente pregunta). También
puede contestar en el chat; si dice "he terminado el examen", lee las respuestas **de la nota**.

**Versión nueva de un examen.** El examen limpio se queda para repasar. Si el alumno pide "otra versión", o si
tú lo propones porque el mismo examen ya lleva dos intentos y la nota puede ser memoria (propónlo; decide él),
crea un fichero nuevo en la misma carpeta: mismas preguntas y conceptos, mismo reparto, **otras cifras y otro
orden de opciones**, soluciones rehechas, con `version: 2` (3, 4…) y `anterior:` con el enlace al fichero de la
versión anterior en el frontmatter. Su histórico empieza vacío. La versión anterior no se toca. Al corregir la
nueva, el veredicto compara concepto a concepto con el último intento de la anterior.

Si `lente` está activada en `config/profesor.md`, añade al final la lectura desde ese punto de
vista; nunca decide qué se explica ni cuánto, y nunca puntúa.

### 4. Corregir — la parte que importa

Cuando te dé las respuestas:

1. Corrige pregunta a pregunta, diciendo **por qué** falla la respuesta equivocada, no solo cuál
   era la buena. **Corrige lo que la pregunta pedía, nada más** ("Cuando preguntas para medir", `AGENTS.md`):
   una respuesta corta y correcta es un acierto, y la idea bien sin el nombre también, si no pedías el nombre.
2. Agrupa los fallos por concepto, no por número de pregunta.
3. Si un concepto acumula 2+ fallos → a `## Errores repetidos` de `config/alumno.md`, citando
   este examen como prueba, y sube su `dificultad` en la nota.
4. Da el veredicto en tres bloques, sin rodeos:

```
✅ Dominado          → velocidad-media, causas-de-la-revolucion
⚠️ Hay que repasar   → aceleración (2 fallos)
🔴 Vuelve a la nota  → causas-de-la-revolucion — no está el mecanismo, está memorizado
```

5. **Actualiza `estudio/progreso.md`** — es el único sitio donde se sabe qué domina de verdad. Un
   concepto solo cambia de estado si hay una respuesta suya que lo justifique:
   - acertó el mecanismo → `teoría ✅` · acertó el cálculo o supo aplicarlo → `aplicación ✅`
   - falló → `🟡`; falló por segunda vez → `🔴` (y entonces también el paso 3)
6. **Registra el intento con la herramienta, no a mano.** Escribe con tu herramienta de ficheros
   `correccion-examen.json`, en la raíz del curso, con lo que es juicio tuyo:

       { "nota": 6.5,
         "veredicto": ["✅ Dominado → …", "⚠️ Hay que repasar → …", "🔴 Vuelve a la nota → …"],
         "preguntas": [{ "resultado": "✅ Correcta", "por_que": "…" }, …] }

   `nota`, un número sobre 10 (`6.5`, nunca `6,5/10`); `preguntas`, una por hueco y en orden, con `resultado`
   empezando **siempre** por una de las tres etiquetas de "Cuando preguntas para medir" —`✅ Correcta` ·
   `⚠️ Le falta: <qué>` · `❌ Incorrecta` (una en blanco: `❌ Incorrecta (en blanco)`)— y detrás lo que quieras.
   Después:

       node .kit/herramientas/examen.js --registrar <ruta del examen> --correccion correccion-examen.json

   La herramienta copia sus respuestas **literales** a `## Histórico de intentos` (la fila y el bloque plegado
   del intento), pone `nota`, `fecha` e `intentos` en el frontmatter, deja cada `✍️ **Tu respuesta:**` vacío otra
   vez (las preguntas, cifras, opciones y soluciones no cambian: al repetirlo, compara intento a intento) y, si
   aprueba un examen (no un test; el aprobado es `aprobado:` de `config/curso.md`, 5 si no está), marca
   `estudiada: true` en las sesiones de su unidad y de las que cuelgan de ella: es la única vez que el profesor
   marca esa casilla. Si algo no cuadra (un resultado de menos, una en blanco que no es incorrecta), no toca
   nada y dice qué: arréglalo en el JSON y repite.
7. Guarda:

    node .kit/herramientas/guardar.js "examen: <alcance>"

Toda entrada que este examen añada a `config/alumno.md` cita como prueba el fichero del examen.

**Sé honesto con la nota.** Un aprobado regalado hoy es un suspenso real cuando llegue el examen
de verdad.

El formato del examen oficial del centro no es cosa de esta skill (fase 2).

## Al cerrar, una línea más

`Del kit: nada` o `Del kit: <qué>`. Si no es "nada", sigue "Feedback al kit" de `AGENTS.md`.

## Después de corregir: el alumno también corrige al profesor (si quiere)

Cinco preguntas sesgan; la experiencia de un bloque entero, menos. Al terminar la corrección **ofrece**,
sin insistir, dos preguntas en llano: "de cómo te he explicado este bloque, ¿qué te ha ayudado más y qué te
ha estorbado?". **Se puede saltar**: si dice que no o no contesta, sigues sin más y no lo vuelves a
preguntar en ese examen. Lo que conteste va a `config/profesor.md` → **Historial de cambios**, con la prueba
(`examen: <fichero>`); si contradice una preferencia, **propón** el cambio y aplícalo solo con su sí.

## Cuando hay señal de que algo no funciona: revisa cómo explicas

No es un paso fijo ni un bloqueo: es lo que haces cuando **los datos lo piden**. Señales: un concepto
acumula fallos o dudas (`config/alumno.md`, `estudio/progreso.md` en 🔴), un examen sale mal en general,
varias notas del mismo bloque han necesitado reescritura, o el alumno dice que algo le estorba. Entonces:

Empieza por `node .kit/herramientas/estado.js --json` → `senales`: ahí están ya calculadas (examen suspendido,
nota que baja entre intentos, concepto en 🔴, tercera duda). No sustituyen tu juicio, te dicen dónde mirar.

- **Qué cambiar aquí, para este alumno y este temario:** ajustes concretos en `config/profesor.md` (largo,
  orden, tipo de ejemplo, peso de la lente…), con su sí. Cada alumno y cada curso son distintos: lo que
  aprendas es, casi siempre, mejora de *este* profesor.
- **Qué es del kit, no de este curso:** una skill ambigua, una herramienta que falló, algo que tuviste que
  hacer a mano dos veces, un patrón que se repetiría con cualquier alumno. Eso **no** se arregla aquí: abre
  una issue siguiendo "Feedback al kit" de `AGENTS.md` (con su permiso, sin contenido del curso). Así lo que
  aprendes con un alumno llega a todos.
