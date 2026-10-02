# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque modulo-01

### [[colchon-financiero|Colchón financiero]]

$$ colchon = meses \times gastos\ del\ mes $$

Los meses son los que quieres poder aguantar sin ingresos.

### [[presupuesto-personal|Presupuesto personal]]

$$ ahorro = ingresos - gastos $$

Todo en el mismo mes. Si sale negativo, ese mes has gastado más de lo que entró.

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ tasa = \frac{ahorro}{ingresos} \times 100 $$

El ahorro y los ingresos son del mismo mes. El resultado se lee como "euros que te quedan por cada 100,00 €
ingresados". No es un interés: no tiene periodo ni crece sola.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: El dinero resuelve el problema del trueque cumpliendo a la vez tres funciones: medio de cambio, unidad de cuenta y depósito de valor.
- [[gastos-fijos-y-variables|Gastos fijos y variables]]: Un gasto es fijo si se repite cada mes con casi la misma cifra, y variable si la cifra la decides tú ese mes.
- [[inflacion|Inflación]]: La inflación es la subida general y sostenida de los precios: con el mismo dinero, mañana se compra menos que hoy.
- [[liquidez|Liquidez]]: La liquidez es lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.

## Bloque modulo-02

### [[aportacion-periodica|Aportación periódica]]

$$ saldo_{n} = saldo_{n-1} \times (1 + i) + a $$

- $saldo_{n}$: lo que tienes al final del año $n$, en €.
- $i$: el tipo de interés anual en tanto por uno (5 % anual = 0,05).
- $a$: la aportación de cada año, en €.

Primero crece lo que ya tenías; después entra la aportación nueva.

### [[horizonte-temporal|Horizonte temporal]]

$$ saldo_{n} = a \times \frac{(1 + i)^{n} - 1}{i} $$

> [!info] Ampliación fuera de los apuntes
> El material solo da el resultado a 30 años. Esta fórmula es la suma de todas las aportaciones del año a año
> de [[aportacion-periodica]], y reproduce las dos cifras: con $a$ = 2.400,00 €, $i$ = 0,05 y $n$ = 30, sale
> 159.453,23 €. Supone aportaciones al final de cada año; el material no lo dice.

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1 + i)^n $$

`n` es el número de periodos, y `i` el tipo por uno **de ese mismo periodo** (tipo anual, `n` en años).
Aquí: 1.000 × 1,05³ = 1.000 × 1,157625 = **1.157,63 €**.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo
periodo que `i`** (tipo anual, `t` en años). `C_f` es el capital final.

### [[regla-del-72|Regla del 72]]

$$ \text{años para doblar} \approx \frac{72}{\text{tipo anual, sin el símbolo}} $$

Se usa el número del tipo anual tal cual (6 % anual, 6; no 0,06).

### [[tipo-de-interes|Tipo de interés]]

$$ i = \frac{\text{intereses de un periodo}}{C} $$

`i` es el tipo en tanto por uno (5 % anual = 0,05) y `C` el capital. Se usa así en [[interes-simple]] y en
[[interes-compuesto]].

### Definiciones

- [[capital|Capital]]: El capital es la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.
- [[capitalizacion|Capitalización]]: La capitalización es cada cuánto se suman los intereses al capital (cada año, mes o trimestre): cuanto más a menudo, más rápido crece.
