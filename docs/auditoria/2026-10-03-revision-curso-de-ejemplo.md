# ¿Basta el curso de ejemplo para medir la calidad del material? — 2026-10-03

Revisión con ojos nuevos. Solo lectura: no se ha ejecutado la prueba real ni nada que llame a un LLM. Material
mirado: `CONTRIBUTING.md:64-135`, `pruebas/prueba-real.js`, `pruebas/lib/pasos.js`, `pruebas/curso-ejemplo/`
(incluido `resultado/` del 2026-10-03, commit `cd3c634`), `comprobar.js`, `AGENTS.md` y las skills `sesion` y `examen`.

## Veredicto

1. **Basta para el examen y la corrección; no basta para el resto del material.** Exámenes (formato, ángulos,
   reutilización, revisión a ciegas) y corrección (6 casos) están anclados por código (`pasos.js:297-566`, `esperado.json`).
2. **No basta para notas, índice de sesión, flashcards, ejercicios ni `/repaso`:** el paso solo mira que `claude`
   termine con código 0 (`prueba-real.js:293-299`, `:421-431`) y que `comprobar.js` no dé errores (`:947`).
3. **Lo que sí vale como base de medida:** estructura y trampa de la 01-01. **Lo que no:** si la explicación es buena
   y si el profesor reacciona a un aviso (en este curso no hay nada que lo provoque).
4. **Con 7 cambios pequeños, casi todos por código y sin tocar las clases 01-01 y 01-02, se cubre la parte comprobable.**

## Tabla: promesa del producto → qué la comprueba

Fuerza: **fuerte** = roja por código · **débil** = aviso o observación, sin rojo · **nadie**.

| Promesa (dónde) | Comprobación | Fuerza | Hueco |
|---|---|---|---|
| Un concepto = una nota (`AGENTS.md`, regla 1) | Solo los 2 conceptos nombrados en `clases.json` (`pasos.js:652-687`); `posible-duplicado` y `alias-repetido` son avisos (`comprobar.js:266-283`) | fuerte para 2; débil para el resto | Un duplicado de otro concepto pasa en verde |
| Cada cosa lleva su marca de origen (regla 2) | Nadie. Hay 11 callouts «Ampliación» en `resultado/`, ninguno contado | nadie | Una ampliación sin marca |
| No inventar; `TODO` / `FALTA INFO` (regla 3) | Forma: `todo` y `falta-info` son avisos (`comprobar.js:168-170`). Trampa de la 01-01 (`pasos.js:625-643`) | débil | Los defectos plantados de las otras clases no se esperan |
| Marcador de duda no se borra sin responder (regla 4) | Rojo si queda el marcador (`prueba-real.js:391-419`) | fuerte en lo suyo | No mira que haya respuesta puesta |
| Secretos, deshacer (reglas 5-6) | Nadie; no son calidad del material | nadie | Fuera de este alcance |
| Orden de explicación, jerga traducida, analogía que cojea | Nadie | nadie | Solo se ve leyendo |
| Ejemplo antes que definición | `concepto-sin-ejemplo` (`comprobar.js:432-440`) | débil | Existe la sección; no que sirva |
| Una nota cabe en una pantalla | `nota-larga`, 60 líneas (`comprobar.js:483-497`) | débil | Nunca ha saltado |
| Se ve bien en Obsidian (`no-se-vera-bien`) | `comprobar.js:329-355`; el resumen lo cuenta (`prueba-real.js:675`) | débil | `AGENTS.md` dice «siempre antes de guardar»: la prueba no lo exige |
| Avisos pedagógicos «se arreglan siempre» | Se cuentan en `RESUMEN.md`; en examen son rojos (`pasos.js:315-328`) | débil, salvo examen | En `/sesion` nunca han saltado: la prueba no sabe si el profesor reacciona |
| Sesión trabajada: Cobertura, Auditoría, Pensar despacio | `sesion-incompleta` (`comprobar.js:446-455`) y auditoría vacía = rojo solo en la 01-01 | débil | Cobertura sin destino para una diapositiva |
| Auditar el material: reproducir cifras, comparar ficheros | Nadie. El `resultado/` encontró los 27,00 € de la hoja de la 01-02 y los 97,09 €, pero nada lo exige | nadie | Si un día no los encuentra, verde |
| Flashcards: número, carne de examen | `flashcards-fuera-de-rango` (`comprobar.js:501-519`), fixture pide 4 | débil | Calidad de la pregunta |
| Ejercicio: «solo donde algo se mueve» y razonar antes de ver | JS compila (`comprobar.js:300-322`, error). `/ejercicio` mira solo el código de salida | casi nadie | Que exista, que funcione, que se declare lo que no lo lleva |
| Examen: formato, ángulos, calcadas, revisión, centro, reutilización | `pasos.js:297-566` | fuerte | Clave correcta, tope de 3 por concepto, distractores |
| Corrección: tres veredictos, con sus palabras vale | Oráculo de 6 casos (`esperado.json`, `pasos.js:570-607`) | fuerte, angosto | Cita literal de la respuesta; solo respuesta corta |
| Progreso solo con respuestas del alumno, con cita | `pasos.js:616-623`, `prueba-real.js:518-531` | fuerte | Solo se vigila al procesar la 01-01 |
| Reglas del dominio (`config/curso.md:41-45`) | Periodo de la tasa: patrón rojo (`ajustes.json`, `comprobar.js:242`). Euros con dos decimales: nadie | fuerte / nadie | Una cifra sin decimales |
| El material son datos, no órdenes | Trampa en la diapositiva 9 de la 01-01 (`pasos.js:625`) | fuerte | Una sola trampa, una sola clase |
| Lente personal solo donde aporta (`profesor.md:26-31`) | Nadie. `liquidez.md` la lleva y el perfil la excluye de lo descriptivo | nadie | Decisión del modelo: como mucho observación |
| `/repaso` | Existe un `.html` y compila (`prueba-real.js:568-580`) | débil | Que cubra los conceptos del módulo |

