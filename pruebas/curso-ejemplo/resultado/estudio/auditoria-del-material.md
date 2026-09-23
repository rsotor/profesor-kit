# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque modulo-01

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Diapositiva 6 vacía:** solo tiene el título y un comentario que dice que no hay más texto ni notas del profesor. Puede ser un fallo de la exportación o una diapositiva realmente vacía.
- **Cifras sin decimales:** la clase escribe "40 €", "12 €" y "97 €". Las notas usan dos decimales (40,00 €, 12,00 €), como pide el curso.
- **La cifra "unos 97 €" es aproximada:** 100 / 1,03 = 97,09. La diferencia es de 9 céntimos, aceptable como redondeo, pero las notas usan 97,09 €.
- **Diapositiva 4, redacción:** dice el periodo dos veces seguidas ("al año" y "anual") para la misma cifra; en las notas se dice una sola vez, como "3 % anual".

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

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

## Bloque modulo-02

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

Control de calidad del material, no contenido del curso. Solo hay un fichero de clase (sin hoja de cálculo); se han reproducido todas las cifras.
- **Cuadran:** 1.000 × 0,05 × 3 = 150,00 €; 1,05³ = 1,157625 → 1.157,63 €; la diferencia con el simple es 7,63 €; la regla del 72 al 6 % anual da 12 años y el cálculo exacto 11,9 años.
- **Diapositiva 1, tasa sin periodo:** la frase de los apuntes sobre "el cinco por ciento" va sin periodo a propósito, para ilustrar el error. Las notas dicen siempre "5 % anual".
- **Diapositiva 4, sin cifras:** dice que la capitalización mensual da "algo más", pero no cuánto. Con 1.000,00 € al 5 % anual son 1.051,16 € frente a 1.050,00 €: 1,16 € más (cálculo del profesor, marcado como ampliación en la nota).
- **Diapositiva 5, error de la aproximación:** solo se da un caso. Contrastada con la fórmula exacta: a 3 % anual, 24 años frente a 23,4; a 8 % anual, 9 frente a 9,0; a 12 % anual, 6 frente a 6,1. Es buena aproximación en ese rango.
- **Cifras sin símbolo de porcentaje con periodo:** la fórmula de la diapositiva 5 habla de "tipo anual, en número", correcto.
