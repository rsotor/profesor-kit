# Auditoría del kit · 2026-09-23

Sobre `main` en `53e3c83` (kit **0.19.0**). Solo informe: no se ha cambiado nada del repo.

## 0. Seguimiento (se actualiza en cada bloque)

Estado a **2026-09-23**, tras mezclar el PR #30 (release `v0.20.0`). Los hallazgos de abajo no se editan: aquí
se dice qué se hizo con cada uno y dónde mirarlo. "Bloque" es el de §8.3.

| Hallazgo | Bloque | Estado | Cómo se resolvió · dónde revisarlo |
|---|---|---|---|
| §2.1 Vuelta atrás que borraba lo no guardado | 1 | ✅ 0.20.0 | `actualizar.js` mira el resultado de `guardar` antes de tocar nada: si no pudo guardar (y no es `sin-cambios`) devuelve `sin-guardar` y no empieza. Test: "si no puede guardar antes de actualizar, no toca nada…" en `tests/actualizar.test.js` |
| §2.1 (menor) Commit previo con secreto que luego se sube | 1 | ⏳ abierto | No tocado. Opción: que `guardar` con `permitirErrores` siga sin hacer commit si el único error es `secreto` |
| **Nuevo** `tieneIdentidad` daba por buena una identidad vacía | 1 | ✅ 0.20.0 | Salió al probar §2.1: con `user.name=` en el git global, `git config` responde pero el commit falla. `lib/git.js` usa ahora `git var GIT_AUTHOR_IDENT` / `GIT_COMMITTER_IDENT`, que decide como `git commit` |
| §2.2 Motor desde `main`, sin etiquetas | 1 | ✅ 0.20.0 | `actualizar.js`: `etiquetaPublicada()` lee la última release (`gh api …/releases/latest`), `descargar()` clona con `--branch vX.Y.Z`, `versionPublicada()` (aviso diario) sale de ahí. `.github/workflows/release.yml` crea la release en cada merge que sube `.kit/VERSION`, con las notas de `.github/release-notas.js` (sección del CHANGELOG). Flujo y paso manual en `CONTRIBUTING.md` (paso 6). Comprobado: `v0.20.0` creada sola al mezclar #30 |
| §2.2 `enforce_admins` desactivado · sin firma del motor | 1 | ⏳ decisión | `enforce_admins` es un clic en GitHub (decide Roberto). Firmar releases: no vale la pena mientras el repo tenga un solo mantenedor |
| §2.3 Complementos de Obsidian sin fijar | 1 (adelantado) | ✅ 0.20.0 | `lib/obsidian.js`: cada complemento lleva `version` y sha256 por fichero (terminal 3.27.2, code-files 1.1.9, claudian 2.3.3); `descargarDeGitHub` baja esa versión, verifica el hash y rechaza lo que no coincide; `AbortSignal.timeout(120 s)`. Subir de versión: `CONTRIBUTING.md`, último apartado. Tests nuevos en `tests/obsidian.test.js` |
| §2.3 (TBD) Claudian y la clave de API | — | ⏳ abierto | Sin comprobar. Toca a la hoja del alumno si pide clave |
| §2.4 Inyección por la ruta del curso en el atajo | 1 (adelantado) | ✅ 0.20.0 | `crear-atajo.js`: `RUTA_PELIGROSA` rechaza `"`, `$`, `%`, acento grave y saltos de línea con motivo `ruta-no-valida` y explicación en llano. Test en `tests/crear-atajo.test.js` |
| §3.2 Sin `package.json` | 1 (adelantado) | ✅ 0.20.0 | `package.json` mínimo: `private`, `engines >=22`, `npm test`, `npm run test:cobertura`, `npm run comprobar`. `preparar-curso.js` lo borra en los cursos (`SOLO_DEL_KIT`) |
| §3.2 Sin linter · líneas largas | 3+ | ✅ 0.21.0 | ESLint como devDependency solo del repo del kit (`preparar-curso.js` lo borra en los cursos, junto con `node_modules/`), `eslint.config.js` en la raíz con `no-unused-vars`, `no-undef`, `eqeqeq`, `prefer-const` y `max-len` 160 (ignora cadenas/comentarios largos y los `assert.match` de los tests). `npm run lint`, paso de CI solo en el job Linux Node 24 |
| §3.2 `comprobar.js` mezcla comprobar y generar | 2 | ✅ 0.21.0 | `comprobar.js` ya solo comprueba; lo que genera markdown (`pendientes`, `auditoría`, `formulario`, `ejercicios/_index`, `Estado` del README) vive en `lib/generados.js`, como `lib/indice.js`. `guardar.js` y los tests importan de ahí |
| §3.2 Parser de frontmatter propio | 2 | ✅ 0.21.0 (de otra forma) | No se sustituye ni se amplía el lector: se decidió que detectar es mejor que prever. `lib/vault.js` → `revisarPropiedades()` señala las líneas que el lector no entiende y los valores que lee pero no sirven (`estudiada: sí`, `nota: 7/10`, fechas imposibles) en las propiedades que usan las herramientas. `comprobar.js` lo da como aviso `propiedad-no-estandar`. El profesor interpreta, pregunta la primera vez, reescribe en el estándar y lo apunta en `config/alumno.md` → *Cómo escribe en sus notas*; a la tercera, issue al kit describiendo el patrón, no el valor (`AGENTS.md`, "Cuando el alumno escribe a su manera"). Tests en `tests/propiedades.test.js` |
| §3.2 Ficheros vivos mantenidos a mano | 2 | ✅ 0.21.0 | = P2, ver más abajo. **Añadido después:** `formulario.md` recoge de cada concepto su fórmula si la tiene y, si no, su definición en una frase (de su nota o, si falta, de `_index.md`); se mezclan en el mismo curso. Los índices generados no cuentan para decidir si un concepto es huérfano (si no, ninguno lo sería) |
| §3.2 Temporal de la descarga sin limpiar | 1 (adelantado) | ✅ 0.20.0 | `cli()` de `actualizar.js` borra el clon temporal en un `finally` (solo si no vino por `--origen`) |
| §3.2 Test que faltaba (§2.1) | 1 | ✅ 0.20.0 | Ver §2.1 |
| §4.2 Linux sin documentar | — | ⏳ decisión | Roberto: son dos proyectos; pendiente decidir si se documenta o se declara no soportado |
| §4.2 Atajo depende de `~/.local/bin` en el PATH | 2 (multi-LLM) | ⏳ abierto | Junto con §5.2 |
| §4.2 Windows solo con Node 24 y sin instalación completa | — | ⏳ abierto | Sigue pendiente el feedback de Windows |
| §4.2 `diario.md` con `\n` fijo | 3+ | ⏳ abierto | Menor |
| §5.1 `.gitignore` en el motor se reemplazaba | 1 | ✅ 0.20.0 | `.gitignore` sigue en `motor.json` (si saliera, el `actualizar.js` viejo de los cursos lo borraría), pero `actualizar.js` lo trata como `SE_FUSIONAN`: `fusionarGitignore()` añade al final las reglas del kit que falten bajo `# Reglas del kit añadidas al actualizar a la X`, sin tocar las del alumno ni el fin de línea. **Ojo:** la actualización 0.19→0.20 la hace el código viejo y lo sustituye entero una última vez (avisado en el CHANGELOG). Test en `tests/actualizar.test.js` |
| §5.2 `ESTANDARES.md` es un encargo, no un adaptador | 2 | ⏳ abierto | Rutas de Codex/Gemini: TBD, confirmar en su documentación |
| §5.3 Claude-ismos · calidad dependiente del modelo | 2 | ⏳ abierto | = P1 |
| §6.1 `CONTRIBUTING.md` decía privado y sin protección | 1 | ✅ 0.20.0 | Reescrito: flujo con releases, "Las dos barreras de `main`" neutro respecto a la visibilidad, tabla de fuentes de verdad con `docs/auditoria/` en vez de `docs/superpowers/` |
| §6.1 `README.md` y plantilla de PR decían CI con Mac | 1 | ✅ 0.20.0 | Corregidos (Linux y Windows), `npm test`, releases, lista completa de lo que se borra al crear un curso |
| §6.1 `INSTALACION.md` habla de invitación al repo privado | — | ⏳ decisión | Sin tocar hasta decidir público/privado. Si queda público: quitar el paso 1.3-1.4 y la frase del 404 |
| §6.1 La 1.0.0 | — | ⏳ decisión | Roberto: después de estos ajustes, no todavía. El mecanismo de release ya está |
| §6.1 Fichero con datos de un curso real en `docs/superpowers/pruebas/` | 1 | ✅ 0.20.0 | `docs/superpowers/` borrado entero (specs, planes, pruebas, `comparar-con-vault.js`). Sigue en el historial de git |
| §6.3 Documento de arquitectura vivo | 2 | ⏳ abierto | Más necesario ahora que `docs/superpowers/` no está |
| §6.3 Regla "Deshacer" sin herramienta | 2 | ⏳ abierto | `deshacer.js` |
| §7 Releases | 1 | ✅ 0.20.0 | Ver §2.2 |
| §7 Curso de referencia en el CI | 2 | ⏳ abierto | Después de P1 |
| §7 `.superpowers/sdd/` en el árbol de trabajo | — | ⏳ abierto | Ignorado por su propio `.gitignore`; sin decidir si se saca |
| §8.1 P2 Más ficheros vivos generados | 2 | ✅ 0.21.0 | `guardar.js` genera ahora `estudio/formulario.md` (fórmulas por bloque) y `estudio/ejercicios/_index.md` (qué practica cada ejercicio, desde `ejercicio:` y `## Practícalo`); `mapa-del-curso.md` se queda solo para la cobertura del material, como ya decía la skill. Migración `004-…` conserva con otro nombre lo que un curso ya tuviera escrito a mano y no coincida con lo generado. Ver `lib/generados.js`, `tests/generados.test.js` Las notas `-anterior` se quedan como están, sin paso de revisión: decisión de Roberto (hay pocos cursos afectados) |
| §8 Resto de propuestas P1, P3-P8 y E1-E9 | 2 y 3 | ⏳ abierto | Siguiente: P1 (lint pedagógico) y P3 (calentamiento), bloque 2 |

