# Cuánto cuesta la prueba real, y por qué — 2026-10-02

Informe de una sesión de trabajo (Roberto + Claude) que empezó con «no puedo completar una prueba entera con mi
cuota de Codex» y acabó midiendo de dónde sale el gasto. Sirve de punto de partida: las mediciones siguientes se
añaden a la tabla de **Registro**, al final, para ver cómo evoluciona.

El plan que sale de aquí está en `docs/planes/plan-vivo.md`, «Siguiente: prueba real por piezas».

## En una página

1. **La prueba no es cara por cómo comprueba, sino por lo que cuesta cada interacción del producto.** Las
   comprobaciones son código (`pruebas/lib/pasos.js`) y no gastan. Lo que gasta es que el profesor genere el curso.
2. **Más de la mitad del gasto es contexto fijo que se reenvía en cada llamada al modelo** (lo que viaja antes de
   que el profesor lea nada): 61 % con Claude, 51 % con Codex.
3. **Una cuarta parte de ese contexto fijo, con Claude, era la configuración personal de Roberto** (su `CLAUDE.md`
   global, sus skills y conectores). Un alumno no la tiene. Quitarla de la prueba: 36 K → 27 K tokens por llamada.
4. **La entera con Claude dura 14–27 min, no una hora,** y en el plan de Roberto gasta como mucho 11 puntos de la
   ventana de 5 h. La cuota solo aprieta con Codex Plus: allí la entera no cabe en una ventana.
5. **El coordinador de varias clases es caro sobre todo en Codex:** 58 % de la prueba, frente al 22 % con Claude.
6. **Con la prueba aislada salen 3 permisos denegados en vez de 1:** el profesor lanza comandos de shell que
   `AGENTS.md` prohíbe. Sin confirmar si la configuración personal los tapaba.

## Las mediciones

### Prueba entera con Claude (Sonnet): antes y después de aislarla

Antes: `88ada91`, con la configuración personal de quien lanza. Después: rama `prueba-aislada`, `4b3bb2a`, con
`--setting-sources project,local --strict-mcp-config`. Las dos, 16/16 y corrección 6/6.

| Paso | Antes: llamadas · tokens · s | Aislada: llamadas · tokens · s |
|---|---|---|
| `/sesion 01-01` | 10 · 527 K · 76 | 10 · 441 K · 84 |
| `/sesion 01-02` | 15 · 1.044 K · 171 | 14 · 772 K · 105 |
| `/dudas` | 9 · 424 K · 49 | 10 · 353 K · 34 |
| `/ejercicio` | 11 · 591 K · 84 | 12 · 540 K · 90 |
| `/examen` (referencia del centro) | 5 · 239 K · 19 | 5 · 179 K · 17 |
| `/examen` (generar + revisor) | 18 · 1.212 K · 223 | 15 · 758 K · 120 |
| `/examen` (corregir) | 12 · 634 K · 49 | 11 · 470 K · 38 |
| `/examen` (otra vez + revisor) | 18 · 1.238 K · 171 | 14 · 660 K · 159 |
| `/examen` (corrección fija) | 15 · 838 K · 72 | 15 · 721 K · 63 |
| `/repaso` | 10 · 652 K · 132 | 9 · 458 K · 116 |
| Preparar 02-01 y 02-02 (coordinador + subagentes) | 39 · 2.095 K · ~4 min | 36 · 2.113 K · ~4 min |
| **Total** | **162 · 9,50 M · 17,5 min** | **151 · 7,47 M · 14 min** |

- «Tokens» es todo lo que entra al modelo sumando las llamadas (nuevo + escrito en caché + leído de caché). Más
  del 90 % es lectura de caché. Salida: 182 K antes, 151 K aislada.
- **Contexto fijo por llamada:** 36 K antes, 27 K aislada (subagentes: 29 K y 21–29 K). La preparación en segundo
  plano sigue en 36 K: la lanza el kit (`preparar.js`), no la prueba, y lleva la configuración personal.
