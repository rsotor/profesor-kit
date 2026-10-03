# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque 1.1

### [[inflacion|Inflación]]

$$ \text{valor real} = \frac{\text{dinero}}{(1 + i)^{n}} $$

- $i$: la inflación de cada año (con su periodo: anual).
- $n$: los años que pasan.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: el dinero resuelve el problema del trueque cumpliendo tres funciones a la vez: medio de cambio, unidad de cuenta y depósito de valor.
- [[liquidez|Liquidez]]: la liquidez es lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.

## Bloque 1.2

### [[colchon-financiero|Colchón financiero]]

$$ \text{colchón} = \text{gastos del mes} \times \text{meses a cubrir} $$

### [[presupuesto|Presupuesto]]

$$ \text{ahorro del mes} = \text{ingresos del mes} - \text{gastos del mes} $$

Si sale negativo, ese mes has gastado más de lo que entró.

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ \text{tasa de ahorro} = \frac{\text{ahorro del mes}}{\text{ingresos del mes}} \times 100 $$

Es un porcentaje **del mes** (no un interés): cambia cada mes con los ingresos y los gastos.

### Definiciones

- [[gastos-fijos-y-variables|Gastos fijos y variables]]: un gasto es fijo si se repite con (casi) la misma cifra y no depende de lo que decidas ese mes; es variable si la cifra la decides tú cada mes.

## Bloque 2.1

### [[capitalizacion|Capitalización]]

Mismo mecanismo que el compuesto: `n` cuenta los **periodos de capitalización**, no los años. Si el tipo
se reparte en doce meses, `n` son meses y `i` es el tipo de cada mes.

$$ C_f = C \cdot (1 + i)^n $$

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1 + i)^n $$

`C` es el capital inicial, `i` el tipo en tanto por uno (un 5 % anual es 0,05) y `n` el número de
periodos de capitalización (si `i` es anual, `n` en años). En el ejemplo: 1.000 × 1,05³ = 1.000 × 1,157625
= 1.157,63 €.

Con aportaciones periódicas, cada una genera intereses desde que entra, y esos intereses generan más
(ver [[aportacion-periodica]]): 2.400,00 € al final de cada año a un 5 % anual durante 3 años dan
4.920,00 € y luego 7.566,00 €, con 7.200,00 € aportados y 366,00 € de intereses.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el capital inicial, `i` el tipo en tanto por uno (un 5 % anual es 0,05) y `t` el tiempo, en el
mismo periodo que `i` (si `i` es anual, `t` en años). `I` son los intereses y `C_f` el capital final.

### [[regla-del-72|Regla del 72]]

$$ \text{años para doblar} \approx \frac{72}{\text{tipo anual, en número, sin el signo de porcentaje}} $$

El 6 % anual entra como 6, no como 0,06.

### [[tipo-de-interes|Tipo de interés]]

$$ i = \frac{\text{tanto por ciento}}{100} $$

Para calcular se usa en **tanto por uno**: un 5 % anual es `i = 0,05`. Y el tiempo se cuenta en el mismo
periodo que el tipo (tipo anual, tiempo en años).

### Definiciones

- [[capital|Capital]]: el capital es la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.

## Bloque 2.2

### [[aportacion-periodica|Aportación periódica]]

$$ F = A \cdot \frac{(1+i)^n - 1}{i} $$

`A` es la aportación de cada periodo, `i` el tipo por periodo en tanto por uno (un 5 % anual es 0,05) y `n`
el número de periodos. Aquí las aportaciones entran **al final** de cada periodo, como en el ejemplo. Con
`A` = 2.400,00 €, `i` = 0,05 y `n` = 3: 2.400,00 € × 3,1525 = 7.566,00 €.

> [!info] Ampliación fuera de los apuntes
> La clase no da esta fórmula; es la suma de las aportaciones del ejemplo: la primera trabaja 2 años
> (2.400,00 € × 1,05² = 2.646,00 €), la segunda 1 año (2.520,00 €) y la última ninguno (2.400,00 €):
> 2.646,00 € + 2.520,00 € + 2.400,00 € = 7.566,00 €.

### [[horizonte-temporal|Horizonte temporal]]

Es la de la [[aportacion-periodica]], con `n` = el horizonte en años:

$$ F = A \cdot \frac{(1+i)^n - 1}{i} $$

Lo que aquí se mueve es `n`. Con `A` = 2.400,00 € e `i` = 0,05, pasar de `n` = 3 a
`n` = 30 multiplica el factor de 3,1525 a 66,4388.