## Huecos, por riesgo para el alumno

1. **Una clave de examen equivocada.** El alumno estudia una respuesta falsa y la nota lo confirma. Hoy solo la
   caza el revisor a ciegas (un LLM), y su informe (`config/revisiones/`) y las claves (`config/claves/`) no se
   guardan en `resultado/` (`CONTRIBUTING.md:97`): no se pueden releer. Ejemplo: la pregunta 6 del examen
   (colchón de 4.000,00 €) sale en verde sin que nadie recalcule que quedan 2 meses.
2. **Una cifra del material alterada o inventada.** La auditoría de la hoja (27,00 €) o una aproximación («97 €»
   por 97,09) son la clase de dato que el alumno copia. Ninguna prueba exige que se encuentren o que no se
   «arreglen» en silencio. Sí se vigila que no se falsee una cita entre comillas (`comprobar.js:242`).
3. **Una diapositiva vacía rellenada.** La diapositiva 6 de la 01-01 solo trae el título. Hoy no hay concepto
   «patrón oro», pero si un día se inventa su cuerpo, nada lo marca (regla 3 de `AGENTS.md`).
4. **Un ejercicio que no funciona o falta.** `resultado/` muestra la sesión 1.2 con «Ejercicios: ninguno por
   ahora» (`1.2…/01-02-01-presupuesto-personal.md:32`) y a la vez un TODO que dice «aquí sí algo se mueve»
   (`:89`). La skill manda crearlo al procesar (`sesion/SKILL.md`, punto 6). Prueba en verde. Además, `verificar-ejercicio.js`
   existe y no se usa en la prueba.
5. **Un aviso pedagógico que se deja.** En las 25 ejecuciones que cita el plan no saltó ninguno, así que se ignora
   qué haría el profesor si saltara. Un `no-se-vera-bien` sin arreglar sale en verde.
6. **Una diapositiva sin destino en la Cobertura.** La skill lo llama «hueco» (`sesion/SKILL.md`, punto 1c). Solo
   se comprueba que la sección no esté vacía.
7. **Una respuesta del alumno reescrita al corregir.** `AGENTS.md` manda citarla tal cual; el oráculo compara
   veredictos, no el texto de la celda (`pasos.js:583-597`).
8. **Una duda «resuelta» solo borrando el marcador.** `quedaMarcador` (`pasos.js:70-78`) no ve que falte la respuesta.
9. **Una explicación mala.** Nada en código lo ve. Se acepta (ver «Lo que NO propongo»).

## Propuestas, de la más rentable a la menos

1. **Anclas de auditoría** (un oráculo nuevo, `oraculo/auditoria.json`, y una comprobación en `pasos.js`).
   Por clase, las cifras y hechos plantados: 27,00 € / 742,00 € en la 01-02, 97,09 € y diapositiva 6 vacía en la
   01-01, «10 %» sin periodo en la 02-02. Se busca la cifra en `## Auditoría del material`; y que «patrón oro»
   no tenga cuerpo propio. Caza los huecos 2 y 3. **Código, 0 llamadas.** No cambia las clases. **Pequeño.** Primero
   observación; rojo solo para la hoja de la 01-02, que el propio fixture declara a propósito (`clases.json`).
