# Instalación del kit — guía para el LLM

Quien tienes delante **no es técnico**. Una frase por cada cosa que instales, permiso antes de
instalar, y lenguaje llano si algo falla. **Si un paso falla, no sigas con el siguiente a medias.**

Cada paso es un **objetivo** y **cómo comprobarlo**. El comando lo eliges tú según el sistema
operativo que detectes; los que aparecen aquí son ejemplos. Las herramientas del kit se ejecutan
igual en todos los sistemas, siempre con `/`: `node .kit/herramientas/<nombre>.js`.

Si no eres Claude Code, lee antes `.kit/ESTANDARES.md` (lo tendrás tras el paso 3).

| # | Objetivo | Cómo se comprueba | Ejemplo |
|---|---|---|---|
| 1 | Node LTS (22 o superior), Git y `gh` instalados | `node --version` · `git --version` · `gh --version` | Mac: `brew install node git gh` · Windows: `winget install OpenJS.NodeJS.LTS Git.Git GitHub.cli` |
| 2 | Sesión de GitHub iniciada, **con la cuenta a la que se invitó al alumno** | `gh auth status` en verde y `gh api repos/rsotor/profesor-kit --jq .name` responde | ver abajo. **Nunca un token.** |
| 3 | El curso tiene nombre, y está creado desde la plantilla dentro de la carpeta de cursos del alumno | existe `<carpeta>/.kit/VERSION` | ver abajo |
| 4 | Git sabe quién es el alumno | `git config user.name` y `git config user.email` devuelven algo | ver abajo |
| 5 | Curso limpio y ajustes creados | existe `config/ajustes.json`; no existen `docs/` ni `.github/` | `node .kit/herramientas/preparar-curso.js --subir si --nombre "<nombre del curso>"` (o `--subir no`) |
| 6 | Skills instaladas | Claude Code: existe `.claude/skills/sesion/SKILL.md` | `node .kit/herramientas/instalar-skills.js` |
| 7 | **El atajo funciona:** escribir una palabra en la terminal abre este curso | `config/ajustes.json` tiene `atajo`; en una terminal nueva, esa palabra abre el LLM en el curso | `node .kit/herramientas/crear-atajo.js --nombre <palabra>` — ver abajo |
| 8 | **Instalación verificada** y guardada | `node .kit/herramientas/diagnostico.js` termina con **"Todo listo"** | después, `node .kit/herramientas/guardar.js "curso: instalación"` — ver abajo |
| 9 | Obsidian instalado y con la carpeta `estudio/` abierta como bóveda | existe `estudio/.obsidian/workspace.json` (solo lo escribe Obsidian al abrir la bóveda) y el alumno ve sus carpetas en la columna izquierda | Mac: `brew install --cask obsidian` · Windows: `winget install -e --id Obsidian.Obsidian` — ver abajo |
| 10 | Arranca la sesión 0 | — | dile que **cierre esta ventana, abra una terminal nueva y escriba su atajo**. Avísale antes: al abrirse le preguntará **si confía en esta carpeta** — tiene que decir que sí, o los permisos del kit no se aplican y le pedirá confirmación a cada paso. Ya dentro, que escriba "empezamos" (o lanza tú `/configurar`) |

## Antes de nada — ¿es su primer curso?

Node, Git, `gh`, la sesión de GitHub y Obsidian se instalan **una vez para todo el ordenador**, no por
curso. Mira si en la carpeta donde estás ya hay otro curso del kit (una carpeta hermana con
`.kit/VERSION`), o pregúntaselo.

- **Ya tiene otro curso:** comprueba los pasos 1 y 2 **de una sola vez** (`node --version`, `git --version`,
  `gh --version`, `gh auth status`) y, si todo responde, **ve directo al paso 3**. No reinstales ni vuelvas
  a explicar qué es cada cosa: son dos minutos, no treinta. Obsidian también lo tiene ya: en el paso 9
  solo hay que abrir la carpeta `estudio` del curso nuevo como otra bóveda.
- **Es el primero:** sigue la tabla entera.

## Paso 1 — comprobar antes de instalar

**Instala solo lo que falte, y comprueba antes de decidir que falta.** Que un comando "no exista" no
siempre significa que el programa no esté instalado:

