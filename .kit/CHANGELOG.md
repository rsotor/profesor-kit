# Cambios del kit

Escrito para el alumno: qué nota él, no qué cambió por dentro. Es lo que `/actualizar` le resume.

**Versiones.** Mientras el número empiece por `0.` el kit está en pruebas. La `1.0.0` se publica solo
cuando el kit haya demostrado que puede sustituir al curso con el que nació. A partir de ahí:

| Número | Qué significa para ti | Ejemplo |
|---|---|---|
| `x.y.Z` (arreglo) | Algo que fallaba deja de fallar. No notas nada más | un aviso que salía de más |
| `x.Y.0` (mejora) | Algo nuevo que puedes usar. Actualizar no te pide nada | una skill nueva |
| `X.0.0` (mayor) | Cambia la forma de tus datos o hay que **hacer algo** (una migración, una decisión tuya, reinstalar). Tu profesor te lo explica al actualizar y lo hace contigo | carpetas nuevas, campos nuevos en tus notas |

Tu profesor comprueba una vez al día si hay versión nueva y te lo dice al saludar; actualizar es cosa tuya.

## 0.21.0
- **`estudio/formulario.md` y `estudio/ejercicios/_index.md` ahora se escriben solos**, como ya pasa con
  **inicio** y **pendientes**. El formulario reúne la fórmula de cada concepto que la tiene, por bloque, con
  enlace a la nota; el índice de ejercicios reúne qué practica cada uno y qué se descubre fallándolo. Ya no
  hace falta mantenerlos a mano, y no pueden quedarse desactualizados.
- **En el formulario sale cada concepto**: con su fórmula si la tiene y, si no, con su definición en una frase.
  Un curso sin fórmulas (historia, derecho…) ya no tiene la hoja vacía.
- **Si escribes algo a tu manera en tus notas** (un *sí* en vez de marcar la casilla, una nota como *7/10*),
  tu profesor lo ve, te pregunta qué querías decir la primera vez y lo deja bien. Se apunta cómo escribes, así
  que no te vuelve a preguntar lo mismo; y si es una forma natural de escribirlo, avisa al kit para que la
  entienda para todos.
- **El atajo funciona a la primera.** Si tu ordenador no sabía dónde buscar la palabra de tu curso, tu profesor
  lo configura solo; basta con abrir una ventana de terminal nueva.
- **Hace falta Node 24 o superior** (es el que se instala hoy por defecto). Si tienes uno más viejo, tu profesor
  te lo dice al comprobar la instalación y lo actualiza contigo.
- Windows ya está probado (con Codex). Linux no está soportado.
- **Tu profesor se revisa antes de guardar**: avisa si una nota no cabe en una pantalla, si a un concepto le
  falta el ejemplo, si una sesión se quedó sin su auditoría o sus preguntas para pensar, si hay más o menos
  flashcards de las que pediste, o si una pregunta de examen en realidad son dos. Lo arregla antes de guardar; si
  decide dejar alguno, te dice por qué.
- **Modelo recomendado.** La guía dice qué modelo conviene usar con tu asistente (con Claude, Sonnet): hace bien
  el trabajo sin gastarte la cuota. Si no lo estás usando, tu profesor te lo dice una vez al configurar o al
  preparar una clase.
- **Si usas otro asistente** (Codex u otro), tu profesor deja su configuración escrita en tu curso, donde nunca se
  pisa al actualizar, y con tu sí la propone al kit para que al siguiente alumno le cueste menos. Gemini deja de
  estar soportado: no se podía probar.
- **"Deshaz lo último" es más seguro.** Tu profesor te enseña primero qué volvería a como estaba y solo lo hace
  con tu sí. Nunca borra tu historia: añade un guardado que deshace el anterior, así que también se puede
  rehacer. Si tienes algo sin guardar, o lo último fue una actualización del kit, no lo hace y te explica por qué.
- La instalación ya no pide invitación al kit: es público. Tu curso sigue siendo privado.
- **Si ya tenías tu curso:** si usas otro asistente que no es Claude, tu profesor te ofrece pasar lo que montó
  al principio al formato nuevo.
- **Si ya tenías tu curso:** si alguna de esas dos notas tenía algo escrito que tu profesor no habría
  generado, se conserva tal cual, con el nombre **formulario-anterior** o **ejercicios/_index-anterior**; la
  próxima vez que guardes, tu profesor deja ahí la versión generada.

## 0.20.0
- **Actualizar es más seguro.** Si tu profesor no puede guardar tu trabajo antes de actualizar, no actualiza:
  antes, en ese caso raro, una actualización fallida podía borrar lo que aún no estaba guardado.
- **Solo te llegan versiones publicadas.** Tu profesor descarga la última versión publicada del kit, no lo que
  esté a medio hacer, y se puede volver a una versión concreta.
