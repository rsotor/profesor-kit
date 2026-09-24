---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [interes-compuesto]
alias: [capitalización, frecuencia de capitalización, capitalización mensual]
tags: []
---
# Capitalización

> **En una frase:** La capitalización es cada cuánto se suman los intereses al capital; cuanto más a menudo, más rápido crece el dinero.

## El problema

Un tipo anual no siempre se aplica de golpe una vez al año. Un banco puede sumar los intereses cada mes o
cada trimestre, y eso cambia el resultado.

## El ejemplo

1.000,00 € a 5 % anual durante un año.

- **Capitalización anual:** se aplica el 0,05 una vez: 1.000,00 × 1,05 = **1.050,00 €**.
- **Capitalización mensual:** cada mes se aplica una doceava parte del tipo anual, sobre el capital ya
  crecido: 1.000,00 × (1 + 0,05 ÷ 12)¹² = **1.051,16 €**.

La mensual gana 1,16 € más, solo por sumar los intereses antes.

> [!info] Ampliación fuera de los apuntes
> La clase describe la capitalización mensual con palabras. La cuenta con cifras (1.051,16 €) es mía,
> aplicando lo descrito.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> Generalización de la fórmula del compuesto, con `m` capitalizaciones al año y `t` años:

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

Con `m = 1` es la de siempre; con `m = 12`, la mensual.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que "5 % anual con capitalización mensual" es 5 % anual a secas. Se llama igual, pero el dinero
> acaba con algo más. Al comparar dos ofertas, pregunta siempre cada cuánto capitalizan.

## Relacionados

- [[interes-compuesto]] — la capitalización es el "cada cuánto" del compuesto
- [[capital-y-tipo-de-interes]] — el tipo anual del que se toma la doceava parte

## Historial

- **02-01-01** · primera vez
