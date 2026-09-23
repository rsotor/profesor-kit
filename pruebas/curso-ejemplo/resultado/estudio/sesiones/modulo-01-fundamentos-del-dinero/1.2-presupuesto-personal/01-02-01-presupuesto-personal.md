---
tipo: sesion
bloque: modulo-01
clases: [1.2]
trabajada: 2026-09-23
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: false
---
# 01-02-01-presupuesto-personal · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y sale cada mes, separar gastos fijos y variables, medir qué parte de lo que ganas te queda y cuánto colchón conviene tener, con una hoja de cálculo de apoyo que tiene una cifra que no cuadra.

## Conceptos

- [[presupuesto]] — **nuevo** (incluye el ingreso medio para ingresos irregulares)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; con ingresos irregulares, se usa la media de 6-12 meses.
2. Fijos (no los decides este mes) y variables (los decides tú) se llevan por separado.
3. La tasa de ahorro compara; el colchón financiero (5-6 meses de gastos para un freelance) es el primer objetivo.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]] _(solo gastos fijos y variables; el resto son fórmulas de una operación y definiciones)_

## Cobertura del material

| Sección | Destino |
|---|---|
| Apuntes · Diapositiva 1 · Qué es un presupuesto | [[presupuesto]] |
| Apuntes · Diapositiva 2 · Ingresos irregulares | [[presupuesto]] (sección "Visto desde tus ingresos irregulares") |
| Apuntes · Diapositiva 3 · Gastos fijos y variables | [[gastos-fijos-y-variables]] |
| Apuntes · Diapositiva 4 · Ejemplo trabajado | [[gastos-fijos-y-variables]] (tabla) y [[presupuesto]] (ahorro del mes) |
| Apuntes · Diapositiva 5 · La tasa de ahorro | [[tasa-de-ahorro]] |
| Apuntes · Diapositiva 6 · El colchón financiero | [[colchon-financiero]] |
| Apuntes · Diapositiva 7 · Resumen | Recogido en "Lo que hay que llevarse" |
| Hoja · "Gastos fijos" | Auditoría (abajo) y [[gastos-fijos-y-variables]] (aviso de cifra en revisión) |
| Hoja · "Gastos variables" | Auditoría: cuadra con las diapositivas (480,00 €) |
| Hoja · "Resumen" | Auditoría: arrastra el error de "Gastos fijos" |

## Auditoría del material

Control de calidad del material, no contenido del curso. Revisadas las fórmulas de la hoja, no solo los valores; comparada con las diapositivas.

- **Suscripciones no cuadra entre diapositivas y hoja:** las diapositivas dicen 25,00 €; la hoja muestra 52,00 € en B4 (según la nota de quien exporta, se cambió en directo por olvidar el gimnasio). Diferencia: 27,00 €.
- **La fórmula de "Total fijos" no suma B4:** en la hoja, B5 es `=B2+B3+25`, con el 25 escrito a mano. Por eso el total sigue en 715,00 € aunque B4 ya diga 52,00 €. Sumando las celdas de verdad: 650,00 + 40,00 + 52,00 = **742,00 €**.
- **El error se arrastra a toda la hoja "Resumen":**

| | Hoja / diapositivas | Con Suscripciones a 52,00 € |
|---|---|---|
| Total fijos | 715,00 € | 742,00 € |
| Total gastos | 1.195,00 € | 1.222,00 € |
| Ahorro | 655,00 € | 628,00 € |
| Tasa de ahorro | 35,4 % mensual | 33,9 % mensual |
| Colchón de 3 meses | 3.585,00 € | 3.666,00 € |

- **Gastos variables:** `=SUMA(B2:B4)` da 480,00 €, correcto y coincide con las diapositivas.
- **Tasa de ahorro con distinto redondeo:** la hoja muestra la cifra sin decimales (35, sin periodo) y la diapositiva 35,4 % mensual. Es el mismo resultado (655 ÷ 1.850 = 35,41 % mensual), solo cambia el formato de la celda; la hoja tampoco dice el periodo.
- **Cifras sin decimales en las diapositivas** ("1.195 €" en la diapositiva 6): las notas usan dos decimales, como pide el curso.
- **Qué cifra vale es una decisión pendiente:** las notas usan la de las diapositivas (25,00 €), la más conservadora, y avisan del conflicto. No se ha dado por buena ninguna de las dos.

## Para pensarlo despacio

1. Un mes cobras 2.400,00 € y al siguiente 1.300,00 €. ¿Con qué cifra harías el presupuesto y por qué no con la del mejor mes?
2. Si un mes flojo los ingresos bajan pero el alquiler no, ¿qué tipo de gasto te toca ajustar y por qué?
3. ¿Sería mejor tener una tasa de ahorro alta un mes suelto o una media razonable durante el año? Razónalo desde tu situación.
4. ¿Por qué el colchón tiene que estar en algo líquido, y qué pasaría si lo tuvieras en algo que tarda semanas en venderse?

## Pendiente

- **TODO:** preguntar al alumno cuál es la cifra correcta de Suscripciones: 25,00 € (diapositivas) o 52,00 € (hoja, tras la corrección en directo). Según cuál sea, hay que cambiar los ejemplos de [[gastos-fijos-y-variables]], [[presupuesto]], [[tasa-de-ahorro]] y [[colchon-financiero]] (totales del cuadro de la auditoría).
- **TODO:** confirmar con el alumno si el profesor avisó en clase de la corrección de la hoja y si hay una versión corregida.

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
