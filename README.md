# profesor-kit

**Tu profesor particular para el curso que estás haciendo, dentro de tu ordenador.**

Dejas los apuntes o el PDF de la clase en una carpeta. Tu profesor los convierte en notas de estudio, ejercicios,
exámenes y flashcards, y los lees en [Obsidian](https://obsidian.md), a tu ritmo. Le preguntas lo que no
entiendes, te pone a prueba, y con cada respuesta aprende **cómo aprendes tú**: qué te cuesta, qué ya dominas,
qué te toca repasar.

Sirve para cualquier curso: un máster, unas oposiciones, un curso online. Todo lo específico sale de una
conversación de 20 minutos al instalarlo.

<!-- TODO vídeo: docs/tutorial.gif (+ docs/tutorial.mp4). Lista de tomas en docs/capturas/LEEME.md -->

> **No sustituye a tus clases.** Trabaja con el material que le das: lo que no está en tus apuntes no se lo
> inventa. Si le falta algo, te lo dice.

---

## Un día normal

1. Tienes clase y dejas el PDF o tus apuntes en la carpeta **inbox**.
2. Abres la terminal y escribes una palabra: tu profesor se abre en tu curso.
3. Le dices *"he dejado los apuntes de hoy"*.
4. Te prepara la clase. La lees en Obsidian cuando quieras.
5. Si algo no lo entiendes, se lo dices. Si quieres practicar, le pides un test.

No hace falta saber comandos: le hablas como en un chat, y si algo no te gusta, *"deshaz lo último"*.

## Qué hace por ti

**Prepara cada clase** — de tus apuntes a material de estudio.
- Una nota por concepto, que cabe en una pantalla: primero el problema, luego un ejemplo, luego el nombre.
- Lo que es del curso, lo que añade él y lo que recuerdas tú de clase, **cada cosa marcada con su origen**.
- Un mapa del curso, un formulario y flashcards, organizados por módulos como tu temario.

**Resuelve tus dudas** — las que le preguntas y las que dejas marcadas en tus notas mientras estudias solo.
Si tropiezas tres veces con lo mismo, te lo vuelve a explicar desde otro ángulo sin que se lo pidas.

**Te pone a prueba** — ejercicios, exámenes corregidos con criterio (tu respuesta con tus palabras vale) y
repasos espaciados. Si tu centro tiene un formato de examen, lo imita.

**Sigue tu progreso** — cada concepto con su estado (🟢 dominado, 🟡 flojo, 🔴 pendiente) y **la respuesta
que lo prueba**. Nada se da por sabido porque sí.

<!-- TODO capturas: tabla de dos columnas (Una clase preparada | Tu progreso), como en docs/capturas/LEEME.md -->

## Empezar

Necesitas:
- Un **Mac o un Windows**.
- Una **suscripción de pago de Claude** (con el plan Pro basta). El plan gratuito no sirve.
- Una cuenta de **GitHub**, gratis.
- Unos **30 minutos**.

Tú haces tres pasos: instalar Claude, abrir la terminal y pegar un texto. El resto lo hace tu profesor,
explicándote cada cosa y pidiéndote permiso.

**👉 [Guía de instalación](.kit/guias/INSTALACION.md)**

¿Ya lo tienes? Cuando haya una versión nueva, tu profesor te avisa al saludarte. Dile *"actualiza el kit"* y
lo hace todo él.

## Tu curso es tuyo

- Tu material, tus notas y lo que tu profesor sabe de ti viven **en tu ordenador**, en una carpeta tuya.
- La copia de seguridad va a **un repositorio privado de tu cuenta de GitHub**, no a este. Solo lo ves tú.
- Lo que sí sale de tu ordenador es la conversación con tu asistente (Claude), como en cualquier chat con él.
- Este repo solo tiene el motor: nunca recibe material de ningún curso ni datos de ningún alumno.

## Con qué funciona

| Asistente | Mac | Windows |
|---|---|---|
| [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) | ✅ Probado | ✅ Probado |
| [Codex CLI](https://github.com/openai/codex) | Sin probar | ⚠️ Con limitaciones |

Otros asistentes de terminal son compatibles pero están sin probar: detalles en
[`.kit/adaptadores/LEEME.md`](.kit/adaptadores/LEEME.md). Linux no está soportado (las herramientas funcionan,
pero no hay guía de instalación).

## Colabora

¿Te has atascado instalando? ¿Tu profesor ha hecho algo raro? ¿Echas algo en falta?
[Abre una issue](../../issues/new/choose): hay una plantilla para cada caso. Normalmente te ayudará tu propio
profesor a escribirla. **Nunca pegues material de tu curso ni datos personales.**

Si quieres cambiar el código, lee [CONTRIBUTING.md](CONTRIBUTING.md). Para fallos de seguridad,
[SECURITY.md](SECURITY.md).

## Cómo está hecho

| Parte | Qué es |
|---|---|
| `AGENTS.md` | Las reglas del profesor: cómo explica, cómo pregunta, qué nunca hace. |
| `.kit/skills/` | Lo que sabe hacer: preparar una clase, dudas, ejercicios, exámenes, repasos, configurar, actualizar. |
| `.kit/herramientas/` | Herramientas en Node, sin dependencias: guardan, comprueban la calidad del material y migran los datos entre versiones. |
| `pruebas/` | Un curso inventado sobre el que un asistente de verdad pasa por todas las skills antes de cada versión. |

Cada cambio pasa por tests en Mac, Windows y Linux con cobertura mínima del 80 %, y cada versión se publica como
release, que es lo que descargan los cursos al actualizar. Mapa completo en
[`docs/arquitectura.md`](docs/arquitectura.md); historial en [`.kit/CHANGELOG.md`](.kit/CHANGELOG.md).

## Licencia

[MIT](LICENSE). Úsalo, cámbialo y compártelo.
