# Mi perfil y evolución con datos (P4 + E4) y alumno simulado (5b.4)

Especificación. Nace de la auditoría del 2026-09-23 (`docs/auditoria/2026-09-23-auditoria-del-kit.md`, §8.1 P4,
§8.2 E4) y del plan 0.22 (§5b.4). Decisiones de Roberto tomadas al revisar la sección 8, el 2026-09-23.

## 0. Correcciones tras el plan (revisadas con Roberto, 2026-09-24)

Mandan sobre lo que diga el resto de este documento:

1. El bloque de un concepto es el primer valor de su `bloques:` (como `formulario.md`), no `config/estructura.json`.
   Sin `bloques:` → "Sin bloque" (§3).
2. `examen-suspenso` vale para cualquier examen completo, no solo el de módulo. Un **test** (lo que el kit llamaba
   "parcial": el de "lo que me falta") no cuenta (§4).
3. Las señales llevan `examen` (ruta relativa a `estudio/`) en vez de `unidad` (§4).
4. `mi-perfil.md` no va a `GENERADOS_CON_ENLACES`: un enlace roto copiado de `config/alumno.md` no bloquea el
   guardado. Sale como aviso, y los avisos se revisan cada cierto tiempo (§5 y tarea 12 del plan).
5. La señal se menciona en el paso 3 del arranque, cuando ya se ha leído `estado.js`, no en el paso 1 (§4).
6. El alumno simulado devuelve un JSON con sus respuestas y el script las escribe en el examen: nunca tiene el
   fichero con las soluciones a su alcance (§6).

Y en todo lo que ve el alumno, el examen "parcial" pasa a llamarse **test**.

## 1. Qué se quiere

Los datos que dicen cómo va el alumno ya existen, pero repartidos: nota y fecha de cada intento de examen,
estados de `estudio/progreso.md`, dudas y errores repetidos en `config/alumno.md`, cómo le explica el profesor en
`config/profesor.md`. Se juntan solos en cada guardado para dos cosas:

1. **El profesor ve que algo no funciona sin tener que acordarse de mirarlo** (P4). Hoy "revisa cómo explicas" y
   el "tercer tropiezo" dependen de su memoria.
2. **El alumno ve lo que el profesor sabe de él** y puede corregirlo (E4). Hoy todo eso vive en `config/`, fuera
   de su bóveda.

**Sabremos que funciona** cuando, tras la prueba real, la hoja del alumno enseñe la nota del examen del módulo 1
con sus conceptos flojos y la duda de `colchon-financiero`, y el profesor mencione una señal al saludar.

## 2. Decisiones

| Decisión | Por qué |
|---|---|
| **Una sola hoja**, `estudio/mi-perfil.md`, para alumno y profesor | Mismos datos, dos lectores. Una sola verdad: el profesor lee lo mismo que ve el alumno |
| Se **genera** en cada guardado; no se edita | Patrón de `inicio.md` (P2): lo que se puede calcular, se calcula |
| **Todo visible y directo**, sin fichero oculto | `config/alumno.md` ya está fuera de la bóveda. Una segunda versión "para el alumno" serían dos verdades, y E4 es justo que el alumno vea lo mismo que el profesor y pueda decir "eso no es verdad" |
| `config/alumno.md` se escribe **como una evaluación de verdad**: sincera, clara, con su prueba, sobre lo que hizo y no sobre cómo es | Ahora lo lee el alumno. "No ha entendido X: en las preguntas 16-20 lo confunde con un gasto" sí; "no se entera" no (juicio sin prueba que no dice qué arreglar). No se suaviza con ningún filtro automático |
| Señales calculadas en `estado.js --json` | El saludo de `AGENTS.md` ya lee `estado.js`: así la señal llega sin un paso nuevo |
| Alumno simulado en la misma versión | El cambio toca `AGENTS.md` → prueba real obligatoria; con las respuestas por palabras clave el examen sale con un 0,5 que no mide nada, y P4 se probaría con datos falsos |

## 3. La hoja `estudio/mi-perfil.md`

Cabecera: qué es ("lo que tu profesor sabe de ti, con la prueba de cada cosa"), que se regenera sola y que **si
algo no es verdad, se lo digas a tu profesor y lo corrige** (en `config/alumno.md`, con la corrección como prueba:
`corrección del alumno, <fecha>`).

