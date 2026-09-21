# Kit del profesor — Fase 1: kit base

Fecha: 2026-09-21 · Estado: pendiente de revisión por Roberto

## 1. Qué es y para qué

Un kit que convierte cualquier LLM de terminal en un **profesor personal para un curso
concreto**: procesa el material de clase, genera notas de estudio, ejercicios y exámenes, y se
adapta al alumno según aprende de él.

Nace de generalizar el vault `inversion-multimercado` de Roberto, que funciona pero está hecho
a mano para un curso y un alumno. **El kit es genérico desde el día 0**: no contiene nada de
ningún curso concreto. Todo lo específico sale de la sesión de configuración.

**Usuarios:** compañeros de Roberto, **sin perfil técnico**, con Mac o Windows.

### Fases del proyecto

| Fase | Alcance | Este spec |
|---|---|---|
| 1 | Kit base: instalación, configuración (curso, estilo, nivel), skills de estudio, adaptación al alumno | **Sí** |
| 2 | Modo examen oficial: formato del examen real, exámenes de referencia | No |
| 3 | Informe final de curso para mejorar el kit (anonimizado) | No |
| Futuro lejano | Ejemplo: Obsidian opcional, con formatos solo estándar. Sin número ni fecha | No |

### Fuera de alcance en la fase 1

- Una app web o una interfaz gráfica propia. El producto es un repo con skills y el LLM de terminal.
- Chats web (ChatGPT, claude.ai), que no pueden leer ni escribir ficheros.
- La lente de producto y el export `motor-financiero.json` del vault de Roberto, que son suyos.

## 2. Decisiones tomadas

| Decisión | Elegido | Por qué |
|---|---|---|
| Arquitectura | **Motor fijo + datos aparte** | Las mejoras del kit llegan a todos los cursos; las skills se prueban una vez por LLM. La personalización es información, no código |
| LLM | **Compatible con cualquier LLM de terminal; probado solo en Claude Code.** El kit se escribe en el estándar abierto (`SKILL.md`, `AGENTS.md`) y trae `.kit/ESTANDARES.md` (§5) | Roberto no tiene suscripción de Codex, así que no se puede validar: **el primer compañero con otro LLM es el tester**, igual que con Windows. El kit no trae los ficheros propios de cada LLM, pero sí el estándar para que ese LLM **genere los suyos** al instalar y anote qué creó (`config/adaptacion-llm.md`) |
| Sistema operativo | Mac y Windows | Hay compañeros con Windows. Herramientas en Node, no en bash. Las instrucciones para el LLM dicen **qué conseguir y cómo comprobarlo**, no comandos de un sistema concreto |
| Dependencias | **Herramientas sin dependencias npm** | Evita un `npm install` en la instalación de un usuario no técnico |
| Lectura | Obsidian | Formatos estándar cuando no cueste más; lo exclusivo de Obsidian se anota para el futuro |
| Git | Commit local siempre; push según `subir_a_github` (por defecto `true`) | Poder deshacer siempre; subida opcional |
| Repo del alumno | **Privado siempre** | Dentro hay material con derechos de autor y un perfil personal |
| Repo del kit | `rsotor/profesor-kit`, **privado**, marcado como plantilla | Roberto invita a cada compañero |
| Instalación | Manual solo hasta tener el LLM funcionando; **el resto lo hace el LLM** | Un usuario básico sigue a un LLM mejor que a una guía larga |
| Encuesta de nivel | **Una vez**, en la configuración | Después el profesor aprende del trabajo diario, no de encuestas |

## 3. Estructura de un curso

```
curso-X/
├── AGENTS.md               ← MOTOR: reglas del profesor (genéricas, fijas)
├── CLAUDE.md, GEMINI.md    ← una línea que remite a AGENTS.md
├── INSTALACION.md          ← guía para el alumno (3 pasos manuales)
├── INSTALAR-AGENTE.md      ← guía para el LLM (el resto de la instalación)
├── .kit/                   ← MOTOR
│   ├── VERSION, CHANGELOG.md
│   ├── skills/             ← única copia de las skills
│   ├── plantillas/
│   └── herramientas/       ← comprobar.js, guardar.js, instalar-skills.js, actualizar.js
├── config/                 ← DATOS (los escribe /configurar)
│   ├── curso.md
│   ├── profesor.md
│   ├── alumno.md
│   └── ajustes.json
├── inbox/  conceptos/  sesiones/  ejercicios/  examenes/  flashcards/
└── progreso.md  formulario.md  mapa-del-curso.md
```

