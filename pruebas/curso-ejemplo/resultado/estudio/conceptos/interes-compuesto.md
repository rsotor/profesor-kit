---
tipo: concepto
bloques: [02-01]
visto_en: [02-01-01-interes-simple-y-compuesto]
dificultad: 3
requiere: [interes-simple]
alias: []
tags: [interes]
ejercicio: 02-01-01-interes-compuesto
---
# Interés compuesto

> **En una frase:** los intereses de cada periodo se suman al capital y, a partir de ahí, generan intereses ellos también ("interés sobre interés").

## El problema

Con [[interes-simple]] cobras siempre lo mismo, aunque lleves años con el dinero quieto. Pero esos intereses ya son tuyos: si se quedan dentro, ¿por qué no iban a trabajar también?

## El ejemplo

Los mismos 1.000,00 € al 5 % anual de la clase anterior, ahora compuesto.

| Año | Simple | Compuesto |
|---|---|---|
| 1 | 1.050,00 € | 1.050,00 € |
| 2 | 1.100,00 € | 1.102,50 € |
| 3 | 1.150,00 € | 1.157,63 € |

El año 2 el compuesto gana 52,50 €, no 50,00 €: el 5 % anual se aplica a 1.050,00 €, que ya incluye los intereses del año 1. A 3 años la diferencia es de 7,63 €: poca cosa. Lo que sorprende es cómo crece después.

> [!info] Ampliación fuera de los apuntes
> A 30 años, con 1.000,00 € al 5 % anual: simple 2.500,00 €, compuesto 4.321,94 €. La diferencia ya es de 1.821,94 €. El simple sube una recta; el compuesto, una curva cada vez más empinada.

## La fórmula

$$ C_f = C \cdot (1 + i)^n $$

- `C` es el [[capital]] inicial e `i` el [[tipo-de-interes]] en tanto por uno.
- `n` es el número de periodos de capitalización: con `i` anual, `n` en años.
- Con los datos de arriba: `Cf = 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = 1.157,63 €`.

## El error típico

Dar por hecho que el compuesto siempre "se nota": a pocos años apenas se distingue del simple (7,63 € a 3 años). La diferencia la hace el tiempo y el tipo, no el nombre.

## Practícalo

→ **[¿Ha ganado ya el doble que el simple?](../ejercicios/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-compuesto.html)**

Mueve el tipo y los años y busca el punto donde el compuesto pasa de generar menos del doble de intereses que el simple a generar más. Sorprende lo poco que pesa el capital inicial en esa respuesta.

> [!tip] Visto desde tus ingresos irregulares
> El compuesto solo funciona si el dinero se queda dentro: si en un mes flojo sacas lo ahorrado, los intereses de después se calculan sobre menos capital. Por eso importa decidir cuánto puedes dejar quieto (tu [[tasa-de-ahorro]], medida sobre un ingreso medio) en vez de ahorrar a golpes.

## Relacionados

- [[interes-simple]] — el punto de comparación, y lo que hay que entender antes
- [[capitalizacion]] — cada cuánto se suman los intereses al capital
- [[regla-del-72]] — cuánto tarda en doblarse, a ojo
- [[capital]] · [[tipo-de-interes]] — los dos datos de la fórmula

## Historial

- **02-01-01-interes-simple-y-compuesto** · primera vez