| Sección | Fuente | Cómo |
|---|---|---|
| **Cómo te explico y por qué** | `config/profesor.md` → "Tono", "Qué le funciona a este alumno al explicar"; `config/alumno.md` → "Cómo explicarle", "Qué funcionó" | Copia literal por título de sección |
| **Lo que te cuesta** | `config/alumno.md` → "Conceptos que costaron", "Errores repetidos" | Copia literal |
| **Lo que te entró a la primera** | `config/alumno.md` → "Conceptos que entraron a la primera" | Copia literal |
| **Tu evolución** | Exámenes, `estudio/progreso.md`, `config/alumno.md` → "Registro de dudas" | Calculado (ver abajo) |
| **Cambios en cómo te explico** | `config/profesor.md` → "Historial de cambios" | Copia literal |

**Tu evolución**, calculada:

- **Exámenes**: una fila por examen no parcial con nota: unidad, cada intento (fecha y nota) en orden, y si
  aprueba (`aprobado:` de `config/curso.md`, 5 por defecto). Los intentos salen de la tabla `## Histórico de
  intentos` que ya escribe `/examen`; si un examen no la tiene, se usa el `nota:`/`fecha:` del frontmatter como
  único intento.
- **Conceptos por estado**: por bloque de `config/estructura.json` (o total, sin estructura), cuántos conceptos
  hay en ✅, 🟡, 🔴 y ⬜, por eje (teoría y aplicación), desde la tabla de `progreso.md`.
- **Donde más dudas**: los conceptos del "Registro de dudas" con más dudas, de más a menos (máximo 5).

**No se enseña**: "Cómo escribe en sus notas" (es para las herramientas), "Nivel de partida" (ya está en la hoja
del test inicial) y el diario.

Reglas de copia:

- Una sección que no existe, está vacía o solo tiene el comentario de la plantilla (`<!-- … -->`) sale como
  *"Todavía nada: se irá llenando con tus exámenes y tus dudas."* Nunca se inventa nada.
- Las tablas vacías (solo cabecera) cuentan como vacías.
- Lo copiado se copia tal cual, con sus pruebas. Los enlaces `[[…]]` que traiga siguen valiendo porque la hoja
  está en la raíz de la bóveda, igual que `inicio.md`.

## 4. Señales para el profesor

`senales(raiz)` devuelve una lista de `{ tipo, concepto?, unidad?, detalle }`, en este orden de prioridad:

| `tipo` | Cuándo |
|---|---|
| `examen-suspenso` | El último intento de un examen completo (no un test) tiene nota por debajo del aprobado |
| `nota-baja` | Un examen tiene dos intentos o más y el último tiene nota menor que el anterior |
| `concepto-rojo` | Un concepto tiene 🔴 en algún eje de `progreso.md` |
| `tercer-tropiezo` | Un concepto tiene 3 dudas o más en el "Registro de dudas" |

`estado.js --json` la incluye como `senales`. `estado.js` sin `--json` imprime una línea por señal.

Uso en las skills y en `AGENTS.md`:

- **Al saludar** (`AGENTS.md`, "Al empezar cada sesión", paso 3, tras leer `estado.js`): si hay señales, menciona **como mucho una**, la
  primera, en la misma frase del saludo. No es un sermón, es una línea.
- **`/examen`**, "Cuando hay señal de que algo no funciona": las señales de `estado.js` son el punto de partida,
  en vez de tener que buscarlas.
- **`/dudas`**: la regla del tercer tropiezo se cumple mirando la señal `tercer-tropiezo`, además de contar.

## 5. Dónde vive