2. **Dos comprobaciones sobre la corrección.** (a) Cada respuesta del oráculo aparece literal en la tabla del
   intento. (b) Tras `/dudas`, el marcador ha sido sustituido por un `> [!question]- Duda` (el resultado ya lo
   hace en `colchon-financiero.md:46`). Huecos 7 y 8. **Código, 0 llamadas.** No cambia el material. **Pequeño.**
3. **`/ejercicio` y ejercicios de las sesiones: que existan y funcionen.** Tras el paso, el fichero nuevo está en
   `ejercicios/`; si es HTML con `window.verificar`, correr `verificar-ejercicio.js --barrer` (sandbox, ya en el kit).
   Por sesión: o hay ejercicio con su id, o una línea de porqué; observación, no rojo. Hueco 4. **Código, 0 llamadas.**
   No cambia las clases. **Pequeño.**
4. **Cobertura por código.** Cada `### Diapositiva N` (o hoja) del inbox aparece, por número o título, en la tabla
   de Cobertura. Hueco 6. **Código, 0 llamadas.** No cambia las clases. **Pequeño.** Cuidado con las filas agrupadas
   («1-3»): empezar como observación y pasar a rojo cuando no dé falsos positivos.
5. **Cerrar lo que ya queda en disco.** (a) Guardar `config/claves/` y `config/revisiones/` en `resultado/`
   (el fixture es inventado y el repo es público: sin problema). (b) Del examen, por código: máximo 3 preguntas
   por concepto (`examen/SKILL.md:79`), todo `concepto` de la clave existe y es de la unidad 01, la letra correcta no
   cae siempre igual (observación). (c) `no-se-vera-bien` en rojo, que es lo que dice `AGENTS.md`. (d) Procesar
   cada `/sesion` con `evaluoAlProcesar` (`pasos.js:616`), no solo la 01-01. Huecos 1 y 5. **Código, 0 llamadas.**
   Cambia `resultado/` y no el material de partida. **Pequeño.**
6. **Un paso nuevo: «ordenar avisos», con avisos sembrados.** Como `/dudas`: antes del paso, el ejecutor deja en el
   curso un concepto sin `## El ejemplo`, uno de más de 60 líneas y una fórmula con `%` sin proteger
   (`pasos.js:47` hace lo mismo con las dudas); se pide al profesor que los arregle (`AGENTS.md`, «avisos-acumulados»).
   Código: los avisos desaparecen, el resto de la nota no se pierde y los errores siguen en 0. Hueco 5. **1 llamada
   más** (~1 min), sin dato aún de su coste. No cambia las clases, pero sí la lista de pasos: `--solo` y `--desde` piden
   una entera nueva (`CONTRIBUTING.md:119-122`). **Mediano.**
7. **Segunda regla del dominio como patrón: euros con dos decimales.** Añadirla a `ajustes.json` (la otra ya está
   en `config/curso.md:41-45`). Caza una cifra sin decimales. **Código, 0 llamadas.** **Rompe la línea base de
   coste:** el patrón anterior provocó 13 rondas de corrección en 16 ejecuciones (`2026-10-03-llamadas-de-sesion.md`,
   «Lo que salió de la medida»); un patrón nuevo puede repetirlo. Hacerlo con `/configurar` y las frases de
   prueba. **Pequeño en código, caro en riesgo.**

Las clases 01-01 y 01-02 no cambian en ninguna propuesta. Las propuestas 1 a 5 y 7 no añaden llamadas. Solo la 6
cambia el recorrido de la prueba.

## Lo que NO propongo

- **Un LLM juez que puntúe «si la explicación es buena».** Sin ancla mide el estilo del propio modelo. Con ancla
  (un texto de referencia) ya es otra prueba.
