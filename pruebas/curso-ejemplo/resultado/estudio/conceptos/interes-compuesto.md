---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: [interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-simple-o-compuesto
---
# Interés compuesto

> **En una frase:** Con interés compuesto los intereses de cada periodo se suman al capital y generan intereses ellos también, así que el dinero crece cada vez más rápido.

## El problema

Con [[interes-simple]] los intereses ganados quedan "parados": no trabajan. Si los dejas dentro y se suman al capital, el periodo siguiente ya cobras sobre una cifra mayor.

## El ejemplo

El mismo caso de antes: **1.000,00 €** al **5 % anual**, 3 años, pero ahora los intereses se quedan dentro.

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Frente a los 1.150,00 € del simple, hay **7,63 €** de diferencia. Poco a 3 años; pero la diferencia no crece en línea recta, crece cada vez más rápido: es la parte que sorprende.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

$C$ es el capital inicial, $i$ el tipo en tanto por uno y $n$ el número de periodos (si $i$ es anual, $n$ en años). Con el ejemplo: 1.000 × 1,05³ = 1.000 × 1,157625 = **1.157,63 €**.

## El error típico

Pensar que "algo más que el simple" significa "poco más", porque a 3 años lo parece. Con el mismo 5 % anual y 1.000,00 €, a 30 años el simple da 2.500,00 € y el compuesto 4.321,94 €.

> [!info] Ampliación fuera de los apuntes
> Las cifras de 30 años son cálculo propio (1.000 × 1,05³⁰ = 4.321,94; simple: 1.000 + 1.000 × 0,05 × 30 = 2.500,00), no vienen de la clase.

## Practícalo

→ **[Simple o compuesto: ¿cuál gana?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-o-compuesto.html)**

Con un simple del 8 % anual frente a un compuesto del 5 % anual, el simple gana a 3 años y pierde a partir de los 19: busca ese punto moviendo el tiempo.

## Visto desde tus ingresos irregulares

La fórmula supone un capital que se deja quieto y sin aportaciones. Tus meses buenos y flojos no cambian eso, pero sí decide cuánto puedes dejar sin tocar: el efecto lo da el **tiempo** que el dinero pasa dentro, así que retirarlo en un mes flojo corta justo lo que hace crecer al compuesto. Ahí el [[colchon-financiero]] protege también tu inversión.

**TODO:** la clase no cubre aportaciones periódicas (ahorrar una cantidad cada mes, o cantidades distintas cada mes). Hace falta material para eso.

## Relacionados

- [[interes-simple]] — el mismo caso sin reinvertir
- [[capitalizacion]] — cuántas veces al año se suman los intereses
- [[regla-del-72]] — cuánto tarda en doblarse a este ritmo

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
