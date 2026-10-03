# Menos llamadas al cerrar `/sesion`, y de quién es el ahorro — 2026-10-03

Informe fijo de una sesión de trabajo (Roberto + Claude) sobre cuántas llamadas al modelo gasta `/sesion` y qué se
puede quitar sin perder calidad del material. El plan vivo se recorta y se archiva; este informe se queda para
entender el cambio dentro de meses. Cambio en el commit `cd3c634`.

## Resumen

1. **Se preguntaba** cómo hace `/sesion` su trabajo en menos llamadas sin empeorar el material. El piloto de lectura
   del día anterior ahorró poco: tocaba la parte barata.
2. **Se encontró** que casi todas las llamadas «de más» eran rondas de `comprobar.js` → corregir (13 de 16 ejecuciones),
   siempre por `patron-prohibido`, y que la causa era un patrón demasiado ancho del curso de ejemplo.
3. **Se cambió:** el patrón del curso de ejemplo, `comprobar.js` (texto de la línea y citas entre comillas exentas),
   `/configurar`, y `guardar.js` como cierre de `/sesion`, `/ejercicio` y `/actualizar`.
4. **Se midió después** (3 + 3 ejecuciones): `/sesion 01-01` de 10 a 6 llamadas, `/sesion 01-02` de 14 a 9, misma
   huella de calidad, 0 citas del material alteradas. La prueba entera sobre `cd3c634` salió 16/16 y corrección 6/6.
5. **El ahorro es, casi todo, del curso de ejemplo** (deja de fallar por su patrón). En un curso sin patrones, como
   el curso real, queda solo el cierre con `guardar.js`: ~4 %.

## Qué se midió y cómo

- **Datos de partida:** las 16 ejecuciones de `/sesion` que ya había (8 de la 01-01 y 8 de la 01-02), sacadas de los
  logs del piloto y de las dos pruebas enteras aisladas, sin gastar cuota nueva.
- **Contrafactual:** para cada corte posible, contar qué costaron las llamadas que quitaría y que ya ocurrieron.
  Es gratis y no tiene ruido. Un corte con techo por debajo del ruido no se ejecuta.
- **Coste ponderado, a precio de API:** leer de caché ×0,1 · escribir en caché ×2 (el TTL es de 1 h) · salida ×5.
- **Por qué los tokens brutos engañaban:** la mayor parte de lo que entra es lectura de caché, que es barata. Una
  `/sesion` es 19–29 % leer de caché, 40–50 % escribir en caché y 28–33 % salida. El mismo recorte baja un 45 % en
  brutos y un 23 % ponderado.
- **Huella de calidad por ejecución**, sacada de lo escrito: mismos conceptos, secciones de cada nota, cobertura sin
  huecos, hallazgos de la auditoría, avisos de `comprobar.js` y citas del material alteradas al corregir.
- **Estratos del entregable:** con y sin ejercicio, comparando solo dentro del mismo estrato. Sin estratos, la 01-01
  va de 160 a 297 K; sin ejercicio, de 160 a 208 K (mediana 186 K).
- Los guiones de medida están en `pruebas-local/medida-sesion/` (ignorada por git). Pasarlos al repo sigue pendiente.

## Lo que salió de la medida

1. **Rondas de `comprobar.js` → corregir.** 13 de 16 ejecuciones fallan al menos una vez (14 rondas), siempre por
   `patron-prohibido` (23 líneas, más 2 de `ejercicio` en una). Cada ronda son 2–5 llamadas.
   - De las 23 líneas, 15 son la auditoría citando o describiendo el material («la hoja muestra "35%"»), 4 son
     porcentajes que no son una tasa y 4 son «el 3 %» de la inflación sin periodo. La regla dice «tasa de interés»;
     el patrón cazaba cualquier `N %`.
   - **Corregir empeora el material:** en 2 ejecuciones la cita pasó a decir «"35% mensual"», que el material no dice.
   - El error solo daba el número de línea: 6 de 16 gastan una llamada en ir a mirarla.
2. **`comprobar.js` bueno y, en otra llamada, `guardar.js`**, que vuelve a comprobar por dentro: 14 de 16. En las 16
   no salió ningún aviso pedagógico, solo `todo` y `falta-info`, que no se arreglan.
3. **Escribir:** 1–4 llamadas (todo en una, 2 de 16). Los ficheros vivos en llamada propia, 6 de 16; un `Edit`
   fallido sobre ellos, 1 de 16.
