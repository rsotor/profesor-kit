# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque modulo-01

### [[colchon-financiero|Colchón financiero]]

$$ \text{colchón} = \text{gastos mensuales} \times \text{meses a cubrir} $$

### [[inflacion|Inflación]]

$$ V = \frac{D}{(1+i)^n} $$

- $V$: lo que vale ese dinero en compra real, a precios de hoy.
- $D$: el dinero que guardas.
- $i$: la inflación **anual**, en tanto por uno (3 % anual → 0,03).
- $n$: los años que pasan.

Con 1.000,00 € guardados 5 años a un 3 % anual de inflación: 1.000,00 ÷ 1,03⁵ = **862,61 €** de poder de compra.

### [[presupuesto-personal|Presupuesto personal]]

$$ \text{ahorro del mes} = \text{ingresos del mes} - \text{gastos del mes} $$

Lo que entra menos lo que sale. Lo que sobra es el ahorro.

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ \text{tasa de ahorro} = \frac{\text{ahorro del mes}}{\text{ingresos del mes}} \times 100 $$

Se divide entre lo que **ingresas**, no entre lo que gastas.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: el dinero sirve para tres cosas a la vez: cambiar cosas sin trueque (medio de cambio), ponerles precio con la misma vara (unidad de cuenta) y guardar valor para más adelante (depósito de valor).
- [[gastos-fijos-y-variables|Gastos fijos y variables]]: un gasto es fijo si se repite cada mes con (casi) la misma cifra sin que tú decidas, y variable si la cifra la decides tú cada mes.
- [[liquidez|Liquidez]]: la liquidez es lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.

## Bloque modulo-02

### [[aportacion-periodica|Aportación periódica]]

$$ C_{\text{año}} = C_{\text{año anterior}} \cdot (1 + i) + A $$

- $A$: la aportación de cada año (2.400,00 €).
- $i$: el tipo de interés anual en tanto por uno (5 % anual = 0,05).
- Se repite año a año, empezando en 0,00 €. La versión cerrada, para saltar directo al año $n$, está en [[horizonte-temporal]].

### [[capitalizacion|Capitalización]]

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- $i$: el tipo anual en tanto por uno (5 % anual → 0,05 anual).
- $m$: veces al año que se capitaliza (12 si es mensual, 4 si es trimestral, 1 si es anual).
- $t$: años.

Con $m = 1$ vuelve a ser la fórmula de [[interes-compuesto]].

> [!info] Ampliación fuera de los apuntes
> La fórmula general no está en los apuntes; sale de aplicar la del compuesto $m \cdot t$ veces con un tipo de $i/m$.

### [[horizonte-temporal|Horizonte temporal]]

$$ C_n = A \cdot \frac{(1+i)^n - 1}{i} $$

- $A$: la aportación de cada año.
- $i$: el tipo de interés anual, en tanto por uno (5 % anual = 0,05).
- $n$: los años, es decir, el horizonte.
- $C_n$: el capital al final del año $n$, con las aportaciones al final de cada año.

Es la cuenta año a año de [[aportacion-periodica]] resumida: el $n$ está como exponente, y por eso el tiempo pesa tanto. Con 30 años: 2.400,00 € × 66,44 ≈ **159.453,23 €**.

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1+i)^n $$

- $C_f$: el capital final, en €.
- $C$: el capital inicial, en €.
- $i$: el tipo en tanto por uno **con su periodo** (5 % anual → 0,05 anual).
- $n$: cuántos periodos de capitalización pasan (si $i$ es anual, $n$ en años).

Con los números: 1.000,00 € × 1,05³ = 1.000,00 € × 1,157625 = **1.157,63 €**.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- $I$: los intereses ganados, en €.
- $C$: el capital inicial, en €.
- $i$: el tipo en tanto por uno **con su periodo** (5 % anual → 0,05 anual).
- $t$: el tiempo, **medido en el mismo periodo que $i$** (si $i$ es anual, $t$ en años).
- $C_f$: el capital final.

### [[regla-del-72|Regla del 72]]

$$ T \approx \frac{72}{p} $$

- $T$: años para doblar el capital.
- $p$: el tipo anual en número, sin el % (6 % anual → 6).

La cuenta exacta sale de $(1+i)^T = 2$. La regla es una aproximación, **no** el resultado exacto.

### [[tipo-de-interes|Tipo de interés]]

$$ i = \frac{p}{100} $$

- $i$: el tipo en tanto por uno, el que entra en las fórmulas (5 % anual → 0,05 anual).
- $p$: el tipo en número, sin el símbolo %.

El periodo viaja con el tipo: un 0,05 anual se combina con años; un 0,05 mensual, con meses.

### Definiciones

- [[capital|Capital]]: el capital es la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.