- **En Windows, lo recién instalado no se ve en la ventana de terminal que ya estaba abierta**: el PATH
  solo se actualiza al abrir una ventana nueva. Si `gh --version` falla pero `winget list --id GitHub.cli`
  dice que está instalado (lo mismo con `OpenJS.NodeJS.LTS` y `Git.Git`), **no lo reinstales**: dile al
  alumno que cierre esta ventana, abra otra, vuelva a entrar en su carpeta de cursos y te pegue otra vez
  el texto de arranque. Retomarás donde lo dejaste, porque todo lo instalado seguirá ahí.
- En Mac pasa menos, pero pasa tras instalar Homebrew: misma solución, ventana nueva.

**Cómo comprobarlo bien** (no te fíes de un solo intento):

| | Mac / Linux | Windows (PowerShell) |
|---|---|---|
| ¿Responde el comando? | `node --version; git --version; gh --version` | `node --version; git --version; gh --version` |
| ¿Está instalado aunque no responda? | `brew list --versions node git gh` | `winget list --id OpenJS.NodeJS.LTS -e; winget list --id Git.Git -e; winget list --id GitHub.cli -e` |
| Hacer que esta ventana lo vea sin cerrarla | `hash -r` (o abrir ventana nueva) | `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')` — **en la misma línea** que el comando que quieras probar, porque cada comando que lanzas nace con el PATH viejo |

Node tiene que ser **22 o superior**: mira el número, no solo que responda.
- Si la instalación se interrumpió a medias (por lo que sea), **no empieces de cero**: repasa la tabla de
  arriba abajo comprobando cada objetivo y continúa por el primero que no se cumpla.

## Paso 2 — la sesión de GitHub

`gh auth login` es interactivo: escribe un código de un solo uso y **se queda esperando**. Si lo ejecutas
como un comando normal, el alumno no ve el código hasta que el comando termina, y no termina hasta que
él mete el código. Hazlo así:

1. Lánzalo **en segundo plano**: `gh auth login --web -h github.com -p https`
   (`-p https` hace que git use la sesión de `gh`; sin él, puede intentar SSH y fallar al subir).
2. Lee su salida en cuanto aparezca. Trae dos cosas: un **código de 8 caracteres** (`XXXX-XXXX`) y la
   dirección `https://github.com/login/device`. `gh` **no abre el navegador** en este modo: ábrelo tú
   (`open <url>` en Mac, `start <url>` en Windows).
3. Dile el código con claridad y qué va a ver: pegar el código, pulsar *Continue* y *Authorize*.
4. Espera a que el proceso termine y comprueba con `gh auth status`.

**Plan B**, si no puedes lanzar procesos en segundo plano o algo falla: que abra **otra ventana de
terminal**, pegue ahí ese mismo comando, siga lo que le diga y vuelva a decirte "hecho".

**Si ya tenía sesión iniciada** (`gh auth status` en verde antes de empezar): comprueba que es la cuenta a
la que se invitó, leyendo el kit (`gh api repos/rsotor/profesor-kit --jq .name`). Un **404** aquí casi
nunca es "falta la invitación": suele ser **otra cuenta activa**. Enséñale las cuentas que ve
`gh auth status` y, si procede, `gh auth switch --user <la suya>`.

## Paso 3 — nombre y creación del curso

Pregunta **"¿Cómo quieres llamar a este curso?"** y de la respuesta saca dos cosas, que le enseñas para
que las confirme:

- **La carpeta del curso:** el nombre en minúsculas, sin acentos y con guiones (`historia-del-arte`). Si
  ya existe una con ese nombre, es otro curso suyo: pide otro nombre.
