---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia de capitalización]
tags: [interes]
---
# Capitalización

> **En una frase:** La capitalización es cada cuánto se suman los intereses al capital (al año, al trimestre, al mes); cuanto más a menudo, más rápido crece.

## El problema

Un tipo anual no obliga a pagar los intereses una sola vez al año. Si se aplican por meses, hay que saber qué cambia.

> Recuerda (de [[interes-compuesto]], que te costó): los intereses se suman al capital y desde entonces generan intereses.

## El ejemplo

**1.000,00 €** al **5 % anual**, durante **1 año**:

| Capitalización | Cómo se aplica | Capital final |
|---|---|---|
| Una vez al año | 5 % anual de golpe | 1.050,00 € |
| Cada mes | 5 % anual ÷ 12 = 0,4167 % mensual, doce veces | 1.051,16 € |

Con la capitalización mensual, cada mes se cobra sobre un capital ya crecido, y por eso salen **1,16 €** más.

> [!info] Ampliación fuera de los apuntes
> La clase dice que el resultado es "algo mayor", sin cifras. Las de la tabla son cálculo propio: 1.000 × (1 + 0,05 ÷ 12)¹² = 1.051,16.

## La fórmula

> [!info] Ampliación fuera de los apuntes
> La clase no da fórmula para este caso; esta es la generalización directa de la del compuesto.

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

$i$ es el tipo anual en tanto por uno, $m$ las veces que se capitaliza al año (12 = mensual) y $t$ los años.

## El error típico

Creer que más capitalización cambia mucho. Con el 5 % anual la diferencia a un año es de 1,16 €: la frecuencia ayuda, pero lo que más pesa es el tipo y el tiempo.

> [!info] Ampliación fuera de los apuntes
> Este error típico es propuesta propia; la clase no trae uno.

## Relacionados

- [[interes-compuesto]] — es el caso base (se capitaliza una vez al año)
- [[capital-y-tipo-de-interes]] — por eso el periodo del tipo importa

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
