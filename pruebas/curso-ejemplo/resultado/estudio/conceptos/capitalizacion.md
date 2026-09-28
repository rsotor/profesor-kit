---
tipo: concepto
bloques: ["Módulo 2 · Ahorro e interés"]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: []
tags: [interes]
---
# Capitalización

> **En una frase:** La capitalización es cada cuánto se suman los intereses al capital (cada año, trimestre o mes); cuanto más a menudo, más rápido crece el dinero.

## El problema

Un interés "anual" no tiene por qué pagarse de golpe una vez al año. Si se reparte en mensualidades, ¿cambia el
resultado?

Antes, dos líneas de [[interes-compuesto]]: los intereses se suman al capital y desde ahí generan más intereses.

## El ejemplo

> [!info] Ampliación fuera de los apuntes
> El material describe la idea pero no trae cifras; este cálculo es mío.

1.000,00 € al 5 % anual, durante un año.

- **Capitalización anual:** 1.000,00 € × 1,05 = **1.050,00 €**.
- **Capitalización mensual:** cada mes se aplica una doceava parte del tipo anual, 0,05 ÷ 12 ≈ 0,004167, pero
  sobre el capital ya crecido: 1.000,00 € × (1 + 0,05 ÷ 12)¹² ≈ **1.051,16 €**.

Son 1,16 € de diferencia por lo mismo de siempre: los intereses de enero ya ganan intereses en febrero.

## La fórmula

Es la misma del compuesto, con `i` = el tipo de **cada periodo** y `n` = el número de periodos:

$$ C_f = C \cdot (1 + i)^n $$

Mensual: `i` = tipo anual ÷ 12 y `n` = 12 por cada año.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Dividir el tipo entre 12 pero contar solo 1 periodo (o al revés). `i` y `n` tienen que ir en el mismo periodo:
> un doceavo y 12 meses, o el tipo entero y 1 año.

## Relacionados

- [[interes-compuesto]] — de donde sale la fórmula
- [[regla-del-72]] — otra forma de intuir cuánto crece un capital

## Historial

- **02-01-01** · primera vez