- **Dónde se guarda: aquí.** El alumno ya ha elegido la carpeta de sus cursos **antes de abrirte** (la guía
  le explica cómo), y es la carpeta en la que estás. No le preguntes dónde: dile en una frase dónde va a
  quedar (*"Lo guardo en `<ruta>`"*) y **comprueba dos cosas antes de crear nada**:
  - **Que no estás en su carpeta personal** (ni en la raíz del disco). Si lo estás, es que abrió el LLM
    sin entrar en ninguna carpeta: crea `cursos`, entra en ella y sigue desde ahí. Nunca trabajes con
    todo su ordenador como zona de trabajo.
  - **Que la carpeta no se sincroniza con la nube.** Señales: la ruta contiene `OneDrive`, `iCloud`,
    `Mobile Documents`, `Dropbox` o `Google Drive`; en Windows, *Documentos* y *Escritorio* suelen estar
    dentro de OneDrive; en Mac lo están en iCloud si `defaults read com.apple.finder FXICloudDriveDocuments`
    devuelve `1`. Si es el caso, avísale **antes de seguir**: *"ahí el ordenador sube y baja los ficheros
    por su cuenta, y eso puede estropear el historial de tu curso; tu copia de seguridad ya la hace
    GitHub"*. Si prefiere cambiar, que cierre, elija otra carpeta como dice la guía y te vuelva a abrir
    allí. Si aun así la quiere, es su decisión: respétala.
- **El atajo:** una sola palabra corta para abrirlo (`historia`). Es lo único que tendrá que recordar.

Después pregunta: **"¿Quieres una copia de seguridad de tu curso en GitHub? Será privada: solo la
ves tú."** Recomienda que sí.

- **Sí:** `gh repo create <carpeta> --template rsotor/profesor-kit --private --clone`
- **No:** `gh repo clone rsotor/profesor-kit <carpeta>` (el paso 5 elimina el enlace con el kit).

El repo del alumno es **privado siempre**: dentro hay material con derechos de autor y su perfil.

## Paso 4 — identidad de git

Si falta, configúrala **solo en este repo** (sin `--global`), con los datos de su cuenta de GitHub:

    gh api user --jq '.login, .id'
    git config user.name "<login>"
    git config user.email "<id>+<login>@users.noreply.github.com"

## Paso 3 (continuación) — dile dónde queda su copia

Si eligió copia en GitHub, **en cuanto crees el repo** comprueba que es privado
(`gh repo view --json visibility,url`) y díselo con el enlace:

> "Tu curso tiene una copia de seguridad en GitHub: `<url>`. **Es privada: solo la ves tú.** Si algún día
> quisieras cambiarlo, se hace en esa página, en *Settings → General → Danger Zone → Change repository
> visibility*. No te lo recomiendo: dentro hay material del curso, que tiene derechos de autor, y lo que
> tu profesor sabe de cómo aprendes."

## Paso 7 — el atajo

    node .kit/herramientas/crear-atajo.js --nombre <palabra>

Si la herramienta dice que esa palabra no vale (ya es un programa, o ya abre otro curso suyo), propón
otra y repite. Si avisa de que la carpeta no está en el PATH, lo normal es que baste con abrir una
terminal nueva; si no, añádela al PATH explicándoselo en una frase. **Compruébalo de verdad** antes de
seguir: en una terminal nueva, la palabra tiene que abrir el LLM dentro del curso.

## Paso 8 — verificar la instalación, no darla por buena

    node .kit/herramientas/diagnostico.js

Repasa **todo**: Node, Git, `gh`, la sesión de GitHub, el acceso al kit, la identidad de git, que la copia
en GitHub sea privada de verdad, las skills, el atajo y la salud del curso. Cada línea sale con ✓ o ✗, y
cada ✗ trae su arreglo. **La instalación no está terminada hasta que diga "Todo listo"**: arregla lo que
marque y vuelve a ejecutarlo. El aviso de Obsidian (⚠) no bloquea: se resuelve en el paso 9.

Si algo falla y no sabes por qué, el diagnóstico es también lo que se pega en una issue
(`diagnostico.js --json`), sin datos del alumno.

## Paso 9 — Obsidian

Obsidian es el programa donde el alumno **lee** todo lo que preparas. Es gratis y no pide cuenta.
Explícaselo en una frase e instálalo tú, con su permiso, igual que el resto.

**Antes de que la abra**, ejecuta `node .kit/herramientas/obsidian.js`: deja escritos los ajustes recomendados
(ya los puso `preparar-curso.js`; no pisa nada) y descarga los complementos **Terminal**, **Code Files** y
**Claudian** sin activarlos. Si no hay red, lo dice y sigue: se repite más tarde.

