# Plan de acción · 2026-09-24

**Fuente única de lo pendiente.** Junta en un sitio todo lo que queda por hacer en el kit, lo ordena de
necesario a mejora y propone en qué versión va cada cosa. Kit en **0.22.1**.

Reúne cuatro fuentes. Las dos auditorías **no se editan**: quedan como histórico. Este documento dice qué se
hace con cada hallazgo.

| Fuente | Qué es |
|---|---|
| `docs/auditoria/2026-09-23-auditoria-del-kit.md` | Nuestra auditoría (0.19.0). Casi todo resuelto; quedan P4 a P8 y E1 a E9 |
| Issue #39 | Auditoría de Codex en Windows sobre la 0.22.1: hallazgos H01 a H12 |
| Issues #36 y #38 | Claudian con Codex · falsos avisos de `concepto-sin-ejemplo` |
| `docs/planes/2026-09-24-para-continuar.md` | Decisiones de la última sesión: mi perfil, P7, P8, permisos desde Obsidian |

---

## 1. En una pantalla

- **Hay 5 fallos que pueden perder datos o hacer algo que el alumno no pidió** (H01, H02, H03, H07 y el
  segundo plano: H04 a H06). Van **antes que cualquier función nueva**. Los P1 de Codex los he comprobado en el
  código de `main`: son ciertos.
