---
name: configurar
description: Use when the student starts a new course with the kit, when config/curso.md says "sin-configurar", or when they want to change what the course is, how the teacher explains or what level they start from. Triggers on "/configurar", "configura el curso", "empezamos", "quiero cambiar cómo me explicas".
---

# Sesión 0: configurar el curso

Unos 20-30 minutos. Tres bloques. **Se puede dejar a medias y retomar**: al cerrar cada bloque
escribes su fichero y marcas el bloque en `config/ajustes.json` → `configuracion`.

## Antes de empezar

Lee `config/ajustes.json`. Si algún bloque de `configuracion` ya está en `true`, dile al alumno
por dónde ibais y sigue desde el primero en `false`. No repitas preguntas ya contestadas.

Si el alumno solo quiere cambiar una cosa, ve directo a ese bloque.

Reglas de toda la sesión: **una pregunta cada vez.** Nada de formularios. Lenguaje llano. Y no
inventes: lo que el alumno no sepa se queda como `**TODO:**` en el fichero.

## Dos formas de empezar: hablando o con una hoja

Los bloques A y C tienen una parte que son **datos** (cómo se llama el curso, qué temas tiene, cómo se
llaman las clases, cuánto cree que sabe). Los datos salen mejor de una hoja rellenada con calma que de
ocho preguntas contestadas de memoria. Pero una hoja en blanco también puede echar para atrás. Así que
**el alumno elige**. Lo primero que le dices:

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
   centro (con tildes: es lo que el alumno lee en `estudio/inicio.md`). Así la página de inicio enseña el curso
   entero desde el primer día, y el alumno ve lo que le queda.

   Si el curso **no tiene** una arquitectura clara (una lista plana de clases, o nada), **propón una** al
   alumno a partir del temario —por bloques— y escribe la que acepte. Si de verdad no hay nada que agrupar,
   no escribas el fichero: todo se queda plano. Con la estructura escrita, `node .kit/herramientas/organizar.js`
   coloca lo que ya hubiera.
6. **El aprobado.** Pregunta sobre cuánto se aprueba (normalmente 5 sobre 10) y escríbelo en el frontmatter de
   `config/curso.md` como `aprobado: 5`. Es lo que separa "📝 7,5" de "📝 4,0 suspenso" en `estudio/inicio.md`.
7. Cambia `estado: sin-configurar` por `estado: configurado`. Marca `configuracion.curso: true`.

## Bloque B — Cómo aprende → `config/profesor.md`

**Sin preguntas abstractas.** Nadie sabe contestar "¿prefieres ejemplos o definiciones?".

1. Elige un concepto del **primer bloque del temario**.
2. Explícalo de **dos formas** que difieran en **una sola cosa**, y pregunta cuál le ha servido
   más. Repite 4-5 veces, con un concepto distinto cada vez, variando una dimensión por ronda:
   - ejemplo primero ↔ definición primero
   - analogía cotidiana ↔ explicación técnica directa
   - tabla o esquema ↔ párrafo
   - corto y denso ↔ paso a paso
   - tono cercano ↔ tono sobrio
3. Pregunta dos cosas concretas: qué marcador quiere para dejar dudas en las notas (`@@` por
   defecto) y si quiere una **lente personal**: una lectura añadida al final de cada concepto
   desde un punto de vista suyo (su trabajo, un proyecto). Por defecto, desactivada.
4. Escribe el frontmatter y las secciones de `config/profesor.md`. Marca `configuracion.estilo: true`.

Las explicaciones de este bloque son muestras: **no se guardan como notas.**

## Bloque C — Cuánto sabe → `config/alumno.md`

1. **Autoevaluación:** por cada bloque del temario, de 0 (no me suena) a 3 (podría explicarlo).
   Si ya la dio en la hoja del curso, no se la vuelvas a pedir.
2. **Test corto generado del temario:** 1-2 preguntas por bloque, empezando por los que ha
   puntuado con 2 o 3 (es donde la autoevaluación engaña más). Si falla una pregunta de base,
   **baja a los prerrequisitos**: pregunta lo que hay que saber antes, hasta encontrar suelo firme.
   Máximo 10-12 preguntas en total.
3. Escribe `## Nivel de partida` en `config/alumno.md`: por bloque, la autoevaluación, el resultado
   y los prerrequisitos flojos. **Cada entrada cita su prueba**: "test de /configurar, pregunta N".
4. Marca `configuracion.nivel: true`.

Los prerrequisitos que haya que enseñar fuera del temario irán marcados como ampliación.

## Cierre

Presenta al profesor en **cinco líneas**: cómo es · por dónde empieza · qué irá rápido · qué verá
desde cero · cómo dejarle dudas. El alumno puede corregir cualquier cosa; si corrige, actualiza el
fichero que toque.

### La hoja para otro día

Antes de guardar, escribe **`estudio/como-usar-tu-profesor.md`** a partir de
`.kit/plantillas/guia-de-uso.md`. Es lo que el alumno va a abrir dentro de dos días, cuando no se
acuerde de nada: escríbela para alguien que no sabe qué es una terminal. Rellena:

| Hueco | Con qué |
|---|---|
| `{{NOMBRE_DEL_CURSO}}` | `nombre_curso` de `config/ajustes.json` (o el nombre de `config/curso.md`) |
| `{{ATAJO}}` | `atajo` de `config/ajustes.json`. Si está vacío, créalo ahora con `node .kit/herramientas/crear-atajo.js --nombre <palabra>` |
| `{{MARCADOR}}` | `marcador_dudas` de `config/profesor.md` |
| `{{TERMINAL_EN_OBSIDIAN}}` | Si tiene instalado el complemento Terminal en Obsidian (existe `estudio/.obsidian/plugins/terminal/`): un párrafo — "También puedes hablar con tu profesor sin salir de Obsidian: abre el terminal de Obsidian y escribe tu palabra." Si no lo tiene, **borra el hueco entero**, sin dejar línea en blanco de más |
| `{{COMO_ABRIR_LA_TERMINAL}}` | Según su ordenador. Mac: "Pulsa a la vez las teclas **Cmd** y **Espacio**, escribe **Terminal** y pulsa **Intro**." Windows: "Pulsa la tecla **Windows**, escribe **PowerShell** y pulsa **Intro**." |

No añadas secciones ni comandos, sin jerga: está escrita para leerse de arriba abajo la primera vez y para
buscar una respuesta las siguientes. Al presentarla, dile que empiece por el punto 1 (fijar **inicio**). Puedes adaptar las frases de ejemplo de la
tabla a su curso ("Ponme un ejercicio de la bóveda de cañón"). No dejes ningún `{{…}}` sin rellenar.

### La portada del curso (`README.md`)

Es lo que se ve al abrir su repositorio en GitHub. `preparar-curso.js` la dejó con huecos: rellénalos ahora
con lo de `config/curso.md` — "De qué va" (dos frases), "Temario" (la lista de bloques) y el atajo en "Cómo se
usa". Respeta el resto de la plantilla. La sección **Estado** la escribe `guardar.js` sola: no la toques.

Después:

    node .kit/herramientas/guardar.js "config: sesión 0"

Dile dónde está su hoja (es lo primero que verá en Obsidian) y cuál es el siguiente paso. Y para ti, una
línea: `Del kit: nada` o `Del kit: <qué>` (un paso de la configuración que sobró, faltó o confundió; si no
es "nada", "Feedback al kit" de `AGENTS.md`). Siguiente paso: dejar el material de la primera clase en `estudio/inbox/` (dentro de
Obsidian la verá como la carpeta **inbox**) y pedir `/sesion`.
