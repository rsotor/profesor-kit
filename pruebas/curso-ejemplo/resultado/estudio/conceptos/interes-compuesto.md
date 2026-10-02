---
tipo: concepto
bloques: [modulo-2]
visto_en: [02-01-01-interes-simple-y-compuesto, 02-02-01]
dificultad: 3
requiere: [interes-simple]
alias: [interés compuesto, interés sobre interés]
tags: [interes]
ejercicio: 02-01-01-simple-frente-a-compuesto
---
# Interés compuesto

> **En una frase:** con interés compuesto, los intereses de cada periodo se suman al capital y a partir de ahí generan intereses ellos también ("interés sobre interés").

## El problema

Con [[interes-simple]] cobras lo mismo cada año, aunque ya tengas intereses acumulados parados. Es como dejar el dinero ganado en un cajón: no trabaja. El compuesto lo vuelve a meter a trabajar.

## El ejemplo

El mismo caso que en [[interes-simple]]: 1.000,00 € al 5 % anual, 3 años.

| Año | Capital al empezar | Intereses del año | Capital al acabar |
|---|---|---|---|
| 1 | 1.000,00 € | 50,00 € | 1.050,00 € |
| 2 | 1.050,00 € | 52,50 € | 1.102,50 € |
| 3 | 1.102,50 € | 55,13 € | 1.157,63 € |

Compuesto: **1.157,63 €**. Simple: 1.150,00 €. Diferencia: 7,63 €. Poco a 3 años, pero la diferencia crece cada vez más rápido al pasar los periodos.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el [[capital]] inicial, `i` el [[tipo-de-interes]] en tanto por uno y `n` el número de periodos de capitalización (si `i` es anual, `n` en años). Comprobación: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**.

## Con aportaciones periódicas (clase 02-02)

> [!info] De la clase 02-02
> Cada aportación periódica genera intereses compuestos desde que entra. Supuesto: la aportación se hace al final de cada año (el material solo lo dice en el ejemplo de 3 años).

2.400,00 € al final de cada año, al 5 % anual compuesto, 3 años:

- Año 1: 2.400,00 €
- Año 2: 2.400,00 × 1,05 + 2.400,00 = 4.920,00 €
- Año 3: 4.920,00 × 1,05 + 2.400,00 = **7.566,00 €**

De ellos, 7.200,00 € son aportado y **366,00 €** intereses. Con 30 años (mismo 5 % anual, 2.400,00 € al año): unos **159.453,23 €**, de los que 72.000,00 € son aportado. Aquí los intereses ya pesan más que lo que pones tú. Ver [[aportacion-periodica]].

## El error típico

> [!info] Ampliación fuera de los apuntes
> Pensar que "a 3 años casi da igual", y quedarse con el simple. Los 7,63 € de diferencia salen de 1.000,00 € y 3 años; con 30 años de aportaciones la diferencia son miles de euros. El tiempo pesa más que el tipo.

## Practícalo

→ **[Simple frente a compuesto](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-simple-frente-a-compuesto.html)**

Sube los años con el mismo tipo: la ventaja del compuesto sobre el simple crece más que proporcionalmente. A 1 año, los dos dan lo mismo.

## Visto desde tus ingresos irregulares

> [!info] Ampliación fuera de los apuntes
> Como freelance no hace falta aportar lo mismo cada año: un año flojo no tira lo anterior, que sigue generando intereses. Lo que más pesa es empezar pronto y no sacar lo ya acumulado.

## Relacionados

- [[interes-simple]] — el contraste directo
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — cuánto tarda en doblarse un capital así
- [[aportacion-periodica]] — de la clase 02-02: aportar cada periodo
- [[tasa-de-ahorro]] — la parte de tus ingresos que puedes destinar a aportar

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
- **02-02-01** · ampliada: el interés compuesto aplicado a aportaciones periódicas (ejemplo de 3 y de 30 años)
