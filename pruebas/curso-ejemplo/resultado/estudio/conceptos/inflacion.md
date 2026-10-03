---
tipo: concepto
bloques: [01-01]
visto_en: [01-01-01-el-dinero-y-sus-funciones]
dificultad: 2
requiere: [funciones-del-dinero]
alias: []
tags: [dinero]
ejercicio: 01-01-01-inflacion
---
# Inflación

> **En una frase:** la subida general y sostenida de los precios, que hace que con el mismo dinero se compre cada año menos.

## El problema

Guardar dinero solo tiene sentido si mañana sigue comprando lo que compra hoy. Si los precios suben, el dinero parado pierde valor aunque la cifra no cambie: falla el depósito de valor de [[funciones-del-dinero]].

## El ejemplo

Con una inflación del 3 % anual, una cesta de la compra que hoy cuesta 100,00 € costará 103,00 € dentro de un año. Al revés: tus 100,00 € guardados dentro de un año compran lo que hoy compran **97,09 €**. Los apuntes lo redondean a "unos 97 €".

Pasados 10 años, con la misma inflación del 3 % anual, esos 100,00 € compran lo que hoy compran 74,41 €.

## La fórmula

$$ P_n = \frac{P_0}{(1+i)^n} $$

- $P_0$: el dinero de hoy.
- $i$: la inflación de cada año, en forma decimal (3 \% anual → 0,03).
- $n$: los años que pasan.
- $P_n$: lo que esa cantidad compra, medido en euros de hoy.

> [!info] Ampliación fuera de los apuntes
> La fórmula no está en los apuntes: sale de repetir cada año "los precios suben un $i$". Explica por qué la pérdida no es "−3,00 € cada año" (eso daría 70,00 € a los 10 años) sino algo menor, 74,41 €: cada año se pierde un 3 \% de lo que queda.

## El error típico

Confundir "sube el precio de una cosa" con inflación. Si el tomate sube por una mala cosecha, es un precio que sube. Inflación es que suba el nivel general de precios, casi todo a la vez.

## Practícalo

→ **[Cuánto compra tu dinero guardado](../ejercicios/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-inflacion.html)**

Mueve la inflación anual y los años: hay un punto donde el dinero guardado compra menos de la mitad. Debería sorprenderte lo pronto que llega con inflaciones que no parecen altas.

> [!tip] Visto desde tus ingresos irregulares
> Tu colchón para los meses flojos es dinero guardado: la inflación se come un poco de él cada año que no lo usas. No es un motivo para gastarlo, sino para saber que un colchón grande y parado durante años pierde poder de compra, y que por eso la unidad 2.1 (ahorrar e invertir) importa.

## Relacionados

- [[funciones-del-dinero]] — la función de depósito de valor es la que ataca
- [[liquidez]] — guardar con liquidez tiene como enemigo a la inflación

## Historial

- **01-01-01-el-dinero-y-sus-funciones** · primera vez
