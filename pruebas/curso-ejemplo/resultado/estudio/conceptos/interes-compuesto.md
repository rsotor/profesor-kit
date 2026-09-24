---
tipo: concepto
bloques: ["Módulo 2"]
visto_en: ["02-01-01-interes-simple-y-compuesto"]
dificultad: 3
requiere: [interes-simple, capital-y-tipo-de-interes]
alias: [interés compuesto, interés sobre interés]
tags: []
ejercicio: 02-01-01-se-dobla-el-capital
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también.

## El problema

Con [[interes-simple]] cobras siempre lo mismo. Pero si dejas quieto lo que ya has cobrado, ese dinero
también podría rendir. El interés compuesto es lo que pasa cuando no tocas nada.

## El ejemplo

Los mismos 1.000,00 € al 5 % anual, ahora compuesto:

| Año | Interés simple | Interés compuesto |
|---|---|---|
| 1 | 1.050,00 € | 1.050,00 € |
| 2 | 1.100,00 € | 1.102,50 € |
| 3 | 1.150,00 € | 1.157,63 € |

En el año 2, el compuesto cobra el 5 % anual sobre 1.050,00 €, no sobre 1.000,00 €: son 52,50 € en vez de
50,00 €. La diferencia a 3 años es 7,63 €: poca. Lo que sorprende es que **crece cada vez más rápido**.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno y `n` el número de periodos de capitalización
(si `i` es anual, `n` va en años). A 3 años: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

> [!info] Ampliación fuera de los apuntes
> A 20 años, los mismos 1.000,00 € al 5 % anual dan 2.000,00 € con interés simple y 2.653,30 € con
> compuesto. Cuenta propia con las dos fórmulas de arriba.

## El error típico

Creer que la diferencia entre simple y compuesto es pequeña porque a 3 años lo es. Con pocos periodos se
parecen; con muchos, el compuesto se escapa. Es justo lo que falló en el test inicial (pregunta 4).

## Practícalo

→ **[¿Se dobla el capital?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-se-dobla-el-capital.html)**

Mueve el tipo y los años y decide si el capital llega a doblarse con interés compuesto. Lo que debería
sorprender es que el simple y el compuesto empiezan igual, pero uno se dobla mucho antes.

> [!info] Ampliación fuera de los apuntes
> **Visto desde tus ingresos irregulares:** el compuesto solo funciona si no retiras los intereses. Si
> en un mes flojo sacas lo que rindió tu ahorro, estás volviendo, sin darte cuenta, al interés simple.

## Relacionados

- [[interes-simple]] — el punto de comparación
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — atajo para saber cuánto tarda en doblarse
- [[inflacion]] — también se acumula año a año, y en contra

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
