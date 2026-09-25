---
name: configurar
description: Use when the student starts a new course with the kit, when config/curso.md says "sin-configurar", or when they want to change what the course is, how the teacher explains or what level they start from. Triggers on "/configurar", "configura el curso", "empezamos", "quiero cambiar cómo me explicas".
---

# Sesión 0: configurar el curso

Unos 20-30 minutos. Tres bloques. **Se puede dejar a medias y retomar**: al cerrar cada bloque
escribes su fichero y marcas el bloque en `config/ajustes.json` → `configuracion`.

## Antes de empezar

Si no usas el modelo recomendado (`.kit/adaptadores/LEEME.md`), díselo en una frase: esta sesión decide cómo
será todo su curso. Decide él.


Lee `config/ajustes.json`. Si algún bloque de `configuracion` ya está en `true`, dile al alumno
por dónde ibais y sigue desde el primero en `false`. No repitas preguntas ya contestadas.

Si el alumno solo quiere cambiar una cosa, ve directo a ese bloque.

Reglas de toda la sesión: **una pregunta cada vez.** Nada de formularios. Lenguaje llano. Lo que no sepa:
`**TODO:**`.

## Preséntate (solo la primera vez)

Si todos los bloques de `configuracion` están en `false` y no existe `estudio/hoja-del-curso.md`, es la
primera vez que te ve trabajar: preséntate antes de preguntar nada, en **cuatro o cinco frases**, con el
mismo orden e imágenes que "Cómo funciona esto" de la guía de instalación:

1. Quién eres: su profesor para este curso, en frases normales, como en un chat.
2. Dónde lee: en Obsidian, su cuaderno; ahí escribes lo que le preparas.
3. Cómo recuerdas: no la conversación de ayer, sino lo que dejas escrito en su curso — por eso guardas
   cada cosa que terminas.
4. Por qué pides permiso: antes de tocar algo, preguntas; si no entiende para qué, que te pregunte "¿qué
   vas a hacer?". Y "deshaz lo último" lo deja como estaba si algo no le gusta — no puede romper nada.
5. Que puede interrumpirte y preguntarte cualquier cosa, también "¿qué es esto?".

Termina con una frase de lo que viene ahora (conocer su curso y cómo aprende, unos 20 minutos) y sigue con
la pregunta de abajo, sin esperar respuesta a la presentación.

## Dos formas de empezar: hablando o con una hoja

Los datos de los bloques A y C (nombre, temas, cómo se llaman las clases, cuánto cree que sabe) los puede
dar hablando o en una hoja: **elige él**. Lo primero que le dices:

> "Puedo preguntarte yo aquí, poco a poco, o dejarte una hoja para que la rellenes con calma y luego
> me avisas. ¿Qué prefieres?"

- **Hablando** → sigue con el bloque A de abajo, tal cual.
- **Con la hoja** → copia `.kit/plantillas/hoja-del-curso.md` a **`estudio/hoja-del-curso.md`**, dile que
  la tiene en Obsidian (o que la verá ahí en cuanto lo abra), que la rellene a su ritmo y que al
  terminar te diga "ya he rellenado la hoja". Guarda (`config: hoja del curso entregada`) y despídete:
  no le esperes con la sesión abierta.

**Si al empezar ya existe `estudio/hoja-del-curso.md`** y `configuracion.curso` es `false`, es que vuelve
con la hoja (rellena o a medias). Entonces:

1. Léela entera. Lee también lo que haya dejado en `estudio/inbox/` (el programa, si lo puso).
2. **Pregunta solo por los huecos y las ambigüedades**, de una en una. No repitas lo que ya contestó.
   Lo imprescindible para seguir: el nombre, los temas y cómo se llaman las clases (pregunta 6). Lo
   demás, si no lo sabe, se queda como `**TODO:**`.
3. Escribe `config/curso.md` como en el bloque A (incluidos el ejemplo de nombre de fichero y la
   propuesta de `patrones_prohibidos`, si alguna regla suya se puede comprobar con un patrón).
4. Apunta su autoevaluación (pregunta 8) para el bloque C: **ya no se la preguntas**, pasas directo al
   test. Prueba a citar: "hoja del curso, pregunta 8".
5. Pon como primera línea de la hoja `> ✅ Recogida por tu profesor el <fecha>.` y no la borres: es suya.
6. Marca `configuracion.curso: true` y sigue con el **bloque B, que siempre es hablando**.