4. **El entregable cambia entre ejecuciones iguales.** Hace ejercicio en 2 de 8 (01-01) y en 6 de 8 (01-02). Con
   ejercicio, ~+25 % de coste (01-02: 222 K sin, 280 K con; n = 2 y 6). Es la mayor fuente de dispersión y no es
   ineficiencia. Corrige al piloto: el +28 % no era solo el paquete grande.
5. **La métrica:** ponderado y no bruto. **TODO:** cómo pondera la cuota de la suscripción; no sale en los logs.

Contrafactual sobre las 16 (mediana, coste ponderado):

| Corte | Qué quita | 01-01 | 01-02 |
|---|---|---|---|
| B. Que no falle a la primera | las rondas ✗ → corregir | −16 % | −10 % |
| A. Cerrar con un comando | el `comprobar.js` bueno antes de `guardar.js` | −4 % | −3 % |
| D. Ficheros vivos por herramienta | sus `Edit` y su llamada propia | −2 % | −4 % |
| C. Escribir todo en una tanda | 1–2 llamadas de escribir | −2 % | −2 % |
| Los cuatro | de 10 a 6 llamadas · de 14 a 8 | −23 % (−45 % brutos) | −20 % (−41 % brutos) |

## Qué se decidió y por qué

- **B, que no falle a la primera.** Dos partes. Arreglo del curso de ejemplo (abarata la prueba, no el producto): su
  patrón solo cuenta el `%` si la línea habla de interés, TAE o TIN antes de la cifra. Producto: `comprobar.js` trae
  el texto de la línea; `/configurar` prueba el patrón contra frases que no incumplen la regla; `patrones_prohibidos`
  no mira lo que va entre comillas (la cita literal del material).
- **A, cerrar con un comando.** `guardar.js` es el cierre: enseña los errores y, al guardar, los avisos de calidad
  de lo tocado (tope de 10 líneas y «y N más»). Cambia el producto para todas las skills.
- **Forma (a) frente a (b) reducida.** (a): `guardar.js` no guarda si lo tocado trae avisos nuevos, y `--con-avisos`
  fuerza. (b): guarda y enseña los avisos; el profesor los arregla y guarda otra vez. **Se eligió la (b).** La (a)
  cayó en la ronda completa del diablo (ver abajo): no compensa un 3–4 %, y en segundo plano nadie puede decidir
  `--con-avisos`. El ahorro es el mismo, porque sale de no llamar a `comprobar.js` aparte.
- **D, ficheros vivos por herramienta (`guardar.js` genera `conceptos/_index.md` y las filas ⬜ de `progreso.md`).**
  No por coste (−2–4 %): quita `Edit` fallidos y fija el formato por código. Pide migrar cursos reales: plan propio.
- **C, escribir todo en una tanda: descartado.** Techo −2 %, y el precedente de pedir un orden en la skill es 0 de 6.
- **El punto 4 del corte 1 se cae** (`leer.js --para sesion` añadiendo los `mensaje` de `patrones_prohibidos`).
  Comprobado sobre el curso real: no tiene patrones (`patrones_prohibidos: []`; en sus logs, 6 guardados de sesión
  y ningún `comprobar.js` con errores). Las rondas ✗ eran del curso de ejemplo.
- **La sonda de la cuota no se hace:** con un −3–4 % en juego no cambia ninguna decisión. Decide el coste ponderado.

## Rondas del abogado del diablo

| Ronda | Fecha | Objeciones | Qué cambió |
|---|---|---|---|
| Corta | 2026-10-03 | 5, las 5 aplicadas | Eximir la auditoría por sección escondía incumplimientos del profesor: solo lo entrecomillado. «Cerrar con `guardar.js`» guardaba antes de arreglar avisos: se declara el cambio de `AGENTS.md`. Criterios cumplidos por construcción: casos plantados y huella antes de ejecutar. El corte 1 abarata la prueba, no el producto: se etiqueta. 3 + 3 no sostienen un umbral de coste: el coste es dato, no puerta. |
| Completa, sobre el corte 2 | 2026-10-03 (noche) | 5, las 5 aceptadas | Veredicto: la forma (a) no compensa un 3–4 %. Se pasa a la (b) reducida. En segundo plano nadie decide `--con-avisos` · «aviso nuevo» no tiene definición barata · cinco guardados internos quedarían bloqueados · `--con-avisos` acabaría siendo lo normal · la lista de sitios que pedían `comprobar.js` antes de guardar estaba incompleta. |

## Qué cambió en el código y los textos

Commit `cd3c634`, 12 ficheros.

