---
name: ejercicio
description: Use when the student wants a new practice exercise for a concept, or more practice on something they keep failing. Triggers on "/ejercicio", "ponme un ejercicio de esto", "quiero practicar este concepto", "hazme más ejercicios de esto".
---

# Crear un ejercicio

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`).

Ejercicios nuevos, a demanda, sobre cualquier concepto del curso. No solo los que trajo la
sesión: **si un concepto se puede practicar, se le puede escribir un ejercicio.**

El kit no trae plantillas ni código de ejercicios: cada ejercicio es un fichero autocontenido
que tú generas. Esta skill es una guía —qué reto diseñar, qué formato elegir, cómo
verificarlo— no una receta con un único molde.

## El principio, antes que nada

**El caso concreto no es el contenido.** Da igual qué valores use el enunciado: lo que se
practica es **cómo se comporta el mecanismo cuando las condiciones cambian**. De ahí dos
consecuencias:

1. Cada condición que importe se puede mover, no queda fija y sola en el enunciado.
2. El ejercicio **plantea casos distintos cada vez** y pregunta el razonamiento *antes* de
   enseñar el resultado. Si el alumno puede acertar mirando la tabla, no ha practicado nada.

Corolario: una pregunta de ejercicio nunca es "¿cuánto da?" ni "¿qué es?". Es "¿qué pasa
si…?", "¿qué conviene?", "¿qué cambia?". El resultado es la comprobación, no el objetivo.

## Checklist

### 1. ¿Este concepto se puede practicar?

**Solo si algo se mueve:** al cambiar una condición, el resultado o el veredicto cambian de
forma que enseñe algo —idealmente invirtiéndose.

| Sí | No |
|---|---|
| Hay un cálculo o un procedimiento con condiciones que varían | Es una clasificación cerrada o una definición |
| Hay un umbral donde la respuesta se invierte | Es una lista sin mecanismo detrás |
| Hay una intuición que falla (el atajo que engaña) | El resultado siempre va en la misma dirección y es obvio |

Si no se mueve, **dilo y para.** Forzar un ejercicio para que el concepto "tenga uno" es peor
que no tenerlo: entrena a mirar la solución en vez de razonar.

Si el alumno lo pide porque **está fallando algo** (`estudio/progreso.md` en 🟡 o 🔴), lee antes su
nota y `config/alumno.md`: el ejercicio tiene que atacar el error concreto, no el concepto en
general.

### 2. Diseñar el reto antes que el formato

Escribe primero, en dos líneas:

- **La pregunta** que se le va a hacer (conceptual, no numérica).
- **Qué tiene que descubrir** al equivocarse.

Si no sabes contestar a lo segundo, el ejercicio todavía no existe. Todo lo demás —controles,
tablas, enunciados— es andamiaje para esa pregunta.

### 3. Elegir el formato según lo que hay que tocar

| Si el concepto… | Formato | Por qué |
|---|---|---|
| tiene parámetros que se pueden mover y el resultado se recalcula (cuantitativo, con umbral o punto donde el veredicto se invierte) | **HTML interactivo**: controles para cada parámetro, el reto pregunta antes de mostrar, y plantea casos distintos cada vez | tocar el parámetro y ver invertirse el resultado es lo que fija el mecanismo |
| es una decisión, una clasificación con casos frontera o un procedimiento con pasos (tangible, pero sin nada que recalcular) | **HTML tipo formulario**: el alumno elige o rellena, y la corrección explica **por qué** falla la opción equivocada | se puede comprobar solo, sin esperar al profesor |
| pide argumentar, interpretar o comparar (respuesta abierta) | **Markdown**: caso con condiciones + pregunta + respuesta plegada que dice qué condición cambiaría el veredicto; el alumno contesta y el profesor corrige en la conversación | un formulario no sabe corregir un argumento |
| pide producir algo (un texto, un esquema, un cálculo largo, código) | **Markdown con enunciado y criterios de corrección** plegados; el alumno entrega su fichero en `estudio/ejercicios/entregas/` y el profesor lo corrige contra los criterios | lo que se evalúa es lo producido |

Si dos formatos valen, manda `tipo_ejercicio` de `config/profesor.md`. Si ninguno encaja,
propón otro y explica por qué: la tabla es una guía, no un corsé.

Ejemplo cuantitativo: `velocidad-media` encaja en HTML interactivo —mueves la distancia y el
tiempo, y el veredicto ("¿llega a tiempo?") se invierte en un punto concreto—. Ejemplo no
cuantitativo: `causas-de-la-revolucion` encaja mejor en markdown de respuesta abierta —se
pesan causas entre sí, no hay ningún número que mover—.

### 4. Reglas de cualquier ejercicio en HTML

- **Un solo fichero autocontenido**: CSS y JS dentro, sin dependencias externas ni de red, se
  abre con doble clic.
- Sin estado escondido: todo se recalcula a partir de lo que el alumno ve.
- La solución nunca es visible antes de responder.
- Formato de números y fechas del idioma del curso.
- Legible en móvil.
- Los mismos tres bloques, en el mismo orden: **condiciones → reto → explicación.**
- Tipografía del sistema, una columna, fondo claro u oscuro según el sistema del alumno: que
  todos los ejercicios se parezcan entre sí.

### 5. Verificarlo — no es opcional

1. Si hay código, comprueba que no tiene errores de sintaxis (`node --check` sobre el JS
   extraído). Un error de sintaxis deja la página muerta y en silencio.
2. **Reproduce el resultado fuera del ejercicio** y compáralo con la nota del concepto. Si
   discrepan, **manda la nota.**
3. Si los casos son aleatorios, **barre unos miles** y comprueba que la respuesta marcada
   como correcta lo es de verdad en todos, descartando empates y casos degenerados.
4. Antes de cerrar, comprueba que la moraleja del ejercicio es la misma que la de la nota.
   **Si enseña la contraria, se tira; no se matiza.**

### 6. Enlazarlo — en los dos sentidos

Un ejercicio que solo se alcanza desde el fichero de su sesión está medio perdido. Cuatro
sitios, y `node .kit/herramientas/comprobar.js` valida que no falte el primero:

1. **Nota del concepto** → `ejercicio: <slug>` en el frontmatter y sección `## Practícalo` con
   el enlace y qué hay que mover. Si el ejercicio sirve a **varios** conceptos, cada uno lo
   declara y cada uno explica qué se ve *desde su lado* (no se copia el mismo párrafo).
2. **Ejercicio → concepto**: el ejercicio enlaza de vuelta a la nota o notas, no solo a la
   sesión de la que salió.
3. **`estudio/ejercicios/<id-de-sesion>.md`** de la sesión de la que salga, con su versión a mano. Si
   nace suelto, va a `estudio/ejercicios/extra.md`.
4. **`estudio/ejercicios/_index.md`**: fila en las dos tablas —por ejercicio y por concepto—, con *qué
   se descubre fallándolo*. Es el único sitio donde se ve qué practica qué sin abrir nada.

### 7. Lo que aprende el profesor

Un fallo en un ejercicio es una prueba. Va a `config/alumno.md` citando el ejercicio, y mueve
el eje *aplicación* de `estudio/progreso.md`.

### 8. Cerrar

    node .kit/herramientas/comprobar.js
    node .kit/herramientas/guardar.js "ejercicio: <concepto>"

Si `comprobar.js` da errores, se arreglan antes de guardar.

## Al terminar

Dile en una línea qué ejercicio hay y **qué se descubre fallándolo**. Nada más —el ejercicio
se explica solo o está mal hecho.
