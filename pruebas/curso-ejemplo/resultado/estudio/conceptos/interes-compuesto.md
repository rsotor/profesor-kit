---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [capital-y-tipo-de-interes, interes-simple]
alias: [interés compuesto, interés sobre interés]
tags: [dinero, interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto, los intereses de cada periodo se suman al capital y desde ahí generan intereses ellos también, así que el dinero crece cada vez más rápido.

## El problema

Con el [[interes-simple]] cobras siempre lo mismo, aunque ya tengas intereses acumulados. Pero esos intereses también son dinero: ¿por qué no iban a ganar ellos intereses?

## El ejemplo

Los mismos **1.000,00 €** al **5 % anual**, 3 años, pero ahora los intereses se reinvierten.

1.000,00 € × 1,05 × 1,05 × 1,05 = 1.000,00 € × 1,157625 = **1.157,63 €**.

| | Simple | Compuesto |
|---|---|---|
| Capital final a 3 años | 1.150,00 € | 1.157,63 € |
| Diferencia | | 7,63 € |

## La fórmula

$$ C_f = C \cdot (1+i)^n $$

$C$ es el capital inicial, $i$ el tipo en tanto por uno y $n$ el número de periodos de capitalización (si $i$ es anual, $n$ en años).

## El error típico

Pensar que 7,63 € a 3 años es una diferencia pequeña y que, por tanto, da igual. La diferencia crece cada vez más rápido con el tiempo.

> [!info] Ampliación fuera de los apuntes
> Con los mismos 1.000,00 € al 5 % anual a **20 años**: simple = 2.000,00 €, compuesto = 2.653,30 €. La diferencia ya son **653,30 €**.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve los años y los dos tipos. Lo que debería sorprender: un compuesto con tipo menor acaba ganando a un simple con tipo mayor si esperas lo bastante.

> [!info] Ampliación fuera de los apuntes · Visto desde tus ingresos irregulares
> Si en un mes bueno apartas un sobrante y lo dejas quieto, el tiempo es lo que más trabaja a tu favor: cuanto antes lo apartes, más periodos tiene para capitalizar. Y sacarlo pronto corta ese crecimiento.

## Relacionados

- [[interes-simple]] — la comparación de la que parte.
- [[capitalizacion]] — cada cuánto se suman los intereses al capital.
- [[regla-del-72]] — cuánto tarda en doblarse un capital así.

## Historial

- **02-01-01** · primera vez
