---
tipo: concepto
bloques: [2]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple, tipo-de-interes]
alias: [interés sobre interés]
tags: [interes, ahorro]
ejercicio: 02-01-01-interes-simple-y-compuesto
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y generan intereses a su vez ("interés sobre interés"), así que el dinero crece cada vez más rápido.

## El problema

Con interés simple, los intereses ganados se quedan quietos y no trabajan. Si se reinvierten, el capital de partida de cada año es mayor, y por tanto los intereses también.

## El ejemplo

Repaso rápido del [[interes-simple]]: 1.000,00 € al 5 % anual durante 3 años daban 1.150,00 €.

Ahora **compuesto**, mismo capital, mismo tipo, mismo plazo:

| Año | Capital al empezar | Interés del año (5 % anual) | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | **1.157,63 €** |

Frente a los 1.150,00 € del simple: **7,63 € más**. Poco a 3 años, pero la ventaja crece cada vez más rápido con el tiempo. Es la parte que sorprende la primera vez.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno y `n` el número de periodos de capitalización (si `i` es anual, `n` en años). Aquí: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = 1.157,63 €.

## El error típico

Pensar que "compuesto" es simplemente "un poco más". Al principio se parecen mucho; la diferencia está en el ritmo: el simple suma la misma cantidad cada año y el compuesto suma una cantidad mayor cada año.

## Practícalo

→ **[[ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto|Simple frente a compuesto: qué pasa al alargar el plazo]]**

Duplica los años y mira si la diferencia entre los dos se duplica.

> [!tip] Visto desde tus ingresos irregulares
> Un mes bueno, el dinero que apartas y dejas quieto empieza a ganar intereses sobre intereses desde ese mes. Cuanto antes entra, más tiempo trabaja: aportar en el mes bueno pesa más que esperar a "regularizar" al final del año.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuándo se dobla

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