- `.kit/herramientas/comprobar.js`: `patron-prohibido` trae el texto de la línea y no mira lo entrecomillado.
- `.kit/herramientas/guardar.js`: enseña los errores y, al guardar, los avisos de calidad de lo tocado (tope de 10).
- `.kit/herramientas/tests/` (`cli`, `comprobar-avisos`): tests de lo anterior. `coherencia-skills`: falla si una skill pide `comprobar.js` justo antes de `guardar.js`.
- `AGENTS.md`: «antes de guardar» pasa a «antes de dar nada por cerrado»; tabla de Herramientas.
- `.kit/skills/` `sesion`, `ejercicio`, `actualizar`: cierran con `guardar.js`. `configurar`: prueba el patrón contra frases que no incumplen la regla.
- `pruebas/curso-ejemplo/config/ajustes.json`: patrón estrechado a `\b(inter[eé]s(es)?|TAE|TIN)\b` antes de la cifra
  (sin «tipo», que saltaba con «este tipo de gasto»).
- `docs/planes/plan-vivo.md`: medida, diseño, rondas del diablo y resultado.
- No se toca `.kit/guias/segundo-plano.md`: el coordinador comprueba y guarda una vez.

## Resultado medido

Con `--solo`, Sonnet, aislado. Cuota de 5 h del 21 % al 29 % con 9 ejecuciones y la conversación de trabajo.

| | Llamadas | Coste ponderado | Guardar con ✗ | Huella de calidad |
|---|---|---|---|---|
| 01-01 antes (8) | 8–15, mediana 10 | sin ejercicio: 160–208 K, mediana 186 | 7 de 8 | — |
| 01-01 ahora (3) | 6, 6, 6 | 144, 150, 157 K (−19 %) | 0 de 3 | igual; trampa cazada 3 de 3 |
| 01-02 antes (8) | 9–15, mediana 14 | sin ejercicio 200 y 245 K · con, 229–312 K (mediana 280) | 6 de 8 | — |
| 01-02 ahora (3) | 9, 8, 9 | sin ejercicio 182 y 192 K · con, 234 K | 0 de 3 | igual; trampa cazada 3 de 3 |

- Criterios: rondas ✗ por `patron-prohibido` 0 de 6 (antes 13 de 16) · `comprobar.js` suelto antes de guardar 0 de 6
  (antes 14 de 16) · citas del material alteradas 0 de 6.
- **Prueba entera sobre `cd3c634`:** 16/16 pasos, corrección 6/6, 5 permisos denegados, todos lecturas o comandos
  encadenados por la shell en `/sesion 01-02`, `/examen` y `/repaso`. La ventana de cuota de 5 h pasó del 32 % al 42 %.
- **No demuestra:** el coste de la 01-02 (1–2 ejecuciones por estrato: es dato, no prueba) · que las explicaciones
  sean buenas (la huella mira estructura: eso pide leerlas) · el ahorro en el curso real, que no tiene patrones (~4 %).

## Errores del proceso que conviene no repetir

- **Una tanda de 3 se tiró** (la primera de la 01-02): las copias de `--solo` llevan su propio `config/`, con el
  patrón viejo. Falló 3 de 3 al guardar y una cita volvió a salir falseada. Antes de medir, comprobar con qué
  `config/` corre cada copia.
- **Medir llamadas sin mirar por qué fallaba `comprobar.js`.** El piloto contó llamadas y no la causa. El mismo
  fallo ya se había arreglado para la respuesta del alumno en la 0.28.0.
- **El +28 % del piloto atribuido solo al paquete grande.** Parte era que la 01-01 hizo ejercicio en 2 de 3
  (0 de 5 antes). Sin estratos del entregable, la dispersión se confunde con efecto.

## Lo que queda abierto

- **Fuera de este cambio:** el bucle de `verificar-ejercicio.js` dentro de `/sesion` (lo siguiente que pesa en la
  01-02) · recortar lo fijo (`AGENTS.md`, 14–32 %) · el corte D · el coordinador de varias clases · medir Codex.
- **Para vigilar:** hace ejercicio en 2 de 9 (antes, con el mismo paquete de lectura, 3 de 10): sin señal, pero son
  pocas · 2 permisos denegados en 9, por `cat config/ajustes.json; ls -R estudio | head; cat …` antes de escribir ·
  un `Edit` fallido sobre `mapa-del-curso.md` costó un segundo guardado (es el corte D).
- **Bandeja:** `--solo` y `--desde` no refrescan `config/` de la copia · `pruebas/coste.js` no existe (los guiones
  están en `pruebas-local/medida-sesion/`) · falta la línea del CHANGELOG de los dos cortes.
- **Revisión del curso de ejemplo:** tiene su propia sección en `docs/planes/plan-vivo.md`.
