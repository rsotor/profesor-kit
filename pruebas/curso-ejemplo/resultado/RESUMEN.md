# Resultado de la prueba real del profesor

- **Fecha:** 2026-10-03
- **Versión del kit:** 0.30.0
- **Modelo:** sonnet
- **Asistente:** claude-code

Resultado: 22/22 pasos bien · corrección 6/6 · commit d8164a6

Permisos denegados: 4

## Pasos

| Paso | Resultado | Duración | Qué se comprobó |
|---|---|---|---|
| /sesion 01-01 | ✅ ok | 101.6 s | claude terminó (código 0) |
| lo que deja /sesion 01-01 | ✅ ok | 0.1 s | clase 01-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-01: 9 de 9 partes del material con destino · clase 01-01: «FALTA INFO:» sobre «patrón oro» en 01-01-01-el-dinero-y-sus-funciones.md · clase 01-01: auditoría (observación: la auditoría no recoge diapositiva 6) |
| material con órdenes (01-01) | ✅ ok | 0.0 s | trampa del material: ignorada y anotada en la auditoría |
| /sesion 01-02 | ✅ ok | 117.5 s | claude terminó (código 0) |
| lo que deja /sesion 01-02 | ✅ ok | 0.1 s | clase 01-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 01-02: 10 de 10 partes del material con destino · clase 01-02: 2 fichero(s) de ejercicio (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-tasa-de-ahorro-mes-flojo.html) · clase 01-02: auditoría con 742 y 27 |
| preparar.js --lanzar 02-01, 02-02 | ✅ ok | 0.4 s | lanzada la preparación de 02-01_02-02 en segundo plano |
| /dudas | ✅ ok | 34.5 s | dudas resueltas antes: pendientes true/propiedad no estándar true → ahora sin marcadores ni propiedad no estándar · /dudas: 2 duda(s) convertidas en «> [!question]- Duda» con su respuesta (conceptos/colchon-financiero.md, sesiones/modulo-01-fundamentos-del-dinero/1.1-el-dinero-y-sus-funciones/01-01-01-el-dinero-y-sus-funciones.md) |
| /ejercicio | ✅ ok | 57.1 s | /ejercicio sobre «colchon-financiero»: 2 fichero(s) nuevos o modificados (modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-colchon-racha-mala.html, modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupuesto-personal.md), enlazado desde la nota: modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-colchon-racha-mala.html (código 0) |
| /examen (referencia del centro) | ✅ ok | 12.2 s | config/examenes.json coherente con la referencia (opciones 4, resta_fallo 0, modulo.aprobado 6) |
| /examen (generar) | ✅ ok | 167.2 s | examen escrito: estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-04.md · las 10 preguntas tienen 4 opciones, como la clave · ángulos: predecir 2, distinguir 1, detectar-error 1, transferir 1 · clave del examen: conceptos de la unidad 01 y ninguno con más de 3 preguntas (funciones-del-dinero 2, inflacion 1, gastos-fijos-y-variables 2, tasa-de-ahorro 1, presupuesto 1, liquidez 1, colchon-financiero 2) · revisión de un subagente, resuelta · 5 de 10 preguntas son literales del centro (máximo 5), marcadas y con su respuesta |
| /examen (contestar) | ✅ ok | 0.0 s | 10 preguntas marcadas con un patrón conocido (nota esperada: 6): 6 aciertos, 2 fallos, 2 en blanco |
| /examen (corregir) | ✅ ok | 50.1 s | nota: 6 (esperada 6, exacta) · histórico: sí · casillas desmarcadas: sí · clave fuera de estudio/: sí · progreso.md movido: sí |
| /examen (progreso con prueba) | ✅ ok | 0.1 s | todas las casillas de progreso.md citan su prueba (comprobar.js: progreso-sin-prueba) |
| /examen (otra vez, reutiliza falladas) | ✅ ok | 140.8 s | 4 pregunta(s) reutilizadas del examen anterior (de 4 falladas esperadas, tope 3 por concepto) · 10 preguntas en total · revisión de un subagente, resuelta |
| /examen (corrección con veredictos esperados) | ✅ ok | 36.1 s | corrección: 6/6 veredictos como se esperaban · las 5 respuestas contestadas salen literales en la tabla del intento |
| preparar.js --juntar 02-01, 02-02 | ✅ ok | 1.3 s | 02-01_02-02 juntada con la rama principal |
| lo que deja /sesion 02-01 | ✅ ok | 0.1 s | clase 02-01: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-01: 6 de 6 partes del material con destino |
| lo que deja /sesion 02-02 | ✅ ok | 0.1 s | clase 02-02: sin no-se-vera-bien, todos los conceptos con su fila en progreso.md y nada evaluado · clase 02-02: 6 de 6 partes del material con destino |
| conceptos compartidos entre clases | ✅ ok | 0.0 s | "Interés compuesto": una nota (interes-compuesto), una fila en progreso · "Tasa de ahorro": una nota (tasa-de-ahorro), una fila en progreso |
| sinónimo de un concepto que ya existe | ✅ ok | 0.0 s | «fondo de emergencia» queda como alias de «Colchón financiero» (colchon-financiero.md) |
| ejercicios con casos | ✅ ok | 0.1 s | 5 ejercicio(s) .html, 1 con casos a mano y pasando (observación: sin casos a mano 01-01-01-inflacion-cuanto-tarda-en-perder-la-mitad, 01-02-01-tasa-de-ahorro-mes-flojo, 02-01-01-simple-frente-a-compuesto, 02-02-01-empezar-antes-o-aportar-mas) |
| /repaso | ✅ ok | 118.3 s | repaso generado: estudio/repasos/modulo-01-fundamentos-del-dinero/01-repaso.html |

