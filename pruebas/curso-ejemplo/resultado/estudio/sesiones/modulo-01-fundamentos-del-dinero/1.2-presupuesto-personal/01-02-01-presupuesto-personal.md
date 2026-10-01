---
tipo: sesion
bloque: "1.2"
clases: ["1.2"]
trabajada: 2026-10-01
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01-presupuesto-personal · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale cada mes, separar gastos fijos y variables, medir cuánto ahorras en proporción y tener una reserva para los meses flojos.

## Conceptos

- [[presupuesto-personal]] — **nuevo**
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; con ingresos irregulares se usa la media de 6-12 meses.
2. Fijo es lo que no decides cada mes; variable, lo que sí. El ocio es variable.
3. La tasa de ahorro compara; el colchón (5-6 meses si facturas) es el primer objetivo.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-colchon-financiero]] (colchón, con cifras propias, no las de la hoja). Los demás, por ahora ninguno. Los que se moverían (tasa de ahorro, colchón) parten de las cifras del ejemplo, y la hoja de la clase no coincide con las diapositivas; mejor esperar a aclarar la cifra de suscripciones.

## Cobertura del material

Fuentes: `inbox/clase-02-presupuesto-personal.md` (diapositivas) y `inbox/clase-02-plantilla-presupuesto.md` (hoja de cálculo exportada con sus fórmulas).

| Sección | Destino |
|---|---|
| Diap. 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diap. 2 · Ingresos irregulares | [[presupuesto-personal]] (recuadro de la lente) |
| Diap. 3 · Fijos y variables | [[gastos-fijos-y-variables]] |
| Diap. 4 · Ejemplo trabajado | [[presupuesto-personal]] y [[gastos-fijos-y-variables]] |
| Diap. 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diap. 6 · Colchón financiero | [[colchon-financiero]] |
| Diap. 7 · Resumen | Repite las diapositivas 1-6: es «Lo que hay que llevarse» |
| Hoja «Gastos fijos» | Auditoría (cifra discutida); el modelo es [[gastos-fijos-y-variables]] |
| Hoja «Gastos variables» | Cuadra con las diapositivas (480,00 €); [[gastos-fijos-y-variables]] |
| Hoja «Resumen» | Auditoría; el modelo es [[presupuesto-personal]] y [[tasa-de-ahorro]] |

## Auditoría del material

> Control de calidad del material, no contenido del curso.

- **Total de gastos fijos mal calculado en la hoja.** La celda `B5` de «Gastos fijos» es `=B2+B3+25`: suma el 25 «a mano» en vez de la celda `B4`. En directo se cambió «Suscripciones» de 25,00 € a 52,00 € (según la nota de quien exportó, por olvidar el gimnasio) pero la fórmula no se tocó.
- **Cifras reproducidas con mi propio cálculo:**

| Dato | Hoja (mostrado) | Recalculado con `B4` = 52,00 € | Diferencia |
|---|---|---|---|
| Total fijos | 715,00 € | 650,00 + 40,00 + 52,00 = 742,00 € | 27,00 € |
| Total gastos | 1.195,00 € | 742,00 + 480,00 = 1.222,00 € | 27,00 € |
| Ahorro | 655,00 € | 1.850,00 − 1.222,00 = 628,00 € | 27,00 € |
| Tasa de ahorro | 35 % mensual | 628 ÷ 1.850 ≈ 33,9 % mensual | ≈ 1,5 puntos |
| Colchón de 3 meses | 3.585,00 € | 1.222,00 × 3 = 3.666,00 € | 81,00 € |

- **Las diapositivas y la hoja no coinciden:** la diapositiva 4 dice 25,00 € de suscripciones; la hoja, 52,00 €. Con 25,00 € todo cuadra (715,00 €); con 52,00 € no. Con este material no se puede saber cuál es la cifra buena (¿hay una suscripción más de 27,00 € o se editó la hoja por error?).
- **Redondeo de la tasa:** la hoja muestra «35 % mensual» (la celda tiene 35,4 % mensual, formateada sin decimales); las diapositivas dicen 35,4 % mensual. Es solo formato.
- **Decisión conservadora:** las notas usan la cifra de las diapositivas (25,00 €), que es la que cuadra consigo misma, y lo dicen en [[gastos-fijos-y-variables]].
- Primera auditoría con hoja de cálculo; no hay un error igual en clases anteriores (la 1.1 tenía otros: instrucciones en una diapositiva, diapositivas vacías y un redondeo).

## Para pensarlo despacio

1. Si un mes facturas 1.300,00 € y presupuestaste con 1.850,00 €, ¿qué pasa y qué habrías hecho distinto?
2. ¿Por qué el ocio es variable aunque gastes algo todos los meses? ¿Y una suscripción que puedes cancelar cuando quieras?
3. Dos personas ahorran 400,00 € al mes, una ingresa 1.500,00 € y otra 4.000,00 €. ¿Cuál lo está haciendo mejor y por qué?
4. ¿Por qué el colchón tiene que estar en algo líquido, aunque rinda menos?
5. En la hoja de cálculo, ¿qué riesgo tiene escribir un número a mano dentro de una fórmula?

## Pendiente

- ⚠️ **FALTA INFO:** cifra real de «Suscripciones» (25,00 € en las diapositivas, 52,00 € en la hoja). Solo la resuelve el profesor del curso o el alumno si recuerda la clase.
- **TODO:** cuando se aclare la cifra, decidir si se corrigen los ejemplos y se prepara un ejercicio de tasa de ahorro y colchón.

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