- **Motor** = `AGENTS.md`, los ficheros puente (`CLAUDE.md`, `GEMINI.md`), las guías y `.kit/`.
  Lo reemplaza `/actualizar`.
- **Datos** = `config/` y todo el material del alumno. **Ninguna herramienta del kit los
  sobrescribe nunca.** La única excepción son las migraciones de formato de `/actualizar` (§9),
  que transforman sin perder contenido y siempre con un commit previo.
- `instalar-skills.js` **copia** `.kit/skills/` a las carpetas donde busca cada LLM. Copia y no
  enlace, porque en Windows los enlaces simbólicos piden permisos de administrador. La lista
  de carpetas por herramienta se verifica contra la documentación oficial en el plan.
- Las copias de las skills van en `.gitignore`: la única fuente es `.kit/skills/`.
- El kit trae la **lista de comandos permitidos** de Claude Code (`node .kit/herramientas/*`
  y git básico), para que el alumno no reciba una petición de permiso por cada comando.

### Qué contiene cada fichero de `config/`

| Fichero | Contenido | Quién lo cambia |
|---|---|---|
| `curso.md` | Nombre, de qué va, temario (bloques/módulos), objetivo (examen oficial · cultura general · uso profesional), fechas, cómo numera el centro las clases, **reglas-propias** del dominio | `/configurar`; el alumno a mano |
| `profesor.md` | Tono, longitud máxima de nota, orden de explicación, tipo de ejercicio preferido, marcador de dudas (`@@` por defecto), lente personal (opcional) | `/configurar`; cambios propuestos por el profesor y aceptados por el alumno |
| `alumno.md` | Nivel de partida por bloque, prerrequisitos flojos, conceptos que costaron, errores repetidos, qué funcionó. **Cada entrada con su prueba** | El profesor, en cada sesión, duda, ejercicio o examen |
| `ajustes.json` | `subir_a_github`, `llm`, `patrones_prohibidos` (reglas de texto propias de este curso; vacío por defecto), `version_datos` (versión del formato de los datos, la usan las migraciones), `configuracion` (qué bloques de `/configurar` están completos) | `/configurar`; el alumno; `actualizar.js` solo `version_datos` |

La versión del motor vive solo en `.kit/VERSION`; no se duplica en `ajustes.json`.

## 4. Reglas del método

### Núcleo (no se puede desactivar)

Las skills y `comprobar.js` dependen de estas reglas. Están documentadas, pero no son editables:

1. **Un concepto = una nota, para siempre**, con `alias`. Antes de crear una nota se consulta
   `conceptos/_index.md` entero.
2. **Marcas de origen:** del curso (sin marca) · de la clase, aportado por el alumno (con fecha) ·
   ampliación del profesor · dato con fuente externa. Los prerrequisitos que se enseñan fuera del
   temario van como ampliación.
3. **Nunca inventar contenido del curso.** `TODO` = trabajo pendiente del profesor ·
   `FALTA INFO` = material que el curso no entregó.
4. **Ningún marcador de duda se borra sin responderlo.**
5. **Secretos:** si el alumno pega un token o una contraseña en el chat, el profesor no lo usa,
   le avisa y le explica cómo ponerlo él mismo en un fichero local.
6. **Deshacer:** si el alumno lo pide, el profesor deshace el último guardado. El alumno nunca
   necesita saber git.

### Preferencias (valor por defecto, editables en `config/profesor.md`)

Marcador de dudas (`@@`), longitud máxima de nota (una pantalla), orden de explicación
(problema → ejemplo → nombre → fórmula → error típico), número de flashcards por sesión (3-6),
lente personal (desactivada). `INSTALACION.md` explica cómo cambiarlas.

## 5. Instalación

### Manual (`INSTALACION.md`, para el alumno)

Mac y Windows por separado. Cada paso lleva **el comando en su propio bloque para copiar, lo
que vas a ver y qué hacer si ves otra cosa**.

La guía avisa al principio de que **el LLM de terminal es una suscripción de pago**. Los pasos
detallados son para Claude Code; para otro LLM, el alumno instala el suyo con la guía oficial
de ese LLM y continúa igual desde el paso 3.

1. Crear la cuenta del LLM y la de GitHub, y enviar el usuario de GitHub a Roberto para que
   le invite al kit.
2. Instalar el LLM de terminal (un comando).
3. Abrirlo y pegar el **texto de arranque**, que el alumno copia de esta misma guía en la web
   de GitHub. El texto es autocontenido, porque el repo es privado y el LLM todavía no puede
   leerlo: le pide instalar Git y `gh`, hacer `gh auth login` por navegador y, solo entonces,
   leer `INSTALAR-AGENTE.md` de `rsotor/profesor-kit` y seguirlo.

