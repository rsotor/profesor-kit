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
| 2 | Sesión de GitHub iniciada | `gh auth status` en verde | `gh auth login` por navegador. **Nunca un token.** |
| 3 | El curso tiene nombre, y está creado desde la plantilla dentro de la carpeta de cursos del alumno | existe `<carpeta>/.kit/VERSION` | ver abajo |
| 4 | Git sabe quién es el alumno | `git config user.name` y `git config user.email` devuelven algo | ver abajo |
| 5 | Curso limpio y ajustes creados | existe `config/ajustes.json`; no existen `docs/` ni `.github/` | `node .kit/herramientas/preparar-curso.js --subir si --nombre "<nombre del curso>"` (o `--subir no`) |
| 6 | Skills instaladas | Claude Code: existe `.claude/skills/sesion/SKILL.md` | `node .kit/herramientas/instalar-skills.js` |
| 7 | **El atajo funciona:** escribir una palabra en la terminal abre este curso | `config/ajustes.json` tiene `atajo`; en una terminal nueva, esa palabra abre el LLM en el curso | `node .kit/herramientas/crear-atajo.js --nombre <palabra>` — ver abajo |
| 8 | Todo sano y guardado | `node .kit/herramientas/comprobar.js` dice "Curso sano" | `node .kit/herramientas/guardar.js "curso: instalación"` |
| 9 | Obsidian instalado y con la carpeta `estudio/` abierta como bóveda | existe `estudio/.obsidian/` (Obsidian la crea al abrir la carpeta) y el alumno ve sus carpetas en la columna izquierda | Mac: `brew install --cask obsidian` · Windows: `winget install -e --id Obsidian.Obsidian` — ver abajo |
| 10 | Arranca la sesión 0 | — | dile que **cierre esta ventana, abra una terminal nueva y escriba su atajo**. Avísale antes: al abrirse le preguntará **si confía en esta carpeta** — tiene que decir que sí, o los permisos del kit no se aplican y le pedirá confirmación a cada paso. Ya dentro, que escriba "empezamos" (o lanza tú `/configurar`) |

## Paso 3 — nombre y creación del curso

Pregunta **"¿Cómo quieres llamar a este curso?"** y de la respuesta saca dos cosas, que le enseñas para
que las confirme:

- **La carpeta del curso:** el nombre en minúsculas, sin acentos y con guiones (`historia-del-arte`). Si
  ya existe una con ese nombre, es otro curso suyo: pide otro nombre.
- **Dónde se guarda.** Estás trabajando dentro de una carpeta que el alumno creó solo para sus cursos
  (normalmente `cursos`, en su carpeta personal): **no estás en su carpeta personal ni debes trabajar
  ahí**. Por defecto el curso se crea **aquí**. Confírmalo: *"Voy a guardar tu curso en esta carpeta,
  `<ruta>`. ¿Te va bien, o prefieres otro sitio?"*. Si no le importa, no insistas: con el atajo nunca va
  a necesitar saber dónde está.
  - **Si prefiere otro sitio**, créalo allí. Vas a necesitar permiso para trabajar fuera de esta carpeta:
    explícaselo en una frase antes de pedirlo. Si ya tiene otros cursos instalados, lo natural es la
    carpeta donde están (lo dice el lanzador de cualquier atajo suyo).
  - **Si se abrió el LLM directamente en la carpeta personal** (no siguió la guía): crea tú la carpeta
    `cursos`, entra en ella y sigue desde ahí.
  - **Si elige una carpeta sincronizada con la nube, avísale antes de seguir.** Señales: la ruta contiene
    `OneDrive`, `iCloud`, `Mobile Documents`, `Dropbox` o `Google Drive`; en Windows, *Documentos* y
    *Escritorio* suelen estar dentro de OneDrive; en Mac, *Documentos* y *Escritorio* están en iCloud si
    `defaults read com.apple.finder FXICloudDriveDocuments` devuelve `1`. El motivo, en una frase: *"ahí
    el ordenador sube y baja los ficheros por su cuenta, y eso puede estropear el historial de tu curso;
    tu copia de seguridad ya la hace GitHub"*. Si aun así la quiere, es su decisión: respétala.
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

## Paso 7 — el atajo

    node .kit/herramientas/crear-atajo.js --nombre <palabra>

Si la herramienta dice que esa palabra no vale (ya es un programa, o ya abre otro curso suyo), propón
otra y repite. Si avisa de que la carpeta no está en el PATH, lo normal es que baste con abrir una
terminal nueva; si no, añádela al PATH explicándoselo en una frase. **Compruébalo de verdad** antes de
seguir: en una terminal nueva, la palabra tiene que abrir el LLM dentro del curso.

## Paso 9 — Obsidian

Obsidian es el programa donde el alumno **lee** todo lo que preparas. Es gratis y no pide cuenta.
Explícaselo en una frase e instálalo tú, con su permiso, igual que el resto.

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

Comprueba que ha ido bien: tiene que existir `estudio/.obsidian/`, y él tiene que ver en la columna
izquierda las carpetas **conceptos**, **inbox**, **sesiones**… Dile que su material de clase lo deja en
**inbox**.

### Opcional — hablar contigo desde dentro de Obsidian

**Ofrécelo al final, cuando todo lo demás funcione, y solo si le apetece:** *"¿Quieres poder hablar
conmigo desde dentro de Obsidian, sin abrir otra ventana?"*. Es un extra: el camino normal (terminal +
su palabra) funciona siempre.

Se hace con el complemento **Terminal**, de polyipseity (<https://github.com/polyipseity/obsidian-terminal>).
Es de la comunidad, no de Obsidian ni de este kit: díselo. Requisitos según su guía oficial: **Python 3.9
o superior**, y en Windows además los paquetes de Python que indica esa guía. Sigue **su** guía de
instalación, no una memorizada. Lo que él verá en Obsidian: *Ajustes → Complementos de la comunidad →
"Salir del modo restringido"*, buscar **Terminal**, *Instalar* y *Activar*.

Comprobación: dentro de Obsidian abre un terminal, escribe su atajo, y te abres tú en su curso. Si algo
no va, **no insistas**: déjalo con el camino normal y, si quiere, propón una issue.

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
