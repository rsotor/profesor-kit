# Prueba 2 (tarea 16): un curso que no es de finanzas

Fecha: 2026-09-21 · Resultado: **superada** · Ejecutada por Claude, simulando a la alumna.

## Cómo se hizo

Curso "Historia del Arte: del Románico al Barroco" (4 bloques, sin números, sin examen oficial)
instalado en `pruebas-local/curso-historia-arte/` con las herramientas reales (`preparar-curso`,
`instalar-skills`). Cada paso se lanzó en una **sesión nueva de Claude Code** (`claude -p`, modelo
Sonnet) dentro de esa carpeta, que solo conoce el kit. La alumna simulada: nivel bajo, autoevaluación
optimista, prefiere analogías, tablas y paso a paso.

**Limitación conocida:** la carpeta está dentro del repo del kit, así que la sesión también lee el
`CLAUDE.md` del kit (mismo contenido) y el `CLAUDE.md` global del usuario de la máquina. No se coló
nada de eso en lo generado, pero la prueba limpia de verdad es la 15, fuera del repo.

## Resultado por skill

| Skill | Qué se comprobó | Resultado |
|---|---|---|
| `/configurar` A | Detecta "sin-configurar" y arranca sola; una pregunta cada vez; saca el nombre de las notas del título real de la clase; convierte las reglas de la alumna en reglas del dominio | ✅ `bloque-01-clase-03-la-escultura-romanica.md`. Lo que no sabía (día de fin, temario detallado) quedó como `TODO`, no inventado |
| `/configurar` B | Dos versiones del mismo concepto que difieren en una cosa, 5 rondas, sin preguntas abstractas | ✅ Las muestras van marcadas como conocimiento general y no se guardan. Una analogía dice dónde cojea |
| `/configurar` C | Autoevaluación + test que baja a prerrequisitos | ✅ Detectó que el 2 en Románico era optimista; bajó a "qué vino antes" y "qué es un arco". **Cada entrada de `alumno.md` cita su prueba** |
| `/sesion` | Apuntes de alumna con un dato sin apuntar y un término sin explicar | ✅ 6 conceptos, 6 flashcards, 1 ejercicio. La fecha no apuntada → `FALTA INFO`; autores y fechas de las obras → `TODO` (regla del dominio: no inventar). Usó el fallo del test de nivel: `arco-de-medio-punto` en dificultad 3 con truco |
| `/ejercicio` (vía sesión) | Formato acorde a un temario sin números | ✅ Caso en markdown con "qué cambiaría el veredicto"; 0 ejercicios HTML. Cuatro conceptos sin ejercicio, con la razón anotada |
| `/dudas` | Una duda y una corrección | ✅ Las distinguió. Corrección aceptada "porque estuviste en clase", sin inventar lo que no sabía. 0 marcadores pendientes tras responder. `alumno.md` con prueba y un honesto "aún por confirmar si desbloquea" |
| `/examen` | Test de 5 preguntas, respondido con un error repetido a propósito | ✅ Ponderado por los errores de la alumna (preguntas 1 y 2). Contó el fallo del test de nivel como primero → `🔴 falló dos veces` y "Errores repetidos" con las dos pruebas. `progreso.md` solo cambió tras el examen |

Comprobaciones automáticas: `comprobar.js` en verde en todo momento (0 errores) · ninguna palabra de
finanzas ni del dueño del kit en lo generado · marcas de origen presentes (4 ampliaciones, 1 aportación
de la alumna, 8 `TODO`, 2 `FALTA INFO`) · 4 guardados locales con los mensajes previstos.

## Hallazgos y qué se cambió

| Hallazgo | Arreglo |
|---|---|
| Al abrir Claude por primera vez en la carpeta sale el diálogo "¿confías en esta carpeta?"; hasta aceptarlo, los permisos del kit se ignoran | Avisado en `INSTALACION.md` e `INSTALAR-AGENTE.md` |
| `tipo_ejercicio` se quedaba en "sin-configurar": `/configurar` nunca lo pregunta | Valor por defecto `segun-concepto` (decide la tabla de `/ejercicio`) |
| `/configurar` reescribe `orden_explicacion` con pasos propios (`analogia`, `tabla`) y puede quitar `problema`, que sí es una sección de la plantilla de concepto | **Pendiente de decidir:** ¿el orden es libre o se elige entre pasos fijos? Hoy funciona, pero la nota ya no abre con "El problema" |

## Lo que salió menos redondo

- La nota de concepto es buena pero larga para "una pantalla": ejemplo + analogía + nombre + tabla + error.
  Con una alumna que pide "paso a paso", el profesor tiende a sumar en vez de elegir.
- Los ejemplos caseros (cartón y libros) no llevan marca de origen. Es coherente con el kit —el ejemplo
  ilustra, no es contenido del curso—, pero conviene que Roberto lo vea en la prueba 1 y decida.