### Guiada por el LLM (`INSTALAR-AGENTE.md`, para el LLM)

Git, `gh` y la sesión de GitHub ya vienen hechos por el texto de arranque (**nunca se pide ni
se pega un token**); esta guía los comprueba, no los repite.

1. Comprobar qué hay instalado (Node, Git, `gh`) e instalar lo que falte, pidiendo permiso
   y explicando en una frase qué es cada cosa.
2. Comprobar que `gh auth status` está en verde.
3. Preguntar si quiere subir a GitHub:
   - **Sí:** `gh repo create curso-X --template rsotor/profesor-kit --private --clone`
   - **No:** clonar la plantilla sin crear un repo remoto, **eliminar el remoto `origin`**
     (apunta al kit, no a su curso) y poner `subir_a_github: false`.
     La cuenta de GitHub hace falta igualmente, porque el kit es privado y hay que leerlo.
4. `instalar-skills.js`.
5. Indicar cómo abrir la carpeta en Obsidian.
6. Lanzar `/configurar`.

Si un paso falla, el LLM explica qué ha pasado en lenguaje llano y no sigue adelante con el
siguiente paso a medias.

**Instrucciones estándar, no comandos de un sistema.** Cada paso de `INSTALAR-AGENTE.md` se
escribe como *objetivo + cómo comprobar que está hecho* ("Node LTS instalado; se comprueba con
`node --version`"), y el LLM elige el comando según el sistema que detecte (gestor de paquetes
de Mac o de Windows). Los comandos concretos van solo como ejemplo. Las herramientas del kit se
ejecutan siempre igual en los dos sistemas: `node .kit/herramientas/<nombre>.js`.

### `.kit/ESTANDARES.md` — para que cualquier LLM genere lo suyo

`INSTALAR-AGENTE.md` remite a este fichero en su primer paso. Describe **qué necesita el kit
de un LLM**, sin atarse a ninguno:

| Necesidad | Estándar del kit | Ya resuelto para Claude Code |
|---|---|---|
| Reglas del profesor | `AGENTS.md` en la raíz; si el LLM lee otro nombre, un fichero puente de una línea que remite a él | `CLAUDE.md` |
| Skills | Formato `SKILL.md` en `.kit/skills/`; se copian a la carpeta donde ese LLM las busca | `instalar-skills.js` |
| Invocación | Por nombre o en lenguaje natural; la sintaxis corta es la de cada LLM | `/sesion` |
| Permisos | Poder ejecutar sin preguntar `node .kit/herramientas/*` y git básico | Lista de permitidos incluida |

Un LLM distinto de Claude Code lee esta tabla, genera sus equivalentes según su propia
documentación y anota en `config/adaptacion-llm.md` qué ficheros creó y dónde. Ese fichero es
lo que el compañero le devuelve a Roberto para incorporarlo al kit.

## 6. `/configurar` — sesión 0

Dura unos 20-30 minutos y se puede **retomar**: lo contestado se guarda en `config/` según
avanza, y el bloque completado se anota en `ajustes.json` (`configuracion`).

| Bloque | Qué hace | Escribe |
|---|---|---|
| **A. El curso** | Pregunta de qué va, el temario (mejor el PDF del programa en `inbox/`), el objetivo, las fechas, cómo numera el centro las clases y las reglas propias del dominio | `curso.md` |
| **B. Cómo aprende** | Le enseña **el mismo concepto del temario explicado de dos formas**, 4-5 veces, y el alumno elige. Sin preguntas abstractas | `profesor.md` |
| **C. Cuánto sabe** | Autoevaluación de 0 a 3 por bloque del temario, más un **test corto generado del temario** que baja a los prerrequisitos cuando falla la base | `alumno.md` |

**Cierre:** presenta al profesor en cinco líneas (cómo es, por dónde empieza, qué irá rápido y
qué verá desde cero). El alumno puede corregir cualquier cosa. Después, commit con `guardar.js`.

## 7. Skills

Todas leen `config/` antes de actuar. Es una regla común en `AGENTS.md`.

