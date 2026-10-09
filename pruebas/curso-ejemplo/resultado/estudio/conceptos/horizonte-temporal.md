---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto, capitalizacion]
alias: []
tags: [ahorro, interes]
ejercicio: 02-02-01-llega-tarde-al-ahorro
---
# Horizonte temporal

> **En una frase:** el horizonte temporal es el tiempo que el dinero va a estar ahorrado antes de usarlo, y con interés compuesto es lo que más pesa en cuánto acabas teniendo.

## El problema

Dos personas ahorran lo mismo cada año, al mismo tipo. Una empieza ahora y la otra dentro de unos años. ¿Acaban con lo mismo? Parece que sí: la diferencia son "solo unos años". No es así.

## El ejemplo

Aportación de 2.400,00 € al final de cada año, al 5 % anual compuesto ([[aportacion-periodica]]). Solo cambia el tiempo:

| Horizonte | Aportado | Capital final | De ello, intereses |
|---|---|---|---|
| 3 años | 7.200,00 € | 7.566,00 € | 366,00 € |
| 30 años | 72.000,00 € | 159.453,23 € | 87.453,23 € |

Con 10 veces más tiempo, lo aportado es 10 veces mayor (7.200,00 € → 72.000,00 €), pero el capital final es unas **21 veces** mayor. El resto lo ponen los intereses, que a 30 años son más que todo lo que aportaste.

## La fórmula

$$ C_n = A \cdot \frac{(1+i)^n - 1}{i} $$

- $A$: la aportación de cada año.
- $i$: el tipo de interés anual, en tanto por uno (5 % anual = 0,05).
- $n$: los años, es decir, el horizonte.
- $C_n$: el capital al final del año $n$, con las aportaciones al final de cada año.

Es la cuenta año a año de [[aportacion-periodica]] resumida: el $n$ está como exponente, y por eso el tiempo pesa tanto. Con 30 años: 2.400,00 € × 66,44 ≈ **159.453,23 €**.

## El error típico

Pensar que si empiezas 5 años más tarde lo compensas aportando "un poco más". Con 2.400,00 € al año, 5 % anual y 30 años llegas a 159.453,23 €. Si empiezas 5 años después (25 años), con la misma aportación te quedas en **114.545,04 €**; para alcanzar los 159.453,23 € tendrías que aportar unos **3.340,94 € al año**, es decir, 940,94 € más cada año. Los años del final son los que más intereses dan, y son justo los que pierdes al empezar tarde.

> [!info] Ampliación fuera de los apuntes
> La diapositiva 6 dice que "empezar antes pesa más que aportar un poco más". Las cifras de arriba lo confirman: son cálculos del profesor con la fórmula de arriba, no cifras de la clase.

## Practícalo

→ **[Llega tarde al ahorro](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-llega-tarde-al-ahorro.html)**

Mueve la aportación de quien empieza tarde, los años de retraso y el tipo anual: verás cuánto hay que subir la aportación para alcanzar a quien empezó antes, y cómo el retraso lo encarece.

## Relacionados

- [[aportacion-periodica]] — la cantidad regular que va acumulando durante el horizonte
- [[interes-compuesto]] — por qué el tiempo pesa más que la cantidad
- [[capitalizacion]] — los intereses se suman al capital y generan más
- [[colchon-financiero]] — para no tener que sacar el dinero antes de tiempo y acortar el horizonte

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