- **El −21 % no es todo mérito del aislamiento:** hay 11 llamadas menos, y el número de llamadas varía solo de una
  ejecución a otra (ver Registro: de 130 a 217). Lo que sí es fijo son los 9 K menos por llamada.
- **Cuota de Claude** (`/cuota` antes y después de la aislada): ventana de 5 h del 2 % al 13 %, semanal del 10 %
  al 11 %. Es un techo: esta conversación y otra gastaban a la vez.
- **Permisos denegados en la aislada (3; antes 1):** `node -e …` en corregir, `sed -i …` en la corrección fija y
  `cd … && for … cat` en `/repaso`. Los tres pasos salieron bien igualmente.

### De qué está hecho el contexto fijo (Claude, Sonnet)

Medido con una llamada de `claude -p "Responde solo: ok"` en una carpeta vacía, cambiando los flags:

| Caso | Tokens de entrada |
|---|---|
| Tal cual (configuración personal de Roberto) | 25.083 |
| Sin configuración de usuario ni conectores (`--setting-sources project,local --strict-mcp-config`) | 15.887 |
| Configuración personal, sin conectores (`--strict-mcp-config`) | 22.985 |
| Sin configuración de usuario, con conectores (`--setting-sources project,local`) | 17.985 |

De ahí: Claude Code solo, 15,9 K · configuración personal, 9,2 K (7,1 K de usuario + 2,1 K de conectores) · el kit
(`AGENTS.md`, listado de skills), ~11 K **por diferencia** con los 36 K de la prueba (no medido directamente).
`AGENTS.md` son 23 KB y 310 líneas.

### Prueba con Codex (plan Plus), `62c67a4`, 12 de 16 pasos

Se cortó por límite de uso (`usage_limit_exceeded`) al empezar a corregir. El `RESUMEN.md` solo decía «código 1».

| Paso | Llamadas · tokens · s | Ventana de 5 h |
|---|---|---|
| `/sesion 01-01` | 9 · 315 K · 223 | 0 → 8 % |
| `/sesion 01-02` | 12 · 459 K · 289 | 8 → 19 % |
| `/dudas` | 6 · 178 K · 93 | (solapado) |
| `/ejercicio` | 7 · 228 K · 159 | (solapado) |
| `/examen` (referencia del centro) | 6 · 179 K · 59 | (solapado) |
| `/examen` (generar + revisor) | 15 · 547 K · 247 | 71 → 98 % (con el final de la preparación) |
| Preparar 02-01 y 02-02 (coordinador 40 + subagentes 25) | 65 · 2.689 K · ~7 min | (solapado; ~media ventana, estimación) |
| **Total** | **122 · 4,64 M · 18 min** | **0 → 98 %; semanal 31 → 47 %** |

- Contexto fijo por llamada: 19 K (21 K en subagentes).
- El coordinador hizo 40 llamadas; unas 10 fueron solo para esperar a los subagentes.
- La ejecución de la mañana (08:36) dio lo mismo: 95 % de ventana antes del examen.
- La entera completa pediría un 125–130 % de una ventana (estimación: quedaban 4 pasos).

## Lo que se decidió hoy

- **Varias clases a la vez:** ya no se ofrece. Una detrás de otra, en el orden del curso; a la vez solo si el alumno
  lo pide, con aviso de cuota y su sí. PR #82.
- **Rumbo: primero la raíz.** Abaratar cada interacción del producto antes de reorganizar la prueba. Mover la
  entera de sitio (al PR, a la noche) «mueve el polvo»: se gasta lo mismo.
- **La release espera a una entera en verde** (opción A) y la publica Roberto con su clic.
- **La prueba se lanza aislada** de la configuración personal (rama `prueba-aislada`, comprobada con una entera).
- **Tres fallos de texto de la auditoría de prompts del producto**, arreglados en la rama `auditoria-producto`
  (`docs/auditoria/2026-10-02-auditoria-de-prompts-producto.md`).

## Lo que se descartó, y por qué