Alcance: seguridad · calidad del código y de los tests · multiplataforma · multi-LLM · documentación ·
agilidad del proceso · y, sobre todo, **qué le vendría bien al kit en las próximas iteraciones**, para el
profesor y para el alumno.

Método: lectura completa del motor (`.kit/herramientas/`, `lib/`, migraciones), de las siete skills, de
`AGENTS.md`, de las guías, plantillas y `CONTRIBUTING.md`; ejecución de la suite con cobertura; consulta del
estado real del repo en GitHub (visibilidad, protección de `main`, CI, issues, PRs, etiquetas).

Marcas: 🔴 arreglar · 🟡 revisar o decidir · 🟢 bien, se queda.

---

## 1. Veredicto en una pantalla

**El kit está sano y bien hecho para su tamaño.** 189 tests en verde, 98 % de cobertura de líneas, CI en
Linux y Windows, `main` protegida, actualizaciones con vuelta atrás, migraciones con contrato, escaneo de
secretos, y una documentación por audiencias poco habitual en un proyecto de una persona. Las decisiones
de diseño (motor/datos, `estudio/` como bóveda, todo lo generado sale de disco) son las correctas.

**Lo que hay que arreglar (🔴), por orden** (los cuatro resueltos en 0.20.0; el 4 a falta de tu decisión sobre la visibilidad):

1. **La actualización puede borrar trabajo del alumno** en un caso concreto: si git no tiene identidad
   configurada y la actualización falla, la vuelta atrás hace `git clean -fd` sobre ficheros que nunca se
   llegaron a guardar (§2.1).
2. **El motor se actualiza desde `main`, sin etiquetas ni releases**: cualquier PR mezclado llega en
   minutos a todos los cursos y ejecuta código (migraciones) en la máquina del alumno. No hay forma de
   apuntar a una versión concreta ni de volver a una anterior (§2.2).
3. **`.gitignore` forma parte del motor** y se reemplaza al actualizar: contradice lo que `ESTANDARES.md`
   pide a otros LLMs (añadir ahí su carpeta de skills) y borra cualquier línea propia del alumno (§5.1).
4. **La documentación dice que el repo del kit es privado y que la protección de `main` no se aplica.
   Ninguna de las dos cosas es verdad hoy**: el repo es público y `main` exige `tests-ok` (§6.1). Si lo
   público es intencionado, hay un fichero en `docs/superpowers/pruebas/` con referencias a un curso real
   de Roberto que conviene limpiar.

