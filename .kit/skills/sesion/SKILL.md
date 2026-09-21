---
name: sesion
description: Use when the student delivers notes, slides, a transcript or a PDF from a class and wants them turned into study material. Triggers on "/sesion", "aquí tienes los apuntes de la clase", "procesa esta sesión", "he dejado el PDF en inbox".
---

# Procesar una sesión de clase

**Antes de nada:** lee `config/curso.md`, `config/profesor.md` y `config/alumno.md` (regla común
de `AGENTS.md`). Sin esos tres y sin `estudio/conceptos/_index.md` completo se explica en el vacío y se
duplican conceptos.

Convierte apuntes en bruto en material de estudio, sin duplicar lo que ya existe.

## Checklist

Crea una tarea por cada punto y complétalas en orden.

### 1. Situar la sesión

El identificador de la sesión sale de la sección "Cómo numera el centro las clases" de
`config/curso.md`. Si esa sección no basta para nombrar esta clase, **pregunta** — no lo
adivines: un identificador mal puesto rompe el `## Historial` de todas las notas que toque.

Fuente de los apuntes: fichero en `estudio/inbox/`, texto pegado, PDF, transcripción. Si es un PDF o una
imagen, léelo antes de empezar.

### 1b. Auditar el material, no solo leerlo

Los ficheros de clase dicen más de lo que pone en el texto. Antes de escribir nada:

- **Si hay hojas de cálculo, mira las fórmulas, no solo los valores**, si tu entorno lo permite.
  Ahí se ve el modelo real: qué celdas son mandos y qué supuestos esconde.
- **Reproduce el resultado del material con tu propio cálculo.** Si cuadra, el modelo está
  entendido. Si no cuadra, hay algo que contar.
- **Compara los ficheros de la clase entre sí.** Discrepancias las hay casi siempre: plantillas
  que alguien tocó en directo, cifras que cambian entre ediciones.
- **Cuantifica lo que encuentres.** "Es una aproximación" no dice nada; un número concreto sí.

Todo esto va a la sección `## Auditoría del material` del índice de sesión, marcado como lo que
es: **control de calidad del material, no contenido del curso.**

### 2. Extraer los conceptos

Lista los conceptos que aparecen en la clase. Para cada uno, decide:

- **¿Está en `estudio/conceptos/_index.md`?** Comprueba el slug **y los `alias`**. Quien explique este
  bloque puede llamarlo distinto a como lo llamó otra fuente antes.
- **Existe** → amplía la nota existente: añade lo nuevo, añade el nombre nuevo a `alias` si
  procede, añade el bloque a `bloques:`, y añade una línea al `## Historial`. **Nunca crees una
  segunda nota.**
- **No existe** → nota nueva desde `.kit/plantillas/concepto.md`.

Si dudas de si dos cosas son el mismo concepto: **pregunta**. Un duplicado cuesta más de
arreglar dentro de dos meses que una pregunta ahora.

### 3. Escribir las notas de concepto

Reglas de `AGENTS.md`, en corto:

- Una pantalla máximo. Si no cabe, el concepto son dos conceptos: pártelo.
- Ejemplo con datos **inventados y sencillos**, que se puedan seguir sin herramientas.
- Cumple las reglas propias del dominio de `config/curso.md`.
- Orden: problema → ejemplo → nombre → fórmula → error típico.
- Rellena `requiere:` con los conceptos previos necesarios. Si un prerrequisito está marcado
  `dificultad: 3` en su nota, refréscalo en dos líneas antes de seguir.
- Lo que no venga en los apuntes: `**TODO:**` con la pregunta concreta. **Nunca inventes.**
- Material que el curso no entregó: `⚠️ **FALTA INFO:**`. No es lo mismo que un TODO — eso solo
  lo puede resolver el alumno o el centro.
- Ampliaciones tuyas fuera de los apuntes: `> [!info] Ampliación fuera de los apuntes`.
- Dato con fuente externa: `💬 *Conocimiento general, no del curso.*` + la fuente.
- Si `lente` está activada en `config/profesor.md`, añade al final la lectura desde ese punto de
  vista; nunca decide qué se explica ni cuánto, y nunca puntúa.

### 4. Índice de sesión

Carpeta plana `estudio/sesiones/<id>-tema.md`, desde `.kit/plantillas/sesion.md`. Es un **mapa, no
contenido**: ~15-20 líneas.

