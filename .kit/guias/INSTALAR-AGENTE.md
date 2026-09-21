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
| 3 | El curso creado desde la plantilla, en una carpeta con nombre en kebab-case (`curso-<tema>`) | existe `<carpeta>/.kit/VERSION` | ver abajo |
| 4 | Git sabe quién es el alumno | `git config user.name` y `git config user.email` devuelven algo | ver abajo |
| 5 | Curso limpio y ajustes creados | existe `config/ajustes.json`; no existen `docs/` ni `.github/` | `node .kit/herramientas/preparar-curso.js --subir si` (o `no`) |
| 6 | Skills instaladas | Claude Code: existe `.claude/skills/sesion/SKILL.md` | `node .kit/herramientas/instalar-skills.js` |
| 7 | Todo sano y guardado | `node .kit/herramientas/comprobar.js` dice "Curso sano" | `node .kit/herramientas/guardar.js "curso: instalación"` |
| 8 | El alumno sabe leer sus notas | ha abierto la carpeta `estudio/` en Obsidian | ver abajo |
| 9 | Arranca la sesión 0 | — | **cierra y vuelve a abrir el LLM dentro de la carpeta del curso**, y lanza `/configurar`. Avísale antes: al abrirlo le preguntará **si confía en esta carpeta** — tiene que decir que sí, o los permisos del kit no se aplican y le pedirá confirmación a cada paso |

## Paso 3 — crear el curso

Pregunta primero: **"¿Quieres una copia de seguridad de tu curso en GitHub? Será privada: solo la
ves tú."** Recomienda que sí.

- **Sí:** `gh repo create <carpeta> --template rsotor/profesor-kit --private --clone`
- **No:** `gh repo clone rsotor/profesor-kit <carpeta>` (el paso 5 elimina el enlace con el kit).

El repo del alumno es **privado siempre**: dentro hay material con derechos de autor y su perfil.

## Paso 4 — identidad de git

Si falta, configúrala **solo en este repo** (sin `--global`), con los datos de su cuenta de GitHub:

    gh api user --jq '.login, .id'
    git config user.name "<login>"
    git config user.email "<id>+<login>@users.noreply.github.com"

## Paso 8 — Obsidian

Obsidian es el programa gratuito para leer las notas. Que lo descargue de https://obsidian.md, lo
abra, elija "Abrir carpeta como bóveda" y seleccione la carpeta **`estudio`** que hay dentro de su curso
(no la carpeta del curso entera: en `estudio/` está todo lo suyo y nada que pueda romper). No hace falta cuenta.
Dile también que su material de clase lo deja en `estudio/inbox/`.

## Si algo falla

1. Explica qué ha pasado, en una frase y sin jerga.
2. Intenta la solución más probable **una vez**.
3. Si sigue fallando, propón abrir una issue en `rsotor/profesor-kit` con: sistema operativo, tu
   nombre y versión de LLM, el paso, qué esperabas y qué pasó. **Enséñasela antes de enviarla y
   espera su sí.** Nunca incluyas rutas con su nombre de usuario ni nada personal.
