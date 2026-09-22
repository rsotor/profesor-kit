# Índice del curso: navegar el temario sin el profesor

Fecha: 2026-09-22 · Estado: aprobada por Roberto (revisada con Fable) · Parte de: kit 1.0.0 (antes de publicarla)

## 1. Problema

El contenido que genera el kit está bien, pero **para usarlo hay que conocer el árbol de carpetas**. Al abrir
la bóveda en Obsidian no hay un punto de entrada del curso: `como-usar-tu-profesor.md` son instrucciones
generales, y `mapa-del-curso.md` lo escribe el profesor a mano como una lista plana de sesiones sin estado de
estudio. No se puede ir de una sesión a la siguiente ni saber de un vistazo qué está estudiado, qué está
probado y qué hay que repasar.

**Objetivo:** que el alumno repase el curso **solo en Obsidian, sin abrir al profesor**, siguiendo el temario
entero a golpe de clic.

**Restricción dura:** solo Markdown que Obsidian dibuja de serie (enlaces, tablas, propiedades). Ningún plugin.

## 2. Lo que ve el alumno

### 2.1 `estudio/inicio.md` — la página de inicio

La genera `guardar.js` entera en cada guardado.

```markdown
# Inversión multimercado

🔁 Para repasar:
- [[01-02-02-03-ratios-de-rentabilidad|1.2.2-1.2.3 Ratios de rentabilidad]]
- [[01-02-04-van-y-tir|1.2.4 VAN y TIR]]

👉 Sigue por aquí: [[01-03-01-renta-variable|1.3.1 Renta variable]]

Estudiadas 5 de 13 · Pendientes abiertos: 4 → [[pendientes]]

## Módulo 1 · Conceptos teóricos esenciales · 5/13 estudiadas · sin examen de módulo

### 1.2 Medidores básicos de rendimiento y análisis · 3/4 estudiadas · 📝 4,0 suspenso (2026-10-02)

| Sesión | Estudiada (tú) | Profesor |
|---|---|---|
| [[01-02-01-interes-inflacion-e-impuestos\|1.2.1 Interés, inflación e impuestos]] | ✅ | ✅ superada |
| [[01-02-02-03-ratios-de-rentabilidad\|1.2.2-1.2.3 Ratios de rentabilidad]] | ✅ | 🔁 repasar |
| [[01-02-04-van-y-tir\|1.2.4 VAN y TIR]] | ⬜ | 📝 faltan 2 |

## Módulo 2 · Finanzas personales · aún sin sesiones

Otras hojas: [[mapa-del-curso]] · [[progreso]] · [[formulario]] · [[como-usar-tu-profesor]]
```

- **🔁 Para repasar** es una lista, una sesión por línea. Si no hay ninguna, no aparece.
- **👉 Sigue por aquí** es la primera sesión, en orden del temario, sin `estudiada`. Si están todas
  estudiadas: "Has estudiado todas las sesiones procesadas".
- **Examen de módulo pendiente:** si todas las sesiones procesadas de un módulo están estudiadas y el módulo no
  tiene examen, su cabecera dice "listo para el examen del módulo: pídeselo a tu profesor".
