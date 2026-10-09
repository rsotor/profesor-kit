---
tipo: concepto
bloques: [modulo-02]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 2
requiere: [interes-compuesto]
alias: [frecuencia de capitalización]
tags: [interes, ahorro]
---
# Capitalización

> **En una frase:** la capitalización es cada vez que los intereses se suman al capital para generar más intereses; un tipo anual puede capitalizarse una vez al año, cada trimestre o cada mes.

## El problema

Un tipo anual no dice con qué frecuencia se aplica. Si se aplica a trozos a lo largo del año, cada trozo ya cuenta sobre un capital algo mayor. ¿Cuánto cambia eso?

## El ejemplo

1.000,00 € al 5 % anual, durante un año:

| Capitalización | Cómo se aplica | Capital final |
|---|---|---|
| Anual | una vez, 5 % anual | 1.050,00 € |
| Mensual | una doceava parte cada mes, sobre el capital ya crecido | 1.051,16 € |

Son 1,16 € más: poco, pero sin tocar nada, solo por la frecuencia. Y cuanto más frecuente, más rápido crece.

> [!info] Ampliación fuera de los apuntes
> El material dice "algo mayor" pero no da cifra; el 1.051,16 € es cálculo propio con la fórmula de abajo. A 3 años: 1.161,47 € (mensual) frente a 1.157,63 € (anual).

## La fórmula

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- $i$: el tipo anual en tanto por uno (5 % anual → 0,05 anual).
- $m$: veces al año que se capitaliza (12 si es mensual, 4 si es trimestral, 1 si es anual).
- $t$: años.

Con $m = 1$ vuelve a ser la fórmula de [[interes-compuesto]].

> [!info] Ampliación fuera de los apuntes
> La fórmula general no está en los apuntes; sale de aplicar la del compuesto $m \cdot t$ veces con un tipo de $i/m$.

## El error típico

Pensar que capitalizar mensual "multiplica" el resultado. Con el mismo tipo anual la mejora es pequeña (1,16 € en el ejemplo); lo que de verdad pesa son los años.

> [!info] Ampliación fuera de los apuntes
> Ni capitalizando cada instante se pasa de 1.051,27 € a 1 año con este ejemplo: la frecuencia tiene techo.

## Relacionados

- [[interes-compuesto]] — la capitalización es lo que lo hace funcionar
- [[tipo-de-interes]] — el tipo anual que se reparte en trozos

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
