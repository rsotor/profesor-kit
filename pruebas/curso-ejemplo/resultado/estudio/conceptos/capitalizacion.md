---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [capitalización, frecuencia de capitalización]
tags: [interes]
---
# Capitalización

> **En una frase:** la capitalización es cada cuánto se suman los intereses al capital (cada año, trimestre o mes): cuanto más frecuente, más rápido crece.

## El problema

Un interés anual no siempre se aplica de golpe una vez al año. Si se aplica cada mes, cada mes se usa una doceava parte del tipo anual, pero sobre el capital que ya ha crecido. Eso da algo más que aplicarlo una sola vez.

## El ejemplo

> [!info] Ampliación fuera de los apuntes
> Ejemplo inventado: la clase no trae cifras para la capitalización mensual.

1.000,00 € durante 1 año, con un tipo de 12 % anual:

- **Una vez al año:** 1.000,00 × 1,12 = **1.120,00 €**.
- **Cada mes** (un 1 % mensual, la doceava parte): 1.000,00 × 1,01¹² ≈ **1.126,83 €**.

Mismo tipo anual, 6,83 € más, solo por sumar los intereses al capital cada mes.

## La fórmula

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

Es la del [[interes-compuesto]] con el tipo troceado: `m` es cuántas veces al año se capitaliza (12 si es mensual) y `t` los años. Esta forma general es ampliación mía; la clase solo cuenta la idea.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que un 1 % mensual es lo mismo que 12 % anual al cabo de un año. Un 1 % mensual capitalizado da un poco más (126,83 € de intereses frente a 120,00 € sobre 1.000,00 €).

## Relacionados

- [[interes-compuesto]] — del que esto es un detalle: el periodo de capitalización
- [[tipo-de-interes]] — hay que decir siempre su periodo

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
