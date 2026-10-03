---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: []
tags: [interes]
---
# Capitalización

> **En una frase:** cada cuánto tiempo se suman los intereses al capital (una vez al año, cada mes, cada trimestre); cuanto más a menudo, más rápido crece.

## El problema

Un tipo anual no tiene por qué aplicarse de golpe al final del año. Si el banco suma los intereses cada mes, el dinero empieza a generar intereses antes.

## El ejemplo

Con capitalización mensual, cada mes se aplica una **doceava parte** del tipo anual, pero sobre el capital ya crecido. Así, a un año el resultado es algo mayor que aplicar el tipo anual una sola vez.

> [!info] Ampliación fuera de los apuntes
> La clase no trae cifras. Con 1.000,00 € al 5 % anual nominal, capitalizado cada mes:
>
> | Capitalización | Capital a un año |
> |---|---|
> | Una vez al año | 1.050,00 € |
> | Cada mes | 1.051,16 € |
>
> La diferencia es de 1,16 €.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> La clase lo cuenta con palabras; esta es su forma de fórmula, la de [[interes-compuesto]] con el tipo troceado:

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- `i` es el tipo anual en tanto por uno, `m` las veces que se capitaliza al año (12 si es mensual) y `t` los años.
- `1.000,00 × (1 + 0,05 ÷ 12)¹² = 1.051,16 €`.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Leer "5 % anual, capitalización mensual" como "5 % cada mes". Son 0,05 ÷ 12 cada mes. Aplicar el 5 % mensual daría 1.000,00 × 1,05¹² = 1.795,86 €: otro mundo.

## Relacionados

- [[interes-compuesto]] — del que esto es la versión "con más de un periodo al año"
- [[tipo-de-interes]] — por qué hay que decir siempre su periodo

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