Las skills se invocan con la barra de Claude Code (`/sesion`) o en lenguaje natural ("procesa
la sesión"). En otro LLM, la sintaxis equivalente sale de `.kit/ESTANDARES.md` (§5).

**Material de `inbox/`:** recomendado PDF, markdown y texto; un PPTX se lee mejor exportado a
PDF. Es una recomendación en `INSTALACION.md`, no una restricción: si el LLM no puede leer un
fichero, lo dice y pide otro formato.

| Skill | Qué hace | Origen en el vault |
|---|---|---|
| `/configurar` | Sesión 0 | Nueva |
| `/sesion` | Procesa el `inbox/`: auditoría del material, conceptos (con alias), índice de sesión, flashcards, ejercicios y ficheros vivos | `sesion`, con la numeración y las reglas del dominio tomadas de `curso.md` |
| `/dudas` | Responde a los marcadores de duda en el sitio y aprende de ellos | `dudas`, casi igual |
| `/ejercicio` | Práctica a demanda. La skill es una **guía, no código**: el kit no trae plantillas de ejercicio. El profesor elige el formato según lo que haya que tocar — HTML interactivo si hay parámetros que mover, HTML tipo formulario si es una decisión comprobable, markdown si la respuesta es abierta o hay que producir algo — y lo genera como fichero autocontenido | `ejercicio`: se conserva el método, no el código |
| `/examen` | Test interno con autocorrección, ponderado por los errores del alumno | `examen`, sin lente salvo que esté activada |
| `/repaso` | Página HTML **local**, que se abre en el navegador | `repaso`, sin Artifact |
| `/actualizar` | Enseña qué cambia en la versión nueva del motor, lo aplica y migra los datos automáticamente si el formato cambió (§9) | Nueva |

## 8. Cómo aprende el profesor del alumno (paso 5)

- `alumno.md` es el `perfil-alumno.md` del vault, con una regla nueva: **toda entrada cita su
  prueba** (qué ejercicio, examen o duda la origina). Sin prueba no se apunta.
- **Tercer tropiezo:** a la tercera duda sobre el mismo concepto, se reexplica la nota desde
  otro ángulo sin esperar a que lo pida.
- **Cambios de estilo:** si la prueba contradice `profesor.md`, el profesor **lo propone** y solo
  lo cambia con el sí del alumno. Nunca a escondidas.
- `progreso.md` solo cambia con respuestas del alumno (ejercicio o examen), nunca al procesar
  una sesión.

## 9. Herramientas (Node, Mac y Windows)

| Herramienta | Qué hace |
|---|---|
| `comprobar.js` | Enlaces rotos, frontmatter, índices sincronizados (`_index`, progreso, mapa), lista de marcadores de duda pendientes (aviso, no error), **escaneo de secretos**, y los **patrones prohibidos propios de cada curso** (el motor trae el mecanismo vacío; las reglas son datos del curso, en `ajustes.json`) |
| `guardar.js` | Ejecuta `comprobar.js` y hace commit local. Hace push **solo si** `subir_a_github` es `true` **y** el escaneo de secretos está limpio |
| `instalar-skills.js` | Copia las skills a las carpetas de cada LLM |
| `actualizar.js` | Descarga la versión nueva del motor, enseña el CHANGELOG, reemplaza solo los ficheros del motor, ejecuta las migraciones pendientes y vuelve a lanzar `instalar-skills.js` |

### Migraciones: el alumno no aprecia ninguna rotura

Toda mejora del kit tiene que poder aplicarse sola. Si una versión cambia el formato de los
datos (frontmatter, estructura de `alumno.md`, índices):

1. La versión trae su **script de migración** en `.kit/herramientas/migraciones/`, numerado por
   `version_datos`. Un cambio de formato sin migración no se publica.
2. `actualizar.js` hace **commit previo** con `guardar.js`, ejecuta en orden las migraciones
   entre la `version_datos` del alumno y la nueva, y sube `version_datos`.
3. Al terminar ejecuta `comprobar.js`. Si no queda en verde, **revierte al commit previo** y el
   alumno sigue con la versión anterior, funcionando; el fallo se explica en lenguaje llano.
4. Las migraciones **transforman, nunca borran** contenido del alumno, y son deterministas
   (script, no LLM). No piden confirmación: el alumno solo ve el resumen del CHANGELOG.

### Feedback al kit: una issue en el repo

Canal único para mejorar el kit. Cuando el LLM de un alumno encuentra algo del **motor** que
no funciona o que se puede mejorar (un paso que falla en Windows, un fichero que tuvo que
generar por usar otro LLM, una skill ambigua), crea una issue en `rsotor/profesor-kit` con
`gh issue create`. Los compañeros invitados pueden abrir issues.

> **Decisión de Roberto (2026-09-21): el kit se queda en su cuenta personal.** Verificado en
> docs.github.com: en un repo privado de cuenta personal no existe el permiso de solo lectura, así
> que todo compañero invitado tiene **escritura** y puede hacer push al kit. Es un **riesgo
> aceptado**: los invitados son compañeros de confianza. Mitigación disponible si la cuenta tiene
> GitHub Pro: proteger la rama `main`.

- **Plantilla fija** (`.github/ISSUE_TEMPLATE/` del kit): sistema operativo, LLM y versión,
  versión del kit, paso o skill, qué se esperaba, qué pasó, y el arreglo aplicado si lo hubo
  (incluido el contenido de `config/adaptacion-llm.md`).
- **Siempre con el sí del alumno:** el LLM le enseña el texto de la issue antes de enviarla.
- **Nunca sale contenido del alumno:** ni material del curso, ni `alumno.md`, ni rutas con su
  nombre de usuario, ni secretos. Solo el problema del motor.
- **Antes de crear, busca** si ya existe una issue igual y, en ese caso, comenta en ella.
- Si `subir_a_github` es `false` o no hay sesión de `gh`, el texto se guarda en
  `config/feedback-pendiente.md` para que el alumno se lo pase a Roberto.

La regla vive en `AGENTS.md` y en `INSTALAR-AGENTE.md` (la instalación es donde más fallos habrá).

## 10. Pruebas antes de entregar

1. **Comparador con el vault de Roberto.** Curso nuevo "Inversión Multimercado" instalado desde
   cero con el kit (el kit no sabe nada de finanzas: todo sale de `/configurar`) y un perfil
   equivalente al de Roberto. Se procesa el mismo PDF de una sesión ya hecha en el vault.
   - Automático: conceptos detectados, cero duplicados, marcas de origen presentes y `comprobar.js` en verde.
   - Calidad: la juzga Roberto leyendo las dos versiones (criterio 3 de abajo).
2. **Curso que no es de finanzas.** Un temario libre y sin números, instalado simulando al
   alumno. Se comprueba que no se cuela nada de finanzas y que el formato de los ejercicios es el que corresponde a un temario sin números.
   La hace Claude; Roberto no tiene que hacer nada.
3. **LLM:** instalación, `/configurar` y una `/sesion` en **Claude Code**. Otros LLMs: sin
   suscripción para probarlos. Se entrega marcado como **compatible, sin probar**, y el primer
   compañero con otro LLM (el usuario 2, con Codex) es el tester; su `adaptacion-llm.md` vuelve al kit.
4. **Windows:** sin máquina Windows disponible. Se entrega marcado como **sin probar**, y el
   primer compañero con Windows es el tester.
5. **Feedback real:** la primera instalación de un compañero. Manda sobre las pruebas anteriores.

### Criterios de aceptación (definidos por Roberto)

1. **Código testeado y validado al 100%.** Aplica a las herramientas de `.kit/herramientas/`
   (incluidas las migraciones): tests automáticos, todos en verde. Las skills son instrucciones
   para el LLM, no código: no admiten test unitario y se validan con las pruebas 1 y 2.
2. **Instalación funcionando** de principio a fin en una máquina limpia, siguiendo solo
   `INSTALACION.md`. Validada en Mac; la de Windows se escribe y se entrega igual, y la valida
   el primer compañero con Windows (prueba 4).
3. **El curso generado suple, o mejora, el vault actual `inversion-multimercado`**, que es la
   primera prueba (prueba 1). Lo decide Roberto.

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Otro LLM o Windows fallan y no lo hemos podido probar | `.kit/ESTANDARES.md` e instrucciones por objetivo, no por comando; el primer compañero es el tester y su feedback vuelve al kit como issue (§9); `comprobar.js` pilla los fallos estructurales, sea cual sea el LLM o el sistema |
| El alumno abandona por las peticiones de permiso | El kit trae la lista de comandos permitidos de Claude Code |
| El alumno se atasca en la instalación | Parte manual mínima; el LLM explica cada error en lenguaje llano |
| Un profesor genérico sale insípido | Bloques B y C de `/configurar`, más la adaptación continua con prueba |
| Un compañero invitado hace push al kit por error (en repo personal todos tienen escritura) | Riesgo aceptado por Roberto; `AGENTS.md` prohíbe tocar el motor y el feedback va por issue, no por push. Proteger `main` si hay GitHub Pro |
| Material del centro o tokens subidos por error | Repo siempre privado y escaneo de secretos antes de cada push |
| Actualizar rompe los datos del alumno | `actualizar.js` solo toca ficheros del motor, con una lista explícita; los cambios de formato van con migración automática, commit previo y reversión si `comprobar.js` falla |
| El LLM no puede leer un formato del material | Formatos recomendados en la guía; el LLM avisa y pide otro formato en vez de inventar |