- **Tu `.gitignore` es tuyo.** Al actualizar se añaden las reglas del kit que falten, sin borrar las tuyas
  (esta vez, y solo esta, se sustituye entero: si le habías añadido algo, vuelve a ponerlo).
- **Los complementos de Obsidian van fijados a una versión** y se comprueba que lo descargado es exactamente
  lo esperado; si no coincide, no se instala.
- El atajo rechaza carpetas con caracteres que romperían el lanzador (comillas, `$`, `%`), y lo explica.

## 0.19.0
- **Las preguntas de tus tests y exámenes se leen mejor**: cada una pregunta una sola cosa y te dice qué
  respuesta espera (una cifra, una frase, el porqué en 2-3 líneas). Si tu profesor quiere tu razonamiento, te
  lo pide.
- **Una respuesta corta y correcta cuenta como acierto.** Tu profesor ya no te apunta como fallo algo que la
  pregunta no pedía, como el nombre técnico de una idea que has explicado bien.
- **Tu test inicial queda guardado** en la nota **test-inicial**, enlazada desde **inicio**: las preguntas, lo
  que contestaste y cómo se valoró.
- **Si ya tenías tu curso:** tu profesor te ofrece revisar tu nivel de partida con estas reglas: te hace una
  pregunta nueva por cada fallo que pudo venir de una pregunta mal hecha, y corrige tu perfil.

## 0.18.0
- **En la primera sesión, tu profesor te pregunta por ti**: qué relación tienes con la materia, para qué la
  quieres y cuánto tiempo tienes. Lo usa para que sus ejemplos se parezcan a tu mundo.
- **Te explica cómo dejarle dudas** en tus notas, con un ejemplo, en vez de preguntarte qué símbolo quieres.
- **El recuadro que conecta cada concepto con lo tuyo** (tu trabajo, un proyecto, una afición) ahora te lo
  enseña antes de ofrecértelo: ves cómo queda, qué ganas y qué cuesta, y decides. Tu hoja *Cómo usar tu
  profesor* dice cómo ponerlo o quitarlo cuando quieras.
- **Si ya tenías tu curso:** tu profesor te ofrece las tres preguntas sobre ti (puedes decir que no) y pone al
  día tu hoja *Cómo usar tu profesor*.

## 0.17.0
- **La guía de instalación empieza explicando cómo funciona esto**: qué es cada pieza (tu profesor, la terminal,
  Obsidian, GitHub), cómo es un día normal y por qué es normal que te pida permiso a menudo. Pensado para quien
  nunca ha trabajado así.
- **Tu profesor se presenta** al empezar la primera sesión: quién es, dónde vas a leer, cómo recuerda lo que
  hacéis y que puedes preguntarle cualquier cosa. Si ya tienes tu curso configurado, no notas nada.

## 0.16.0
- **Tu curso tiene una página de inicio.** En Obsidian, la nota **inicio** enseña el temario entero por
  módulos, por dónde vas (👉 *Sigue por aquí*), lo que tienes que repasar y la nota de cada examen. Cada sesión
  acaba con *← anterior · 🏠 Inicio · siguiente →*: puedes estudiar el curso de principio a fin sin buscar en
  carpetas y sin abrir a tu profesor.
- **Tú marcas lo que has estudiado**, con la casilla *estudiada* de cada sesión; tu profesor marca lo que tienes
  demostrado. Puedes pedirle "hazme un test de lo que me falta" para completar huecos.
- **Los exámenes se contestan en la propia nota**, debajo de cada pregunta. Al corregirlos, tu profesor guarda tus
  respuestas y tu nota aparte y deja el examen limpio para que puedas repetirlo y comparar; si quieres uno nuevo,
  pídele otra versión.
- **Obsidian viene preparado.** Tu curso se abre ya configurado (ejercicios visibles, enlaces que se
  actualizan solos) y con tres complementos instalados pero apagados —una terminal, un visor de código y Claude
  en un panel—: tu hoja *Cómo usar tu profesor* explica qué hace cada uno y cómo encenderlo si quieres.
- **Hay que hacer una cosa al actualizar** (por eso esta versión toca tus notas): tu profesor añade la casilla a
  tus sesiones, completa el temario con todos tus módulos, adapta tus exámenes anteriores y te pide que abras
  **inicio** en Obsidian y fijes su pestaña. Tu hoja *Cómo usar tu profesor* se renueva.

## 0.15.0
- La portada de tu curso en GitHub muestra siempre por dónde vas: clases, bloques, conceptos y pendientes se
  actualizan solos cada vez que tu profesor guarda.

## 0.14.0
- Si cambias de asistente (por ejemplo de Claude a otro), tu palabra de siempre pasa a abrir el nuevo y
  tu curso no cambia.
- Cuando tu profesor encuentra un fallo o una mejora del kit, la comunica mejor y sin datos tuyos: una
  herramienta monta la issue, busca si ya existe y te la enseña antes de enviarla. Y se lo pregunta a sí
  mismo al cerrar cada tarea, para que no dependa de que se dé cuenta.

