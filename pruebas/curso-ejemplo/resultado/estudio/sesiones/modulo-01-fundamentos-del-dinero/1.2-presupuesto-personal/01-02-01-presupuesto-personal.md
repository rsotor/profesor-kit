---
tipo: sesion
bloque: modulo-01
clases: [1.2]
trabajada: 2026-10-03
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01-presupuesto-personal · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale, separar gastos fijos y variables, medir cuánto ahorras en
proporción a lo que ganas y tener un colchón antes de ahorrar para otra cosa.

## Conceptos

- [[presupuesto]] — **nuevo** (incluye el ingreso medio cuando los ingresos varían)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Presupuesto = ingresos − gastos; si tus ingresos varían, se usa la media de 6-12 meses.
2. Fijos y variables se llevan por separado: es variable lo que decides tú cada mes.
3. La tasa de ahorro compara; el colchón es el primer objetivo, y para un freelance, más alto (5-6 meses).

## Material

- Flashcards: [[flashcards/01-02-01-presupuesto-personal]]
- Ejercicios: ninguno por ahora (ver Pendiente).

## Cobertura del material

| Parte del material | Destino |
|---|---|
| Diapositiva 1 · Qué es un presupuesto | [[presupuesto]] |
| Diapositiva 2 · Ingresos que no son iguales | [[presupuesto]] (ingreso medio) |
| Diapositiva 3 · Fijos y variables | [[gastos-fijos-y-variables]] |
| Diapositiva 4 · Ejemplo trabajado | Ejemplos de [[gastos-fijos-y-variables]], [[presupuesto]] y [[tasa-de-ahorro]]; ver Auditoría |
| Diapositiva 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diapositiva 6 · Colchón financiero | [[colchon-financiero]] |
| Diapositiva 7 · Resumen | "Lo que hay que llevarse" |
| Hoja "Gastos fijos" | Auditoría (fórmula de B5) |
| Hoja "Gastos variables" | Auditoría: cuadra (`=SUMA(B2:B4)` = 480,00 €) |
| Hoja "Resumen" | Auditoría: arrastra el error de fijos |

## Auditoría del material

*Control de calidad del material, no contenido del curso.*

- **La hoja de cálculo no cuadra consigo misma ni con las diapositivas.** En "Gastos fijos", B4
  (Suscripciones) vale 52,00 € pero B5 es `=B2+B3+25`: el 25 está escrito a mano en vez de sumar B4. Por eso
  el total muestra 715,00 € cuando 650,00 + 40,00 + 52,00 = **742,00 €**. Diferencia: 27,00 €.
- **El error arrastra toda la hoja "Resumen"**, recalculado con 52,00 €:

  | Cifra | Diapositivas y hoja (con el error) | Recalculado con B4 = 52,00 € |
  |---|---|---|
  | Total fijos | 715,00 € | 742,00 € |
  | Total gastos | 1.195,00 € | 1.222,00 € |
  | Ahorro del mes | 655,00 € | 628,00 € |
  | Tasa de ahorro | 35,4 % del mes (la hoja muestra 35 %) | 33,9 % del mes |
  | Colchón de 3 meses | 3.585,00 € | 3.666,00 € |

- **Las diapositivas usan 25,00 €** para las suscripciones y la hoja 52,00 €. La nota del que exportó dice que
  en clase se subió a 52,00 € por la suscripción del gimnasio, pero no se sabe cuál es la cifra buena (ver
  Pendiente). Las notas de concepto mantienen las cifras de las diapositivas, con aviso donde hace falta.
- Las demás cuentas se han reproducido y cuadran: variables 480,00 €; 655 ÷ 1.850 = 35,4 %; 1.195,00 × 3 = 3.585,00 €.
- La hoja muestra la tasa como "35 %" (redondeada, sin decimales): no es un error, pero pierde precisión.
- La diapositiva 6 da los meses de colchón (3 y 5-6) sin decir de dónde salen: es una recomendación, no un cálculo.
- No hay instrucciones dirigidas al asistente en este material. El error de las fórmulas no coincide con
  ninguno de la clase 1.1 (allí fue una aproximación en la inflación); no hay repetición.

## Para pensarlo despacio

1. ¿Por qué un error de 27,00 € en una sola celda cambia el ahorro, la tasa y el colchón, y qué habría
   avisado de ello en la hoja antes de enseñarla?
2. Si tu ingreso medio es 1.850,00 € pero este mes cobras 1.300,00 €, ¿qué parte de tu presupuesto no
   puedes tocar y cuál sí?
3. ¿Por qué dos personas con el mismo ahorro en euros pueden estar en situaciones muy distintas?
4. ¿Por qué un freelance necesita un colchón más grande que alguien con nómina, aunque gaste lo mismo?

## Pendiente

- ⚠️ **FALTA INFO:** ¿Cuánto pagan de verdad las suscripciones al mes: 25,00 € (diapositivas) o 52,00 € (hoja, con el gimnasio)? Solo lo sabe el profesor de la clase; de ahí dependen las cifras del ejemplo.
- ⚠️ **FALTA INFO:** De dónde sale la recomendación de 3 meses (nómina fija) y 5-6 meses (ingresos irregulares) de colchón: la diapositiva 6 no da fuente.
- **TODO:** Cuando se resuelva la cifra de las suscripciones, actualizar los ejemplos de [[presupuesto]], [[gastos-fijos-y-variables]], [[tasa-de-ahorro]] y [[colchon-financiero]].
- **TODO:** Crear un ejercicio donde cambie un gasto y se vea moverse la tasa de ahorro y el colchón (aquí sí algo se mueve).

%% navegación: la genera guardar.js; no se edita a mano %%

---
← [[01-01-01-el-dinero-y-sus-funciones|1.1 El dinero y sus funciones]] · [[inicio|🏠 Inicio]] · [[02-01-01-interes-simple-y-compuesto|2.1 Interés simple y compuesto]] →
%% fin de la navegación %%