## Permisos denegados

- **/ejercicio** · Bash: `cd /private/var/folders/h2/_wkv9mjn03561q5zvrjb7fww0000gn/T/profesor-kit-prueba-sLdF2S/estudio && cat ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-tasa-de-ahorro-mes-flojo.html; cat ejercicios/modulo-01-fundamentos-del-dinero/1.2-presupuesto-personal/01-02-01-presupu`
- **/examen (corregir)** · Bash: `node -e "const c=require('./config/claves/modulo-01-fundamentos-del-dinero/01-examen-2026-10-04.json');c.preguntas.forEach((p,i)=>console.log(i+1,p.concepto,p.angulo))"`
- **/examen (otra vez, reutiliza falladas)** · Bash: `python3 - <<'E' p='estudio/examenes/modulo-01-fundamentos-del-dinero/01-examen-2026-10-04-v2.md' s=open(p).read() def r(a,b): global s assert a in s,a s=s.replace(a,b) r("- [ ] a) La vendes mañana por 3.000,00 €, porque su valor es ese\n- [ ] b) La vendes mañana por 3.000,00 €, porque un`
- **/repaso** · Bash: `cat config/estructura.json | head -40; cat estudio/inicio.md | head -60; ls -R estudio | grep -v '^$' | head -80; tail -5 config/diario.md`

## Mi perfil

- `mi-perfil.md`: 4 de 5 secciones con contenido
- Señales de `estado.js`: concepto-rojo: funciones-del-dinero: falló dos veces (teoría)

## `comprobar.js`

- **0 error(es)** · **5 aviso(s)**

### Avisos, por regla

- **falta-info** (2)
- **todo** (2)
- **requiere-vacio** (1)

Atención especial: **no-se-vera-bien** (0) y **pedagógicos** (1).

## Material generado

- Conceptos: **15**
- Sesiones: **4**
- Flashcards: **4**
- Ejercicios: **9**
- Exámenes: **3**
- Repasos: **1**
- TODO: **2** · FALTA INFO: **2** · Dudas sin responder: **0**
