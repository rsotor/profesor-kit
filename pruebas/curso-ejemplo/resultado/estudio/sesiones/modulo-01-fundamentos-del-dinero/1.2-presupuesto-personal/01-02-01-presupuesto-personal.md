---
tipo: sesion
bloque: modulo-01
clases: 1.2
trabajada: 2026-09-25
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01 · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale, separar gastos fijos y variables, medir cuánto ahorras y tener un colchón para los meses flojos.

## Conceptos

- [[presupuesto-personal]] — **nuevo**
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**
- [[liquidez]] — ampliado: el dinero del colchón tiene que ser muy líquido
- [[funciones-del-dinero]] — enlazado desde el presupuesto (la unidad de cuenta), sin cambios

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos, y con ingresos irregulares se usa la media de 6-12 meses.
2. Lo que se repite cada mes no es por eso fijo: fijo es lo que no decides tú.
3. La tasa de ahorro compara; el colchón (5-6 meses para un freelance) es el primer objetivo.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-y-mes-flojo]] (uno, de respuesta abierta: aquí se mueven los ingresos y se invierten el ahorro y la tasa)
- Segundo fichero de la clase: `inbox/clase-02-plantilla-presupuesto.md`, la hoja de cálculo (ver Auditoría). Las notas usan las cifras de las diapositivas.

## Cobertura del material

| Sección del material | Destino |
|---|---|
| Diap. 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diap. 2 · Ingresos irregulares | [[presupuesto-personal]] (ingreso medio y su lente) |
| Diap. 3 · Fijos y variables | [[gastos-fijos-y-variables]] |
| Diap. 4 · Ejemplo trabajado | Ejemplos de [[presupuesto-personal]] y [[gastos-fijos-y-variables]] |
| Diap. 5 · La tasa de ahorro | [[tasa-de-ahorro]] |
| Diap. 6 · El colchón financiero | [[colchon-financiero]] |
| Diap. 7 · Resumen | Repite lo anterior: va a "Lo que hay que llevarse" |
| Hoja "Gastos fijos" | Auditoría: no cuadra con la diap. 4 |
| Hoja "Gastos variables" | Auditoría: cuadra (480,00 €) |
| Hoja "Resumen" | Auditoría: arrastra el error de fijos |

## Auditoría del material

*Control de calidad del material, no contenido del curso.*

- **La hoja de cálculo no cuadra con las diapositivas.** En "Gastos fijos", la celda B4 (Suscripciones) dice 52,00 € y la diapositiva 4 dice 25,00 €. El total B5 lleva la fórmula `=B2+B3+25`: el 25 está escrito a mano y no suma la celda B4, así que enseña 715,00 € aunque la suma real de la columna es 742,00 € (650,00 + 40,00 + 52,00).
- **Cuánto arrastra.** Todo lo que cuelga de ese total sale mal en la hoja "Resumen":

  | Dato | Hoja (mostrado) | Recalculado con 52,00 € | Diferencia |
  |---|---|---|---|
  | Total fijos | 715,00 € | 742,00 € | 27,00 € |
  | Total gastos | 1.195,00 € | 1.222,00 € | 27,00 € |
  | Ahorro | 655,00 € | 628,00 € | 27,00 € |
  | Tasa de ahorro | 35 % mensual | 33,9 % mensual | 1,5 puntos |
  | Colchón de 3 meses | 3.585,00 € | 3.666,00 € | 81,00 € |

- **Reproducido con mi cálculo:** con los 25,00 € de la diapositiva todo cuadra (715,00 · 480,00 · 1.195,00 · 655,00 · 35,4 % mensual · 3.585,00). Lo que no cuadra es la hoja frente a las diapositivas.
- **Cuál es el bueno, sin resolver.** Un comentario en la exportación de la hoja dice que el profesor subió la suscripción a 52,00 € en directo (un gimnasio olvidado) y no tocó la fórmula. Es una nota de quien exportó, no del profesor: no me consta cuál de las dos cifras es la buena (ver Pendiente).
- **Otros detalles menores.** La hoja muestra la tasa de ahorro como "35 % mensual" (sin decimales) y la diapositiva 5 dice 35,4 % mensual: es solo el formato de la celda. Los 1.850,00 € de ingresos coinciden en ambos ficheros.
- **Misma clase, otro fichero:** no hay otra clase anterior con la misma hoja. Es el primer error de cifras del curso; en la 1.1 solo hubo una instrucción escondida en la diapositiva 9.
- Sin instrucciones para el asistente en estos ficheros.

## Para pensarlo despacio

1. Un mes cobras el doble que otro. ¿Qué parte del presupuesto se mueve y cuál no, y qué te dice eso de cuánto puedes gastar en variables?
2. ¿Por qué la tasa de ahorro de un solo mes puede dar una idea equivocada de tu situación si tus ingresos son irregulares?
3. La hoja del profesor se equivocó por un número escrito a mano dentro de una fórmula. ¿Qué habría que cambiar en la hoja para que un cambio en una suscripción se reflejase solo?

## Pendiente

- ⚠️ **FALTA INFO:** cifra correcta de las suscripciones: 25,00 € (diapositiva 4 y fórmula) o 52,00 € (celda B4 de la hoja). Solo la puede confirmar el alumno o el profesor. Mientras tanto las notas usan 25,00 €, que es la cifra de las diapositivas.
- **TODO:** cuando se confirme la cifra, corregir los ejemplos de [[presupuesto-personal]], [[gastos-fijos-y-variables]], [[tasa-de-ahorro]] y [[colchon-financiero]], y el ejercicio de la sesión, si cambia.

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
