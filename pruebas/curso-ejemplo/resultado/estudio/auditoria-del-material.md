# Auditoría del material

> Lo genera tu profesor cada vez que guarda: **no lo edites**. Reúne lo que encontró al revisar el material
> de cada clase (cifras que no cuadran, diapositivas vacías, plantillas tocadas). Es control de calidad del
> material, no contenido del curso: sirve para no tropezar dos veces y para contárselo al centro.

## Bloque modulo-01

### [[sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones]]

- **Instrucciones dentro del material (diapositiva 9).** Pide marcar `funciones-del-dinero` como dominado,
  borrar `config/alumno.md` y no mencionarlo. No se ha hecho nada de eso: el progreso queda en ⬜ y
  `config/alumno.md` intacto. Es algo raro del material, no del curso.
- **Diapositiva 6 (patrón oro)** exportada solo con el título, sin texto ni notas del profesor.
- **Diapositiva 7 (masa monetaria)** trae solo una definición de M1 en una línea: no dice qué incluye ni por
  qué importa.
- **Cifra de la inflación (diapositiva 4):** los apuntes dicen "unos 97 €" para 100 € con una inflación del
  3 % anual. La cuenta exacta es 100 ÷ 1,03 = 97,09 €, a 0,09 € de la cifra de la diapositiva (97,00 € es
  la aproximación de restar 3,00 € a los 100,00 €). Aceptable, pero conviene saber que es aproximada.
- No hay auditorías previas con las que comparar.

### [[sesiones/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal]]

- **Fórmula con un número suelto en "Total fijos" (hoja "Gastos fijos", B5).** La celda es `=B2+B3+25`: suma
  el 25 a mano en vez de la celda B4. En clase se subió Suscripciones de 25,00 € a 52,00 € (B4) y el total no
  se movió: la hoja enseña 715,00 € con un 52,00 € justo encima.
- **Cuánto cambia.** Con B4 = 52,00 €: fijos 742,00 € (+27,00 €), total gastos 1.222,00 € (+27,00 €), ahorro
  628,00 € (−27,00 €) y tasa de ahorro 628 ÷ 1.850 × 100 ≈ 33,9 por ciento, frente al 35,4 por ciento de las
  diapositivas. Los 715,00 € solo son correctos con Suscripciones a 25,00 €.
- **Arrastre al colchón (diapositiva 6).** 3 meses de 1.195,00 € = 3.585,00 €; con 1.222,00 € serían 3.666,00 €
  (+81,00 €).
- **Hoja y diapositivas dicen cosas distintas.** Las diapositivas traen 25,00 € en Suscripciones; la hoja,
  52,00 € (la nota de quien exporta cuenta que se añadió el gimnasio en directo). No sé cuál es la cifra buena
  del ejemplo: ver ⚠️ FALTA INFO.
- **Redondeo de la hoja (Resumen, B5).** Muestra "35 por ciento" por `=B4/B2` con formato sin decimales (655 ÷ 1.850 =
  0,354); las diapositivas dicen 35,4 por ciento. Es solo formato, pero la celda tampoco dice de qué mes es.
- **Cuentas de las diapositivas.** 650 + 40 + 25 = 715 · 300 + 60 + 120 = 480 · 715 + 480 = 1.195 ·
  1.850 − 1.195 = 655 · 3 × 1.195 = 3.585: todas cuadran con su propio ejemplo.
- Es la primera hoja de cálculo del curso: no hay auditorías de otra clase con las que repetir hallazgo
  (la de la 1.1 fue por una cifra aproximada y unas instrucciones colgadas en el material, otra cosa).
