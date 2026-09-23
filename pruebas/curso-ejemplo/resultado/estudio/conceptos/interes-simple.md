---
tipo: concepto
bloques: ["2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [capital-y-tipo-de-interes]
alias: [interés simple]
tags: []
ejercicio: 02-01-01-simple-vs-compuesto
---
# El interés simple

> **En una frase:** con interés simple, los intereses de cada periodo se calculan siempre sobre el capital inicial, y no se reinvierten.

## El problema

Prestas o inviertes un capital durante varios periodos (años, meses...) a un tipo de interés fijo. La
forma más sencilla de calcular lo que genera es aplicar el tipo siempre sobre la misma cifra de partida,
periodo tras periodo, sin tocar lo ya ganado.

## El ejemplo

1.000,00 € a un interés simple del 5% anual, durante 3 años: cada año generan el 5% anual de esos mismos
1.000,00 €, es decir 50,00 €. En 3 años, 150,00 € de intereses. Capital final: 1.150,00 €.

## La fórmula

$$ I = C \cdot i \cdot t $$

`C` es el capital inicial, `i` el tipo de interés en tanto por uno (5% anual = 0,05) y `t` el tiempo en el
mismo periodo que `i` (si `i` es anual, `t` en años). El capital final es $C_f = C + I$.

## El error típico

⚠️ **FALTA INFO:** el material no da un error típico propio para el interés simple más allá de la regla
general del periodo, que ya queda cubierta en [[capital-y-tipo-de-interes]].

## Practícalo

→ **[Simple o compuesto: ¿cuánto se dispara la diferencia?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-vs-compuesto.html)**

Cambia el capital y el tipo de interés, y compara la diferencia entre simple y compuesto a 3 años y a 25.
Lo que sorprende: cuánto más grande es esa diferencia a largo plazo de lo que parece a corto.

## Relacionados

- [[capital-y-tipo-de-interes]] — de ahí salen `C` e `i`
- [[interes-compuesto]] — la otra forma de calcularlo, reinvirtiendo los intereses

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
