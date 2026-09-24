---
tipo: sesion
bloque: 01-02
clases: [1.2]
trabajada: 2026-09-24
fuente: inbox/clase-02-presupuesto-personal.md
estudiada: true
---
# 01-02-01 · Presupuesto personal

## En una frase

Cómo apuntar lo que entra y lo que sale cada mes, separar gastos fijos de variables, medir cuánto ahorras en proporción y tener un colchón antes de ahorrar para otra cosa.

## Conceptos

- [[presupuesto-personal]] — **nuevo** (incluye el ingreso medio para ingresos irregulares)
- [[gastos-fijos-y-variables]] — **nuevo**
- [[tasa-de-ahorro]] — **nuevo**
- [[colchon-financiero]] — **nuevo**

## Lo que hay que llevarse

1. Ahorro del mes = ingresos − gastos; con ingresos irregulares se presupuesta con la media de 6-12 meses, no con el mejor mes.
2. Un gasto es fijo o variable según quién decide la cifra ese mes, no según si se repite.
3. La tasa de ahorro compara; el colchón (3 meses de gastos, 5-6 si facturas de forma irregular) va antes que cualquier otro ahorro.

## Material

- Flashcards: [[flashcards/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]
- Ejercicios: [[ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]] _(el de colchón y gastos es una página web; los otros conceptos no llevan: ver ese fichero)_

## Cobertura del material

Fuente 1: `clase-02-presupuesto-personal` · Fuente 2: `clase-02-plantilla-presupuesto` (hoja de cálculo exportada).

| Sección | Dónde ha quedado |
|---|---|
| Diap. 1 · Qué es un presupuesto | [[presupuesto-personal]] |
| Diap. 2 · Ingresos irregulares (media 6-12 meses) | [[presupuesto-personal]] (error típico y "Visto desde tus ingresos irregulares") |
| Diap. 3 · Gastos fijos y variables, y su error típico | [[gastos-fijos-y-variables]] |
| Diap. 4 · Ejemplo trabajado en clase | No es una nota: sus cifras tienen una discrepancia (ver Auditoría). Las notas usan ejemplos inventados |
| Diap. 5 · Tasa de ahorro | [[tasa-de-ahorro]] |
| Diap. 6 · Colchón financiero | [[colchon-financiero]] |
| Diap. 7 · Resumen | Es un resumen de lo anterior: no añade nada, cubierto arriba |
| Hoja · "Gastos fijos" | Auditoría (abajo) |
| Hoja · "Gastos variables" | Auditoría: coincide con la diap. 4 |
| Hoja · "Resumen" | Auditoría: arrastra el error de "Gastos fijos" |

## Auditoría del material

*Control de calidad del material, no contenido del curso.* Primera sesión auditada: no había hallazgos anteriores en `estudio/auditoria-del-material.md`.

**La hoja de cálculo no cuadra con las diapositivas.** Miradas las fórmulas, no solo los valores:

- En "Gastos fijos", **B4 (Suscripciones) vale 52,00 €**, pero la diapositiva 4 dice 25,00 €.
- **B5 (Total fijos) es `=B2+B3+25`**: tiene el 25 escrito a mano en vez de sumar B4. Por eso sigue en 715,00 € aunque B4 diga 52,00 €.
- Recalculando con la celda B4 (650,00 + 40,00 + 52,00): fijos **742,00 €**, no 715,00 €. Gastos variables 480,00 € (coincide en las dos fuentes).

| Cifra | Diapositivas / hoja (tal como se ve) | Recalculado con B4 = 52,00 € | Diferencia |
|---|---|---|---|
| Total fijos | 715,00 € | 742,00 € | +27,00 € |
| Total gastos | 1.195,00 € | 1.222,00 € | +27,00 € |
| Ahorro del mes | 655,00 € | 628,00 € | −27,00 € |
| Tasa de ahorro | 35,4 % mensual (la hoja la muestra sin decimales) | 33,9 % mensual | −1,5 puntos |
| Colchón de 3 meses | 3.585,00 € | 3.666,00 € | +81,00 € |

**Qué es cierto y qué no.** Que la fórmula tiene un 25 fijo y que B4 dice 52,00 € se ve en la hoja: es un hecho. Cuál de las dos cifras de Suscripciones es la buena (25,00 € o 52,00 €) **no se puede saber con el material**: el comentario del fichero exportado dice que el profesor la cambió en directo por el gimnasio, pero lo cuenta quien exportó, no el profesor. Por eso las notas de concepto no usan esas cifras.

**Otros:** la hoja muestra la tasa de ahorro como un entero (formato sin decimales) mientras la diapositiva dice 35,4 % mensual: es solo redondeo. No se han visto instrucciones dirigidas al profesor en ninguno de los dos ficheros.

## Para pensarlo despacio

1. Facturas 2.400,00 € un mes y 1.300,00 € otro. Si presupuestas con el mejor mes, ¿qué te pasa el mes flojo, y por qué la media de 6-12 meses lo evita?
2. Ana y Berta ahorran cantidades distintas de euros. ¿Qué te dice la tasa de ahorro que no te dice la cifra en euros, y cuándo aun así la cifra en euros es lo que importa?
3. Un gasto que haces todos los meses, ¿es fijo? Pon un caso en que sí y otro en que no, y di qué criterio usas.
4. Un colchón de 6 meses con gastos bajos puede llenarse antes que uno de 3 con gastos altos. ¿Por qué?
5. Una hoja de cálculo con un número escrito a mano dentro de una fórmula: ¿qué riesgo tiene para tu propio presupuesto?

## Pendiente

- **TODO:** confirmar si el ejemplo de la clase usa Suscripciones = 25,00 € o 52,00 € y, con eso, corregir la hoja (`=B2+B3+B4`) o la diapositiva 4.
- **TODO:** la clase da 5-6 meses de colchón para ingresos irregulares pero no de dónde sale la cifra; ¿lo cubre otro material?
- ⚠️ **FALTA INFO:** cifra correcta de Suscripciones en el ejemplo de clase; solo la puede dar el profesor o el alumno si lo recuerda de la clase.

> [!question]- Duda · 2026-09-24
> ¿por qué esto importa para el resto del módulo?
>
> **Respuesta:** lo leo como una pregunta sobre lo pendiente de arriba (la cifra de Suscripciones y el
> 5-6 meses). Sobre esas cifras: no cambian nada de lo que viene, porque las notas de concepto usan
> ejemplos inventados y no las de la hoja. Lo que sí te llevas es el hábito que enseña el error de la
> hoja: una cifra escrita a mano dentro de una fórmula deja de actualizarse sola, y en cualquier hoja
> tuya te daría un total falso sin avisar. Del resto del módulo, con el material que hay, no puedo
> decirte más: el temario solo trae la unidad 1.1 (ya vista) y esta.
>
> **TODO:** si «esto» era otra cosa (todo el presupuesto, o el módulo entero), confirmar cuál.

%% navegación: la genera guardar.js; no se edita a mano %%

---
[[inicio|🏠 Inicio]]
%% fin de la navegación %%