El bloque B y el test del bloque C **no tienen versión en hoja**: uno mide su reacción a dos
explicaciones y el otro se adapta a cada respuesta.

## Bloque A — El curso → `config/curso.md`

1. Pide el programa del curso. Lo mejor es el PDF en `estudio/inbox/`; si no lo tiene, que te lo cuente.
2. Rellena cada sección de `config/curso.md`: nombre, de qué va, objetivo (examen oficial ·
   cultura general · uso profesional), temario por bloques, fechas.
3. **Cómo numera el centro las clases.** Pide un ejemplo real ("¿cómo se llama la última clase que
   has visto en la plataforma?"). De ahí sale el nombre de cada nota de sesión: escribe la regla
   **y un ejemplo de nombre de fichero** en kebab-case, con números a dos dígitos.
4. **Reglas propias del dominio.** Pregunta qué hay que hacer siempre o nunca al explicar esta
   materia. Dale dos ejemplos de otros dominios para que entienda la pregunta ("en un curso de
   derecho: citar siempre el artículo"; "en uno de cocina: cantidades siempre en gramos"). Si una
   regla se puede comprobar con un patrón de texto, **propón** añadirla a `patrones_prohibidos`
   de `config/ajustes.json` como `{ "patron": "<regex>", "mensaje": "<qué pasa>" }`.
5. **La arquitectura del curso → `config/estructura.json`.** Las carpetas de `estudio/` (sesiones, flashcards,
   ejercicios, exámenes) copian la estructura del curso **tal como la ve el alumno en la plataforma**, para
   que dentro de seis meses encuentre las cosas por donde las busca allí: módulos, bloques, semanas, temas…
   lo que tenga el curso, con los niveles que tenga. De la regla de nombres del punto 3 sale un **prefijo**
   por unidad; cada unidad tiene su carpeta (anidada si hay niveles):

   ```json
   { "unidades": [
     { "prefijo": "01",    "carpeta": "modulo-01-conceptos-esenciales", "titulo": "Módulo 1 · Conceptos esenciales" },
     { "prefijo": "01-02", "carpeta": "modulo-01-conceptos-esenciales/1.2-medidores-basicos", "titulo": "1.2 Medidores básicos" }
   ] }
   ```

   Un fichero pertenece a la unidad cuyo prefijo coincide con el principio de su nombre (gana el más largo).
   **Escribe todas las unidades del temario**, tengan material o no, cada una con su `titulo` tal como la nombra el
   centro (con tildes: es lo que el alumno lee en `estudio/inicio.md`).

   Si el curso **no tiene** una arquitectura clara (una lista plana de clases, o nada), **propón una** al
   alumno a partir del temario —por bloques— y escribe la que acepte. Si de verdad no hay nada que agrupar,
   no escribas el fichero: todo se queda plano. Con la estructura escrita, `node .kit/herramientas/organizar.js`
   coloca lo que ya hubiera.
6. **El aprobado.** Pregunta sobre cuánto se aprueba (normalmente 5 sobre 10) y escríbelo en
   `config/examenes.json`, en `tipos.modulo.aprobado`. Si el alumno trae un examen de ejemplo del centro en
   `estudio/inbox/`, sigue "Examen de referencia del centro" de `.kit/skills/examen/SKILL.md` (vale también,
   más adelante, para el examen final o la certificación).
7. Cambia `estado: sin-configurar` por `estado: configurado`. Marca `configuracion.curso: true`.

## Bloque B — Cómo aprende → `config/profesor.md`

**Sin preguntas abstractas.** Nadie sabe contestar "¿prefieres ejemplos o definiciones?".

### Primero, quién es → `config/alumno.md`

Antes de las muestras, conócele. Tres preguntas, **de una en una**, y ninguna que ya esté contestada en
`config/curso.md`, en la hoja del curso o en `## Quién es` (si vuelve solo a cambiar el estilo, esa
sección ya está escrita: sáltate esto):

1. **Qué relación tiene con la materia:** si la ha estudiado, si la toca en su trabajo, si la ha seguido
   por su cuenta o si parte de cero.
2. **Para qué la quiere.** Sáltala si el objetivo ya salió en el bloque A.
3. **Cuánto tiempo puede dedicarle a la semana, y si hay una fecha que apriete** (un examen, una entrega).
   La fecha, sáltala si ya está en `config/curso.md`.

Escribe `## Quién es` en `config/alumno.md`: sus respuestas, en sus palabras y resumidas, con la prueba
"sesión 0, respuesta del alumno". Lo que no sepa o no quiera decir, no se apunta. Úsalo en lo que sigue:
los ejemplos de las muestras, mejor de su mundo.

### Las muestras

1. Elige un concepto del **primer bloque del temario**.
2. Explícalo de **dos formas** que difieran en **una sola cosa**, y pregunta cuál le ha servido
   más. Repite 4-5 veces, con un concepto distinto cada vez, variando una dimensión por ronda:
   - ejemplo primero ↔ definición primero
   - analogía cotidiana ↔ explicación técnica directa
   - tabla o esquema ↔ párrafo
   - corto y denso ↔ paso a paso
   - tono cercano ↔ tono sobrio

### Las dudas: se explican, no se preguntan

Elegir un símbolo no le dice nada a quien no sabe para qué sirve. **No le preguntes qué marcador
quiere:** explícale cómo se usa, con el marcador por defecto (`@@`) y un ejemplo que vea escrito:

> "Cuando leas tus notas en Obsidian y algo no se entienda, escribe `@@` justo ahí y tu pregunta:
> `@@ no entiendo por qué sale este número`. Deja todas las que quieras. La próxima vez me dices
> 'tengo dudas' y te contesto cada una en su sitio."

Si él pide otro símbolo, se cambia. Si no, se queda `@@`.

### El recuadro personal: se enseña antes de ofrecerlo

En `config/profesor.md` se llama `lente`; **al alumno no le digas "lente"**: dile "un recuadro al final de
cada concepto que lo conecta con lo tuyo". Nadie decide si quiere algo que no ha visto, así que:

1. **Enséñale una muestra de verdad**: un concepto del primer bloque, en dos o tres líneas, y debajo el
   recuadro de dos o tres líneas hecho con lo que te ha contado en *Quién es* (su trabajo, un proyecto,
   una afición). Si no te ha contado nada que sirva, pregúntale primero desde dónde le gustaría verlo.
2. **Dile qué gana:** lo que conectas con lo tuyo se recuerda mejor, y ves para qué te sirve.
3. **Dile qué cuesta:** un poco más de texto. Solo va en las notas donde aporte, nunca en todas a la
   fuerza, y nunca sustituye al contenido del curso.
4. **Dile que es reversible:** se pone o se quita cuando quiera, pidiéndolo.
5. Pregunta si lo quiere. **Por defecto, no.** Si dice que sí, escribe en `## Lente personal` desde qué
   punto de vista, cómo se titula el recuadro y en qué notas aporta y en cuáles sobra.

### Para cerrar el bloque

Escribe el frontmatter y las secciones de `config/profesor.md`. Marca `configuracion.estilo: true`.

Las explicaciones de este bloque, y la muestra del recuadro, son muestras: **no se guardan como notas.**

## Bloque C — Cuánto sabe → `config/alumno.md`

1. **Autoevaluación:** por cada bloque del temario, de 0 (no me suena) a 3 (podría explicarlo).
   Si ya la dio en la hoja del curso, no se la vuelvas a pedir.
2. **Test corto generado del temario:** 1-2 preguntas por bloque, empezando por los que ha
   puntuado con 2 o 3 (es donde la autoevaluación engaña más). Si falla una pregunta de base,
   **baja a los prerrequisitos**: pregunta lo que hay que saber antes, hasta encontrar suelo firme.
   Máximo 10-12 preguntas en total. Redáctalas y corrígelas con "Cuando preguntas para medir" (`AGENTS.md`).
3. **Guarda el test** en `estudio/test-inicial.md`: por cada pregunta, el enunciado tal como se lo hiciste,
   su respuesta (en sus palabras, resumida si fue larga) y tu veredicto (correcta · le falta lo que se
   pedía · incorrecta) con el porqué. Arriba, la fecha y una línea: "Tu punto de partida. No cuenta para
   nada: sirve para saber por dónde empezar". Es lo que hace que la prueba se pueda consultar.
4. Escribe `## Nivel de partida` en `config/alumno.md`: por bloque, la autoevaluación, el resultado
   y los prerrequisitos flojos. **Cada entrada cita su prueba**: "test inicial, pregunta N".
5. Marca `configuracion.nivel: true`.

### Revisar un nivel de partida hecho antes de estas reglas

Para cursos configurados antes de la 0.19.0 (su `## Nivel de partida` cita "test de /configurar" y no existe
`estudio/test-inicial.md`): sus preguntas no se guardaron y pudieron dar falsos negativos. No se pueden
recuperar desde el curso, así que no las reconstruyas de memoria:

1. En `## Nivel de partida`, busca los huecos que huelen a pregunta mal hecha: "sin nombrarlo", "no usó la
   fórmula", "le falta el término", "intuye… pero". Pregúntate si la pregunta original los pedía; si no lo
   sabes, trátalo como dudoso.
2. Si desde entonces hay pruebas mejores (exámenes corregidos, `estudio/progreso.md`), mandan ellas: ese
   hueco ya está medido y no se repregunta.
3. De lo que queda dudoso, **una pregunta nueva por hueco**, con las reglas de ahora. Cuéntale antes, en una
   frase, por qué: "algunas preguntas del primer test no pedían lo que luego te apunté como fallo".
4. Guarda estas preguntas en `estudio/test-inicial.md` (con una línea arriba: "Revisión del <fecha>: las
   preguntas del primer test no se guardaron") y corrige `## Nivel de partida`: lo que era falso negativo se
   quita, citando "test inicial, revisión del <fecha>, pregunta N". Lo que se confirma, se queda.

## Cierre

Presenta al profesor en **cinco líneas**: cómo es · por dónde empieza · qué irá rápido · qué verá desde
cero · cómo dejarle dudas. Si corrige algo, actualiza el fichero que toque.

### Los permisos, una vez

Ejecuta `node .kit/herramientas/permisos.js --ver` y cuéntale lo que dice en dos o tres frases: con su sí, dejas
de pedirle permiso a cada paso, solo dentro de su curso, y lo puede quitar cuando quiera. Con su sí,
`permisos.js --aplicar`. Si dice que no, o que su asistente aún no sabe, sigue: preguntarás como hasta ahora.

### La hoja para otro día

Antes de guardar, escribe **`estudio/como-usar-tu-profesor.md`** a partir de
`.kit/plantillas/guia-de-uso.md`. Es lo que el alumno va a abrir dentro de dos días, cuando no se
acuerde de nada: escríbela para alguien que no sabe qué es una terminal. Rellena:

| Hueco | Con qué |
|---|---|
| `{{NOMBRE_DEL_CURSO}}` | `nombre_curso` de `config/ajustes.json` (o el nombre de `config/curso.md`) |
| `{{ATAJO}}` | `atajo` de `config/ajustes.json`. Si está vacío, créalo ahora con `node .kit/herramientas/crear-atajo.js --nombre <palabra>` |
| `{{MARCADOR}}` | `marcador_dudas` de `config/profesor.md` |
| `{{TERMINAL_EN_OBSIDIAN}}` | Si tiene **activado** el complemento Terminal (`estudio/.obsidian/community-plugins.json` incluye `"terminal"`): un párrafo — "También puedes hablar con tu profesor sin salir de Obsidian: abre el terminal de Obsidian y escribe tu palabra." Si no lo tiene, **borra el hueco entero**, sin dejar línea en blanco de más |
| `{{COMO_ABRIR_LA_TERMINAL}}` | Según su ordenador. Mac: "Pulsa a la vez las teclas **Cmd** y **Espacio**, escribe **Terminal** y pulsa **Intro**." Windows: "Pulsa la tecla **Windows**, escribe **PowerShell** y pulsa **Intro**." |

No añadas secciones ni comandos, sin jerga: está escrita para leerse de arriba abajo la primera vez y para
buscar una respuesta las siguientes. Al presentarla, dile que empiece por el punto 1 (fijar **inicio**). Puedes adaptar las frases de ejemplo de la
tabla a su curso ("Ponme un ejercicio de la bóveda de cañón"). No dejes ningún `{{…}}` sin rellenar.

### La portada del curso (`README.md`)

Es lo que se ve al abrir su repositorio en GitHub. `preparar-curso.js` la dejó con huecos: rellénalos ahora
con lo de `config/curso.md` — "De qué va" (dos frases), "Temario" (la lista de bloques) y el atajo en "Cómo se
usa". Respeta el resto de la plantilla.

Después:

    node .kit/herramientas/guardar.js "config: sesión 0"

Dile dónde está su hoja (es lo primero que verá en Obsidian) y cuál es el siguiente paso: dejar el material
de la primera clase en `estudio/inbox/` (la carpeta **inbox** en Obsidian) y pedir `/sesion`. Cierra con
`Del kit: nada` o `Del kit: <qué>`.