- **Hay 1 fallo pequeño que molesta ya a quien actualiza** (#38: 69 avisos falsos en un curso real).
- **Mi perfil y evolución (P4 + E4) se retrasa una versión.** Estaba como siguiente paso. Lo recomiendo así
  porque la auditoría de Codex tiene razón en lo principal: no ampliar mientras haya fallos de integridad.
  Además, la prueba real (H08) hay que arreglarla de todas formas para el alumno simulado, y encaja en esa versión.
- **"Igual para todos los asistentes"** (permisos, adaptadores, material que no es PDF) es un bloque propio, después.
- **Lo que hace que el alumno vuelva** (repaso espaciado, plan con calendario…) va al final. No porque importe
  menos, sino porque se apoya en todo lo anterior.

| Versión | Objetivo | Qué entra | Tamaño |
|---|---|---|---|
| **0.22.2** | Que no haga daño | #38, H03, H07, H02, H01, H10 (parte CI) | M |
| **0.22.3** | Segundo plano fiable | H05, H04, H06 | M |
| **0.23.0** | Mi perfil, y probar la calidad de verdad | P4 + E4, alumno simulado, H08, H11 (regla) | L |
| **0.24.0** | Igual para todos | Permisos genéricos, H09, P8, #36, H10 (resto) | L |
| **0.25.0+** | Que el alumno vuelva | E1, E2, E3, P7, luego P5, P6, E5 a E9, H12 | L, por partes |

---

## 2. Inventario

Prioridad: **🔴 necesario** (puede perder datos, publicar lo que no toca o romper el curso) · **🟠 importante**
(funciona, pero no igual para todos o no se puede demostrar que está bien) · **🟢 mejora** (producto nuevo).

### 2.1 🔴 Necesario: que no haga daño

| ID | Qué pasa | Para quién | Origen | Tamaño | Versión |
|---|---|---|---|---|---|
| **#38** | `concepto-sin-ejemplo` no reconoce `## El ejemplo, paso a paso` y títulos parecidos: 69 avisos falsos de 72 en un curso real. Arreglo: aceptar cualquier título que empiece por "El ejemplo", y que `/sesion` pida el título a secas | Cursos anteriores a la 0.21 | Issue #38 | S | 0.22.2 |
| **H03** | Las herramientas dan por bueno cualquier git "por encima" del curso. Un curso sin git propio dentro de otro repositorio acaba haciendo commits en el de fuera. Pasó durante la auditoría. Arreglo: exigir que la raíz del git sea la del curso en cada herramienta que escribe (guardar, actualizar, reparar, deshacer, preparar). Es la continuación de lo que la 0.22.1 ya comprueba en `diagnostico.js` | Todos | #39 | S-M | 0.22.2 |
| **H07** | `"subir_a_github": "false"` (texto, no booleano) se lee como verdadero y sube. Sin ajustes, sube por defecto. Antes de subir no se comprueba que el remoto siga siendo el privado del alumno. `issue.js` y el escáner de secretos usan patrones distintos. Arreglo: ajustes con tipos estrictos, no subir si algo es ambiguo (guardar en local igual), comprobar remoto y privacidad al subir, un solo detector | Todos | #39 | M | 0.22.2 |
| **H02** | Las rutas de manifiestos y de la estructura no se comprueban bien. En Windows se aceptan `..\fuera` o `.git`. `instalar-skills.js` borra lo que diga el manifiesto anterior: en la auditoría, `../../victim` borró una carpeta de fuera. Arreglo: una función común que diga si una ruta está dentro de su sitio, usada en todas las escrituras y borrados | Todos (sobre todo Windows) | #39 | M | 0.22.2 |
| **H01** | El segundo plano en Windows lanza el asistente a través de la shell: el prompt llega partido en 67 trozos, y un nombre de fichero con `&` ejecuta comandos. Hoy solo afecta a Claude Code en Windows (el adaptador de Codex no tiene segundo plano). Arreglo: lanzar sin shell y pasar el prompt por fichero o por stdin | Windows | #39 | S-M | 0.22.2 |
| **H10 (CI)** | La release se publica con un workflow aparte, que no espera a los tests del mismo commit. Las Actions usan etiquetas que pueden cambiar. Arreglo: publicar solo si `tests-ok` pasó en ese commit, y fijar las Actions por su identificador de commit (SHA) | Mantenimiento | #39 | S | 0.22.2 |

### 2.2 🔴 Necesario: segundo plano fiable

La preparación en segundo plano salió en la 0.22.0 y se usa ya. Estos tres fallos no rompen el curso, pero
pueden dar por buena una clase que no se ha preparado o perder una corrección sin avisar.

| ID | Qué pasa | Origen | Tamaño | Versión |
|---|---|---|---|---|
| **H05** | La copia de trabajo sale del último guardado: **no ve el material recién dejado en `inbox/`**, que es justo el caso normal. Si el asistente termina sin hacer nada, se marca como terminada. `estado.json` se cuela en el commit. Sin tiempo límite ni bloqueo contra dos lanzamientos. Arreglo: copiar la entrada de forma explícita, dar la clase por preparada solo si existe la sesión esperada (que el asistente acabe bien no basta), sacar el estado de lo que se guarda en git, y añadir tiempo límite y bloqueo | #39 | M | 0.22.3 |
| **H04** | Al juntar, si la sesión cambió en los dos lados, se queda la versión principal entera y se pierde la otra sin avisar. Arreglo: resolver solo lo generado (el pie de navegación) y parar si hay un conflicto de verdad | #39 | M | 0.22.3 |
| **H06** | No se puede deshacer una preparación juntada: `deshacer.js` no sabe revertir un merge. Arreglo: reconocer los merges del kit y revertir contra su padre principal | #39 | S | 0.22.3 |

> **Decisión de Roberto (D2):** hasta la 0.22.3, ¿el segundo plano sigue activo o se avisa de que es experimental?
> Recomiendo **dejarlo activo**: H05 es el más probable y, como mucho, da una clase por preparada sin estarlo (el
> alumno lo ve al abrirla). No borra nada que ya estuviera guardado.

### 2.3 🟠 Importante: probar que la calidad es buena

| ID | Qué pasa | Origen | Tamaño | Versión |
|---|---|---|---|---|
| **H08** | La prueba real comprueba que se producen ficheros, no que la corrección sea correcta. El alumno simulado responde por palabras clave, y el ejemplo publicado saca 0,5/10 porque las respuestas son de relleno, no por culpa del corrector. La barrera de PR acepta un `RESUMEN.md` vacío. Arreglo: preguntas fijas con respuesta y veredicto esperados, y que la barrera exija un resultado válido y posterior al cambio | #39 | M | 0.23.0, con el alumno simulado |
| **Alumno simulado** | Ya decidido: entra en la versión de mi perfil (plan 0.22, 5b.4). Es la misma pieza que H08 | Para continuar | M | 0.23.0 |
| **H11** | Ninguna regla dice que las instrucciones que vengan dentro del material de clase (un PDF que diga "ignora tus reglas") son datos, no órdenes. Parte barata: esa regla en `AGENTS.md` y en `/sesion`, más un documento trampa en la prueba real. Parte cara (limitar permisos y red del segundo plano): con los permisos genéricos | #39 | S + M | 0.23.0 (regla) · 0.24.0 (resto) |
| **H12** | En un curso real hay conceptos distintos juntos como alias, y una sola casilla de progreso para cosas diferentes. Hay marcas de origen que faltan. Propone objetivos de aprendizaje con su rastro (fuente → concepto → pregunta → respuesta) | #39 | L | 0.25.0+, pensarlo con P5 y P6 |

### 2.4 🟠 Importante: igual para todos los asistentes y entornos

| ID | Qué pasa | Origen | Tamaño | Versión |
|---|---|---|---|---|
| **Permisos** | Desde Obsidian (Claudian), el profesor pide decenas de permisos: las reglas del kit están en la raíz y el asistente arranca en `estudio/`, más los comandos improvisados. **Decisión de Roberto:** nada específico de un asistente. El alumno acepta una vez y el profesor puede trabajar con todas sus notas. Idea: que el profesor delegue en su "servicio técnico" (el adaptador de cada asistente) para configurarlo en su entorno | Para continuar | M | 0.24.0 |
| **H09** | El adaptador aún no es un contrato completo: sin versión, sin capacidades declaradas, un adaptador propio del curso manda aunque cambie `llm`, y el segundo plano cae en `sonnet`. La prueba real solo llama a `claude`. Arreglo: adaptador con versión y capacidades, y una tabla de soporte (probado, con limitaciones, no disponible) por sistema, asistente y modelo | #39 | M-L | 0.24.0 |
| **P8** | Material que no es PDF: PPTX, Excel, fotos, audio o vídeo, Word. Decidido: hay que cubrirlo. Una herramienta del kit para leerlos quita además los `python3` improvisados, que son la mitad de los permisos | Nuestra auditoría | M-L | 0.24.0 |
| **#36** | Claudian con Codex: sin git en la raíz no ve al profesor. La 0.22.1 ya lo avisa. Falta confirmarlo en el curso de Windows y cerrar la issue | Issue #36 | S | En cuanto Roberto lo pruebe |
| **H10 (resto)** | La prueba de actualización da por conservado un fichero si no encoge (un cambio del mismo tamaño pasa). `actualizar.js` compara cuántos errores hay, no cuáles. Arreglo: huellas (hash) de los ficheros que no deben cambiar y comparar los errores uno a uno | #39 | S-M | 0.24.0 |
| **Claudian y la clave de API** (§2.3 de nuestra auditoría) | Se da por resuelto: Claudian usa el `claude` instalado (su ajuste guarda la ruta del programa), con la suscripción. Visto en el curso de Roberto | Nuestra auditoría | — | Cerrar |

### 2.5 🟢 Mejoras de producto

| ID | Qué es | Estado | Versión |
|---|---|---|---|
| **P4 + E4** | Mi perfil y evolución: `estudio/mi-perfil.md` generado; `config/alumno.md` como evaluación sincera y con prueba | Especificación aprobada. Plan de 8 tareas **sin revisar** (6 desviaciones) | 0.23.0 |
| **E1** | Repaso espaciado (nativo, con cajas en las flashcards) | Propuesto | 0.25.0 |
| **E2** | Plan con calendario y cuenta atrás hasta el examen | Propuesto | 0.25.0 |
| **E3** | Progreso visible en `inicio.md`, sin insignias | Propuesto | 0.25.0 |
| **P7** | Examen final a medida: el profesor pide al alumno un ejemplo o las preguntas que tenga | Decidido, sin empezar | 0.25.0 o cuando se acerque un examen real |
| **P5** | Duplicados por significado (herramienta de candidatos) | Propuesto. Encaja con H12 | 0.26.0 |
| **P6** | Consolidar al cerrar un módulo | Espera al primer módulo real terminado | Cuando toque |
| **E5 a E9** | Autoevaluación, "explícamelo tú", examen acumulativo, sesión corta, prerrequisitos como camino | Sin revisar | Una por versión, según pida el curso real |

### 2.6 Decisiones abiertas (no son trabajo, pero lo bloquean)

| ID | Decisión | Recomendación |
|---|---|---|
| **D1** | ¿Arreglar los fallos (0.22.2 y 0.22.3) antes de mi perfil? | **Sí.** Son fallos de datos y ya hay alumnos usándolo |
| **D2** | ¿Segundo plano activo hasta la 0.22.3? | **Sí**, ver 2.2 |
| **D3** | ¿Responder a la issue #39 con este plan y abrir una issue por hallazgo? | **Sí, un comentario con la tabla** y una issue solo cuando se empiece cada una (si no, 12 issues abiertas sin mover) |
| **D4** | Licencia: `package.json` dice `UNLICENSED` y el repo es público | Decidirlo antes de la 1.0.0 o de aceptar contribuciones de fuera. No bloquea nada ahora |
| **D5** | ¿Qué hace falta para la 1.0.0? | Propuesta: 0.22.2 + 0.22.3 + la prueba real que mide la corrección (H08) en verde con dos asistentes |

---

## 3. Cómo se trabaja cada versión

- **Un PR por versión**, con un commit por hallazgo. Cada hallazgo de la #39 entra con su reproducción como
  test **antes** del arreglo (como la #35 en la 0.22.1).
- Los tests de H02, H03 y H07 **solo con datos inventados** en carpetas temporales. Nada de remotos de verdad ni
  de cursos reales (lo pide la #39 y ya lo dice `CONTRIBUTING.md`).
- Al cerrar cada versión: CHANGELOG para el alumno, release, comentario en la #39 con lo resuelto y una línea en
  la tabla de seguimiento de abajo.

## 4. Seguimiento

| Versión | Estado | Notas |
|---|---|---|
| 0.22.1 | ✅ publicada | #35 cerrada; `diagnostico.js` avisa de la raíz del git (#36) |
| 0.22.2 | ⏳ | |
| 0.22.3 | ⏳ | |
| 0.23.0 | ⏳ | Plan de mi perfil pendiente de revisar |