## 0.13.0
- Una nota **auditoria-del-material** reúne, por bloques, todo lo que tu profesor encontró mal o raro en el
  material de las clases. Se actualiza sola, y al final del curso es tu informe para el centro.

## 0.12.0
- Los ejercicios, exámenes y repasos también se colocan en la carpeta de su unidad, aunque su nombre no
  lo diga: tu profesor deduce a qué clase pertenecen por quién los enlaza.

## 0.11.1
- La guía, la portada del curso y la instalación explican cómo se actualiza el kit.

## 0.11.0
- Los ejercicios interactivos ya se ven en Obsidian (antes los ocultaba) y tu profesor te los abre si se lo pides.
- Tras un examen tu profesor puede preguntarte qué te ayudó y qué te estorbó (puedes saltártelo), y cuando
  ve que algo no funciona, revisa cómo explica y lo ajusta contigo.
- La portada de tu curso recuerda los ajustes y extras recomendados de Obsidian.

## 0.10.0
- Tu profesor lleva un diario del curso: al abrir te dice por dónde ibais, y si una vez cerraste la
  ventana a medias, te avisa y lo retoma.
- Guarda cada cosa terminada en el momento, no solo al final.

## 0.9.1
- Tu profesor comprueba una vez al día si hay una versión nueva del kit y te lo dice al saludar.

## 0.9.0
- Tu profesor comprueba que ninguna sección del material se le queda fuera al preparar una clase, y ya no
  avisa de falsos duplicados por palabras comunes.
- Tus notas se organizan en carpetas que copian la estructura de tu curso (módulos, bloques, semanas…),
  para que encuentres cada clase por donde la buscas en la plataforma. Si tu curso no tiene estructura,
  tu profesor te propone una. Lo que ya tenías se coloca solo, sin romper ningún enlace.

## 0.8.0
- Tu hoja *Cómo usar tu profesor* explica ahora cómo estudiar una clase paso a paso, y tu profesor
  te dice al terminar cada clase por dónde empezar.
- Una nota **pendientes** en tu carpeta de estudio recoge, por bloques, todo lo que queda por resolver.
  Se actualiza sola cada vez que tu profesor guarda.

## 0.7.0
- Tu curso tiene portada en GitHub: un README con de qué va, el temario y por dónde vas, que tu
  profesor mantiene al día.

## 0.6.0
- La instalación se comprueba sola al terminar: una lista de ✓ y ✗ te dice si todo está en su sitio, y
  qué hacer con lo que falte. Ya no se reinstala lo que ya tenías.
- Iniciar sesión en GitHub ya no se queda colgado: tu profesor te dice el código y te abre la página.
- Tu profesor te dice dónde está la copia de tu curso en GitHub y comprueba que es privada.
- Instalar un segundo curso es cuestión de dos minutos.
- Tu profesor vigila que las fórmulas y las tablas se vean bien en Obsidian, en cualquier curso.

## 0.5.1
- Tú eliges dónde guardar tus cursos **antes** de instalar nada (basta con arrastrar la carpeta a la
  terminal), y tu profesor trabaja solo dentro de esa carpeta, no en todo tu ordenador. Te avisa si has
  elegido una carpeta que se sincroniza con la nube, porque puede dar problemas.
- Si algún día mueves tu curso a otra carpeta, tu atajo te lo dice y se arregla en un momento.

## 0.5.0
- Tu profesor instala Obsidian por ti y te guía, con las palabras exactas que ves en pantalla, para
  abrir tu carpeta de estudio.
- Opcional: puedes hablar con tu profesor desde dentro de Obsidian, sin abrir otra ventana.

## 0.4.0
- Al configurar un curso puedes elegir: contarle los datos a tu profesor hablando, o rellenar con calma
  una hoja y avisarle cuando termines. Él solo te preguntará por lo que falte.

## 0.3.0
- Cada curso tiene su nombre y su **atajo**: escribes una palabra en la terminal y se abre tu profesor
  en ese curso. Puedes tener varios cursos, cada uno con la suya.
- Al terminar la configuración, tu profesor te deja una hoja a tu medida, *Cómo usar tu profesor*:
  cómo abrirlo otro día, qué puedes pedirle y qué hacer si algo va raro.

## 0.2.0
- Todo tu material vive ahora en una sola carpeta, `estudio/`, que es la que abres en Obsidian. Así no
  ves los ficheros internos del kit ni puedes borrarlos sin querer.
- Si alguna vez borras o mueves algo por error, el profesor lo recupera solo.

## 0.1.0
- Primera versión en pruebas: instalación guiada, sesión de configuración, y las skills para
  procesar clases, resolver dudas, practicar, examinarte, repasar y actualizar el kit.
