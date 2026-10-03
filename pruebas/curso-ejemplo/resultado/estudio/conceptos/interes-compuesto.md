---
tipo: concepto
bloques: [2.1, 2.2]
visto_en: [02-01-01-interes-simple-y-compuesto, 02-02-01-ahorro-a-largo-plazo]
dificultad: 3
requiere: [interes-simple]
alias: []
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con el interés simple, los intereses ganados se quedan aparte, parados. Pero ese dinero también podría
trabajar. Si lo sumas al capital, el año siguiente ya cobras interés sobre una cifra mayor.

## El ejemplo

1.000,00 € a un 5 % anual durante 3 años:

| Año | Capital al empezar | Interés del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Con interés simple eran 1.150,00 €. La diferencia, **7,63 €**, no parece mucho a 3 años, pero crece cada
vez más rápido cuantos más periodos pasan.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno (un 5 % anual es 0,05) y `n` el número de
periodos de capitalización (si `i` es anual, `n` en años). En el ejemplo: 1.000 × 1,05³ = 1.000 × 1,157625
= 1.157,63 €.

Con aportaciones periódicas, cada una genera intereses desde que entra, y esos intereses generan más
(ver [[aportacion-periodica]]): 2.400,00 € al final de cada año a un 5 % anual durante 3 años dan
4.920,00 € y luego 7.566,00 €, con 7.200,00 € aportados y 366,00 € de intereses.

## El error típico

Confundirlo con el simple y pensar que crece "un poco más rápido" y nada más. La diferencia no es
constante: el simple crece en línea recta; el compuesto, cada vez más deprisa.

> [!info] Ampliación fuera de los apuntes
> Más plazo, más distancia. Con 1.000,00 € a un 5 % anual: a 3 años, 1.150,00 € (simple) frente a
> 1.157,63 € (compuesto); a 10 años, 1.500,00 € frente a 1.628,89 €; a 30 años, 2.500,00 € frente a
> 4.321,94 €.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Mueve el tipo y los años. Lo que debería sorprender: a 1 año no hay diferencia, y a muchos años o con un
tipo alto el compuesto da muchos más intereses que el simple.

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes-o-aportar-mas.html)**

Mueve el retraso de Luis y su aportación. Lo que debería sorprender: el interés compuesto premia más los años que las aportaciones extra.

## Visto desde tus ingresos irregulares

Un mes bueno que apartas hoy empieza a generar intereses antes que uno que apartas dentro de un año: con
el compuesto, el **tiempo** que el dinero lleva guardado pesa tanto como la cantidad.

## Relacionados

- [[interes-simple]] — lo que ocurre si los intereses no se reinvierten
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — cuánto tarda en doblarse un capital así
- [[aportacion-periodica]] — qué pasa si, además del capital inicial, se va sumando dinero
- [[horizonte-temporal]] — el plazo, que pesa tanto en este crecimiento

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
- **02-02-01-ahorro-a-largo-plazo** · aplicación a aportaciones periódicas: 2.400,00 € al final de cada año a un 5 % anual durante 3 años → 4.920,00 € → 7.566,00 €; 7.200,00 € aportados y 366,00 € de intereses.
