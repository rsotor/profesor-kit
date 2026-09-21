---
name: repaso
description: Use when the student wants a visual review of a block or a concept, as a local web page instead of markdown. Triggers on "/repaso", "hazme un repaso visual", "repasa este bloque", "quiero verlo en una página web".
---

# Repaso visual

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`).

Genera un fichero HTML local a partir del material del curso. **La web se genera del
markdown; nunca al revés.** El material es la fuente de verdad —si algo está mal en la
página, se arregla en la nota y se regenera la página, no al contrario.

## Checklist

### 1. Alcance

`/repaso 3` = bloque 3. `/repaso <concepto>` = ese concepto y su vecindario (lo que enlaza y
lo que lo enlaza). Si no dice nada, pregunta.

Un alcance, un fichero: `repasos/<alcance>.html`. Si ya existe, se **regenera encima** —nunca
se crea uno segundo para el mismo alcance.

### 2. Leer el material

- `mapa-del-curso.md` — las sesiones del alcance
- Las notas de `conceptos/` que enlacen con ellas (las notas enteras, no solo los títulos)
- `flashcards/` del alcance
- `config/alumno.md` — los conceptos marcados `dificultad: 3` en su frontmatter van primero
  y con más aire

### 3. Construir la página

Un solo fichero HTML **autocontenido**: CSS y JS dentro, sin dependencias externas ni de red.
Sin Artifact, sin URL, sin cargar ninguna skill de diseño. Contenido, en este orden:

1. **Mapa del alcance** — diagrama de los conceptos y sus dependencias (`requiere:`). Un
   vistazo debe bastar para ver qué depende de qué.
2. **Concepto por concepto** — una tarjeta cada uno: la frase de definición, el ejemplo, la
   fórmula si la hay. Los marcados `dificultad: 3` van arriba y con más espacio.
3. **Formulario del alcance** — todas las fórmulas juntas, para memorizar.
4. **Flashcards interactivas** — se voltean al hacer clic. Nada de la respuesta visible antes.
5. **Los ejercicios del alcance**: los de HTML se incrustan en la página tal cual, cada uno en
   su bloque (son ficheros autocontenidos, se copian sin tocarlos); los de markdown se
   enlazan, no se incrustan.

Para decidir entre tabla, diagrama, tarjeta o párrafo, mira `## Cómo explicarle` de
`config/alumno.md`. Si un concepto necesita tres párrafos en la página, es que la nota está
mal escrita —arregla la nota, no la página.

Si `lente` está activada en `config/profesor.md`, añade al final una sección aparte con esa
lectura; nunca decide qué se explica ni cuánto, y nunca puntúa.

### 4. Generarlo y abrirlo

Escribe el fichero en `repasos/<alcance>.html` y ábrelo en el navegador del alumno:

- Mac: `open repasos/<alcance>.html`
- Windows: `start repasos/<alcance>.html`

### 5. Cerrar

El repaso es un fichero del alumno como cualquier otro: se guarda.

    node .kit/herramientas/guardar.js "repaso: <alcance>"

## Al terminar

Dile en una línea qué alcance cubre la página y cuántos conceptos, ejercicios y flashcards
incluye. Nada más —la página se explica sola o está mal hecha.
