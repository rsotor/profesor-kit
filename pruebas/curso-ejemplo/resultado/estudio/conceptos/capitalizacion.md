---
tipo: concepto
bloques: [2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [capitalización mensual, frecuencia de capitalización]
tags: [interes, ahorro]
---
# Capitalización

> **En una frase:** cada cuánto se suman los intereses al capital; cuanto más frecuente, más rápido crece el dinero.

## El problema

Un tipo anual no siempre se aplica una vez al año: el banco puede sumarlo cada mes o cada trimestre. ¿Da lo mismo?

## El ejemplo

Repaso de [[interes-compuesto]]: los intereses ya ganados también generan intereses.

**1.000,00 €** a un **5 % anual**, un año:

| Capitalización | Qué se aplica | Capital al año |
|---|---|---|
| Anual | 5 % anual, una vez | 1.050,00 € |
| Mensual | una doceava parte del tipo anual, cada mes, sobre el capital ya crecido | 1.051,16 € |

Capitalizar cada mes deja **1,16 €** más al año. Poco, pero es dinero que sale solo de la frecuencia.

> [!info] Ampliación fuera de los apuntes
> La cifra 1.051,16 € no está en la clase: sale de aplicar la fórmula de [[interes-compuesto]] con `i` = 0,05 ÷ 12 y `n` = 12 (1.000,00 × 1,0041667¹² ≈ 1.051,16 €).

## La fórmula

Los apuntes no traen una fórmula propia para esta idea: es la del [[interes-compuesto]] con el tipo y los periodos ajustados a la frecuencia.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que capitalizar más a menudo cambia el tipo anual. El tipo es el mismo; lo que cambia es que cada trozo se calcula sobre un capital ya crecido.

## Relacionados

- [[interes-compuesto]] — la capitalización es su motor
- [[tipo-de-interes]] — el tipo anual del que se toma la doceava parte

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
