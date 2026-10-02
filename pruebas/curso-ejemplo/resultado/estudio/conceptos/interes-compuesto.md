---
tipo: concepto
bloques: ["2.1 Interés simple y compuesto", "2.2"]
visto_en: [02-01-01-interes-simple-y-compuesto, 02-02-01-ahorro-a-largo-plazo]
dificultad: 3
requiere: [interes-simple, tipo-de-interes, capital]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto, los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con interés simple, los intereses que ya ganaste se quedan parados. Con compuesto trabajan: lo ganado este año produce más el año que viene.

## El ejemplo

El mismo caso que en [[interes-simple]]: 1.000,00 € al 5% anual, 3 años.

| Año | Capital al empezar | Intereses (5% anual) | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del simple: **7,63 € más**. Poco a 3 años, pero la diferencia crece cada vez más rápido con los años.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`n` es el número de periodos de capitalización (si `i` es anual, `n` en años). Aquí: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

## Con aportaciones periódicas

Visto en [[aportacion-periodica]] (clase 2.2): si cada año añades dinero, **cada aportación genera intereses desde el momento en que entra**. Se calcula año a año:

$$ \text{saldo nuevo} = \text{saldo} \times 1{,}05 + \text{aportación} $$

con la aportación de 2.400,00 € de este ejemplo.

2.400,00 € al final de cada año, al 5% anual: año 1 → 2.400,00 €; año 2 → 4.920,00 €; año 3 → **7.566,00 €**. Cuánto dura el plan pesa más que cuánto aportas: ver [[horizonte-temporal]].

## El error típico

Pensar que, como a 3 años la diferencia con el simple es pequeña, da igual cuál sea. Lo que sorprende es que la distancia crece cada vez más rápido con el tiempo: a 30 años, 1.000,00 € al 5% anual son 2.500,00 € con simple y 4.321,94 € con compuesto.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde el lado del compuesto: mueve los años y el tipo, y busca el punto donde un compuesto con tipo menor adelanta a un simple con tipo mayor.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Si un año flojo no puedes aportar, esa aportación no entra, pero lo ya acumulado sigue creciendo: en el ejemplo, sin aportar el año 3, los 4.920,00 € pasan a 4.920,00 € × 1,05 = 5.166,00 € (en vez de 7.566,00 €). Un plan que se pausa un año sale mejor que uno que se abandona.

## Relacionados

- [[interes-simple]] — la versión sin reinversión
- [[capitalizacion]] — cada cuánto se suman los intereses
- [[regla-del-72]] — cuánto tarda en doblarse
- [[aportacion-periodica]] · [[horizonte-temporal]] — el compuesto con aportaciones y a largo plazo

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
- **02-02-01-ahorro-a-largo-plazo** · uso con aportaciones periódicas
