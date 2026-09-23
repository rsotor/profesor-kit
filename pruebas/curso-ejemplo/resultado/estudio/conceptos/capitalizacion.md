---
tipo: concepto
bloques: ["2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia de capitalización, capitalización mensual, capitalización trimestral]
tags: []
ejercicio: 02-01-01-cuanto-cambia-la-frecuencia
---
# La capitalización

> **En una frase:** la capitalización es cuántas veces al año se aplica de verdad el interés compuesto — no siempre es una sola vez.

## El problema

Recuerda [[interes-compuesto]]: cada periodo, los intereses se suman al capital y generan intereses ellos
también. Pero un interés anual no siempre se aplica una vez al año: un banco puede capitalizarlo mensual
o trimestralmente, aplicando cada vez una parte del tipo anual **sobre el capital ya crecido**. Cuanto más
frecuente, antes empieza a generar "interés sobre interés" — así que el resultado a un año es algo mayor
que aplicar el tipo una sola vez.

## El ejemplo

1.000,00 € a un tipo nominal del 12% anual. Capitalizado una vez al año: 1.000 × 1,12 = 1.120,00 €.
Capitalizado mensualmente, cada mes se aplica una doceava parte del tipo, un 1% mensual, sobre el capital
ya crecido: al cabo de 12 meses, 1.000 × 1,01^12 = 1.126,83 €. Son 6,83 € más, solo por repartir el mismo
12% anual en doce aplicaciones en vez de en una.

## La fórmula

$$ C_f = C \cdot \left(1 + \dfrac{i}{m}\right)^{m \cdot n} $$

`i` es el tipo de interés nominal anual en tanto por uno, `m` las veces que se capitaliza al año (1 si es
anual, 4 si es trimestral, 12 si es mensual) y `n` los años.

## El error típico

⚠️ **FALTA INFO:** el material no da un error típico propio para la capitalización más allá de la
comparación con el interés simple, que ya queda cubierta en [[interes-compuesto]].

## Practícalo

→ **[¿Cuánto cambia la frecuencia?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-cuanto-cambia-la-frecuencia.html)**

Cambia el capital, el tipo nominal y los años, y compara pasar de capitalización anual a trimestral, y de
trimestral a mensual. Lo que sorprende: la segunda subida gana siempre menos que la primera, aunque
"cuatro veces más" a "doce veces más" parezca un salto mayor.

## Relacionados

- [[interes-compuesto]] — el mecanismo que se repite más o menos veces al año
- [[regla-del-72]] — cuántos años tarda en doblarse, con la capitalización que toque

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
