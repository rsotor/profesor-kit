# Índice del curso: navegar el temario sin el profesor

Fecha: 2026-09-22 · Estado: pendiente de revisión por Roberto · Parte de: kit 1.0.0

## 1. Problema

El contenido que genera el kit está bien, pero **para usarlo hay que conocer el árbol de carpetas**. Al abrir
la bóveda en Obsidian no hay un punto de entrada del curso: `como-usar-tu-profesor.md` son instrucciones
generales, y `mapa-del-curso.md` lo escribe el profesor a mano como una lista plana de sesiones sin estado de
estudio. No se puede ir de una sesión a la siguiente ni saber de un vistazo qué está estudiado, qué está
examinado y qué hay que repasar.

**Objetivo:** que el alumno repase el curso **solo en Obsidian, sin abrir al profesor**, siguiendo el temario
a golpe de clic.

**Restricción dura:** solo Markdown que Obsidian dibuja de serie (enlaces, tablas, propiedades). Ningún plugin.

## 2. Lo que ve el alumno

### 2.1 `estudio/inicio.md` — la página de inicio

La genera `guardar.js` entera en cada guardado. Es la pestaña que Obsidian abre al entrar.

```markdown
# Inversión multimercado

🔁 Para repasar:
- [[01-02-02-03-ratios-de-rentabilidad|1.2.2 Ratios de rentabilidad]]
- [[01-02-04-van-y-tir|1.2.4 VAN y TIR]]

👉 Sigue por aquí: [[01-03-01-renta-variable|1.3.1 Renta variable]]

Estudiadas 5 de 13 · Pendientes abiertos: 4 → [[pendientes]]

## Módulo 1 · Conceptos teóricos esenciales · 5/13 estudiadas · sin examen de módulo

### 1.2 Medidores básicos de rendimiento · 3/4 estudiadas · 📝 4,0 suspenso (2026-10-02)

| Sesión | Estudiada (tú) | Examen (profesor) |
|---|---|---|
| [[01-02-01-interes-inflacion-e-impuestos\|1.2.1 Interés, inflación e impuestos]] | ✅ | ✅ superada |
| [[01-02-02-03-ratios-de-rentabilidad\|1.2.2 Ratios de rentabilidad]] | ✅ | 🔁 repasar |
| [[01-02-04-van-y-tir\|1.2.4 VAN y TIR]] | ⬜ | 🔁 repasar |

## Módulo 2 · Finanzas personales · aún sin sesiones

Otras hojas: [[mapa-del-curso]] · [[progreso]] · [[formulario]] · [[como-usar-tu-profesor]]
```

- **🔁 Para repasar** es una lista, una sesión por línea. Si no hay ninguna, no aparece.
- **👉 Sigue por aquí** es la primera sesión, en orden del temario, sin `estudiada`. Si están todas
  estudiadas: "Has estudiado todas las sesiones procesadas".
- Una unidad sin sesiones procesadas aparece con "aún sin sesiones", para que se vea el temario entero.
- Los enlaces con alias dentro de tablas llevan `\|` (regla `no-se-vera-bien` de `AGENTS.md`).
- **Curso sin `config/estructura.json`:** una sola tabla con todas las sesiones en orden, sin agrupar.

### 2.2 Pie de navegación de cada nota de sesión

Lo genera `guardar.js` al final de cada nota de sesión, entre marcadores de comentario de Obsidian (no se ven
al leer):

```markdown
%% navegación: la genera guardar.js; no se edita a mano %%
---
← [[01-02-02-03-ratios-de-rentabilidad|1.2.2 Ratios]] · [[inicio|🏠 Inicio]] · [[01-03-01-renta-variable|1.3.1 Renta variable]] →
Repasa: [[flashcards/…|Flashcards]] · [[ejercicios/…|Ejercicio]]
%% fin de la navegación %%
```

- **Anterior / siguiente** siguen el orden del temario, cruzando sub-bloques y módulos. La primera sesión no
  tiene "anterior"; la última no tiene "siguiente".
- **Orden del temario:** por la parte numérica del id (`01-03-01`). Si dos sesiones comparten números (p. ej.
  `01-03-01-renta-variable` y `01-03-01-estilos-y-ciclos`, las dos de la clase 1.3.1 y del mismo día), desempata
  la propiedad `orden:` (1, 2…), que `/sesion` escribe cuando parte una clase en varias notas. Sin `orden:`, se
  usa el slug como último recurso y `comprobar.js` avisa (`orden-ambiguo`), porque el alfabeto no sabe nada del
  temario.
- "Repasa" solo enlaza lo que existe (flashcards y ejercicio de esa sesión).
- `guardar.js` solo reescribe lo que hay entre los marcadores; si no existen, los añade al final. El resto de
  la nota no se toca nunca.

### 2.3 La casilla "estudiada"

Propiedad `estudiada` en el frontmatter de la nota de sesión. Obsidian la dibuja de serie como una casilla
arriba de la nota. **La marca el alumno.** Ausente equivale a `false`.

## 3. Reglas de estado

Dos columnas que **no se mezclan**: lo que declara el alumno y lo que valida el profesor con un examen.

### 3.1 Estudiada (el alumno)

- La marca el alumno en la nota.
- **Única excepción:** si aprueba un examen, `/examen` marca `estudiada: true` en las sesiones que cubría.
- **Nunca** se marca al procesar una clase.

### 3.2 Examen (el profesor)

Por sesión, en este orden de prioridad:

| Marca | Cuándo |
|---|---|
| 🔁 repasar | Alguno de sus conceptos está en 🟡 o 🔴 en `progreso.md`. Se calcula; nadie lo escribe. |
| ✅ superada | La cubre un examen y ninguno de sus conceptos está en 🟡 o 🔴. |
| (vacío) | Ningún examen la cubre todavía. |

