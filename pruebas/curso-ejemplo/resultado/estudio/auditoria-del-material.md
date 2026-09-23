# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque 1

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

Fuente única para esta clase (apuntes exportados de PDF a markdown): no hay otros ficheros con los que
compararla.
Comprobado con cálculo propio: 100,00 € con una inflación del 3% anual dan 100 / 1,03 ≈ 97,09 €, coincide
con la aproximación del material ("unos 97,00 €"). Sin discrepancia.
⚠️ **FALTA INFO:** la diapositiva 6 ("El patrón oro") llega vacía en la exportación —solo el título, sin
texto ni notas del profesor—. Puede ser un fallo de exportación PDF→texto, o que la diapositiva original
solo tuviera una imagen o un gráfico sin texto seleccionable. No se puede saber cuál de las dos sin ver el
PDF o las diapositivas originales.

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

Comprobado con cálculo propio el ejemplo de la diapositiva 4: 650,00 + 40,00 + 25,00 = 715,00 € de fijos;
715,00 + 480,00 = 1.195,00 € de gastos totales; 1.850,00 − 1.195,00 = 655,00 € de ahorro; 655 ÷ 1.850 ×
100 ≈ 35,4% mensual. Todo cuadra: sin discrepancia dentro de los apuntes.
**Comparado con la plantilla de la hoja de cálculo, sí hay una discrepancia**, y parece un error real de
la plantilla, no un matiz de estilo:
- La hoja "Gastos fijos" muestra Suscripciones en **52,00 €** (según la nota de quien la exportó, el
  profesor lo subió en directo desde 25,00 € "se le había olvidado una, la del gimnasio"), pero la celda
  del total (`=B2+B3+25`) sigue sumando el **25 antiguo escrito a mano**, no la celda de Suscripciones. El
  total que enseña la hoja sigue en 715,00 €.
- El total real de gastos fijos, con la cifra nueva, es 650,00 + 40,00 + 52,00 = **742,00 €**: 27,00 € más
  de lo que muestra la celda.
- Eso arrastra el resto de la hoja "Resumen": el total de gastos real sería 742,00 + 480,00 = 1.222,00 €
  (no 1.195,00 €), el ahorro real 1.850,00 − 1.222,00 = 628,00 € (no 655,00 €), y la tasa de ahorro real
  628 ÷ 1.850 × 100 ≈ 33,9% mensual (no ≈35,4% mensual).
- Los apuntes de la diapositiva 4 nunca se actualizaron con el cambio en directo: siguen con
  Suscripciones a 25,00 €, coherentes entre sí pero ya no coherentes con la plantilla.
Las notas de concepto usan las cifras de los **apuntes** (25,00 € de suscripciones, 715,00 € de fijos),
que son internamente consistentes: es el material "oficial" de la clase. La plantilla queda señalada aquí
como lo que es, un fallo de la hoja de cálculo de apoyo, no como una fuente alternativa de las cifras del
ejemplo.

## Bloque 2

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

Fuente única para esta clase (apuntes exportados a texto): no hay otros ficheros con los que compararla.
Comprobado con cálculo propio el ejemplo de la diapositiva 2: 1.000 × 0,05 × 3 = 150,00 € de intereses,
1.150,00 € de capital final. Coincide con el material.
Comprobado con cálculo propio el ejemplo de la diapositiva 3: 1.000 × 1,05³ = 1.157,63 €, 7,63 € más que
el interés simple. Coincide con el material, incluida la diferencia exacta.
Comprobado con cálculo propio el ejemplo de la diapositiva 5 (regla del 72): 72 ÷ 6 = 12 años
aproximados; el cálculo exacto (ln 2 ÷ ln 1,06 ≈ 11,9 años) coincide con lo que dice el material. También
se ha comprobado, con un barrido de tipos de interés anuales entre el 1% anual y el 30% anual, que la
aproximación se queda corta (da menos años de los reales) por encima de aproximadamente un 8% anual, y se
pasa (da más años de los reales) por debajo: el material no lo dice explícitamente, pero es consistente
con que marque la aproximación como tal y no como el resultado exacto.
Sin discrepancias dentro de los apuntes.
