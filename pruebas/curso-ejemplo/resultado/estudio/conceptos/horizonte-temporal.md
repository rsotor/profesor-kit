---
tipo: concepto
bloques: [2.2]
visto_en: [02-02-01-ahorro-a-largo-plazo]
dificultad: 2
requiere: [aportacion-periodica, interes-compuesto]
alias: []
tags: [ahorro, interes]
ejercicio: 02-02-01-empezar-antes-o-aportar-mas
---
# Horizonte temporal

> **En una frase:** el horizonte temporal es el tiempo que el dinero va a estar ahorrado antes de usarlo, y con interés compuesto es lo que más pesa en cuánto crece.

## El problema

Al planificar el ahorro se mira la cantidad ("¿cuánto aparto?"). Pero con interés compuesto la cantidad es
solo la mitad de la historia: la otra mitad es cuántos años le das al dinero para trabajar.

## El ejemplo

El mismo ahorro de 2.400,00 € al final de cada año, a un 5 % anual compuesto:

| Horizonte | Aportado | Intereses | Total |
|---|---|---|---|
| 3 años | 7.200,00 € | 366,00 € | 7.566,00 € |
| 30 años | 72.000,00 € | 87.453,23 € | 159.453,23 € |

Con 10 veces más años aportas 10 veces más (72.000,00 € frente a 7.200,00 €), pero acabas con unas 21 veces
más dinero: el resto lo ponen los intereses, que a 30 años ya son más que todo lo que aportaste.

## La fórmula

Es la de la [[aportacion-periodica]], con `n` = el horizonte en años:

$$ F = A \cdot \frac{(1+i)^n - 1}{i} $$

Lo que aquí se mueve es `n`. Con `A` = 2.400,00 € e `i` = 0,05, pasar de `n` = 3 a
`n` = 30 multiplica el factor de 3,1525 a 66,4388.

## El error típico

Pensar que el crecimiento es proporcional: "30 años es 10 veces más que 3, así que saldrá 10 veces más".
Sale 21 veces más, porque cada año los intereses se suman al capital y empiezan a rendir ellos también.

> [!info] Ampliación fuera de los apuntes
> La clase afirma que "empezar antes pesa más que aportar un poco más", pero no lo demuestra. Con las cifras
> de aquí sí se puede comprobar: quien empieza hoy con 2.400,00 € al año durante 30 años llega a
> 159.453,23 €; quien espera 10 años y aporta 3.600,00 € al año (un 50 % más) durante 20 años llega a
> 119.037,43 €. Para igualar a quien empezó antes, tendría que aportar unos 4.822,28 € al año, más del doble.
> Es un caso concreto (5 % anual, 30 años): con retrasos pequeños, aportar más sí compensa (ver el ejercicio).

## Practícalo

→ **[Empezar antes o aportar más](../ejercicios/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-empezar-antes-o-aportar-mas.html)**

Mueve cuántos años espera Luis para empezar y cuánto aporta. Lo que debería sorprender: con pocos años de
retraso aportar algo más lo compensa, pero a partir de cierto retraso ninguna aportación razonable alcanza a
quien empezó antes.

## Relacionados

- [[aportacion-periodica]] — la cantidad que se va sumando durante el horizonte
- [[interes-compuesto]] — por qué el tiempo pesa tanto
- [[regla-del-72]] — otra forma de ver cuánto tarda en crecer un capital
- [[colchon-financiero]] — para no tener que sacar el ahorro antes de que acabe el horizonte
- [[inflacion]] — a 30 años, los precios también habrán subido: 159.453,23 € de entonces no compran lo mismo que hoy

## Historial

- **02-02-01-ahorro-a-largo-plazo** · primera vez