- "Sus conceptos" = los enlazados en la sección `## Conceptos` de la nota de sesión.
- **Un examen cubre** todas las sesiones cuyo id empieza por su `unidad:`: un examen del módulo `01` cubre
  también las sesiones de `01-02`, `01-03`… Lo mismo vale para el marcado de `estudiada` al aprobar (3.1).
- 🔁 desaparece sola cuando esos conceptos pasan a ✅ en un examen posterior (`progreso.md` ya lo refleja).
- La casilla del alumno no se toca: estudiada y "hay que repasar" conviven.

### 3.3 Nota de unidad y de módulo

- **Cada examen puntúa la unidad que cubre** (`unidad:` en su frontmatter, que ya existe). La nota sale en la
  fila de esa unidad. **Si hay varios exámenes de la misma unidad, cuenta el último** (por fecha): nunca la
  media, que castiga haber mejorado.
- **La nota del módulo es la de su examen final** (un examen con `unidad:` = el módulo). Sin él: "sin examen de
  módulo".
- Una nota ≥ **aprobado** se muestra "📝 7,5"; por debajo, "📝 4,0 suspenso".
- **Aprobado** viene de `config/curso.md` (`aprobado: 5` por defecto). `/configurar` lo pregunta.

## 4. Cómo se genera

| Pieza | Cambio |
|---|---|
| `.kit/herramientas/lib/indice.js` (nuevo) | Función pura: lee estructura, sesiones (título del H1, `estudiada`, conceptos, flashcards/ejercicio), exámenes (`unidad`, `nota`, fecha) y estados de `progreso.md`; devuelve el texto de `inicio.md` y el pie de cada sesión. No escribe. |
| `guardar.js` | Junto a `pendientes.md` y `auditoria-del-material.md`: escribe `estudio/inicio.md` y el pie de cada sesión, **solo si cambian** (un curso quieto no debe parecer que tiene cambios). |
| `lib/vault.js` | `inicio.md` entra en la lista de ficheros generados (no se cita como fuente, no se edita a mano). |
| `comprobar.js` | Avisos: examen sin `nota:` numérica · marcadores de navegación rotos (uno sin el otro) · `orden-ambiguo` (dos sesiones con los mismos números y sin `orden:`). |
| `.kit/plantillas/sesion.md` | Añade `estudiada: false` al frontmatter, y `orden:` comentado para cuando una clase se parte en varias notas. |
| Skill `sesion` | Deja de listar sesiones en `mapa-del-curso.md`: el mapa queda para la cobertura del material y las fechas. Si parte una clase en varias notas, les pone `orden:`. |
| Skill `examen` | Escribe `nota:` en el frontmatter del examen. Si aprueba, marca `estudiada: true` en las sesiones de la unidad. Cuando todas las sesiones de un módulo están estudiadas y no hay examen de módulo, lo propone. |
| Skill `configurar` | Pregunta el aprobado; lo escribe en `config/curso.md`. |
| `INSTALAR-AGENTE.md`, paso 9 | Tras crear la bóveda, deja `inicio.md` como pestaña abierta en `estudio/.obsidian/workspace.json` (con Obsidian cerrado). |
| `.kit/plantillas/guia-de-uso.md` | Puntos 3 y 5: "empieza por **inicio**"; cómo marcar una sesión como estudiada. |
| `AGENTS.md` | Una línea: `inicio.md` lo escribe `guardar.js`, como `pendientes.md`. |

### Cursos ya creados — migración 003

- Añade `estudiada: false` a las notas de sesión que no tengan la propiedad.
- Añade `aprobado: 5` a `config/curso.md` si falta.
- `inicio.md` y los pies se generan en el siguiente guardado.
- **No se toca `workspace.json`:** Obsidian lo sobrescribe mientras está abierto. El profesor se lo dice una
  vez al alumno: "abre **inicio** y fíjala" (clic derecho en la pestaña → *Fijar*).
- `mapa-del-curso.md` no se toca: su lista de sesiones escrita a mano se queda como está.
- Las sesiones con `orden-ambiguo` no se arreglan solas: el aviso le dice al profesor que ponga `orden:` la
  próxima vez que trabaje en el curso (en el curso de Roberto: `01-03-01-renta-variable` y `01-03-01-estilos-y-ciclos`).

## 5. Pruebas

- `lib/indice.js`, con cursos de ejemplo: con y sin estructura; sesiones estudiadas y no; examen aprobado,
  suspendido y repetido (cuenta el último); concepto en 🟡 → 🔁; examen de módulo presente y ausente; unidad
  sin sesiones; enlaces con alias escapados en tablas; dos sesiones con los mismos números, con y sin `orden:`;
  examen de módulo que cubre las sesiones de sus sub-bloques.
- `guardar.js`: el pie se crea si no existe, se reescribe entre marcadores sin tocar el resto de la nota, y un
  segundo guardado sin cambios no produce diferencias.
- Migración 003: añade `estudiada` y `aprobado` sin duplicarlos; es idempotente.
- `extremo-a-extremo.test.js`: tras procesar sesiones de ejemplo, `inicio.md` existe y enlaza la primera.
- `coherencia-skills.test.js`: las skills citan `inicio.md` y `nota:` como existen en las herramientas.

## 6. Fuera de alcance

- Plugins de Obsidian (Dataview, Tasks, Homepage…).
- Actualizar `inicio.md` en vivo cuando el alumno marca una casilla sin el profesor: se refleja en el
  siguiente guardado. Navegar no depende de ello.
- Formato del examen oficial del centro (sigue siendo fase 2).
- Reescribir el `mapa-del-curso.md` de cursos existentes.