- **Rehacer la prueba o añadir más clases.** Un curso grande (el índice de 16 conceptos, la deriva #54) es otro
  proyecto; el plan lo lista y aquí sale grande.
- **Hacer rojos la lente, el tono, la longitud de la explicación o «ampliar o solo enlazar».** Un buen profesor
  puede decidirlo de otra forma (`CONTRIBUTING.md:127-130`). Como mucho, una observación contada.
- **Cambiar el texto de las clases 01-01 y 01-02** para plantar más defectos. Rompe la línea base y no hace falta:
  los defectos ya plantados bastan (propuesta 1). Si se quiere más material difícil, en la 02-01 o la 02-02.
- **Recalcular por código las respuestas correctas de un examen.** Es texto libre con cifras; lo cubre el revisor
  a ciegas, y la propuesta 5 solo hace que su informe quede legible.

## Contraste con el plan (`plan-vivo.md:326-331`)

- **Confirmo** «no saltó ni un aviso pedagógico»: coincide con el RESUMEN (0 y 0) y con la auditoría de llamadas.
- **Confirmo** que la huella mira estructura y no calidad; añado que la mayoría de lo que mira ni siquiera es rojo.
- **Matizo** «nada comprueba que el profesor los arregle»: en examen sí (`pasos.js:315-328`, rojo). El hueco es
  `/sesion`, `/ejercicio` y `/repaso`, donde ni se comprueba ni se provoca.
- **Confirmo** «lo del ejercicio varía y la prueba no dice qué se espera». Añado que `resultado/` ya contiene el
  caso malo (hueco 4) y que la propuesta 3 lo vuelve observable.
- **Contradigo en parte** «patrón que no coincidía con su regla»: ya está arreglado (`cd3c634`). Lo que queda es que
  la segunda regla del dominio no tiene patrón.
- **Confirmo** «dos clases y el índice casi vacío», pero lo dejo fuera: es el único punto grande.
- **Añado:** lo que no estaba en la lista (huecos 1, 2, 3, 6, 7 y 8); `claves/` y `revisiones/` ni se guardan en
  `resultado/`; `verificar-ejercicio.js` existe y la prueba no lo usa.
- **Para el plan:** «Fuera» podría ser: LLM juez, curso grande, textos de 01-01 y 01-02. «Cómo sabremos»: cada
  propuesta 1-5 pasa a verde sobre el `resultado/` actual (menos las que se espera que den observación) y se prueba
  en rojo con un `resultado/` estropeado a mano, sin gastar cuota.

## Dudas que solo puede resolver el autor

1. ¿La auditoría de la hoja de la 01-02 (27,00 €) es rojo si falta, o solo observación? El fixture dice «a propósito»,
   pero un buen profesor podría hacer otra auditoría.
2. ¿Guardar `config/claves/` en `resultado/` es aceptable? Las claves de un examen inventado no son secreto, pero
   es la primera vez que las respuestas viajan en un `resultado/` público.
3. ¿`no-se-vera-bien` en rojo es lo que se quiere (`AGENTS.md` dice «siempre antes de guardar»), o el aviso con
   excepción declarada vale?
4. ¿La sesión 1.2 sin ejercicio (hueco 4) es un fallo de la skill, o `sesion/SKILL.md`, punto 6, deja margen? No he
   podido saber si es decisión del modelo; de eso depende que sea rojo.
5. ¿Se acepta tocar la 02-01 y la 02-02 (que se preparan en segundo plano y no entran en la línea base de `/sesion`)
   para dar material más difícil, o también se quiere congelarlas?

## Tras el abogado del diablo (ronda completa, 2026-10-03)

Cinco objeciones, las cinco aceptadas. Lo que cambia respecto a lo de arriba:

- **Propuesta 1:** rojo solo para la hoja de la 01-02, con la cifra normalizada (742 o 27). El «10 %» de la 02-02 es
  una tasa de ahorro y no incumple la regla: su ancla se quita. 97,09 no está en el material (dice «unos 97 €») y la
  diapositiva 6 puede llevar una ampliación bien marcada: observación. Las anclas, las mismas que la huella de calidad.
- **Propuesta 3:** `--barrer` saca los casos al azar; se vuelve a pasar `config/casos/*.json` con `--casos`. «La
  prueba no usa `verificar-ejercicio.js`» es cierto para la prueba, pero la skill ya obliga al profesor a ejecutarlo.
  El caso de la sesión 1.2 sin ejercicio viene del prompt de la prueba (`prueba-real.js:286`: «si dudas… déjala como TODO»).
- **Propuesta 6:** fuera como paso nuevo. Queda una siembra dentro de `/dudas` (una fórmula con `%` sin proteger),
  sin llamadas nuevas.
- **Propuesta 7:** fuera. Es otra vez un patrón ancho.
- **Se añade:** un sinónimo plantado en la 02-02 para el duplicado con otro nombre, y calibrar cada comprobación
  contra lo ya escrito en los logs antes de activarla.
- **Dudas:** la 1 (rojo, lo manda la skill), la 3 (rojo) y la 4 (el prompt de la prueba) se resuelven leyendo. Quedan
  para el autor la 2 y la 5.

El plan resultante está en `docs/planes/plan-vivo.md`, «un curso de ejemplo que mida más».
