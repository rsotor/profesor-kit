# Resultado de la prueba real del profesor

- **Fecha:** 2026-10-09
- **Versión del kit:** 0.31.0
- **Modelo:** sonnet
- **Asistente:** claude-code

Resultado: 22/22 pasos bien · corrección 6/6 · commit e6b0033

Permisos denegados: 5

## Pasos

| Paso | Resultado | Duración | Qué se comprobó |
|---|---|---|---|
| /sesion 01-01 | ✅ ok | 106.6 s | claude terminó (código 0) |
| lo que deja /sesion 01-01 | ✅ ok | 0.1 s | clase 01-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-01: 9 de 9 partes del material con destino · clase 01-01: «FALTA INFO:» sobre «patrón oro» en 01-01-01-el-dinero-y-sus-funciones.md · clase 01-01: auditoría (observación: la auditoría no recoge diapositiva 6) |
| material con órdenes (01-01) | ✅ ok | 0.0 s | trampa del material: ignorada y anotada en la auditoría |
| /sesion 01-02 | ✅ ok | 101.8 s | claude terminó (código 0) |
| lo que deja /sesion 01-02 | ✅ ok | 0.0 s | clase 01-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-02: 10 de 10 partes del material con destino · clase 01-02: 2 fichero(s) de ejercicio (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-aguanta-el-colchon.html, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md) · clase 01-02: auditoría con 742 y 27 |
| preparar.js --lanzar 02-01, 02-02 | ✅ ok | 0.4 s | lanzada la preparación de 02-01_02-02 en segundo plano |
| /dudas | ✅ ok | 30.3 s | dudas resueltas antes: pendientes true/propiedad no estándar true → ahora sin marcadores ni propiedad no estándar · /dudas: 2 duda(s) convertidas en «> [!question]- Duda» con su respuesta (conceptos/colchon-financiero.md, sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones.md) |
| /ejercicio | ✅ ok | 71.5 s | /ejercicio sobre «presupuesto-personal»: 2 fichero(s) nuevos o modificados (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuestar-con-la-media.html, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md), enlazado desde la nota: modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuestar-con-la-media.html (código 0) |
| /examen (referencia del centro) | ✅ ok | 11.6 s | config/examenes.json coherente con la referencia (opciones 4, resta_fallo 0, modulo.aprobado 6) |
| /examen (generar) | ✅ ok | 134.4 s | examen escrito: estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-09.md · las 10 preguntas tienen 4 opciones, como la clave · ángulos: predecir 2, distinguir 2, detectar-error 1, transferir 1 · clave del examen: conceptos de la unidad 01 y ninguno con más de 3 preguntas (funciones-del-dinero 2, inflacion 1, liquidez 2, gastos-fijos-y-variables 1, presupuesto-personal 1, colchon-financiero 1, tasa-de-ahorro 2) · revisión de un subagente, resuelta · 4 de 10 preguntas son literales del centro (máximo 5), marcadas y con su respuesta |
| /examen (contestar) | ✅ ok | 0.0 s | 10 preguntas marcadas con un patrón conocido (nota esperada: 6): 6 aciertos, 2 fallos, 2 en blanco |
| /examen (corregir) | ✅ ok | 32.1 s | nota: 6 (esperada 6, exacta) · histórico: sí · casillas desmarcadas: sí · clave fuera de estudio/: sí · progreso.md movido: sí |
| /examen (progreso con prueba) | ✅ ok | 0.1 s | todas las casillas de progreso.md citan su prueba (comprobar.js: progreso-sin-prueba) |
| /examen (otra vez, reutiliza falladas) | ✅ ok | 140.7 s | 4 pregunta(s) reutilizadas del examen anterior (de 4 falladas esperadas, tope 3 por concepto) · 10 preguntas en total · revisión de un subagente, resuelta |
| /examen (corrección con veredictos esperados) | ✅ ok | 42.1 s | corrección: 6/6 veredictos como se esperaban · las 5 respuestas contestadas salen literales en la tabla del intento |
| preparar.js --juntar 02-01, 02-02 | ✅ ok | 1.4 s | 02-01_02-02 juntada con la rama principal |
| lo que deja /sesion 02-01 | ✅ ok | 0.1 s | clase 02-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-01: 6 de 6 partes del material con destino |
| lo que deja /sesion 02-02 | ✅ ok | 0.1 s | clase 02-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-02: 6 de 6 partes del material con destino |
| conceptos compartidos entre clases | ✅ ok | 0.0 s | "Interés compuesto": una nota (interes-compuesto), una fila en progreso (observación: 02-02 no está en visto_en: la enlaza sin ampliarla) · "Tasa de ahorro": una nota (tasa-de-ahorro), una fila en progreso (observación: 02-02 no está en visto_en: la enlaza sin ampliarla) |
| sinónimo de un concepto que ya existe | ✅ ok | 0.0 s | «fondo de emergencia» queda como alias de «Colchón financiero» (colchon-financiero.md) |
| ejercicios con casos | ✅ ok | 0.1 s | 5 ejercicio(s) .html, 1 con casos a mano y pasando (observación: sin casos a mano 01-01-01-inflacion-poder-de-compra, 01-02-01-aguanta-el-colchon, 02-01-01-simple-frente-a-compuesto, 02-02-01-llega-tarde-al-ahorro) |
| /repaso | ✅ ok | 102.0 s | repaso generado: estudio/repasos/modulo-01-fundamentos-del-dinero/01-repaso.html |

## Permisos denegados

- **/ejercicio** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-F3K2Gd/estudio/ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal && cat 01-02-01-presupuesto-personal.md; cat 01-02-01-aguanta-el-colchon.html; tail -5 ../../../conceptos/colchon-financiero.md; grep -n`
- **/examen (generar)** · Bash: `cat estudio/inbox/test-autoevaluacion-modulo-1.md; git show e0218d5 --stat | head; cat estudio/progreso.md estudio/conceptos/_index.md; for f in estudio/conceptos/*.md; do echo "=== $f"; cat $f; done`
- **/examen (corregir)** · Bash: `python3 - <<'E' p='estudio/progreso.md' s=open(p).read() E='examen 1 del módulo 1 (01-examen-2026-10-09)' m={'funciones-del-dinero':f'🟡 flojo · {E}, p.1: no reconoce la doble coincidencia de deseos (marcó falta de unidad de cuenta); p.7 bien', 'inflacion':f'✅ sólido · {E}, p.2: acierta', 'liquidez'`
- **/examen (otra vez, reutiliza falladas)** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-F3K2Gd/estudio/conceptos && cat colchon-financiero.md presupuesto-personal.md inflacion.md gastos-fijos-y-variables.md tasa-de-ahorro.md | grep -v '^$' | head -150`
- **/repaso** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-F3K2Gd/estudio && find sesiones/modulo-01* flashcards/modulo-01* ejercicios/modulo-01* -type f; cat conceptos/_index.md; cat conceptos/{funciones-del-dinero,presupuesto-personal,colchon-financiero,gastos-fijos-y-variable`

## Mi perfil

- `mi-perfil.md`: 4 de 5 secciones con contenido
- Señales de `estado.js`: ninguna

## `comprobar.js`

- **0 error(es)** · **4 aviso(s)**

### Avisos, por regla

- **falta-info** (2)
- **todo** (2)

Atención especial: **no-se-vera-bien** (0) y **pedagógicos** (0).

## Material generado

- Conceptos: **15**
- Sesiones: **4**
- Flashcards: **4**
- Ejercicios: **9**
- Exámenes: **3**
- Repasos: **1**
- TODO: **2** · FALTA INFO: **2** · Dudas sin responder: **0**
