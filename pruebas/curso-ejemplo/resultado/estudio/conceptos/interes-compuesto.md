---
tipo: concepto
bloques: ["2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 3
requiere: [capital-y-tipo-de-interes, interes-simple]
alias: [interés compuesto, interés sobre interés]
tags: []
ejercicio: 02-01-01-simple-vs-compuesto
---
# El interés compuesto

> **En una frase:** con interés compuesto, los intereses de cada periodo se suman al capital y a partir de ahí generan intereses ellos también.

## El problema

Con [[interes-simple]], lo ganado cada periodo se calcula siempre sobre el mismo capital de partida. Pero
si esos intereses se quedan invertidos junto al capital, el periodo siguiente también generan algo: es
"interés sobre interés", y hace que el capital crezca cada vez más rápido, no en línea recta.

## El ejemplo

Mismo caso que en [[interes-simple]]: 1.000,00 € al 5% anual, 3 años, pero ahora compuesto. El primer año
genera 50,00 € (igual que el simple), pero el segundo año el 5% anual se calcula sobre 1.050,00 €, no
sobre 1.000,00 €. Al final de los 3 años: 1.157,63 €. Frente a los 1.150,00 € del interés simple, la diferencia
(7,63 €) parece poca cosa a 3 años — pero crece cada vez más rápido cuantos más años pasan.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo de interés en tanto por uno y `n` el número de periodos de
capitalización (si `i` es anual, `n` en años).

## El error típico

Esperar que crezca en línea recta, como el interés simple. El interés compuesto acelera: la diferencia
frente al simple es pequeña al principio y se dispara con los años, precisamente porque cada periodo
genera intereses sobre un capital algo mayor que el anterior — es la parte que más sorprende la primera
vez que se ve.

## Practícalo

→ **[Simple o compuesto: ¿cuánto se dispara la diferencia?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-vs-compuesto.html)**

Cambia el capital y el tipo de interés, y compara la diferencia entre simple y compuesto a 3 años y a 25.
Lo que sorprende: cuánto más grande es esa diferencia a largo plazo de lo que parece a corto.

> [!tip] Visto desde tus ingresos irregulares
> El interés compuesto premia sobre todo el tiempo que el dinero lleva invertido, no la cantidad exacta
> que metas cada vez. Con ingresos irregulares es tentador esperar a tener "más de golpe" en un mes bueno
> antes de invertir algo: pero ese dinero, metido antes aunque sea poco, lleva más tiempo generando
> intereses sobre intereses que el mismo dinero metido más tarde.

## Relacionados

- [[capital-y-tipo-de-interes]] — de ahí salen `C` e `i`
- [[interes-simple]] — la otra forma de calcularlo, sin reinvertir
- [[capitalizacion]] — cuántas veces al año se aplica de verdad ese "cada periodo"
- [[regla-del-72]] — a ojo, cuántos años tarda este capital en doblarse

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
