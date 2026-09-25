---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia-de-capitalizacion]
tags: [interes]
---
# Capitalización

> **En una frase:** Cada cuánto se suman los intereses al capital (cada año, trimestre o mes): cuanto más a menudo, más rápido crece.

## El problema

Un tipo anual no siempre se aplica de golpe una vez al año. Si el banco lo aplica cada mes, los intereses de enero ya trabajan en febrero. ¿Cambia el resultado?

## El ejemplo

**1.000,00 €** al **5 % anual**, **1 año**, según cada cuánto se capitaliza:

| Capitalización | Se aplica cada vez | Capital final |
|---|---|---|
| Anual | el tipo anual, una vez | 1.050,00 € |
| Trimestral | una cuarta parte del tipo anual, 4 veces | 1.050,95 € |
| Mensual | una doceava parte del tipo anual, 12 veces | 1.051,16 € |

Más frecuente, un poco más de dinero, siempre sobre el capital ya crecido.

> [!info] Ampliación fuera de los apuntes
> Las cifras de esta tabla son cálculo propio con la fórmula de [[interes-compuesto]] (los apuntes solo dan la idea, sin números): 1.000,00 × (1 + 0,05 ÷ 12)¹² ≈ 1.051,16 €.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> Los apuntes no dan fórmula para este caso, solo la idea: se aplica una parte del tipo anual en cada periodo.

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

`m` es cuántas veces al año se capitaliza (12 si es mensual) y `t` los años.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Esperar una gran diferencia por capitalizar más a menudo. Con un 5 % anual, pasar de anual a mensual solo suma 1,16 € sobre 1.000,00 € en un año. Pesa mucho menos que los años que dejes el dinero trabajando.

## Relacionados

- [[interes-compuesto]] — la capitalización es su motor
- [[tipo-de-interes]] — el tipo anual del que se toma una parte cada periodo

## Historial

- **02-01-01** · primera vez