| Pieza | Cambio |
|---|---|
| `.kit/herramientas/lib/perfil.js` (nuevo) | `markdownPerfil(raiz)`, `senales(raiz)` y lectores auxiliares (secciones por título, histórico de intentos, registro de dudas). Reutiliza `indice.leerExamenes`, `indice.leerProgreso`, `indice.leerAprobado` |
| `guardar.js` → `regenerarGenerados()` | Escribe `mi-perfil.md` **antes** de `inicio.md` (como `formulario.md`, porque "Otras hojas" mira si existe) |
| `lib/indice.js` → `OTRAS_HOJAS` | Añade `mi-perfil` |
| `lib/vault.js` → `GENERADOS_CON_ENLACES` | **No** se añade `mi-perfil.md` (ver §0, punto 4) |
| `preparar.js` (resolución de choques al juntar) | Añade `mi-perfil.md` a los generados que se regeneran en vez de chocar |
| `estado.js` | `senales` en el JSON y en la salida de texto |
| `AGENTS.md` | Lista de lo que escribe `guardar.js`; paso 1 del saludo; regla de cómo se escribe `config/alumno.md` (evaluación sincera, clara, con prueba, sobre lo que hizo) en "Cómo aprendes del alumno" |
| `.kit/skills/examen/SKILL.md`, `.kit/skills/dudas/SKILL.md` | Usar las señales (§4) |
| `.kit/plantillas/guia-de-uso.md` | Una línea: qué es **mi-perfil** y que si algo no es verdad se lo digas |
| `.kit/CHANGELOG.md` + `.kit/VERSION` | 0.23.0. Con `**Si ya tenías tu curso:**` para ofrecer la línea nueva de la guía (se copió al configurar) |
| `docs/arquitectura.md` | Mapa de `lib/`, orden de `guardar.js`, señales de `estado.js` |

Sin migración: no cambia ningún dato del alumno. Los cursos existentes tienen la hoja en su siguiente guardado.

## 6. Alumno simulado en la prueba real (5b.4)

Hoy `pasoExamenCorregir` rellena `✍️ **Tu respuesta:**` por palabras clave desde
`pruebas/curso-ejemplo/alumno/respuestas-examen.md`: sale la misma frase bajo preguntas distintas y el examen se
suspende con un 0,5 que no mide nada.

Cambio:

- Un paso nuevo entre generar y corregir: **una llamada sin conversación** (`claude -p`, sesión nueva, sin
  skills) que recibe el examen generado y un **perfil de alumno** (`pruebas/curso-ejemplo/alumno/perfil.md`, nuevo:
  quién es —el de `config/alumno.md` del curso de ejemplo—, qué ha estudiado y con qué nivel) y la consigna de
  contestar **como ese alumno**: bien, a medias, mal y en blanco en la proporción que dice el perfil, con errores
  creíbles (confundir conceptos cercanos, olvidar el periodo de un porcentaje), nunca copiando las soluciones.
  Escribe directamente en la nota del examen.
- Las soluciones plegadas del examen se quitan de lo que ve el alumno simulado (se le pasa el texto sin el callout
  de soluciones), para que no conteste copiándolas.
- `respuestas-examen.md` se retira; su proporción (bien / a medias / mal / blanco) pasa al perfil.
- El paso comprueba que la nota corregida cae **entre 3 y 8**: fuera de ese margen, el paso se anota como fallido
  en `RESUMEN.md` (el simulado o la corrección no se comportaron como se esperaba), sin parar la prueba.
- `--sin-llm` sigue sin llamar a `claude`: el paso se salta igual que los demás.
- `RESUMEN.md` añade la sección **Mi perfil**: si la hoja existe, cuántas secciones con contenido tiene y las
  señales que dio `estado.js` al final.

## 7. Pruebas

- `tests/perfil.test.js` (nuevo): secciones copiadas por título; sección ausente, vacía, solo comentario o tabla
  vacía → "Todavía nada"; secciones que no se enseñan no aparecen; intentos desde el histórico y, sin él, desde el
  frontmatter; parcial excluido; conteo por bloque y sin estructura; top de dudas; las cuatro señales y su orden;
  curso recién instalado (todo vacío) sin errores.
- `tests/estado.test.js`: `senales` en el JSON y en el texto.
- `tests/guardar.test.js`: `mi-perfil.md` se genera y `inicio.md` la enlaza en el mismo primer guardado.
- `tests/preparar.test.js`: `mi-perfil.md` en choque se resuelve solo al juntar.
- `kit-limpio.test.js` y `coherencia-skills.test.js` siguen verdes.
- Prueba real (`npm run prueba-real`) con el alumno simulado; `RESUMEN.md` en el PR.

## 8. Fuera de esta versión

- Tiempo entre clase y procesado (P4 lo proponía): no hay fecha de la clase en el frontmatter, solo `trabajada:`.
  Sin dato fiable, no se calcula.
- Gráficas o barras de evolución: E3.
- Que el alumno corrija escribiendo en la hoja: se regenera; la corrección se la dice al profesor.
- P7 (examen final a medida) y P8 (material que no es PDF): siguientes, con las respuestas de Roberto ya dadas
  (ver seguimiento de la auditoría).
