---
tipo: concepto
bloques: ["2.2 Ahorro a largo plazo"]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto]
alias: []
tags: [ahorro, interes]
ejercicio: 02-02-01-empezar-antes-o-aportar-mas
---
# Horizonte temporal

> **En una frase:** El horizonte temporal es el tiempo que el dinero va a estar ahorrado antes de usarlo; con interés compuesto, es lo que más pesa en cuánto crece.

## El problema

Dos personas ahorran lo mismo cada año, pero una piensa usar el dinero dentro de 3 años y la otra dentro de 30. Si miras solo cuánto aportan, parecen iguales. No lo son: al dinero que se queda más años, el interés le va dando intereses.

## El ejemplo

Aportas 2.400,00 € al final de cada año, a 5 % anual compuesto:

| Horizonte | Aportado | Total al final | Intereses |
|---|---|---|---|
| 3 años | 7.200,00 € | 7.566,00 € | 366,00 € |
| 30 años | 72.000,00 € | 159.453,23 € | 87.453,23 € |

El horizonte se multiplica por 10 y la aportación total también (7.200,00 € → 72.000,00 €), pero los intereses pasan de 366,00 € a 87.453,23 €: casi 240 veces más. Con 30 años, **más de la mitad del total son intereses** (87.453,23 € de 159.453,23 €).

## La fórmula

$$ S_n = A \cdot \frac{(1+i)^n - 1}{i} $$

$A$ es la aportación de cada año, $i$ el tipo de interés anual (en tanto por uno: 5 % anual es $0{,}05$) y $n$ el horizonte en años. Aquí $n$ está en un exponente: por eso alargarlo pesa tanto más que subir $A$, que solo multiplica.

## El error típico

> [!info] Ampliación fuera de los apuntes
> Pensar que "aportar un poco más" arregla haber empezado tarde. Con los mismos 72.000,00 € aportados, 2.400,00 € al año durante 30 años (159.453,23 €) acaban muy por encima de 3.600,00 € al año durante 20 años (119.037,43 €), a 5 % anual. Ojo, no es una ley fija: depende del interés; con 4 % anual, 4.800,00 € durante 20 años (142.934,78 €) superan a 2.400,00 € durante 30 (134.603,85 €). Eso es lo que mueve el ejercicio.

## Practícalo

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes-o-aportar-mas.html)**

Mueve los años de un plan y la aportación del otro, y fíjate en cuándo gana quien empezó antes y cuándo no.

## Relacionados

- [[aportacion-periodica]] — lo que se repite durante el horizonte
- [[interes-compuesto]] — por qué el tiempo pesa tanto (clase 2.1)
- [[inflacion]] — cuanto más largo el horizonte, más importa lo que pierde el dinero con los precios

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
