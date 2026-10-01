---
tipo: concepto
bloques: ["2.1"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia de capitalización]
tags: [interes]
---
# Capitalización

> **En una frase:** cada cuánto tiempo se suman los intereses al capital (cada año, trimestre o mes); cuanto más a menudo, más rápido crece.

## El problema

Un tipo anual no siempre se aplica de golpe una vez al año. Si el banco suma los intereses cada mes, el dinero empieza a generar intereses antes. Sin saberlo, dos productos con el mismo tipo anual pueden dar resultados distintos.

## El ejemplo

**1.000,00 €** a un tipo anual del **5 % anual**, durante **1 año**:

| Capitalización | Qué se aplica | Capital final |
|---|---|---|
| Una vez al año | 5 % anual | 1.050,00 € |
| Mensual | una doceava parte (0,05 ÷ 12) cada mes, sobre el capital ya crecido | 1.051,16 € |

La diferencia son **1,16 €**: poco, pero sale solo de la frecuencia.

> [!info] Ampliación fuera de los apuntes
> Las cifras de este ejemplo las he calculado yo (la clase solo dice que el resultado "es algo mayor"). Con capitalización trimestral sale 1.050,95 €: más frecuente, más rápido.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> La clase no da la fórmula de la capitalización. Es la del interés compuesto con el tipo dividido entre `m` periodos al año:

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

`m` es cuántas veces al año se capitaliza (12 si es mensual) y `t` los años.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Creer que un 5 % anual capitalizado cada mes equivale a un 5 % anual aplicado una vez al año. Parecen lo mismo y no lo son: el mensual da un poco más.

## Relacionados

- [[interes-compuesto]] — la capitalización es lo que decide cuántas veces se aplica

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