1. **El nombre sale de `config/curso.md`.** Usa números a dos dígitos para que ordene bien en el
   explorador de ficheros: con uno solo, `9` ordena después de `14`.
2. **Una nota cubre una unidad de estudio con sentido**, no un fichero suelto: si el material
   trae varias clases cortas sobre lo mismo, se agrupan en una nota. **Si un grupo pasa de ~10
   conceptos nuevos, se parte**, y la nota dice por qué se partió.
3. **Material que no es una clase** (una tutoría, una sesión de dudas) se decide **después de
   leerlo, nunca antes**:
   - **Aporta contenido** (resuelve dudas de fondo, añade ejemplos, corrige algo) → sesión
     normal, con sus notas y su índice. Lo que se dijo allí y no está en el material escrito va
     marcado `> [!quote] De la clase, aportado por el alumno (fecha)`.
   - **No aporta nada** (logística, repetición de lo ya visto) → no se crea nota. Si afecta a
     una sesión concreta, una línea de aviso en esa sesión y punto. **No se rellena por
     rellenar.**

**Fechas: solo `trabajada:`, el día que se procesa la clase.** El orden lo da
`estudio/mapa-del-curso.md`, no el calendario.

Las secciones `## Auditoría del material` y `## Para pensarlo despacio` son las que distinguen
una sesión trabajada de unos apuntes pasados a limpio. **Las preguntas no son flashcards**: no
tienen respuesta de una línea, y si la tienen, están mal planteadas.

Al crear la nota, actualiza también `estudio/mapa-del-curso.md`: marca la clase como procesada con su
fecha.

### 5. Flashcards

`estudio/flashcards/<id-de-sesion>.md`, desde `.kit/plantillas/flashcards.md`. El número lo marca
`flashcards_por_sesion` de `config/profesor.md`. Prioriza lo que sea carne de examen y los
errores típicos.

### 6. Ejercicios — solo donde algo se mueve

**El criterio no es que el concepto tenga números, es que se mueva:** un ejercicio vale la pena
cuando al cambiar una condición **el resultado o el veredicto cambia**. En `velocidad-media`,
cambiar la distancia o el tiempo cambia el resultado. En `causas-de-la-revolucion` también hay
algo que mover, aunque no haya números: ¿habría estallado igual sin la crisis de subsistencias?
Lo que no se mueve es una lista o una definición pura: ahí no se fuerza un ejercicio, se dice en
una línea por qué no lo lleva.

El **cómo** está entero en la skill `/ejercicio`: criterio de si procede, diseño del reto,
formato y verificación obligatoria. Léela antes de escribir el primero.

Los ejercicios de una clase **se crean aquí, en el momento de procesarla**: no se dejan para
después ni se espera a que los pida el alumno.

### 7. Actualizar los ficheros vivos

Los seis, sin saltarse ninguno:

1. `estudio/conceptos/_index.md` — línea nueva o alias actualizado
2. `estudio/formulario.md` — cualquier fórmula nueva, en su sección de bloque
3. `estudio/mapa-del-curso.md` — contadores de sesiones y conceptos, estado del bloque
4. `estudio/ejercicios/_index.md` — fila por ejercicio nuevo, en las dos tablas
5. `estudio/progreso.md` — una fila por concepto nuevo, todos en `⬜ sin evaluar`. **Nunca se marca nada
   como sólido aquí:** eso solo lo hacen `/examen` y `/ejercicio`, con respuestas del alumno delante
6. `config/alumno.md` — **solo si has aprendido algo de él en esta sesión** (una duda, un error
   repetido, una analogía que funcionó). Si no, no lo toques.

### 8. Cerrar

```
node .kit/herramientas/comprobar.js
```

Si falla, arregla antes de dar la sesión por cerrada. Después:

```
node .kit/herramientas/guardar.js "sesion(<id>): <tema>"
```

## Al terminar, resume en pantalla

Formato corto, sin parrafada:

```
<id-de-sesion> · <Tema>

Conceptos nuevos:    velocidad-media, causas-de-la-revolucion
Conceptos ampliados: <concepto> (+ qué se añadió hoy)
Flashcards: 5 · Ejercicios: 2
Auditoría: <discrepancia encontrada, si la hubo>
FALTA INFO: 1 → <qué falta y dónde debería estar>
comprobar.js: OK
```

Y si hay `TODO` o `FALTA INFO`, dilos en voz alta. Es lo único que el alumno tiene que resolver
— todo lo demás ya está hecho.
