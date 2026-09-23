# Clase 2.1 · Interés simple y compuesto

> Apuntes de la clase (diapositivas exportadas a texto).

### Diapositiva 1 · El capital y el tipo de interés

El **capital** es la cantidad de dinero de la que se parte (lo que se presta, se deposita o se invierte).
El **tipo de interés** es el precio de ese dinero: cuánto se paga (o se cobra) por tenerlo prestado
durante un tiempo, expresado en tanto por ciento **y su periodo**. "El 5%" no dice nada por sí solo: no
es lo mismo un 5% anual que un 5% mensual — decirlo siempre es la regla de este curso.

### Diapositiva 2 · Interés simple

Con interés simple, los intereses se calculan **siempre sobre el capital inicial**, periodo a periodo, y
no se reinvierten:

    I = C · i · t

Donde `C` es el capital inicial, `i` el tipo de interés en tanto por uno (5% anual = 0,05) y `t` el
tiempo en el mismo periodo que `i` (si `i` es anual, `t` en años). El capital final es `Cf = C + I`.

**Ejemplo:** 1.000,00 € a un interés simple del 5% anual, durante 3 años.

    I = 1.000 × 0,05 × 3 = 150,00 €
    Cf = 1.000,00 + 150,00 = 1.150,00 €

### Diapositiva 3 · Interés compuesto

Con interés compuesto, los intereses de cada periodo se suman al capital y **a partir de ahí generan
intereses ellos también** ("interés sobre interés"):

    Cf = C · (1 + i)^n

Donde `n` es el número de periodos de capitalización (si `i` es anual, `n` en años).

**Mismo ejemplo, ahora compuesto:** 1.000,00 € al 5% anual, 3 años.

    Cf = 1.000 × (1 + 0,05)^3 = 1.000 × 1,157625 = 1.157,63 €

Frente a los 1.150,00 € del interés simple: la diferencia (7,63 €) no parece mucho a 3 años, pero crece
cada vez más rápido cuantos más periodos pasan — es la parte que sorprende la primera vez que se ve.

### Diapositiva 4 · La capitalización: cuántas veces al año

Un interés anual no siempre se aplica una vez al año: puede capitalizarse mensual o trimestralmente. Con
capitalización mensual, cada mes se aplica una doceava parte del tipo anual, pero **al capital ya
crecido**, así que el resultado a un año es algo mayor que aplicar el tipo anual una sola vez. Cuanto más
frecuente la capitalización, más rápido crece.

### Diapositiva 5 · La regla del 72 (aproximación)

Para saber, a ojo, cuántos años tarda un capital en doblarse a interés compuesto, sin sacar la
calculadora:

    años para doblar ≈ 72 ÷ (tipo de interés anual, en número, sin el %)

**Ejemplo:** al 6% anual, 72 ÷ 6 = 12 años, aproximadamente (el cálculo exacto con la fórmula de arriba
da 11,9 años: la regla del 72 es una aproximación, no el resultado exacto).

### Diapositiva 6 · Resumen

El interés simple crece en línea recta (siempre sobre el mismo capital inicial); el compuesto crece cada
vez más rápido, porque reinvierte sus propios intereses. La regla del 72 da una cifra rápida de cuánto
tarda en doblarse un capital, sin tener que calcular la fórmula exacta.
