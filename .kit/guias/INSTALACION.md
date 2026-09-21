# Instalar tu profesor

Vas a montar un profesor personal para tu curso. Tú haces **tres pasos**; el resto lo hace el
propio profesor, que te irá explicando cada cosa y pidiéndote permiso.

> **Antes de empezar**
>
> - **Hace falta una suscripción de pago de Claude.** El plan gratuito no sirve. Con el plan **Pro**
>   (unos 20 $ al mes) es suficiente.
> - Una cuenta de **GitHub**, que es gratis.
> - El programa **Obsidian**, también gratis, que es donde leerás tus apuntes. No hace falta que lo
>   instales tú: lo hace tu profesor durante la instalación.
> - Unos **30 minutos**.
> - Probado en **Mac**. En **Windows** debería funcionar igual, pero todavía no lo ha probado
>   nadie: si algo falla, tu profesor te ayudará a contarlo para que se arregle.

Elige tu ordenador: [Mac](#mac) · [Windows](#windows)

---

## Mac

### Paso 1 — Tener las dos cuentas y el acceso al kit

1. Crea tu cuenta de Claude en <https://claude.ai> y contrata el plan Pro.
2. Crea tu cuenta de GitHub en <https://github.com>.
3. Envía tu **nombre de usuario de GitHub** a quien te ha dado este kit.
4. Te llegará un correo de GitHub con una invitación. **Ábrelo y acepta.**

**Lo que vas a ver:** tras aceptar, entras en la página del kit en GitHub (es donde estás leyendo
esto).

**Si ves otra cosa:** si no llega el correo, mira en <https://github.com/notifications>. Sin
aceptar la invitación, el paso 3 no funcionará.

### Paso 2 — Instalar Claude en la terminal

Abre la terminal: pulsa `Cmd + Espacio`, escribe **Terminal** y pulsa Intro. Se abre una ventana
con texto. Copia y pega esto, y pulsa Intro:

    curl -fsSL https://claude.ai/install.sh | bash

Cuando termine, **cierra la terminal y vuelve a abrirla.** Después pega esto:

    claude --version

**Lo que vas a ver:** un número de versión, algo como `2.1.0 (Claude Code)`.

**Si ves otra cosa:** si dice `command not found`, es que no has cerrado y vuelto a abrir la
terminal. Ciérrala del todo (`Cmd + Q`) y ábrela otra vez.

### Paso 3 — Arrancar al profesor

En la terminal, escribe esto y pulsa Intro:

    claude

La primera vez, Claude abrirá el navegador para que inicies sesión con tu cuenta. Cuando veas que
Claude te espera en la terminal, copia **todo** el [texto de arranque](#texto-de-arranque), pégalo
y pulsa Intro.

**Lo que vas a ver:** Claude te dice qué va a instalar y te pide permiso. Te preguntará cómo quieres
llamar al curso y **dónde guardarlo**: te propondrá un sitio y puedes cambiarlo. A partir de aquí, síguele
a él: te hará preguntas sencillas y acabará con una sesión de unos 20 minutos para conocer tu
curso y cómo aprendes. En algún momento te pedirá que cierres Claude y lo vuelvas a abrir dentro
de la carpeta de tu curso; al hacerlo te preguntará **si confías en esa carpeta**: di que sí, es
la tuya.

**A partir de mañana** no tendrás que repetir nada de esto: abrirás la terminal, escribirás **una
palabra** que vas a elegir tú durante la instalación, y tu profesor se abrirá en tu curso. Y te dejará
una hoja, *Cómo usar tu profesor*, con todo lo que necesitas recordar.

**Si ves otra cosa:** si Claude dice que no encuentra el kit o ve un error 404, es que la
invitación del paso 1 no está aceptada.

---

## Windows

> Sin probar todavía. Los pasos son los oficiales de cada programa.

### Paso 1 — Tener las dos cuentas y el acceso al kit

1. Crea tu cuenta de Claude en <https://claude.ai> y contrata el plan Pro.
2. Crea tu cuenta de GitHub en <https://github.com>.
3. Envía tu **nombre de usuario de GitHub** a quien te ha dado este kit.
4. Te llegará un correo de GitHub con una invitación. **Ábrelo y acepta.**

**Lo que vas a ver:** tras aceptar, entras en la página del kit en GitHub.

**Si ves otra cosa:** si no llega el correo, mira en <https://github.com/notifications>.

### Paso 2 — Instalar Claude en la terminal

Abre la terminal: pulsa la tecla **Windows**, escribe **PowerShell** y pulsa Intro. Se abre una
ventana azul o negra con texto. Copia y pega esto, y pulsa Intro:

    irm https://claude.ai/install.ps1 | iex

Cuando termine, **cierra PowerShell y vuelve a abrirlo.** Después pega esto:

    claude --version

**Lo que vas a ver:** un número de versión, algo como `2.1.0 (Claude Code)`.

**Si ves otra cosa:** si dice que no reconoce `claude`, es que no has cerrado y vuelto a abrir
PowerShell.

### Paso 3 — Arrancar al profesor

En PowerShell, escribe esto y pulsa Intro:

    claude

La primera vez, Claude abrirá el navegador para que inicies sesión con tu cuenta. Cuando veas que
Claude te espera en la terminal, copia **todo** el [texto de arranque](#texto-de-arranque), pégalo
y pulsa Intro.

**Lo que vas a ver:** Claude te dice qué va a instalar y te pide permiso. Te preguntará cómo quieres
llamar al curso y **dónde guardarlo**: te propondrá un sitio y puedes cambiarlo. A partir de aquí, síguele
a él. En algún momento te pedirá que cierres Claude y lo vuelvas a abrir: es normal. Al abrirlo
en la carpeta de tu curso te preguntará **si confías en esa carpeta**: di que sí, es la tuya.

**A partir de mañana** no tendrás que repetir nada de esto: abrirás PowerShell, escribirás **una
palabra** que vas a elegir tú durante la instalación, y tu profesor se abrirá en tu curso. Y te dejará
una hoja, *Cómo usar tu profesor*, con todo lo que necesitas recordar.

**Si ves otra cosa:** si Claude dice que no encuentra el kit o ve un error 404, es que la
invitación del paso 1 no está aceptada.

---

## Texto de arranque

Copia desde "Vas a instalarme" hasta el final del recuadro:

```text
Vas a instalarme un kit de estudio. Soy una persona sin perfil técnico: explícame cada cosa en una
frase y pídeme permiso antes de instalar nada.

1. Comprueba si tengo Git y GitHub CLI (gh). Instala lo que falte con el gestor de paquetes de mi
   sistema operativo. Si acabas de instalar Git en Windows, dime que cierre y vuelva a abrir esta
   sesión antes de seguir, y que te vuelva a pegar este mismo texto.
2. Ejecuta "gh auth login" para que inicie sesión por el navegador. Nunca me pidas un token ni una
   contraseña, y si te pego uno, no lo uses y avísame.
3. Cuando "gh auth status" esté en verde, lee la guía de instalación del repositorio privado
   rsotor/profesor-kit con este comando y sigue sus pasos uno a uno:
   gh api repos/rsotor/profesor-kit/contents/.kit/guias/INSTALAR-AGENTE.md -H "Accept: application/vnd.github.raw"
4. Si ese comando da un error 404, no tengo acceso todavía: dime que acepte la invitación que me
   llegó por correo, y no sigas.
```

---

## Si usas otro asistente que no sea Claude

El kit está escrito en un formato abierto y debería funcionar con otros asistentes de terminal,
pero **está sin probar**. Instálalo con su guía oficial, ábrelo en una carpeta vacía y pégale el
mismo texto de arranque: el kit le explica qué tiene que adaptar.

## Cómo cambiar tus preferencias

Tus apuntes, ejercicios y exámenes están en la carpeta `estudio/` de tu curso: es la que abres en
Obsidian, y el material de cada clase lo dejas en `estudio/inbox/`. Lo que el profesor sabe de tu
curso y de ti está aparte, en `config/`, y también es tuyo. Para cambiar algo, lo más fácil es **pedírselo**: "quiero las notas más cortas", "prefiero
otro símbolo para dejar dudas", "explícame con más ejemplos". También puedes editar
`config/profesor.md` a mano.

El profesor puede **proponerte** cambios cuando vea que algo no te funciona, pero nunca los aplica
sin tu sí.
