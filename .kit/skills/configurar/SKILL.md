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
5. Cambia `estado: sin-configurar` por `estado: configurado`. Marca `configuracion.curso: true`.

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

Después:

    node .kit/herramientas/guardar.js "config: sesión 0"

Y dile cuál es el siguiente paso: dejar el material de la primera clase en `estudio/inbox/` (dentro de
Obsidian la verá como la carpeta **inbox**) y pedir `/sesion`.
