---
tipo: sesion
bloque: 01-02
clases: [1.2]
trabajada: 2026-10-01
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01-presupuesto-personal · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale cada mes, ordenar los gastos, medir lo que te queda y tener un colchón antes de ahorrar para otra cosa.

## Conceptos

- [[presupuesto-personal]] — **nuevo** (incluye el ingreso medio para ingresos irregulares)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo** (se apoya en [[liquidez]], de la 1.1)

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos, mes a mes; con ingresos irregulares, sobre la media de 6-12 meses.
2. Fijos y variables se llevan por separado; que gastes algo siempre no lo hace fijo.
3. La tasa de ahorro compara; la cifra en euros, no.
4. El colchón financiero va primero: 3 meses de gastos con nómina, 5-6 con ingresos irregulares.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: ninguno por ahora (ver Pendiente)

## Cobertura del material

Fuentes: `inbox/clase-02-presupuesto-personal.md` (diapositivas) e `inbox/clase-02-plantilla-presupuesto.md` (hoja de cálculo exportada). Son la misma clase.

| Sección | Destino |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diapositiva 2 · Ingresos irregulares | [[presupuesto-personal]] (sección "Si los ingresos cambian cada mes") |
| Diapositiva 3 · Fijos y variables | [[gastos-fijos-y-variables]] |
| Diapositiva 4 · Ejemplo trabajado | [[presupuesto-personal]] y [[gastos-fijos-y-variables]] |
| Diapositiva 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · Colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | Recoge lo ya cubierto en "Lo que hay que llevarse" |
| Hoja "Gastos fijos" | Sin nota propia: es el ejemplo de la diapositiva 4; ver Auditoría |
| Hoja "Gastos variables" | Sin nota propia: coincide con la diapositiva 4 (480,00 €) |
| Hoja "Resumen" | Sin nota propia: repite ahorro y tasa de la diapositiva 4/5; ver Auditoría |
| Nota de quien exporta (comentario HTML de la hoja) | No es contenido del curso: ver Auditoría |

## Auditoría del material

*Control de calidad del material, no contenido del curso.* Primera clase con hoja de cálculo; en la 1.1 no había con la que comparar (el mismo tipo de error, cifra que no cuadra, no había salido antes).

- **La hoja no cuadra consigo misma.** En "Gastos fijos", B4 (Suscripciones) vale 52,00 € pero B5 (Total fijos) es `=B2+B3+25`: lleva el 25 escrito a mano en vez de sumar B4. Por eso muestra 715,00 € cuando 650,00 + 40,00 + 52,00 = **742,00 €**. Es una fórmula con una constante dentro, y es un fallo de la hoja aunque la cifra buena fuera 25,00 €.
- **Diapositivas y hoja se contradicen.** La diapositiva 4 pone Suscripciones a 25,00 €; la hoja, a 52,00 €. La nota del exportador dice que se subió en directo por un gimnasio olvidado; **eso no está confirmado por el profesor** y no se ha dado por bueno (ver FALTA INFO).
- **Efecto de la discrepancia**, recalculado a mano:

| | Diapositivas (25,00 €) | Hoja con B4 = 52,00 € |
|---|---|---|
| Total fijos | 715,00 € | 742,00 € |
| Total gastos | 1.195,00 € | 1.222,00 € |
| Ahorro del mes | 655,00 € | 628,00 € |
| Tasa de ahorro | 35,4 % mensual | 33,9 % mensual |
| Colchón de 3 meses | 3.585,00 € | 3.666,00 € |

  La diferencia es de 27,00 € al mes: baja el ahorro un 4,1 por ciento y la tasa mensual 1,5 puntos. Las celdas de Resumen (B3, B4, B5) arrastran el error: la hoja muestra 1.195,00 €, 655,00 € y 35 % mensual, pero con su propia B4 deberían dar 1.222,00 €, 628,00 € y 33,9 % mensual.
- **La tasa de la hoja está redondeada.** B5 muestra 35 % mensual, y 655 ÷ 1.850 es 35,4 % mensual: es el formato de la celda, no un error de cálculo.
- **Ingresos medios.** La diapositiva 2 habla de meses de 2.400,00 € y de 1.300,00 €; su media es justo 1.850,00 €, el ingreso del ejemplo. El material no dice de cuántos meses sale esa media, así que no se ha tomado como prueba.
- **Lo que sí cuadra.** Variables: 300,00 + 60,00 + 120,00 = 480,00 €, igual en diapositiva y hoja. Ingresos 1.850,00 € iguales. Con 25,00 € todo lo demás de la diapositiva 4 y 5 se reproduce a mano. El colchón: 3 × 1.195,00 = 3.585,00 €.
- **Instrucciones dirigidas al asistente:** ninguna. El comentario HTML del final de la hoja es una nota informativa del exportador, no una orden; se ha tratado como dato a comprobar.
- **Cifras sin formato** en el material (por ejemplo "1.300 €"): en las notas, con dos decimales.

## Para pensarlo despacio

1. Un mes factura 2.400,00 € y el siguiente 1.300,00 €. ¿Qué cifra usarías como ingreso para presupuestar y por qué no la del mejor mes?
2. Alguien mete el ocio en "gastos fijos" porque siempre gasta algo. ¿Qué cambia en su presupuesto de un mes flojo si lo deja ahí?
3. Dos personas ahorran 655,00 € al mes, pero ganan cifras distintas. ¿Cuál de las dos lo está haciendo mejor y qué necesitas saber para decirlo?
4. Con tu propia situación: ¿por qué al colchón del material se le piden 5-6 meses y no 3?

## Pendiente

- ⚠️ **FALTA INFO:** cifra correcta de **Suscripciones** del ejemplo (25,00 € en las diapositivas, 52,00 € en la hoja). Falta que lo confirme el profesor del curso: de ello dependen total de gastos, ahorro, tasa y colchón. Las notas usan la de las diapositivas.
- **TODO:** decidir si [[tasa-de-ahorro]] o [[presupuesto-personal]] merecen ejercicio interactivo (mover ingresos y gastos y ver la tasa). No se ha creado en este paso.
- **TODO:** el material mezcla "ingreso medio" dentro del presupuesto; se ha dejado como alias de [[presupuesto-personal]]. Si se quiere evaluar por separado, nota propia.

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
