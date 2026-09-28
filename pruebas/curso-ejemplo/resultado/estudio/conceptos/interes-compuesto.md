---
tipo: concepto
bloques: ["Módulo 2 · Ahorro e interés"]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto los intereses de cada periodo se suman al capital y desde ahí generan intereses ellos también, así que el dinero crece cada vez más deprisa.

## El problema

En el interés simple, los intereses que ya has ganado se quedan quietos. Pero ese dinero ya es tuyo: si se
queda dentro, ¿por qué no iba a ganar él también?

## El ejemplo

Mismo caso de [[interes-simple]]: 1.000,00 € al 5 % anual, 3 años, pero dejando los intereses dentro.

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | **1.157,63 €** |

Frente a los 1.150,00 € del simple: 7,63 € de más. Poco a 3 años, pero la diferencia crece cada vez más
rápido con el tiempo.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`n` es el número de periodos de capitalización (si `i` es anual, `n` en años). Con las cifras de arriba:
1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = 1.157,63 €.

## El error típico

Pensar que "un poco más de interés" es un poco más de dinero. En el simple, el ahorro crece en línea recta;
en el compuesto, se curva hacia arriba: el efecto se nota sobre todo con muchos años.

> [!tip] Visto desde tus ingresos irregulares
> El interés compuesto solo trabaja para ti si el dinero se queda dentro. Un colchón que vacías cada mes flojo
> se comporta como interés simple, o como ninguno. Por eso este dinero conviene tenerlo aparte ([[colchon-financiero]]).

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.md)**

Desde el lado del compuesto: alarga los años y mira cómo la diferencia con el simple se dispara.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cuántas veces al año se suman los intereses
- [[regla-del-72]] — cuánto tarda en doblarse un capital a interés compuesto

## Historial

- **02-01-01** · primera vez
