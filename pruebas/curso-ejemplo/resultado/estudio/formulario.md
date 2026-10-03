# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque 01-01

### [[inflacion|Inflación]]

$$ P_n = \frac{P_0}{(1+i)^n} $$

- $P_0$: el dinero de hoy.
- $i$: la inflación de cada año, en forma decimal (3 \% anual → 0,03).
- $n$: los años que pasan.
- $P_n$: lo que esa cantidad compra, medido en euros de hoy.

> [!info] Ampliación fuera de los apuntes
> La fórmula no está en los apuntes: sale de repetir cada año "los precios suben un $i$". Explica por qué la pérdida no es "−3,00 € cada año" (eso daría 70,00 € a los 10 años) sino algo menor, 74,41 €: cada año se pierde un 3 \% de lo que queda.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: el dinero cumple tres funciones a la vez (medio de cambio, unidad de cuenta y depósito de valor) y por eso sustituye al trueque.
- [[liquidez|Liquidez]]: lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.
- [[trueque|Trueque]]: intercambiar bienes directamente, sin dinero de por medio; solo funciona si cada parte quiere justo lo que la otra ofrece, y a la vez.

## Bloque 01-02

### [[colchon-financiero|Colchón financiero]]

$$ \text{colchón} = \text{gastos mensuales} \times \text{meses a cubrir} $$

Con nómina fija se apunta a unos 3 meses; con ingresos irregulares, a 5-6.

### [[presupuesto-personal|Presupuesto personal]]

$$ \text{ahorro del mes} = \text{ingresos del mes} - \text{gastos del mes} $$

- Positivo: te sobra. Negativo: te falta.
- Los gastos se apuntan separados en fijos y variables: [[gastos-fijos-y-variables]].

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ \text{tasa de ahorro} = \frac{\text{ahorro del mes}}{\text{ingresos del mes}} \times 100 $$

- El ahorro es el de [[presupuesto-personal]].
- Se expresa en \%. No es un interés: no habla de cómo crece el dinero, sino de cuánto sobra.

Para planificar a largo plazo (clase 2.2), la tasa se pasa a cantidad:

$$ \text{ahorro al año} = \text{ingresos del mes} \times \frac{\text{tasa de ahorro}}{100} \times 12 $$

### Definiciones

- [[gastos-fijos-y-variables|Gastos fijos y variables]]: los fijos se repiten cada mes con casi la misma cifra y no dependen de ti; los variables cambian según lo que decidas gastar.

## Bloque 02-01

### [[capitalizacion|Capitalización]]

> [!info] Ampliación fuera de los apuntes
> La clase lo cuenta con palabras; esta es su forma de fórmula, la de [[interes-compuesto]] con el tipo troceado:

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- `i` es el tipo anual en tanto por uno, `m` las veces que se capitaliza al año (12 si es mensual) y `t` los años.
- `1.000,00 × (1 + 0,05 ÷ 12)¹² = 1.051,16 €`.

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1 + i)^n $$

- `C` es el [[capital]] inicial e `i` el [[tipo-de-interes]] en tanto por uno.
- `n` es el número de periodos de capitalización: con `i` anual, `n` en años.
- Con los datos de arriba: `Cf = 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = 1.157,63 €`.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- `C` es el [[capital]] inicial, `i` el [[tipo-de-interes]] en tanto por uno (5 % anual = 0,05) y `t` el tiempo.
- `t` va en el **mismo periodo que `i`**: con `i` anual, `t` en años.
- Con los datos de arriba: `I = 1.000,00 × 0,05 × 3 = 150,00 €` y `Cf = 1.150,00 €`.

### [[regla-del-72|Regla del 72]]

$$ \text{años para doblar} \approx \frac{72}{i} $$

- Aquí `i` va **en número, sin el %**: 6 % anual se mete como 6, no como 0,06.
- Es el símbolo `≈`, no `=`: es una **aproximación**.

### [[tipo-de-interes|Tipo de interés]]

$$ i = \frac{\text{tanto por ciento}}{100} $$

- Para calcular se pasa a **tanto por uno**: 5 % anual es `i = 0,05` (anual).
- El periodo de `i` manda sobre todo lo demás: si `i` es anual, el tiempo se cuenta en años.

### Definiciones

- [[capital|Capital]]: la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.

## Bloque 02-02

### [[aportaciones-con-interes-compuesto|Aportaciones con interés compuesto]]

$$ S_n = S_{n-1} \times (1 + r) + A $$

- $S_n$ es lo que hay al final del año $n$, $S_{n-1}$ lo del año anterior, $A$ la aportación del año y $r$ el interés anual en decimal (5 % anual: $r = 0{,}05$).
- Cada año: lo que había crece un 5 % anual y entra la aportación nueva (al final del año, así que esa no genera intereses todavía).

> [!info] Ampliación fuera de los apuntes
> La misma cuenta en un solo paso: $S_n = A \times \dfrac{(1 + r)^n - 1}{r}$. Con $A$ = 2.400,00 €, $r = 0{,}05$ y $n = 30$ da 159.453,23 €, igual que ir año a año.

### Definiciones

- [[aportacion-periodica|Aportación periódica]]: una cantidad fija que se añade a los ahorros cada cierto tiempo (cada mes, cada año), en vez de ahorrar de golpe una sola vez.
- [[horizonte-temporal|Horizonte temporal]]: el tiempo que el dinero va a estar ahorrado antes de usarlo; con interés compuesto es lo que más pesa en cuánto acaba valiendo el ahorro.
