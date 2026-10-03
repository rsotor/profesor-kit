---
tipo: concepto
bloques: [2.1]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: []
tags: [interes]
---
# Capitalización

> **En una frase:** la capitalización es cada cuánto se suman los intereses al capital dentro del año (mensual, trimestral, anual); cuanto más frecuente, más rápido crece.

## El problema

Un tipo anual no siempre se aplica de golpe una vez al año. Si el banco suma los intereses cada mes, el
dinero empieza a generar intereses antes. Hay que saber qué se está comparando.

## El ejemplo

Con capitalización mensual, cada mes se aplica una doceava parte del tipo anual, pero **sobre el capital
ya crecido** (con los intereses de los meses anteriores). Por eso el resultado a un año es algo mayor que
aplicar el tipo anual una sola vez.

> [!info] Ampliación fuera de los apuntes
> Con 1.000,00 € a un 12 % anual: capitalizando una vez al año, al cabo de 1 año son 1.120,00 €.
> Capitalizando cada mes a un 1 % mensual (12 ÷ 12), son 1.000 × 1,01¹² = 1.126,83 €. Diferencia: 6,83 €
> solo por sumar los intereses antes.

## La fórmula

Mismo mecanismo que el compuesto: `n` cuenta los **periodos de capitalización**, no los años. Si el tipo
se reparte en doce meses, `n` son meses y `i` es el tipo de cada mes.

$$ C_f = C \cdot (1 + i)^n $$

## El error típico

> [!info] Ampliación fuera de los apuntes
> Usar el tipo anual con `n` en meses (o al revés). `i` y `n` tienen que estar en el mismo periodo: o
> tipo anual y años, o tipo mensual y meses.

## Relacionados

- [[interes-compuesto]] — la fórmula que aplica cada periodo
- [[tipo-de-interes]] — el tipo anual que se reparte en periodos

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