- **Un porcentaje de parecido con una referencia como puerta.** Parecido no es correcto: un examen con la clave mal
  sale casi igual. Y medirlo cuesta otro LLM, que también varía.
- **Quitar la entera de la release ya.** El 2026-10-01 la entera cazó un choque entre el examen y una clase que se
  preparaba a la vez (`tasa-de-ahorro.md`); ninguna pieza suelta lo habría visto.
- **Mapear `AGENTS.md` por secciones a piezas de la prueba.** Se lee entero en cada llamada y sus secciones se citan
  entre sí.
- **Una prueba ligera solo para Codex,** como primera medida: tapaba el coste del coordinador. Sigue como opción.
- **Reanudar la prueba de Codex en dos ventanas:** la convierte en una prueba de 6 horas.
- **`/skill-doctor`:** solo da uso y coste de listado de las skills. **`claude plugin eval`:** exige empaquetar
  las skills como plugin y cada caso sigue siendo una sesión entera; en espera.
- **El diseño «prueba por piezas»** queda en espera, con 5 objeciones del abogado del diablo sin aplicar (están en
  el plan vivo).

## Preguntas abiertas

1. ¿Cuánto baja una interacción si el profesor recibe de una vez lo que necesita al arrancar? Piloto en `/sesion`;
   referencia: 10 llamadas y 441 K tokens con Claude aislado, 9 llamadas y 315 K con Codex.
2. ¿Los 3 permisos denegados los tapaba la configuración personal, o es variación? Si es lo primero, a un alumno le
   salen peticiones de permiso que la prueba no veía.
3. ¿Cuánto pesan los tokens leídos de caché en la cuota real? Solo tenemos tokens (Claude) y porcentaje (Codex).
4. ¿Pasa la entera con Haiku? `--modelo haiku` existe y no se ha probado.
5. ¿Se puede aislar también la preparación en segundo plano y la prueba de disparadores (`argsSondeo`)?
6. Coordinador de varias clases con Codex: 40 llamadas, ~10 de espera. Sin abordar.
7. De la auditoría de prompts, sin decidir: los pesos del examen (40/25/20/15 %) que el modelo calcula a ojo, el
   apartado de cursos anteriores a la 0.19.0 que carga en cada `/configurar`, «no te saltes ninguno» en `/sesion`
   y la excepción de las 10–12 preguntas del test inicial.

## Registro

Una fila por prueba entera. Añadir aquí las siguientes.

