# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque modulo-1

### [[colchon-financiero|Colchón financiero]]

$$ \text{colchón} = \text{meses a cubrir} \times \text{gastos mensuales} $$

### [[inflacion|Inflación]]

$$ V = \frac{D}{1+i} $$

- $V$: lo que vale hoy, en compra real, el dinero de dentro de un año.
- $D$: la cantidad de dinero que guardas.
- $i$: la inflación anual, en tanto por uno (0,03 si es un 3 \% anual).

### [[presupuesto-personal|Presupuesto personal]]

$$ \text{ahorro del mes} = \text{ingresos del mes} - \text{gastos del mes} $$

Si sale negativo, has gastado más de lo que entró.

**Si los ingresos varían:** no presupuestes con tu mejor mes. Usa el **ingreso medio de los últimos 6-12 meses**. Con meses de 2.400,00 € y de 1.300,00 €, la media de esos dos da 1.850,00 €.

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ \text{tasa de ahorro} = \frac{\text{ahorro del mes}}{\text{ingresos del mes}} \times 100 $$

Es un porcentaje **mensual** (de ese mes), no una tasa de interés: es una proporción de tus ingresos, por eso no lleva periodo de capitalización. Despejando, el ahorro del mes es ingresos × tasa ÷ 100.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: el dinero sirve para tres cosas a la vez: cambiarlo por cualquier cosa (medio de cambio), poner precio a todo con la misma vara (unidad de cuenta) y guardar valor para más adelante (depósito de valor).
- [[gastos-fijos-y-variables|Gastos fijos y variables]]: un gasto es fijo si se repite cada mes con casi la misma cifra sin que decidas nada, y variable si la cifra la decides tú ese mes.
- [[liquidez|Liquidez]]: la liquidez es lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.

## Bloque modulo-2

### [[aportacion-periodica|Aportación periódica]]

$$ V_n = A \times \frac{(1+i)^n - 1}{i} $$

- $A$ es la aportación de cada periodo, $i$ el tipo del periodo en tanto por uno (5 % anual = 0,05) y $n$ el número de periodos.
- Vale cuando la aportación entra **al final** de cada periodo, que es como lo cuenta la clase.
- Comprobación con los datos de arriba: 2.400,00 × (1,05³ − 1) ÷ 0,05 = 2.400,00 × 3,1525 = **7.566,00 €**.

La clase no da esta fórmula: da el cálculo año a año. La fórmula es la misma cuenta, abreviada.

> [!info] Ampliación fuera de los apuntes
> La fórmula cerrada es nuestra, para comprobar la cuenta de la clase. Si la aportación fuera mensual, $i$ y $n$ pasan a ser mensuales: ver el apartado de la sesión sobre 200,00 € al mes.

### [[capitalizacion|Capitalización]]

> [!info] Ampliación fuera de los apuntes
> Los apuntes no traen esta fórmula, solo la idea.

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

- $C$: capital inicial; $i$: tipo anual en tanto por uno (0,05).
- $m$: veces al año que se capitaliza (1 anual, 12 mensual).
- $t$: años.

Con $m = 1$ es la fórmula de [[interes-compuesto]].

### [[horizonte-temporal|Horizonte temporal]]

$$ V_n = A \times \frac{(1+i)^n - 1}{i} $$

Es la de la [[aportacion-periodica]]. Aquí el protagonista es $n$, que está en el exponente: crece más rápido que $A$, que solo multiplica. Con los datos: 2.400,00 × (1,05³⁰ − 1) ÷ 0,05 = 2.400,00 × 66,4388 = **159.453,23 €**.

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1 + i)^n $$

- $C$: capital inicial (€).
- $i$: tipo en tanto por uno por periodo (5 % anual = 0,05).
- $n$: número de periodos (con tipo anual, años).

Aquí: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**. El 1,157625 es el factor por el que se multiplica el capital en 3 años.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

- $C$: capital inicial (€).
- $i$: tipo en tanto por uno (5 % anual = 0,05 por año).
- $t$: tiempo, **en el mismo periodo que el tipo** (tipo anual, años).
- $I$: intereses totales. $C_f$: capital final.

### [[regla-del-72|Regla del 72]]

$$ \text{años para doblar} \approx \frac{72}{\text{tipo anual, en número, sin el \%}} $$

Con un 9 % anual: 72 ÷ 9 = 8 años.

### [[tipo-de-interes|Tipo de interés]]

Para usarlo en las cuentas se pasa a tanto por uno:

$$ i = \frac{\text{tipo en \%}}{100} $$

Un 5 % anual es $i = 0{,}05$ (por año). El periodo del tipo manda sobre el del tiempo: si el tipo es anual, el tiempo va en años.

### Definiciones

- [[capital|Capital]]: el capital es la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.
