# Auditoría de prompts del producto — 2026-10-02

Ejecutada con `/claude-api prompt-audit .kit/skills .kit/guias AGENTS.md`. Solo propuesta: **no se ha aplicado
ningún cambio**. Complementa a `2026-10-02-auditoria-de-prompts.md`, que auditó la configuración de desarrollo.

**Resultado:** superficie limpia en lo de fondo. 3 fallos reales (texto que el propio repo contradice), 1 retoque de
patrón anticuado y 3 cosas para decidir.

## Supuestos

- **Alcance:** `AGENTS.md`, las 7 `SKILL.md` de `.kit/skills/` y las 9 guías de `.kit/guias/`. De
  `INSTALACION.md` solo cuenta como prompt el "Texto de arranque" (líneas 189-210); el resto lo lee una persona.
- **Modelo objetivo:** Sonnet 5.5, el recomendado para `claude-code` en `.kit/adaptadores/LEEME.md:10`. El
  adaptador `codex` no tiene modelo comparado: no se ha auditado contra modelos de OpenAI.
- **Comprobado contra el repo:** existen las 20 herramientas citadas, todos sus flags y los 22 nombres de aviso o
  señal (`comprobar.js`, `estado.js`, `lib/perfil.js`).
- **Se quedan como están, a propósito:**
  - Las `description` de las skills enumeran frases de ejemplo, pero están afinadas contra una prueba de
    disparadores (`pruebas/disparadores.json`, `npm run disparadores`): es texto de enrutado medido.
  - "Nunca edites ficheros con comandos de shell" se repite en `AGENTS.md`, `sesion`, `ejercicio` y
    `revisor-de-examenes`. Las copias coinciden y la regla sale de un fallo real (en segundo plano se deniega).

## Lo más importante

1. `actualizar/SKILL.md:44` manda a una sección de `/examen` que ya no existe: se movió a una guía.
2. `examen/SKILL.md:267` cita "el fixture de prueba", que vive en `pruebas/`, carpeta que `preparar-curso.js` borra
   del curso. El profesor del alumno nunca lo ve.
3. `AGENTS.md:37` dice que `estudiada` la marca el alumno; `examen.js` también la marca al aprobar un examen de
   módulo.

**Recuento por grupo:** G1 (texto anticuado): 2 · G2 (configuración): 5 · G3 (definiciones de herramientas): no
aplica · G4 (código de llamadas a la API): no aplica.

## Informe