- **Todo el temario:** cada unidad de `config/estructura.json` aparece, tenga sesiones o no ("aún sin
  sesiones"). Por eso la estructura tiene que listar el temario completo (ver 4.2).
- **Nombre de cada sesión:** la numeración del centro (`clases:` del frontmatter, unida con `-` si son
  varias) + el título del H1 sin el prefijo `<id> ·`. Sin `clases:`, solo el título.
- **Nombre de cada unidad:** `titulo` de `estructura.json`; si falta, el nombre de su carpeta sin guiones.
- Los enlaces con alias dentro de tablas llevan `\|` (regla `no-se-vera-bien` de `AGENTS.md`).
- **Curso sin `config/estructura.json`:** una sola tabla con todas las sesiones en orden, sin agrupar.

### 2.2 Pie de navegación de cada nota de sesión

Lo genera `guardar.js` al final de cada nota de sesión, entre marcadores de comentario de Obsidian (no se ven
al leer):

```markdown
%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-02-02-03-ratios-de-rentabilidad|1.2.2-1.2.3 Ratios]] · [[inicio|🏠 Inicio]] · [[01-03-01-renta-variable|1.3.1 Renta variable]] →
%% fin de la navegación %%
```

- La línea en blanco antes de `---` es obligatoria: sin ella Markdown lee el comentario como un título.
- **Anterior / siguiente** siguen el orden del temario, cruzando sub-bloques y módulos. La primera sesión no
  tiene "anterior"; la última no tiene "siguiente".
- Las flashcards y el ejercicio **no** van en el pie: ya están en la sección `## Material` de la nota.
- `guardar.js` solo reescribe lo que hay entre los marcadores; si no existen, los añade al final. El resto de
  la nota no se toca nunca. Se respeta el fin de línea del fichero (CRLF en Windows): si no, cada guardado
  reescribiría la nota entera.
- Añadir una sesión cambia también el pie de la anterior (gana "siguiente"): es esperado.

### 2.3 Orden del temario

Por la parte numérica del id (`01-03-01`). Si dos sesiones comparten números (p. ej.
`01-03-01-renta-variable` y `01-03-01-estilos-y-ciclos`, las dos de la clase 1.3.1 y del mismo día), desempata
la propiedad `orden:` (1, 2…), que `/sesion` escribe cuando parte una clase en varias notas. Sin `orden:`, se usa
el slug como último recurso y `comprobar.js` avisa (`orden-ambiguo`), porque el alfabeto no sabe nada del
temario. Un id sin parte numérica (curso sin estructura, `semana-3-…`) ordena por `trabajada` y luego por slug.

### 2.4 La casilla "estudiada"

Propiedad `estudiada` en el frontmatter de la nota de sesión. Obsidian la dibuja de serie como una casilla
arriba de la nota. **La marca el alumno.** Ausente equivale a no estudiada.

Obsidian reescribe el frontmatter entero al marcar la casilla: borra los comentarios `#` y puede pasar
`clases: [1.2.2, 1.2.3]` a lista en bloque (`- 1.2.2`). Consecuencias: la plantilla no lleva instrucciones en
comentarios YAML que haya que conservar, y el lector de frontmatter entiende las dos formas de lista (4.1).

## 3. Reglas de estado

Dos columnas que **no se mezclan**: lo que declara el alumno y lo que el profesor tiene probado.

### 3.1 Estudiada (el alumno)

- La marca el alumno en la nota.
- **Única excepción:** si aprueba un examen, `/examen` marca `estudiada: true` en las sesiones que cubría.
- **Nunca** se marca al procesar una clase.

### 3.2 Profesor (lo que hay probado)

Sale **solo de `progreso.md`**: nadie la escribe. Un concepto cuenta como **probado** cuando su teoría está en
✅ y ninguna de sus columnas está en 🟡 o 🔴 (la aplicación no se exige: hay conceptos sin cálculo). Por sesión,
en este orden de prioridad:

| Marca | Cuándo |
|---|---|
| 🔁 repasar | Alguno de sus conceptos está en 🟡 o 🔴, en cualquier columna. |
| ✅ superada | Todos sus conceptos están probados. |
| 📝 faltan N | Alguno está probado y quedan N sin probar. |
| (vacío) | Ninguno está probado todavía. |

- **"Sus conceptos"** = todos los enlazados en la sección `## Conceptos` de la nota de sesión, **nuevos y
  ampliados**. Un concepto que nace en 1.1.2 y se amplía en 1.3.1 marca 🔁 en las dos: lo fallado puede ser
  justo la parte ampliada.
- La columna se llama **Profesor** y no "Examen" porque un ejercicio también mueve `progreso.md`.
- 🔁 desaparece sola cuando esos conceptos vuelven a ✅ en una prueba posterior.
- La casilla del alumno no se toca: estudiada y "hay que repasar" conviven.
- **Cómo se tapan los huecos ("📝 faltan N"):** el alumno pide "hazme un test de lo que me falta de la 1.2" y
  `/examen` pregunta **solo** los conceptos sin probar de ese alcance (3-5 preguntas). Una conversación en la
  que el profesor pregunta y el alumno acierta cuenta como mini-test; una explicación sin preguntas no cuenta.

### 3.3 Nota de unidad y de módulo

- **Un examen cubre** las unidades de su `unidad:` (un prefijo o una lista de prefijos) y todas las sesiones
  cuyo id empieza por alguno de ellos: un examen del módulo `01` cubre también las sesiones de `01-02`, `01-03`…
- **Nota de una unidad:** la del último examen (por `fecha:`) cuya `unidad:` es exactamente esa unidad. Nunca la
  media, que castiga haber mejorado. Un examen de varias unidades (`[01-02, 01-03]`) pone su nota en cada una.
- **Nota del módulo:** la de su examen final, que es un examen con `unidad:` **exactamente** el prefijo del
  módulo. Un examen de 1.2 + 1.3 no es examen de módulo. Sin él: "sin examen de módulo".
- Notas sobre 10. Una nota ≥ **aprobado** se muestra "📝 7,5"; por debajo, "📝 4,0 suspenso".
- **Aprobado** viene de `config/curso.md` (`aprobado:`); si falta, vale 5. `/configurar` lo pregunta.
- Los exámenes de "lo que me falta" (3.2) llevan `parcial: true` y **nunca** cambian la nota de la unidad: solo
  preguntan unos pocos conceptos. Sí mueven `progreso.md`, que es lo que tapa los huecos.

## 4. Cómo se genera

### 4.1 Herramientas

| Pieza | Cambio |
|---|---|
| `.kit/herramientas/lib/indice.js` (nuevo) | Función pura: lee estructura, sesiones (H1, `clases`, `orden`, `estudiada`, conceptos de `## Conceptos`), exámenes (`unidad`, `nota`, `fecha`, `parcial`) y estados de `progreso.md`; devuelve el texto de `inicio.md` y el pie de cada sesión. No escribe. |
| `guardar.js` | **Genera primero y comprueba después:** escribe `estudio/inicio.md`, los pies de sesión, `pendientes.md` y `auditoria-del-material.md` (solo si cambian) y luego ejecuta `comprobar()`, que así valida también lo generado. Hoy comprueba antes de generar (`guardar.js:24`), y con `inicio.md` exigido eso sería un punto muerto. |
| `lib/vault.js` | `leerFrontmatter` entiende listas en bloque (`- item`). Lectores tipados para lo nuevo: `estudiada` es cierta solo si vale `true`; `orden` y `nota` son números. `inicio.md` entra en `listarNotas` (se validan sus enlaces) pero **no** en `piezasAusentes` ni en `reparar.js`: se regenera, no se repara. |
| `comprobar.js` | Se quita `comprobarMapa`: hoy exige como **error** que cada sesión esté en `mapa-del-curso.md` y bloquearía el guardado. No se sustituye por "que esté en `inicio.md`": `inicio.md` se genera desde las sesiones y no puede faltar ninguna, y exigirlo haría que `actualizar.js` revirtiera la migración (tras migrar, `inicio.md` aún no existe hasta el guardado final). Avisos nuevos: examen sin `nota:`/`fecha:` válidas · marcadores de navegación rotos (uno sin el otro) · `orden-ambiguo`. |
| `organizar.js` | Acepta `titulo` opcional en cada unidad de `estructura.json`. |
| `.kit/motor.json` | `version_datos: 3` (lo exige `coherencia.test.js`). |

### 4.2 Skills, plantillas y guías

| Pieza | Cambio |
|---|---|
| `.kit/plantillas/sesion.md` | Añade `estudiada: false`. Sin comentarios YAML nuevos. |
| Skill `sesion` | Deja de listar sesiones en `mapa-del-curso.md`: el mapa queda para la cobertura del material y las fechas. Si parte una clase en varias notas, les pone `orden:`. Si la sesión es de una unidad que no está en `estructura.json`, la añade con su `titulo`. |
| Skill `examen` | Frontmatter obligatorio: `unidad` (prefijo o lista), `fecha`, `nota` (sobre 10) y `parcial: true` si es de "lo que me falta". Un examen en HTML lleva además su nota `.md` con ese frontmatter. Si aprueba, marca `estudiada: true` en las sesiones cubiertas. Nuevo alcance: "lo que me falta" de una unidad o sesión. |
| Skill `configurar` | Pregunta el aprobado (`config/curso.md`). Escribe en `estructura.json` **todas** las unidades del temario con su `titulo`, no solo las que ya tienen material. |
| Saludo (`AGENTS.md`, "Al empezar cada sesión") | Si un módulo está listo para su examen (2.1), lo menciona en la frase de saludo. |
| `.kit/plantillas/guia-de-uso.md` | Se reescribe: ver 4.3. |
| `INSTALAR-AGENTE.md`, paso 9 | El alumno abre **inicio** y la fija (clic derecho en la pestaña → *Fijar*). No se toca `workspace.json`: la bóveda la crea Obsidian abierto y lo pisaría. |
| `AGENTS.md` | Una línea: `inicio.md` lo escribe `guardar.js`, como `pendientes.md`; no se edita ni se cita como fuente. |

### 4.3 La hoja "Cómo usar tu profesor" es parte de la entrega

La plantilla `.kit/plantillas/guia-de-uso.md` (que se convierte en `estudio/como-usar-tu-profesor.md`) se
reescribe para este cambio, no se parchea con una línea. **Criterio de aceptación:** un alumno sin perfil
técnico, con esa hoja y nada más, completa el ciclo entero sin preguntar a nadie:

1. **Encontrar su curso:** abrir Obsidian, abrir **inicio** y fijar la pestaña (con captura de pantalla
   descrita en palabras: dónde está la pestaña, qué es "Fijar").
2. **Estudiar sin el profesor:** seguir "👉 Sigue por aquí", leer la sesión, sus conceptos y sus flashcards, y
   pasar a la siguiente con el enlace del pie.
3. **Marcar lo estudiado:** dónde está la casilla **estudiada** en la nota y qué pasa al marcarla (se verá en
   **inicio** la próxima vez que use al profesor).
4. **Leer la página de inicio:** qué significa cada marca (✅ estudiada · ⬜ · ✅ superada · 📝 faltan N ·
   🔁 repasar · 📝 nota / suspenso), en una tabla con una frase por marca.
5. **Qué pedirle al profesor y cuándo:** procesar una clase nueva, "hazme un test de lo que me falta de…",
   el examen de módulo cuando **inicio** lo proponga, repasar lo marcado 🔁.
6. **Si algo no cuadra:** una casilla marcada que no se ve en **inicio** (se actualiza al guardar), una sesión
   que no aparece, la pestaña **inicio** que ya no está fijada.

Se valida con una persona real: Roberto se la da a su padre sin explicarle nada y anota dónde se atasca. Cada
atasco es un cambio en la hoja antes de publicar la 1.0.0.

### 4.4 Cursos ya creados — migración 003

- Añade `estudiada: false` a las notas de sesión que no tengan la propiedad. Nada más: `aprobado` vale 5 si
  falta, sin tocar `config/curso.md`.
- `inicio.md` y los pies se generan en el siguiente guardado.
- Lo que la migración no puede saber lo deja como tarea al profesor, que lo hace la próxima vez que trabaje en el
  curso y se lo cuenta al alumno en una frase: completar `estructura.json` con todo el temario y sus títulos
  (sale de `config/curso.md`), poner `orden:` donde avise `orden-ambiguo`, **volver a escribir
  `como-usar-tu-profesor.md` desde la plantilla nueva** (con los mismos datos que usó `/configurar`: atajo,
  marcador, nombre del curso), y decirle "abre **inicio** y fíjala".
- `mapa-del-curso.md` no se toca: su lista de sesiones escrita a mano se queda como está.
- En el curso de Roberto eso significa: módulos 2-12 y títulos en `estructura.json`, y `orden:` en
  `01-03-01-renta-variable` y `01-03-01-estilos-y-ciclos`.

## 5. Pruebas

- `lib/indice.js`, con cursos de ejemplo: con y sin estructura; estructura con unidades sin sesiones y con y
  sin `titulo`; sesiones estudiadas y no; concepto 🟡 en teoría y en aplicación → 🔁; concepto ampliado en otra
  sesión → 🔁 en las dos; ✅ superada / 📝 faltan N / vacío; examen aprobado, suspendido, repetido (cuenta el
  último), de varias unidades y parcial; examen de módulo presente y ausente, y examen de 1.2+1.3 que **no**
  cuenta como de módulo; dos sesiones con los mismos números, con y sin `orden:`; ids sin parte numérica;
  enlaces con alias escapados en tablas; frontmatter con listas en bloque y `estudiada: false` como texto.
- `guardar.js`: genera antes de comprobar (un curso sin `inicio.md` se guarda y sale con él); el pie se crea si no
  existe, se reescribe entre marcadores sin tocar el resto de la nota, conserva CRLF; un segundo guardado sin
  cambios no produce diferencias.
- `comprobar.js`: una sesión que no está en `mapa-del-curso.md` ya no es error; los tres avisos nuevos salen
  cuando toca y no salen en un curso sano.
- Migración 003: añade `estudiada` sin duplicarla; es idempotente.
- `extremo-a-extremo.test.js`: tras procesar sesiones de ejemplo, `inicio.md` existe y enlaza la primera.
- `coherencia-skills.test.js`: las skills citan `inicio.md`, `nota:`, `fecha:` y `parcial:` como existen en las herramientas.

## 6. Fuera de alcance

- Plugins de Obsidian (Dataview, Tasks, Homepage…).
- Actualizar `inicio.md` en vivo cuando el alumno marca una casilla sin el profesor: se refleja en el
  siguiente guardado (y esas casillas entran en ese commit). Navegar no depende de ello.
- Abrir `inicio.md` automáticamente al entrar en Obsidian: se fija a mano una vez.
- Formato del examen oficial del centro (sigue siendo fase 2).
- Reescribir el `mapa-del-curso.md` de cursos existentes.

## 7. Ampliación (2026-09-22): Obsidian viene configurado de serie

Roberto ha dejado su Obsidian como quiere que lo tengan los alumnos. La instalación lo reproduce.

**Decisiones de Roberto:**
- Ajustes y componentes internos: **por defecto**, sin preguntar. **Sync apagado** (no usa Obsidian Sync).
- Complementos de la comunidad (Terminal, Code Files, Claudian): **se instalan pero no se activan**. La hoja del
  alumno explica qué hace cada uno y cómo activarlo. Son código de terceros: el alumno decide.

### 7.1 Qué se configura

| Fichero en `estudio/.obsidian/` | Contenido |
|---|---|
| `app.json` | `showUnsupportedFiles: true`, `promptDelete: false`, `alwaysUpdateLinks: true` |
| `appearance.json` | `translucency: false` |
| `core-plugins.json` | el de Roberto con `sync: false` (encendidos: explorador, búsqueda, selector, enlaces entrantes y salientes, etiquetas, **propiedades** —dibuja la casilla *estudiada*—, vista previa, paleta de comandos, barra de estado, marcadores, esquema, recuperación de ficheros) |
| `plugins/<id>/` | `main.js`, `manifest.json` y `styles.css` (si lo publica) de la última versión de cada complemento |

Complementos, todos en el directorio oficial de Obsidian (`obsidianmd/obsidian-releases`):

| id | Repo | Para qué, en una frase para el alumno |
|---|---|---|
| `terminal` | `polyipseity/obsidian-terminal` | Abre una terminal dentro de Obsidian para hablar con tu profesor sin cambiar de ventana (necesita Python) |
| `code-files` | `lukasbach/obsidian-code-files` | Permite ver y editar ficheros de código dentro de Obsidian |
| `realclaudian` | `yishentu/claudian` | Mete a Claude dentro de Obsidian, en un panel lateral |

**`community-plugins.json` no se escribe nunca:** es la lista de los activados, y activarlos es decisión del alumno.

### 7.2 Reglas

- **Antes de la primera apertura:** `preparar-curso.js` escribe los tres JSON. Obsidian adopta lo que encuentra
  al abrir una carpeta por primera vez; escribirlos con Obsidian abierto no sirve (los pisa).
- **Nunca se pisa una elección del alumno:** si un JSON existe, solo se **añaden las claves que falten**.
- **Los complementos se descargan** con `node .kit/herramientas/obsidian.js` (paso 9 de la instalación, y tras
  actualizar un curso existente). Solo descarga los que no estén; un fallo de red no rompe nada: lo dice y sigue.
- **Diagnóstico:** "la bóveda está abierta" ya no puede ser "existe `estudio/.obsidian/`" (ahora la crea el kit):
  pasa a ser "existe `estudio/.obsidian/workspace.json`", que solo escribe Obsidian al abrirla.
- **Cursos existentes:** la migración 003 (aún sin publicar) también añade las claves que falten a los JSON. Sin
  red: los complementos los descarga el profesor con `obsidian.js` al terminar de actualizar.
- `plugins/` y `community-plugins.json` ya están en `.gitignore`: los complementos no entran en el repo.
- **Hoja del alumno:** sección "Extras de Obsidian (opcionales)" con la tabla de 7.1 y los pasos para activarlos:
  rueda dentada → *Complementos de la comunidad* → *Activar complementos de la comunidad* → activar el que quiera.
  El hueco `{{TERMINAL_EN_OBSIDIAN}}` pasa a depender de que Terminal esté **activado** (en `community-plugins.json`).

## 8. Ampliación (2026-09-22): el examen se contesta en la nota y se puede repetir

Feedback de Roberto tras hacer el examen del módulo 1: contestaba en el chat, sin sitio en la nota; y quiere que un
examen corregido quede **limpio y listo para repetirlo** días después, con los resultados guardados aparte.

**Decisiones de Roberto:**
- Debajo de cada pregunta, una línea `✍️ **Tu respuesta:**` vacía. Se escribe a continuación (en esa línea o en
  las siguientes, hasta la siguiente pregunta).
- Al repetirlo, el examen es **idéntico** (mismas cifras, mismo orden de opciones): así cada intento se compara con
  el anterior. Con el tiempo y muchos exámenes, la memoria de "la 7 era la b" deja de pesar.

### 8.1 Ciclo de un examen

1. **Generar:** preguntas con su `✍️ **Tu respuesta:**` vacío; soluciones plegadas al final (como hoy);
   frontmatter con `unidad`, `fecha`, `nota:` vacía (spec §3.3).
2. **Contestar:** en la nota (lo normal) o en el chat (sigue valiendo). "He terminado el examen" → el profesor lee
   las respuestas **de la nota**.
3. **Corregir:** como hoy (pregunta a pregunta, por qué falla, veredicto, `progreso.md`, `config/alumno.md`).
4. **Guardar el intento aparte**, en `## Histórico de intentos` al final de la nota:
   - una fila en la tabla `| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |`;
   - un bloque plegado `> [!example]- Intento N · <fecha> · tus respuestas y la corrección` con el veredicto y la
     tabla `| # | Tu respuesta | Resultado | Por qué |` con sus respuestas **literales** (el formato que ya usa el
     examen del módulo 1 de Roberto).
5. **Actualizar el frontmatter:** `nota:` y `fecha:` = las de **este** intento (número sobre 10, nunca `2/10`);
   `intentos: N`. Así `inicio.md` enseña siempre el último intento (§3.3: cuenta el último, nunca la media).
6. **Limpiar:** cada `✍️ **Tu respuesta:**` vuelve a quedar vacío. Preguntas y soluciones no cambian. El examen
   queda listo para repetir.

### 8.2 Qué cambia

Solo la skill `examen` (§3 Formato y §4 Corregir) — va en la Task 8. Ninguna herramienta cambia: `inicio.md` ya lee
`nota` y `fecha` del frontmatter. El examen de módulo 1 que ya existe en el curso de Roberto (`nota: 2/10`,
`alcance:` sin `unidad:`) lo adapta el profesor en la Task 11: `unidad: 01`, `nota: 2`, `intentos: 1`, y los
`✍️ **Tu respuesta:**` vacíos bajo cada pregunta.

### 8.3 Versión nueva de un examen

Decisión de Roberto: el examen limpio se queda para repasar ("el de hace un mes"), y **cuando se considere** se hace
una versión nueva para comparar.

- **Cuándo:** si el alumno lo pide ("hazme otra versión del examen del módulo 1"), o si el profesor lo **propone**
  porque el mismo examen ya lleva dos intentos y la nota puede deberse a la memoria. El alumno decide.
- **Qué es:** un fichero nuevo, en la misma carpeta, con las mismas preguntas y los mismos conceptos (misma
  estructura y mismo reparto), pero **otras cifras y otro orden de opciones**. Frontmatter: `version: 2` (3, 4…) y
  `anterior:` con el enlace al fichero de la versión anterior. Su histórico de intentos empieza vacío.
- **La anterior no se toca:** sigue limpia, lista para repasar.
- **Comparar:** al corregir una versión nueva, el veredicto compara concepto a concepto con el último intento de la
  versión anterior ("VAN: fallado en la v1, bien en la v2").
- **Nota de la unidad:** sigue siendo la del último examen por `fecha:` (§3.3), sea de la versión que sea.
