# Formulario

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Lo que hay que saberse de cada concepto, por
> bloque: su fórmula si la tiene, y si no, su definición en una frase.

## Bloque modulo-1

### [[colchon-financiero|Colchón financiero]]

$$ \text{colchón} = \text{gastos del mes} \times \text{meses a cubrir} $$

Lo que gastas al mes, multiplicado por los meses que quieres aguantar sin ingresos.

### [[ingreso-medio|Ingreso medio]]

$$ \text{ingreso medio} = \frac{\text{suma de lo ingresado}}{\text{número de meses}} $$

La suma de los ingresos de los últimos 6-12 meses, dividida entre cuántos meses has contado.

### [[presupuesto|Presupuesto]]

$$ \text{ahorro del mes} = \text{ingresos del mes} - \text{gastos del mes} $$

Lo que entra menos lo que sale. Si da negativo, ese mes has gastado más de lo que ingresaste.

### [[tasa-de-ahorro|Tasa de ahorro]]

$$ \text{tasa de ahorro} = \frac{\text{ahorro del mes}}{\text{ingresos del mes}} \times 100 $$

El ahorro dividido entre lo que entró, pasado a por cien. Aquí no es un interés: es la proporción del mes que te quedó.

### Definiciones

- [[funciones-del-dinero|Funciones del dinero]]: el dinero sirve para tres cosas a la vez: pagar cualquier cosa (medio de cambio), ponerle precio a todo con la misma vara (unidad de cuenta) y guardar valor para más adelante (depósito de valor).
- [[gastos-fijos-y-variables|Gastos fijos y variables]]: un gasto es fijo si se repite cada mes con (casi) la misma cifra sin que decidas nada, y variable si la cifra la decides tú cada mes.
- [[inflacion|Inflación]]: la inflación es la subida general y sostenida de los precios: con el mismo dinero, mañana se compra menos que hoy.
- [[liquidez|Liquidez]]: la liquidez es lo fácil y rápido que es convertir algo en dinero para gastarlo ya, sin perder valor por las prisas.

## Bloque modulo-2

### [[aportacion-periodica|Aportación periódica]]

El curso solo da el cálculo año a año de arriba, no una fórmula.

> [!info] Ampliación fuera de los apuntes
> Hacer la cuenta año a año a 30 años es largo; hay un atajo, que da lo mismo que el cálculo año a año (comprobado con el ejemplo de 3 años: 7.566,00 €). Con $A$ la aportación al final de cada año, $i$ el interés anual en tanto por uno y $n$ los años:
>
> $$ \text{total} = A \times \frac{(1+i)^n - 1}{i} $$
>
> Con 2.400,00 € al año, $i = 0{,}05$ anual y $n = 3$: 2.400,00 × 3,1525 = **7.566,00 €**. Supone que cada aportación entra al final del año.

### [[capitalizacion|Capitalización]]

$$ C_f = C \cdot \left(1 + \frac{i}{m}\right)^{m \cdot t} $$

Es la del [[interes-compuesto]] con el tipo troceado: `m` es cuántas veces al año se capitaliza (12 si es mensual) y `t` los años. Esta forma general es ampliación mía; la clase solo cuenta la idea.

### [[horizonte-temporal|Horizonte temporal]]

Sin fórmula en el curso: el total sale de la cuenta año a año de [[aportacion-periodica]].

### [[interes-compuesto|Interés compuesto]]

$$ C_f = C \cdot (1 + i)^n $$

`C` es el [[capital]] inicial, `i` el [[tipo-de-interes]] en tanto por uno y `n` el número de periodos de capitalización (si `i` es anual, `n` en años). Comprobación: 1.000,00 × 1,05³ = 1.000,00 × 1,157625 = **1.157,63 €**.

### [[interes-simple|Interés simple]]

$$ I = C \cdot i \cdot t \qquad C_f = C + I $$

`C` es el [[capital]] inicial, `i` el [[tipo-de-interes]] en tanto por uno (5 % anual = 0,05) y `t` el tiempo **en el mismo periodo que `i`** (si `i` es anual, `t` en años). `I` son los intereses y `Cf` el capital final.

### [[regla-del-72|Regla del 72]]

$$ \text{años para doblar} \approx \frac{72}{\text{tipo anual (el número, sin el signo de porcentaje)}} $$

Con un tipo de 6 % anual se divide entre 6. Solo vale para interés compuesto y con el tipo anual.

### Definiciones

- [[capital|Capital]]: el capital es la cantidad de dinero de la que se parte: lo que se presta, se deposita o se invierte.
- [[tipo-de-interes|Tipo de interés]]: el tipo de interés es el precio del dinero: cuánto se paga (o se cobra) por tenerlo prestado durante un tiempo, en tanto por ciento y siempre con su periodo.