| # | Dónde | Texto | Patrón | Por qué | Confianza | Acción |
|---|---|---|---|---|---|---|
| 1 | `.kit/skills/actualizar/SKILL.md:44` | "ver `.kit/skills/examen/SKILL.md`, sección "Exámenes de antes de esta versión"" | G2 · dato que caduca | La sección salió de `/examen` en `dad8504` (#63) y hoy está en `.kit/guias/examenes-de-antes.md` | Alta | rewrite |
| 2 | `.kit/skills/examen/SKILL.md:267-268` | "(como el fixture de prueba, con la clave de soluciones al final)" | G2 · dato que caduca | `pruebas/` está en `SOLO_DEL_KIT` (`preparar-curso.js:8`): en el curso no existe. Es una referencia del desarrollo que se coló en el producto | Alta | rewrite |
| 3 | `AGENTS.md:37` | "la casilla `estudiada`, que marca él" | G2 · contradicción | `examen.js:161-170` la pone a `true` al aprobar un examen de módulo, y `examen/SKILL.md:210` lo dice | Alta | rewrite |
| 4 | `.kit/skills/examen/SKILL.md:84-95` | Tabla de pesos 40/25/20/15 % y su reparto ("su 20 % pasa a cobertura (35 %)… (55 %)") | G1 · 1b, aritmética que tiene que calcular el modelo | Son cuentas que el modelo hace a ojo y nada comprueba (ni `comprobar.js` ni `examen.js` miran el reparto). La parte de criterio es el orden de prioridad | Media | rewrite (alternativa: pasar los pesos a `config/examenes.json` y que `examen.js` dé los números) |
| 5 | `.kit/skills/sesion/SKILL.md:16` | "Sigue estos puntos en orden y no te saltes ninguno." | G1 · 1a, insistencia | Frases del tipo "no te saltes nada" sobran en modelos actuales. Pero aquí puede pesar: son ocho pasos que tocan varios ficheros, y `sesion-incompleta` solo vigila una parte | Baja | flag: probar a quitarla en una `prueba-real` |
| 6 | `AGENTS.md:122` frente a `.kit/skills/configurar/SKILL.md:180-183` | "Hasta 5 preguntas, en el chat directamente; más es un examen" / "Máximo 10-12 preguntas en total" | G2 · contradicción | El test inicial hace 10-12 preguntas en el chat. Seguramente es una excepción por la tarea (van de una en una y se adaptan), pero ninguno de los dos ficheros lo dice | Baja | flag: decidir si se nombra la excepción |
| 7 | `.kit/skills/configurar/SKILL.md:192-207` | "Para cursos configurados antes de la 0.19.0…" | G2 · contenido con fecha | Es un apartado de casos antiguos, así que la forma es buena. Pero carga en cada `/configurar` para un caso que solo tienen los cursos viejos (hoy vamos por la 0.29.0) | Baja | flag: valorar si pasa a una guía o a una oferta de `/actualizar` ("Si ya tenías tu curso") |

## Cambios propuestos

Un cambio por hallazgo, para poder aceptarlos por separado. Solo van los de confianza alta o media.

### 1 · `actualizar/SKILL.md`: la sección que ya no está

```diff
--- a/.kit/skills/actualizar/SKILL.md
+++ b/.kit/skills/actualizar/SKILL.md
@@ -42,4 +42,4 @@
 3. **Adapta los exámenes antiguos** al formato de frontmatter: `unidad:` (el prefijo de la unidad),
    `nota:` como número sobre 10 (nunca `2/10`), `fecha:`, `intentos:`, y un `✍️ **Tu respuesta:**` vacío bajo
-   cada pregunta (ver `.kit/skills/examen/SKILL.md`, sección "Exámenes de antes de esta versión"). Los
+   cada pregunta (ver `.kit/guias/examenes-de-antes.md`). Los
    exámenes nuevos ya nacen en tipo test: no hay que tocar nada.
```

### 2 · `examen/SKILL.md`: el fixture que el curso no tiene

```diff
--- a/.kit/skills/examen/SKILL.md
+++ b/.kit/skills/examen/SKILL.md
@@ -266,4 +266,4 @@
    (apartado 3, paso 3). Que no se convierta en memorizar el test del centro.
-5. **Su respuesta correcta sale de la clave del propio ejemplo**, si la trae (como el fixture de prueba, con
-   la clave de soluciones al final). Si no la trae, la decides tú, contrastando con las notas del curso, y
+5. **Su respuesta correcta sale de la clave del propio ejemplo**, si la trae (por ejemplo, una clave de
+   soluciones al final). Si no la trae, la decides tú, contrastando con las notas del curso, y
    se lo dices al alumno.
```

### 3 · `AGENTS.md`: quién marca `estudiada`

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -36,3 +36,3 @@
 - **Lo escribe `guardar.js` en cada guardado: no lo edites ni lo cites como fuente de lo que sabe el alumno.**
-  `estudio/inicio.md` y el pie de cada sesión (el temario, qué ha estudiado —la casilla `estudiada`, que marca él—
+  `estudio/inicio.md` y el pie de cada sesión (el temario, qué ha estudiado —la casilla `estudiada`, que marca él
+  o `examen.js` al aprobar el examen del módulo—
   y qué tiene probado: su puerta al curso cuando estudia sin ti) · `estudio/pendientes.md` (TODO, FALTA INFO y dudas
```

### 4 · `examen/SKILL.md`: prioridad en vez de porcentajes

```diff
--- a/.kit/skills/examen/SKILL.md
+++ b/.kit/skills/examen/SKILL.md
@@ -84,12 +84,9 @@
-**Reparto de las preguntas nuevas** (paso 3 de arriba). Lee las notas de los bloques y `config/alumno.md`:
-
-| Origen | Peso |
-|---|---|
-| Errores repetidos de `config/alumno.md` | 40 % |
-| Conceptos `dificultad: 3` | 25 % |
-| Fórmulas de `estudio/formulario.md` | 20 % |
-| Cobertura del resto | 15 % |
-
-Si `estudio/formulario.md` está vacío, o `config/profesor.md` dice que las fórmulas son de apoyo y no de
-memoria, su 20 % pasa a cobertura (35 %). Si el alumno es nuevo y no tiene errores repetidos, su 40 % pasa
-también a cobertura (55 %).
+**Reparto de las preguntas nuevas** (paso 3 de arriba). Lee las notas de los bloques y `config/alumno.md`. Pesan
+más, por este orden: los errores repetidos de `config/alumno.md` (el bloque más grande), los conceptos
+`dificultad: 3` y las fórmulas de `estudio/formulario.md`; el resto cubre los demás conceptos del alcance. Lo que
+no aplica (sin errores repetidos todavía, sin fórmulas, o fórmulas de apoyo según `config/profesor.md`) se reparte
+en cobertura.
```

Si se prefiere que el reparto sea exacto, la alternativa es la del informe: pesos en `config/examenes.json` y que
`examen.js` devuelva cuántas preguntas tocan de cada origen. Así el modelo no hace cuentas.

## Cómo comprobarlo

- 1-3: comprobación contra el repo (la ruta existe, el texto coincide con `examen.js`). No hace falta probar el
  comportamiento.
- 4: un `/examen` de módulo en `pruebas-local/` antes y después del cambio. Se mira que siga habiendo más
  preguntas de errores repetidos que del resto.
- 5: la `prueba-real` de `/sesion` sin la línea. Se mira si sale `sesion-incompleta` o si se queda algún fichero
  vivo sin actualizar.

Del kit: nada