| Fecha | Commit | Asistente · modelo | Aislada | Resultado | Llamadas | Entrada | Contexto fijo | Duración | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-01 16:18 | — | Claude · Sonnet | no | — | 130 | 7,59 M | 36 K | 14,8 min | Segundo plano con una sola clase (antes de la #56) |
| 2026-10-01 22:50 | — | Claude · Sonnet | no | — | 217 | 13,01 M | 36 K | 27 min | |
| 2026-10-02 09:17 | — | Claude · Sonnet | no | — | 175 | 10,57 M | 36 K | 17,6 min | |
| 2026-10-02 10:24 | — | Claude · Sonnet | no | — | 150 | 8,46 M | 36 K | 13,7 min | |
| 2026-10-02 12:46 | `88ada91` | Claude · Sonnet | no | 16/16 · 6/6 | 162 | 9,50 M | 36 K | 17,5 min | La del `RESUMEN.md` de la 0.29.0 |
| 2026-10-02 21:10 | `62c67a4` | Codex · por defecto | — | 12/16 (límite de uso) | 122 | 4,64 M | 19 K | 18 min | 98 % de ventana de 5 h (Plus) |
| 2026-10-02 22:46 | `4b3bb2a` | Claude · Sonnet | sí | 16/16 · 6/6 | 151 | 7,47 M | 27 K | 14 min | 3 permisos denegados; ≤ 11 puntos de ventana |
| 2026-10-02 23:06 | `3b077b9` | Claude · Sonnet | sí | 16/16 · 6/6 | 161 | 8,13 M | 27 K | 14,5 min | Rama `auditoria-producto` (3 arreglos de texto). 4 permisos denegados; 9 puntos de ventana (14 → 23 %) |

**Lo que dicen las dos aisladas juntas:**

- **Variación entre ejecuciones iguales:** 151 y 161 llamadas, 7,47 y 8,13 M (±9 %). Un cambio que baje menos que
  eso no se distingue del ruido con una sola ejecución.
- **Los permisos denegados no son casualidad:** 3 y 4 con la prueba aislada, 1 sin aislar. La configuración personal
  los tapaba. En los siete casos el profesor intentaba **leer varios ficheros de una vez** con la shell
  (`for … cat`, `cd … && cat a b c`, `node -e` sobre la clave), que `AGENTS.md` prohíbe. Es la misma necesidad que
  ataca el piloto de `/sesion`: darle de una vez lo que necesita, con una herramienta del kit.

Las horas son locales (Madrid). «—» en commit o resultado: no se ha buscado en los logs.

## Cómo se midió (para repetirlo)

- **Claude:** cada `claude -p` de la prueba deja su transcripción en
  `~/.claude/projects/*profesor-kit-prueba-<id>*/`, con el `usage` de cada respuesta (`input_tokens`,
  `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`). El `<id>` es el final de la carpeta
  temporal que monta la prueba. Contexto fijo = el mínimo de entrada entre las llamadas de una sesión.
- **Codex:** `~/.codex/sessions/AAAA/MM/DD/rollout-*.jsonl`. Los eventos `token_count` traen los tokens de cada
  llamada (`last_token_usage`) y el porcentaje de la ventana (`rate_limits.primary.used_percent`, 5 h;
  `secondary`, semanal). El motivo de un fallo está en `task_complete.error`.
- **Cuota de Claude:** la skill `/cuota` de Roberto, antes y después.
- **Coste por ejecución:** `claude -p --output-format json` devuelve `usage` y `total_cost_usd`; la prueba ya lanza
  Claude así, pero todavía no lo lleva al `RESUMEN.md` (pendiente).

Guion usado para los logs de Claude (`python3 guion.py <id>`):

```python
import sys, json, glob, os
P = os.path.expanduser('~/.claude/projects/')
for tag in sys.argv[1:]:
    filas = []
    for d in glob.glob(P + '*profesor-kit-prueba-' + tag + '*'):
        for f in glob.glob(d + '/**/*.jsonl', recursive=True):
            vistos, primero, t0, t1, sub = {}, '', None, None, False
            for linea in open(f):
                try: x = json.loads(linea)
                except ValueError: continue
                if x.get('timestamp'): t0 = t0 or x['timestamp']; t1 = x['timestamp']
                sub = sub or bool(x.get('isSidechain'))
                m = x.get('message') or {}
                if x.get('type') == 'user' and not primero:
                    c = m.get('content')
                    if isinstance(c, list): c = ' '.join(i.get('text', '') for i in c if isinstance(i, dict))
                    if isinstance(c, str) and c.strip() and not c.startswith('<'): primero = c.strip()[:40]
                if x.get('type') == 'assistant' and m.get('usage'): vistos[m.get('id') or x.get('uuid')] = m['usage']
            if not vistos: continue
            ctx = [u.get('input_tokens', 0) + u.get('cache_read_input_tokens', 0) + u.get('cache_creation_input_tokens', 0) for u in vistos.values()]
            filas.append((t0, t1, primero, len(vistos), sum(ctx), min(ctx), sum(u.get('output_tokens', 0) for u in vistos.values()), 'sub' if sub or 'subagents' in f else ''))
    for t0, t1, primero, n, total, suelo, salida, tipo in sorted(filas):
        print(t0[11:19], t1[11:19], tipo.ljust(3), primero.ljust(40), 'llamadas', n, 'entrada', total // 1000, 'K', 'suelo', suelo // 1000, 'K', 'salida', salida // 1000, 'K')
    print('TOTAL', sum(f[3] for f in filas), 'llamadas ·', sum(f[4] for f in filas) // 1000, 'K de entrada')
```
