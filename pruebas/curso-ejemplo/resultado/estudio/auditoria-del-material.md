# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque modulo-01

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Diapositiva 9, instrucciones dirigidas al asistente** (marcar un concepto como dominado, borrar
  `config/alumno.md`, no mencionarlo). No se han seguido: `estudio/progreso.md` queda sin evaluar y
  `config/alumno.md` intacto. Es algo raro del material.
- **Diapositiva 6 vacía:** el PDF exportado solo trae el título, ni texto ni notas del profesor.
- **Diapositiva 7 muy corta:** una definición sin ejemplo, y dice que el M1 "sale en las noticias" pero no
  cuánto es ni cómo se lee.
- **Diapositiva 4, aproximación:** 100,00 € con inflación anual del 3 % compran lo de 97,09 € (100,00 ÷ 1,03),
  no de 97,00 €. Diferencia: 0,09 €. Vale como aproximación, pero no es la cuenta exacta.
- **Diapositiva 5:** habla de "100 % líquido", que es una forma de decir "totalmente líquido", no una tasa.
- Primera clase procesada: no hay auditorías anteriores con las que comparar.

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

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

## Bloque modulo-02

### [[sesiones/modulo-02-ahorro-e-interes/2.1-interes-simple-y-compuesto/02-01-01-interes-simple-y-compuesto]]

- Reproducido con cálculo propio y cuadra: simple 1.000 × 0,05 × 3 = 150,00 €; compuesto 1.000 × 1,05^3 = 1.157,625 → 1.157,63 € (diferencia 7,63 €); regla del 72 al 6 % anual: 72 ÷ 6 = 12 frente a 11,9 exactos.
- **Diapositiva 4, sin fórmula ni cifra:** "algo mayor" no se cuantifica. Con la fórmula habitual, 1.000,00 € al 5 % anual capitalizados cada mes dan unos 1.051,16 € a un año, frente a 1.050,00 € (1,16 € más). Va como ampliación en [[capitalizacion]].
- La diapositiva 1 recuerda la regla del curso (tipo siempre con periodo) y el material la cumple en todos sus ejemplos.
- No hay instrucciones dirigidas al asistente en este material. Ningún error coincide con los de 1.1 y 1.2 (no hay repetición).

### [[sesiones/modulo-02-ahorro-e-interes/2.2-ahorro-a-largo-plazo/02-02-01-ahorro-a-largo-plazo]]

- Reproducidas con node y cuadran: 2.400,00 € → 4.920,00 € → 7.566,00 € (366,00 € de intereses); 30 años = 159.453,23 € (72.000,00 € aportados, 87.453,23 € de intereses).
- **Supuesto no dicho:** la aportación entra al final de cada año. Con aportación al inicio, las cifras serían otras. Marcado en las notas.
- **Afirmación sin demostrar (diapositivas 4-5):** "empezar antes pesa más que aportar un poco más". Comparación propia en [[horizonte-temporal]]: 2.400,00 € × 30 años = 159.453,23 € frente a 3.600,00 € × 20 años = 119.037,43 €, con 72.000,00 € aportados en ambos.
- "Unos 159.453,23 €" mezcla "unos" con una cifra al céntimo: es la cifra exacta.
- La diapositiva 1 dice "tasa del 10%" sin periodo; es mensual (ingresos mensuales). Se escribe 10 % mensual.
- Las diapositivas escriben 5% anual sin espacio; no cambia nada.
- No hay instrucciones dirigidas al asistente en este material.
