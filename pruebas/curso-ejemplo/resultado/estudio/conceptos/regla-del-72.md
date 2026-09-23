---
tipo: concepto
bloques: ["2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [interes-compuesto]
alias: [regla del 72]
tags: []
ejercicio: 02-01-01-la-regla-del-72-a-prueba
---
# La regla del 72

> **En una frase:** una forma rápida, a ojo, de saber cuántos años tarda un capital en doblarse a interés compuesto, sin sacar la calculadora.

## El problema

La fórmula de [[interes-compuesto]] ($C_f = C \cdot (1+i)^n$) da el resultado exacto, pero hay que
despejar `n` con logaritmos para saber cuántos años tarda en doblarse un capital. Para una cifra rápida,
sin calculadora, basta con una división.

## El ejemplo

Al 6% anual: 72 ÷ 6 = 12 años, aproximadamente. El cálculo exacto con la fórmula de interés compuesto da
11,9 años: la regla del 72 es una aproximación, no el resultado exacto.

## La fórmula

$$ n \approx \dfrac{72}{i} $$

`i` es el tipo de interés anual, en número y sin el símbolo (6% anual → 6, no 0,06). `n` sale en años.

## El error típico

Tomar el resultado como si fuera exacto. La regla del 72 es una aproximación: es más precisa cerca del 8% anual,
y se desvía más cuanto más lejos de ese punto, tanto hacia tipos muy bajos como muy altos.

## Practícalo

→ **[La regla del 72 a prueba](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-la-regla-del-72-a-prueba.html)**

Con un tipo de interés al azar, predice si el resultado exacto tardará más, menos, o casi lo mismo que la
aproximación, antes de verlo. Lo que sorprende: no siempre se desvía en el mismo sentido.

## Relacionados

- [[interes-compuesto]] — la fórmula exacta que esta regla aproxima
- [[capitalizacion]] — con capitalización más frecuente, doblar el capital tarda algo menos

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