**Lo que más valor añadiría (§8):** hacer que la calidad pedagógica dependa menos del modelo (un "lint
pedagógico" en `comprobar.js` y más ficheros vivos generados desde datos), y darle al alumno tres cosas
que hoy no tiene: repaso espaciado, un plan con calendario y ver lo que el profesor sabe de él.

---

## 2. Seguridad

### 2.1 🔴 → ✅ Vuelta atrás que puede destruir trabajo sin guardar

> ✅ **Arreglado en 0.20.0 (PR #30).** `actualizar.js` comprueba el resultado de `guardar` y, si no pudo guardar, devuelve `sin-guardar` sin tocar nada. Con test. De paso salió y se arregló un fallo en `lib/git.js`: una identidad de git vacía pasaba por buena. El caso menor del secreto en el commit previo sigue abierto. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

`actualizar.js:75-77` guarda "lo que hubiera sin guardar" con `guardar({ permitirErrores: true })` y toma
el SHA. Pero **no mira el resultado**: si `guardar` no hizo commit por `sin-identidad` (git sin
`user.name`), el SHA es el del último commit real y los ficheros nuevos (apuntes en `inbox/`, notas
recién escritas) siguen sin rastrear. Si después algo falla, `restaurar()` (`actualizar.js:57-61`) hace
`reset --hard` + `clean -fd`: **los ficheros sin rastrear desaparecen.**

- Probabilidad baja (la instalación configura la identidad y `diagnostico.js` la comprueba), impacto alto
  (pérdida de material del alumno, la única cosa que el kit promete no tocar nunca).
- **Arreglo:** abortar la actualización si `guardar` devuelve algo distinto de `guardado: true` o
  `sin-cambios`. Un test que lo cubra (hoy no existe).

Relacionado, menor: en ese mismo camino, si el curso tiene un posible secreto, el commit previo a actualizar
**sí se crea** (permitirErrores) y solo se bloquea el push; el siguiente `guardar` limpio empuja toda la
historia, secreto incluido. Es un caso de esquina, pero el escaneo de secretos deja de proteger justo ahí.

### 2.2 🔴 → ✅ Cadena de suministro del motor

> ✅ **Arreglado en 0.20.0 (PR #30).** `actualizar.js` descarga la **última release** (`vX.Y.Z`), nunca `main`; el aviso diario también mira la release. El workflow `release.yml` publica la release en cada merge que sube `.kit/VERSION`, con las notas del CHANGELOG. Comprobado con la `v0.20.0`. Siguen abiertos `enforce_admins` (decisión) y la firma del motor (no compensa). Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

`actualizar.js:113-118` clona **`main`** del repo del kit y luego `require()` de las migraciones descargadas
(`actualizar.js:95`) y copia skills y `AGENTS.md`, que gobiernan al LLM. Todo lo que llegue a `main` se
ejecuta en la máquina de cada alumno la próxima vez que diga "actualiza el kit".

Lo que hay hoy a favor: `main` exige el check `tests-ok` por PR (verificado en la API), el hook de pre-push
y la vuelta atrás si tras actualizar hay más errores. Lo que falta:

- **No hay etiquetas ni releases** (`git tag` vacío, `gh release list` vacío). No se puede decir "instala la
  0.18.0" ni volver a ella; `VERSION` es un fichero, no una referencia inmutable.
- `enforce_admins` está desactivado: el propietario puede saltarse la protección. Es tu repo y tienes el
  hook, pero conviene saberlo.
- No hay firma ni checksum de lo que se descarga: la confianza está toda en la cuenta de GitHub.

**Recomendación:** publicar una etiqueta `vX.Y.Z` por versión (un paso más en el flujo de PR, o un workflow
que etiquete al mezclar cuando `VERSION` cambia) y que `actualizar.js` clone **la última etiqueta**, no
`main`. Gana tres cosas: los alumnos reciben solo lo que se ha decidido publicar, se puede volver a una
versión concreta, y `CHANGELOG` y etiqueta quedan atados. Coste: pequeño.

### 2.3 🟡 → ✅ Complementos de Obsidian sin fijar versión

> ✅ **Arreglado en 0.20.0 (PR #30).** Adelantado del bloque 1: cada complemento lleva versión y sha256 por fichero en `lib/obsidian.js`; lo que no coincide no se instala; descarga con tiempo límite. El TBD de la clave de Claudian sigue sin comprobar. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

`lib/obsidian.js:40-45` descarga `releases/latest` de tres repos de terceros (`polyipseity/obsidian-terminal`,
`lukasbach/obsidian-code-files`, `yishentu/claudian`) sin versión ni hash. Se instalan **apagados** y
activarlos es decisión del alumno (bien resuelto), pero si una de esas cuentas se compromete, el código
llega al disco del alumno igualmente.

- **Recomendación:** fijar versión (`releases/download/<tag>/`) y sha256 por fichero en `COMPLEMENTOS`, y
  subirlas a mano con una línea en el CHANGELOG. `fetch` tampoco tiene tiempo límite: en una red mala,
  `obsidian.js` se queda colgado.
- **TBD:** Claudian pide una clave de API o usa la sesión de Claude Code. Si pide clave, choca con la regla
  "nunca un token" de `AGENTS.md`, y la hoja del alumno debería avisarlo.

### 2.4 🟡 → ✅ Inyección en el atajo por la ruta del curso

> ✅ **Arreglado en 0.20.0 (PR #30).** Adelantado del bloque 1: `crear-atajo.js` rechaza rutas con `"`, `$`, `%`, acento grave o saltos de línea (`ruta-no-valida`), con explicación en llano. Con test. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

`crear-atajo.js:14-21` escribe `cd "${raiz}"` en un script de shell. Una ruta con `"`, `$` o acento grave
rompe el lanzador o ejecuta lo que haya dentro. La ruta la elige el propio alumno, así que el riesgo es
bajo, pero un nombre de carpeta con `$` no es raro. Arreglo barato: rechazar esos caracteres al crear el
atajo (`nombre-no-valido` ya existe como patrón de respuesta).

### 2.5 🟢 Lo que está bien

- **Escaneo de secretos** (`lib/secretos.js`) en cada guardado, sobre ficheros rastreados y sin ignorar,
  con patrones de los proveedores habituales; bloquea el push, no imprime el valor.
- **`issue.js` se niega** a enviar rutas con usuario, correos o secretos; el diagnóstico en JSON no lleva
  datos del alumno salvo la carpeta del atajo, que `issue.js` detectaría.
- **`.gitignore`** cubre `.env*`, claves, `workspace.json` y complementos de terceros.
- **El repo del alumno es privado** por diseño y `diagnostico.js` lo comprueba de verdad (`copia-privada`).
- **`validarMotor`** impide que el motor toque `config/`, `estudio/` o `README.md`, y que las rutas salgan
  de la raíz.
- **Permisos de Claude** (`.claude/settings.json`): solo las herramientas del kit y lecturas de git/gh.
  Sin `deny`, pero tampoco hace falta.
- `patrones_prohibidos` compila una regex del alumno (ReDoS teórico); es local y suyo. Se queda.

---

## 3. Calidad del código y de los tests

### 3.1 🟢 Estado

> Cifras del 2026-09-23, antes de la 0.20.0. Tras ella: **197 tests**, 99 % de líneas.

| | |
|---|---|
| Herramientas + librerías | 1 848 líneas, sin dependencias externas, Node ≥ 22 |
| Tests | 24 ficheros, 2 246 líneas, **189 tests en verde**, 16 s |
| Cobertura | 98,4 % líneas · 90,9 % ramas · 96,3 % funciones (mínimo exigido: 80 %) |
| Sin cubrir | `actualizar.js:113-131` (descarga real con `gh`), `obsidian.js:40-45` (fetch real), `issue.js:19-22` |

Los tests son de verdad: crean cursos temporales con git real, ejecutan el atajo de verdad, migran una
copia en formato viejo. `coherencia-skills.test.js` vigila que lo que las skills citan existe, que toda
herramienta tiene permiso y que las propiedades de frontmatter que se nombran las lee alguien. Es el tipo
de test que evita que la prosa y el código se separen, y aquí es lo más valioso de la suite.

### 3.2 🟡 Hallazgos

Siete puntos: **los 7 arreglados ✅** (0.20.0 y 0.21.0). Cada uno dice el suyo. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

- ✅ **Sin `package.json`.** No hay `engines` (el mínimo Node 22 solo lo sabe `diagnostico.js`), no hay
  `npm test`, no hay linter. Uno mínimo, sin dependencias, con `scripts.test` y `engines`, deja el proyecto
  reconocible para cualquier herramienta y para quien lo abra por primera vez.
  → **Arreglado en 0.20.0:** `package.json` con `engines >=22`, `npm test`, `npm run test:cobertura` y
  `npm run comprobar`. `preparar-curso.js` lo borra al crear un curso. El linter no: va en el punto siguiente.
- ✅ **Sin linter.** 40 líneas de más de 160 caracteres en las herramientas; funciones de una línea con tres
  ternarios (`comprobar.js:291`, `indice.js:10`). Es consistente y está comentado, así que se lee, pero
  crece a base de compactar. Un ESLint con reglas mínimas (o al menos `max-len`) costaría poco.
  → **Arreglado en 0.21.0:** ESLint como devDependency solo del repo (`preparar-curso.js` lo borra en los
  cursos, con `node_modules/` y `package-lock.json`), `eslint.config.js` con `no-unused-vars`, `no-undef`,
  `eqeqeq`, `prefer-const` y `max-len` 160 (ignora cadenas y comentarios largos, y los `assert.match` de los
  tests, que son regex literales). `npm run lint`, y un paso de CI solo en el job Linux Node 24.
- ✅ **`comprobar.js` hace dos cosas:** comprobar y generar markdown (`pendientes`, `auditoría`, `Estado` del
  README, `comprobar.js:220-327`). La generación del índice ya vive en `lib/indice.js`; el resto de
  generadores debería vivir en `lib/` también. Refactor pequeño, sin urgencia.
  → **Arreglado en 0.21.0:** `comprobar.js` ya solo comprueba; toda la generación (`pendientes`, `auditoría`,
  `Estado`, y ahora también `formulario` y `ejercicios/_index`) vive en `lib/generados.js`. `guardar.js` y los
  tests importan de ahí.
- ✅ **Parser de frontmatter propio** (`vault.js:90-114`): escalares, listas en línea y en bloque. No entiende
  mapas anidados, cadenas multilínea ni valores con `:` sin comillas. Obsidian escribe frontmatter cuando
  el alumno marca casillas o edita propiedades; hoy solo hace `estudiada`, y está cubierto. Si el kit va a
  apoyarse más en propiedades que toca el alumno (§8), conviene tests de esquina o un parser YAML mínimo
  de verdad.
  → **Resuelto de otra forma en 0.21.0:** en vez de un lector más completo, el kit señala lo que no entiende o no le sirve (aviso `propiedad-no-estandar`) y el profesor lo interpreta con el alumno, lo reescribe en el estándar y apunta cómo escribe. Ver §0.
- ✅ **Ficheros vivos que mantiene el LLM a mano:** `progreso.md`, `conceptos/_index.md`, `mapa-del-curso.md`,
  `formulario.md`, `ejercicios/_index.md`. `comprobar.js` sincroniza los dos primeros; los otros tres
  pueden desviarse sin que nadie avise. Y `mapa-del-curso.md` se solapa con `inicio.md` desde la 0.16.0 (la
  propia skill dice "no listes ahí las sesiones"). Ver §8.1 (P2).
  → **Arreglado en 0.21.0 (P2):** `formulario.md` y `ejercicios/_index.md` se escriben solos al guardar, como
  `inicio.md` y `pendientes.md`. `mapa-del-curso.md` se queda, pero la skill `/sesion` ya solo le pide la
  cobertura del material (se quitó "y estado del bloque", que ya da `inicio.md`). Migración `004-…` conserva
  con otro nombre lo que un curso ya tuviera escrito a mano en los dos primeros y no coincida con lo generado.
  `progreso.md` sigue a mano a propósito: solo lo cambian las respuestas del alumno.
- ✅ **Carpeta temporal sin limpiar:** `actualizar.js:115` clona en `os.tmpdir()` y nunca la borra.
  → **Arreglado en 0.20.0:** `cli()` de `actualizar.js` borra el clon al terminar (en un `finally`), salvo si
  vino por `--origen`.
- ✅ **Test que falta:** el caso de §2.1 (actualizar sin identidad y con fallo).
  → **Arreglado en 0.20.0:** test "si no puede guardar antes de actualizar, no toca nada…" en
  `tests/actualizar.test.js`.

---

## 4. Multiplataforma

### 4.1 🟢 Lo que está bien

- Todas las rutas con `path.join` y conversión a POSIX para lo que se escribe en notas; `\r\n` respetado en
  pies y migraciones; `spawnSync` sin shell (sin problemas de comillas); CI con `autocrlf false`.
- Lanzador `.cmd` en Windows y `sh` en el resto; búsqueda de comandos con `PATHEXT`.
- Guía de instalación con las palabras exactas de cada sistema (Terminal/PowerShell, Finder/Explorador),
  aviso de OneDrive/iCloud, y el detalle del PATH de Windows que no se actualiza en la ventana abierta.

### 4.2 🟡 Hallazgos

- **Linux no existe en la documentación.** El CI corre en Ubuntu y las herramientas funcionan, pero
  `INSTALACION.md` solo tiene Mac y Windows, las skills dicen `open` (Mac) y `start` (Windows) sin
  `xdg-open`, y la guía de uso solo explica cómo abrir la terminal en esos dos. Decidir: o se añade una
  sección Linux (poca cosa: instalación con el gestor de paquetes, `xdg-open`), o se dice explícitamente
  que no está soportado.
- **El atajo depende de que `~/.local/bin` esté en el PATH** (`crear-atajo.js:38`). Es verdad cuando
  Claude Code se instaló con su instalador nativo (él lo añade). Con Codex o Gemini instalados por `npm`,
  esa carpeta puede no estar en el PATH en Mac ni en Windows: `diagnostico.js` lo avisa
  (`atajo-en-path`), pero la instalación queda a medias y la solución ("añádela al PATH") es justo lo que
  un alumno sin perfil técnico no sabe hacer. Ver §5.
- **Windows solo se prueba con Node 24** y sin una instalación completa con curso (lo reconoce el PR #25).
  El feedback pendiente de Windows y Codex de `pendiente-de-validar.md` sigue sin llegar; hasta entonces,
  la frase de la guía "debería funcionar igual" es la honesta.
- `guardar.js` escribe `config/diario.md` con `\n` aunque el fichero venga con `\r\n`: en Windows, con un
  editor que convierta, cada guardado puede tocar el fichero entero. Menor.

---

## 5. Multi-LLM

El kit está diseñado para no atarse a Claude (`AGENTS.md` como fuente, `SKILL.md` estándar, `ESTANDARES.md`,
`llm` en `ajustes.json`, `COMANDO_LLM` en el atajo, `GEMINI.md` puente). La intención es buena y la
arquitectura lo permite. Lo que falla es que **el trabajo de adaptación se le delega al propio LLM en
tiempo de instalación**, y ese es el momento y el actor menos fiables.

### 5.1 🔴 → ✅ `.gitignore` en el motor

> ✅ **Arreglado en 0.20.0 (PR #30).** `.gitignore` sigue en `motor.json` (sacarlo haría que el `actualizar.js` viejo lo borrase), pero ahora se **fusiona**: se añaden al final las reglas del kit que falten y no se toca ninguna del alumno. La actualización 0.19→0.20 la hace el código viejo y lo sustituye entero por última vez (avisado en el CHANGELOG). Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

`motor.json` incluye `.gitignore` entre los ficheros que `/actualizar` reemplaza. `ESTANDARES.md` paso 1
pide al LLM "añade esa carpeta a `.gitignore`". La siguiente actualización la borra. Hoy el fichero ya
trae `.agents/skills/`, `.codex/skills/` y `.gemini/skills/`, así que los tres casos previstos
sobreviven, pero cualquier otro destino, y cualquier línea del alumno, no. **Arreglo:** o `.gitignore` sale
del motor y se fusiona (añadir lo que falte, como hace `aplicarAjustes` con Obsidian), o el kit escribe un
`.gitignore` propio dentro de `.kit/` e incluye desde el de la raíz.

### 5.2 🟡 `ESTANDARES.md` es un encargo, no un adaptador

28 líneas que dicen "averigua en tu documentación oficial en qué carpeta buscas skills". Un modelo que
alucina una ruta deja el curso sin skills y `diagnostico.js` lo da por bueno si existe
`config/adaptacion-llm.md` (`diagnostico.js:57`), que es justo lo que el LLM acaba de escribir.

**Recomendación:** que el kit traiga **adaptadores hechos** para los dos o tres LLMs que se quieran
soportar, y que `instalar-skills.js` y `diagnostico.js` los usen según `ajustes.json → llm`:

| LLM | Reglas | Skills (destino) | Permisos | Estado |
|---|---|---|---|---|
| Claude Code | `CLAUDE.md` → `AGENTS.md` | `.claude/skills/` | `.claude/settings.json` | hecho, probado |
| Codex CLI | `AGENTS.md` nativo | **TBD** (`.agents/skills/` según `.gitignore`; confirmar en su doc) | **TBD** (`.codex/config.toml`) | sin probar |
| Gemini CLI | `GEMINI.md` → `AGENTS.md` | **TBD** | **TBD** (`.gemini/settings.json`) | sin probar |

No invento las rutas: hay que confirmarlas en la documentación de cada uno y probarlas una vez. Con eso,
`ESTANDARES.md` queda para el LLM que no esté en la tabla, y `diagnostico.js` comprueba ficheros reales,
no una nota.

### 5.3 🟡 Claude-ismos y dependencia del modelo

- Restos de Claude en las skills: "Sin Artifact" (`examen`, `repaso`), "Crea una tarea por cada punto"
  (`sesion`, es TodoWrite), "lánzalo en segundo plano" (instalación). Inofensivos, pero delatan.
- **Lo importante:** la calidad pedagógica depende de que el modelo siga skills largas (`sesion` tiene 196
  líneas y siete ficheros vivos que actualizar "sin saltarse ninguno"). Un modelo más flojo se salta pasos
  en silencio. La prueba con Sonnet (`curso-no-finanzas.md`) salió bien, pero fue una. La defensa real no
  es más prosa: es que **las herramientas comprueben el resultado** (§8.1, P1). Eso es lo que hace al kit
  multi-LLM de verdad.
- `INSTALACION.md` está escrita para Claude (la pieza "Claude", el plan Pro). Correcto mientras sea lo
  único probado; solo hay que decirlo en la portada, que ya lo hace.

---

## 6. Documentación

### 6.1 🔴 → ✅ parcial · Lo que ya no es verdad

> ✅ **Arreglado en 0.20.0 (PR #30).** Corregidos `CONTRIBUTING.md` (flujo con releases, barreras de `main` sin depender de la visibilidad) y `README.md` y la plantilla de PR (CI sin Mac). `docs/superpowers/` borrado entero, incluido el fichero con datos del curso real. **Siguen tal cual** la invitación en `INSTALACION.md` y la 1.0.0: dependen de tu decisión sobre público/privado. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

| Dónde | Dice | Realidad |
|---|---|---|
| `CONTRIBUTING.md` | "El repo es privado y de plan gratuito: GitHub … no aplica la protección" | Repo **público**; `main` exige `tests-ok` (comprobado en la API) |
| `INSTALACION.md` paso 1 y texto de arranque | Invitación por correo al "repositorio privado" | Público: la invitación sobra, y el 404 ya no puede ser "falta la invitación" |
| `README.md` | CI "en Mac, Windows y Linux"; PR template igual | Sin Mac desde el PR #23 |
| `README.md` | "en `0.x` hasta que sustituya al curso con el que nació" | PR #25 dice que ya lo sustituye; se cerró sin mezclar. Decidir la 1.0.0 |
| `.kit/ESTANDARES.md`, `README.md` | Otros LLMs "compatibles pero sin probar" | Cierto; y sigue sin fecha para probarlo |

**Decisión tuya:** ¿el repo es público a propósito (para que la protección de `main` funcione en el plan
gratuito)? Si sí: quitar la invitación de la guía, actualizar `CONTRIBUTING.md` y **limpiar
`docs/superpowers/pruebas/2026-09-21-pendiente-de-validar.md`**, que nombra tu curso real, su repo y
detalles personales ("tu dinero real"). Si no: volver a privado y la protección de `main` deja de
aplicarse (vuelve a ser el hook).

### 6.2 🟢 Lo que está bien

- **Documentación por audiencias** con fuente de verdad declarada (tabla de `CONTRIBUTING.md`) y un test
  que vigila la parte mecánica. Raro y valioso.
- La hoja *Cómo usar tu profesor* y la guía de instalación están escritas de verdad para alguien sin perfil
  técnico: palabras exactas de pantalla, "lo que vas a ver / si ves otra cosa".
- `CHANGELOG.md` escrito desde lo que nota el alumno, con las ofertas "Si ya tenías tu curso" que
  `/actualizar` lee. Es un mecanismo de producto, no solo un registro.
- `AGENTS.md`: 196 líneas, denso pero ordenado; junto a las skills, 72 KB de instrucciones que el LLM lee
  por trozos, no de golpe. Aceptable.

### 6.3 🟡 Lo que falta

- **Un documento de arquitectura vivo** (una página): motor/datos, qué genera quién (`guardar.js` →
  `inicio`, pies, `pendientes`, `auditoría`, `Estado`), invariantes (un concepto = una nota; `progreso`
  solo con respuestas), y el ciclo de una sesión. Hoy eso está repartido entre `AGENTS.md`, la spec de la
  fase 1 (histórica, 317 líneas) y los comentarios del código. Quien vaya a tocar el kit —tú dentro de tres
  meses, otro LLM, otra persona— lo necesita.
- `docs/superpowers/pruebas/comparar-con-vault.js` es código dentro de `docs/`. Si sigue siendo útil, a
  `.kit/herramientas/dev/`; si no, fuera.
- La regla 6 de `AGENTS.md` ("Deshacer" con `git revert`) no tiene herramienta: el LLM hace git a mano, que
  es justo lo que la sección Herramientas prohíbe. Un `deshacer.js` cerraría la contradicción y permitiría
  probarlo.

---

## 7. Agilidad del proceso (releases resueltas en 0.20.0)

> ✅ **Arreglado en 0.20.0 (PR #30).** Releases automáticas por etiqueta (ver §2.2). El curso de referencia en CI, `.superpowers/sdd/` y el documento de arquitectura siguen abiertos. Detalle en [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

🟢 **Funciona.** Rama → tests en local (hook) → PR → `tests-ok` → merge → CHANGELOG → migración si toca.
Versiones con criterio ("qué nota el alumno"), CI barato y con cancelación, 15 PRs mezclados en dos días
con la suite creciendo a la par. El bucle de feedback profesor → issue está resuelto mejor que en la
mayoría de proyectos (herramienta que monta la issue, hueco `Del kit:` en cada cierre).

🟡 **Lo que le falta al proceso:**

- **Releases** (§2.2). Es la pieza que convierte "mezclado" en "publicado" y permite decir a un alumno
  "quédate en la 0.18 hasta que lo mire".
- **Un curso de referencia en el CI.** Hoy el CI prueba herramientas; nadie prueba automáticamente que
  las skills siguen produciendo material bueno tras un cambio en `AGENTS.md`. Una prueba periódica (no por
  PR: cuesta tokens) que procese una clase de un curso de juguete con `claude -p` y pase `comprobar.js` más
  el lint pedagógico de §8.1 sería el test que hoy haces a mano.
- **Ruido local:** `.superpowers/sdd/` (informes y diffs de subagentes) vive en el árbol de trabajo. Está
  ignorado por su propio `.gitignore`, pero conviene sacarlo del repo o documentarlo en `CONTRIBUTING.md`.
- **Bus factor 1.** No se arregla con documentación, pero el documento de arquitectura (§6.3) lo mitiga.

---

## 8. Futuras iteraciones

Criterio: cada propuesta dice **qué**, **por qué** (con la prueba que hay en el repo), **tamaño** (S: una
tarde · M: un PR de varios días · L: varias versiones) y en qué ficheros vive. Van primero las que hacen
mejor al profesor; después las que hacen mejor al alumno. Al final, el orden que recomiendo.

### 8.1 Para el profesor: calidad del material, facilidad al enseñar, evolución con el curso

**P1 · Lint pedagógico en `comprobar.js` (S-M).** Hoy `comprobar.js` vigila enlaces, índices, frontmatter y
lo que Obsidian no dibuja. No vigila **nada de la calidad pedagógica**, que hoy depende de que el modelo
lea 196 líneas de skill y no se salte pasos. Avisos nuevos, todos calculables desde disco:

| Aviso | Qué mira | De dónde sale la regla |
|---|---|---|
| `nota-larga` | concepto con más de N líneas (N en `profesor.md → longitud_nota`) | "una nota cabe en una pantalla" |
| `concepto-sin-ejemplo` | sección `## El ejemplo` vacía o ausente | "ejemplo antes que definición" |
| `sesion-incompleta` | `## Cobertura del material`, `## Auditoría del material` o `## Para pensarlo despacio` vacías | son "lo que distingue una sesión trabajada" |
| `flashcards-fuera-de-rango` | número de flashcards fuera de `flashcards_por_sesion` | ya es un parámetro |
| `formula-sin-formulario` | fórmula `$$` en un concepto que no aparece en `formulario.md` | "cualquier fórmula nueva va al formulario" |
| `requiere-vacio` | concepto de `dificultad: 3` sin `requiere:` | "la duda revela un prerrequisito flojo" |
| `pregunta-doble` | pregunta de examen con dos `?` o " y " (heurística, aviso) | "una pregunta pregunta una cosa" (0.19.0) |

Por qué primero: es lo que hace al kit **robusto frente al modelo** (§5.3) y lo que permite un curso de
referencia en CI (§7). Y da al profesor un espejo objetivo de su propio trabajo antes de guardar.

**P2 · Más ficheros vivos generados, menos mantenidos a mano (M).** `inicio.md` demostró el patrón: lo que
se puede calcular, se calcula en `guardar.js`. Candidatos: `ejercicios/_index.md` (de los `ejercicio:` de
cada concepto y un frontmatter en cada ejercicio con `practica:` y `se-descubre:`), `formulario.md` (de las
secciones `## La fórmula`, agrupadas por `bloques:`), y **retirar `mapa-del-curso.md`** o reducirlo a la
cobertura del material (lo único que `inicio.md` no cubre). Menos pasos en `/sesion`, menos desvío, y
`comprobar.js` deja de necesitar comprobarlos.

> ✅ **Arreglado en 0.21.0.** `formulario.md` y `ejercicios/_index.md` los genera `guardar.js`. Una diferencia
> con lo propuesto aquí: "lo que se descubre fallándolo" no sale de un frontmatter nuevo en cada ejercicio
> (`practica:`/`se-descubre:`), sino del `## Practícalo` que la plantilla de concepto ya pedía escribir — no
> hacía falta un campo más que mantener a mano en el propio ejercicio. `mapa-del-curso.md` se queda (no se
> retira), reducido a la cobertura del material. Ver [§0 Seguimiento](#0-seguimiento-se-actualiza-en-cada-bloque).

**P3 · Calentamiento antes de cada clase nueva (S).** Al empezar `/sesion`, antes de leer el material: mirar
`requiere:` de lo que probablemente venga y `progreso.md`, y si hay prerrequisitos en 🟡/🔴 o sin evaluar,
hacerle al alumno dos preguntas de la sesión anterior. Es *retrieval practice* con coste cero y usa datos
que ya existen. Va en la skill, sin herramienta nueva.

**P4 · El profesor ve su evolución con datos (M).** Los datos existen dispersos: notas y fechas en los
exámenes, dudas por concepto en `alumno.md`, conceptos 🔴 en `progreso.md`, el diario. Falta juntarlos:
`estudio/evolucion.md` generado en cada guardado (nota por módulo y fecha, dudas por bloque, conceptos que
más cuestan, tiempo entre clase y procesado). Con eso, la regla "cuando los datos digan que algo no
funciona, revisa cómo explicas" (`AGENTS.md`) deja de depender de que el profesor se acuerde: `/examen` y
el saludo de cada sesión lo leen. Y el alumno lo ve (§8.2, E4).

**P5 · Duplicados por significado, no por slug (S).** `comprobarDuplicados` compara palabras del slug (issue
#12). El índice ya tiene la definición en una frase de cada concepto: un paso explícito en `/sesion` que
compare la definición del concepto nuevo con las del índice **antes** de crear la nota, y una herramienta
`candidatos.js <frase>` que devuelva los tres más parecidos por palabras de la definición y alias. No
sustituye al juicio del LLM; le pone delante lo que tiene que mirar.

**P6 · Cierre de módulo: consolidar (M).** Cuando todas las sesiones de un módulo están estudiadas y
aprobadas, un paso `/consolidar <módulo>`: releer las notas del módulo con lo aprendido después, partir o
fusionar conceptos, completar `requiere:`, regenerar las flashcards priorizando los errores del examen,
y actualizar la auditoría del material para el centro. Es lo que hace un buen profesor entre bloques y hoy
no tiene sitio en el ciclo.

**P7 · Formato del examen oficial (M; solo si el objetivo del curso es un examen oficial).** Pendiente
desde la fase 1. `config/curso.md` gana una sección (tipo de preguntas, número, tiempo, penalización por
fallo, materiales permitidos) y `/examen --oficial` genera un simulacro con ese formato y ese tiempo, y
corrige con esa puntuación. Sin esto, la nota interna y la del centro no son comparables.

**P8 · Material que no es PDF (TBD).** `inbox` acepta "PDF, markdown, texto". Fotos de pizarra, PPTX,
audio de clase y hojas de cálculo (que `/sesion` ya pide auditar "si tu entorno lo permite") dependen de lo
que lea cada LLM. Falta una tabla por LLM en `ESTANDARES.md` y, si merece la pena, una herramienta de
conversión que use lo que haya instalado (LibreOffice para PPTX). No lo dimensiono: depende de lo que
traiga el material de los cursos reales.

### 8.2 Para el alumno: aprender mejor, entender mejor, seguir motivado

**E1 · Repaso espaciado (M).** Las flashcards existen y se leen una vez. Lo que fija el conocimiento es
volver a ellas a intervalos crecientes. Dos formas:

- *Complemento de Obsidian* (Spaced Repetition): probado, con algoritmo y estadísticas, pero exige activar
  un complemento de terceros, cambiar el formato de las flashcards al suyo, y el profesor no ve los datos.
- *Nativo del kit*: cada flashcard con `caja:` y `proxima:` en frontmatter (Leitner, cinco cajas); el alumno
  marca en Obsidian si la acertó; `inicio.md` enseña "🔁 Hoy te tocan 12 flashcards"; `guardar.js`
  recalcula. Más simple, funciona con cualquier lector y **el profesor lo ve** (alimenta `progreso.md` y P4).

Recomiendo el nativo, y ofrecer el complemento como extra igual que los otros tres. Por qué: el kit ya
apuesta por "todo sale de disco y lo genera `guardar.js`", y el dato de repaso vale más para el profesor
que el algoritmo perfecto.

**E2 · Plan con calendario y cuenta atrás (M).** `config/curso.md` tiene fechas y `alumno.md` (0.18.0) tiene
horas por semana y fecha que aprieta, y **nada los usa**. `estudio/plan.md` generado: semanas hasta el
examen, qué sesiones tocan, qué repasar (de E1 y de 🔁), cuándo pedir el examen de módulo; y en `inicio.md`
una línea "📅 Examen del módulo 1 en 12 días · esta semana: 1.4, 1.5 y repaso de 1.2". El plan se recalcula
en cada guardado con lo que de verdad ha hecho; no le regaña, le reordena. Es lo que más reduce el "¿qué
hago ahora?" y lo que da sensación de control.

**E3 · Progreso visible y pequeños logros en `inicio.md` (S).** Todo está en `lib/indice.js`: barra por
módulo (`▓▓▓▓░░ 4/6`), racha de semanas con actividad (del diario), y al aprobar un módulo una línea
("Módulo 1 superado el 2026-10-02 con un 7,5"). Sobrio y desactivable en `profesor.md`; nada de insignias.
La motivación que dura es ver el camino recorrido, no un confeti.

**E4 · El alumno ve lo que el profesor sabe de él (S-M).** `config/alumno.md`, `config/profesor.md` y el
diario están **fuera de la bóveda**: el alumno no puede ver qué se ha apuntado de él, ni por qué le explica
así, ni corregirlo. `estudio/mi-perfil.md` generado: cómo te explico y por qué (con la prueba), qué te
cuesta, qué te entra a la primera, tu evolución (P4). Da confianza, permite corregir ("eso no es verdad") y
es metacognición gratis. Se genera, no se edita: si quiere cambiar algo, se lo dice al profesor.

**E5 · Autoevaluación calibrada (S-M).** Una propiedad `me-lo-se:` (0-3) en cada concepto que el alumno
marca en Obsidian, como `estudiada`. El profesor la cruza con `progreso.md`: donde el alumno se pone 3 y
falla, se lo dice (es el sesgo de familiaridad, el más caro en un examen); donde se pone 1 y acierta, le
quita miedo. `/examen` prioriza los conceptos con más desajuste. El parser de frontmatter lo aguanta.

**E6 · "Explícamelo tú" (S).** Un modo dentro de `/dudas` o `/examen`: el alumno explica un concepto con
sus palabras (en el chat o bajo una línea ✍️ en la nota); el profesor corrige con las reglas de "cuando
preguntas para medir" y mueve el eje teoría de `progreso.md`. Es la forma más barata de distinguir
entender de recordar, y no necesita ningún fichero nuevo.

**E7 · Examen acumulativo por defecto (S).** Cada examen de módulo lleva un 20 % de preguntas de módulos
anteriores (parámetro en `profesor.md`). Sin esto, lo aprobado se olvida y el examen final lo descubre
tarde. Es un cambio en la tabla de reparto de `/examen`.

**E8 · Sesión corta (S).** "Tengo 15 minutos" → el profesor propone una sola cosa (las flashcards de hoy
de E1, una pregunta de E6, una duda pendiente). Reduce la barrera de abrir al profesor los días malos, que
son los que rompen el hábito.

**E9 · Prerrequisitos como camino, no como parche (S).** Hoy lo que falta de base va marcado como
ampliación. Cuando el test inicial o un examen destapan un prerrequisito flojo, crear la nota (marcada
como ampliación) **y** ponerla en el plan (E2) antes de la sesión que la necesita, en vez de esperar al
tropiezo.

### 8.3 Orden recomendado

Tres iteraciones, cada una un objetivo, cada una publicable sola:

1. **"Que no se rompa" (0.20.0):** §2.1 (vuelta atrás segura), §2.2 (etiquetas y actualizar desde
   etiqueta), §5.1 (`.gitignore` fuera del motor), §2.3 (complementos fijados), §6.1 (documentación con la
   verdad: público/privado, CI sin Mac, Linux sí o no) y `package.json`. Todo pequeño; junto, cierra los
   cuatro 🔴. Antes de nada, tu decisión sobre público/privado y sobre la 1.0.0.
2. **"Que no dependa del modelo" (0.21.0):** P1 (lint pedagógico), P2 (ficheros vivos generados), P3
   (calentamiento), P5 (candidatos a duplicado). Es la base para probar otro LLM con garantías y para el
   curso de referencia en CI (§7). Después de esto tiene sentido dedicar una tarde a Codex o Gemini con la
   tabla de §5.2.
3. **"Que el alumno vuelva" (0.22.0):** E1 (repaso espaciado), E2 (plan con calendario), E3 (progreso
   visible), E4 (mi perfil). Las cuatro salen de datos que ya existen y viven casi enteras en `lib/indice.js`
   y `guardar.js`; comparten diseño y conviene hacerlas juntas. E5-E9 después, una por versión, según lo
   que pida el curso real.

P4 (evolución con datos) encaja en la 3 o en la siguiente; P6 y P7 cuando el curso real llegue al final de
un módulo y a la fecha del examen del centro, que es cuando se sabrá qué necesitan de verdad.

---

## 9. Decisiones que necesitan a Roberto

1. **¿El repo del kit es público a propósito?** Cambia la guía de instalación, `CONTRIBUTING.md` y obliga a
   limpiar `docs/superpowers/pruebas/`.
2. **¿Se publica la 1.0.0?** El PR #25 lo daba por validado y se cerró. Si el criterio ("sustituye al curso
   con el que nació") se cumple, la 1.0.0 debería ir con la iteración 1 y con la primera etiqueta.
3. **¿Linux se soporta o se dice que no?** Cualquiera de las dos vale; lo que no vale es el silencio actual.
4. **¿Qué segundo LLM se prueba primero, Codex o Gemini?** Decide qué adaptador de §5.2 se hace de verdad.
5. **Del orden de §8.3:** si el curso real tiene una fecha de examen cerca, E2 (plan con calendario)
   debería adelantarse a la iteración 2.