No existe forma de abrirle la bóveda desde aquí (Obsidian no tiene ningún enlace ni comando para
registrar una carpeta nueva como bóveda), así que **guíale, con las palabras exactas que va a ver**:

1. Que abra **Obsidian** (en Mac: `Cmd + Espacio`, escribir *Obsidian*; en Windows: tecla Windows, escribir *Obsidian*).
2. En la primera pantalla, a la derecha de **"Abrir una carpeta como bóveda"** (si le sale en inglés:
   *"Open folder as vault"*), que pulse **Abrir** (*Open*).
3. Que busque su carpeta de cursos, entre en la de **este curso**, seleccione la carpeta **`estudio`** y
   pulse **Abrir**. **Importante: `estudio`, no la carpeta del curso entera** — dentro está todo lo suyo y
   nada que pueda romper.
4. Si Obsidian pregunta si confía en el autor de la bóveda, que diga que sí: es la suya.

Si la interfaz le sale en inglés y lo prefiere en español: rueda dentada (abajo a la izquierda) →
*General* → *Language* → *Español*, y reiniciar Obsidian.

Comprueba que ha ido bien: tiene que existir `estudio/.obsidian/workspace.json` (Obsidian la escribe al
abrir la bóveda; los demás ficheros de `.obsidian/` ya los puso el kit antes), y él tiene que ver en la
columna izquierda las carpetas **conceptos**, **inbox**, **sesiones**… Dile que su material de clase lo
deja en **inbox**.

**Que fije su página de inicio.** Tras el primer guardado existe **inicio**, en la columna izquierda: es la
puerta a todo el curso. Que haga clic en ella para abrirla, luego clic derecho en su pestaña (arriba) →
**Fijar** (*Pin*). Así queda abierta siempre que abra Obsidian. No se puede hacer por él: Obsidian guarda sus
pestañas mientras está abierto y pisaría cualquier cambio desde fuera.

**Los ejercicios web ya se ven:** la configuración recomendada activa "Detectar todas las extensiones de
archivo". Si `comprobar.js` avisa `obsidian-oculta-ejercicios`, es que el alumno lo desactivó: pregúntale antes
de volver a activarlo.

### Extras de Obsidian — instalados, sin activar

Los complementos **Terminal** (una terminal dentro de Obsidian, para hablar contigo sin cambiar de ventana;
necesita Python 3.9 o superior), **Code Files** (ver y editar ficheros de código) y **Claudian** (Claude en un
panel lateral) ya están instalados, pero **apagados**: son de terceros, no de Obsidian ni del kit, y activarlos
es decisión suya. Díselo en una frase y que sepa que su hoja *Cómo usar tu profesor* explica cómo activarlos.
No los actives tú.

## Si más adelante mueve el curso a otra carpeta

El atajo guarda la ruta del curso: al moverlo deja de funcionar y se lo dice ("no encuentro la carpeta
del curso"). Se arregla desde el sitio nuevo, con el LLM abierto dentro de la carpeta del curso:

    node .kit/herramientas/crear-atajo.js --nombre <su palabra> --actualizar

`--actualizar` solo vuelve a apuntar un atajo **suyo** cuya carpeta anterior **ya no existe**; nunca le
quita el atajo a otro curso que siga en su sitio.

## Al terminar

Cuando acabe la sesión 0, el profesor le deja una hoja hecha a su medida,
`estudio/como-usar-tu-profesor.md`: cómo abrirlo otro día, qué puede pedirle y qué hacer si algo va
raro. **Díselo antes de despedirte, y dile que es lo primero que verá en Obsidian.** Es lo que va a
necesitar dentro de dos días, cuando ya no se acuerde de nada de esto.

## Si algo falla

1. Explica qué ha pasado, en una frase y sin jerga.
2. Intenta la solución más probable **una vez**.
3. Si sigue fallando, propón abrir una issue en `rsotor/profesor-kit` con: sistema operativo, tu
   nombre y versión de LLM, el paso, qué esperabas y qué pasó. **Enséñasela antes de enviarla y
   espera su sí.** Nunca incluyas rutas con su nombre de usuario ni nada personal.
