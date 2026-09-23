# Mi perfil y evolución (P4 + E4) y alumno simulado · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `guardar.js` genera `estudio/mi-perfil.md` (lo que el profesor sabe del alumno y su evolución), `estado.js`
da señales de que algo no funciona, y la prueba real contesta el examen con un alumno simulado.

**Architecture:** Un módulo nuevo `lib/perfil.js` (lectores + `markdownPerfil` + `senales`), con el mismo patrón que
`lib/generados.js`: todo sale de disco, nada se rellena a mano. `guardar.js` escribe la hoja; `estado.js` expone
las señales; `AGENTS.md` y dos skills las usan. En `pruebas/`, un paso nuevo llama a `claude -p` desde una carpeta
vacía para que conteste el examen sin ver las soluciones.

**Tech Stack:** Node 24, `node:test`, sin dependencias nuevas.

**Spec:** `docs/planes/2026-09-23-mi-perfil-y-evolucion.md`

## Global Constraints

- Node ≥ 24; ninguna dependencia nueva.
- Todo el texto para el alumno, en español llano. Nombres de funciones en español, como el resto del kit.
- Tests: carpetas solo con `temporal()` / `cursoTemporal()` de `tests/ayuda.js`; nunca `fs.mkdtempSync` directo.
- ESLint del repo: `max-len` 160, `prefer-const`, `eqeqeq`, `no-unused-vars`.
- Una sección de `config/` vacía, ausente o solo con el comentario de la plantilla sale como
  `*Todavía nada: se irá llenando con tus exámenes y tus dudas.*`. Nunca se inventa nada.
- No se enseña en la hoja: "Cómo escribe en sus notas", "Nivel de partida", "Quién es", el diario.
- Señales, en este orden: `examen-suspenso`, `nota-baja`, `concepto-rojo`, `tercer-tropiezo` (≥ 3 dudas).
- Alumno simulado: la nota corregida tiene que caer entre **3 y 8** (ambos incluidos).
- Versión: `0.23.0`. Sin migración (no cambia ningún dato del alumno).
- Se trabaja en la rama `mi-perfil-y-evolucion`. Commits normales en el repo del kit (esto no es un curso).

## Review Focus

1. **Curso recién instalado, sin `config/alumno.md` ni exámenes** → `guardar.js` no falla y la hoja sale con todo en
   "Todavía nada" (test en Task 3).
2. **`config/alumno.md` con finales de línea de Windows (CRLF)** → las secciones se leen igual (test en Task 1).
3. **Notas con coma (`6,5`) y notas que no son número (`7/10`) en el histórico** → la primera cuenta, la segunda se
   ignora sin romper nada (test en Task 1).
4. **Registro de dudas con filas que no son un concepto** (`sesión 01-01-01 (…)`) **o con `[[slug\|alias]]`** → se
   leen sin partir la fila y el concepto sale limpio (test en Task 1).
5. **Examen parcial** (`parcial: true`) → no sale en la hoja ni da señales (test en Task 2).

## Desviaciones sobre la especificación (se corrigen en ella en la Task 6)

- El bloque de un concepto es el primer valor de `bloques:` en su frontmatter (como `formulario.md`), no
  `config/estructura.json`. Sin `bloques:` → "Sin bloque".
- La señal `examen-suspenso` vale para cualquier examen completo (no parcial), no solo el de módulo.
- Las señales llevan `examen` (ruta relativa a `estudio/`) en vez de `unidad`.
- `mi-perfil.md` **no** va a `GENERADOS_CON_ENLACES`: copia texto de `config/alumno.md`, y un enlace roto escrito ahí
  no debe bloquear el guardado con un error en un fichero que nadie edita.
- La señal se menciona en el paso 3 del arranque (cuando ya se ha leído `estado.js`), no en el paso 1.
- El alumno simulado devuelve un JSON con las respuestas y el script las escribe en el examen: nunca tiene el
  fichero (con las soluciones) a su alcance.

---

### Task 1: Lectores de `lib/perfil.js`

**Files:**
- Create: `.kit/herramientas/lib/perfil.js`
- Test: `.kit/herramientas/tests/perfil.test.js`

**Interfaces:**
- Consumes: `v.baseAlumno`, `v.numero`, `v.leerFrontmatter` (`lib/vault.js`); `indice.leerExamenes`,
  `indice.leerProgreso` (`lib/indice.js`).
- Produces:
  - `seccion(texto: string, titulo: string): string` — cuerpo de `## titulo` sin comentarios HTML, recortado; `''` si no existe.
  - `tieneContenido(cuerpo: string): boolean`
  - `intentosDe(textoExamen: string): Array<{ intento: number, fecha: string, nota: number }>`
  - `examenesConIntentos(raiz): Array<{ rel, unidades: string[], fecha, nota, parcial, intentos }>` — solo no parciales con ≥ 1 intento.
  - `leerDudas(raiz): Array<{ concepto: string, veces: number, ultima: string }>` — de más a menos.
  - `conceptosPorBloque(raiz): Array<[bloque: string, { teoria: {✅,🟡,🔴,⬜: number}, aplicacion: {…} }]>`
  - `leerConfig(raiz, nombre): string` — con `\n`, `''` si no existe.

- [ ] **Step 1: Write the failing tests**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const perfil = require('../lib/perfil');
const { cursoTemporal } = require('./ayuda');

const ALUMNO = [
  '# El alumno', '',
  '## Cómo explicarle', '',
  '| Funciona | No funciona | Prueba |', '|---|---|---|',
  '| Ejemplo con cifras | Definición primero | sesión 0 |', '',
  '## Qué funcionó', '<!-- analogías -->', '',
  '## Conceptos que entraron a la primera', '',
  '## Registro de dudas', '',
  '| Concepto | Nº de dudas | Última |', '|---|---|---|',
  '| alfa | 3 | 2026-10-01 · conceptos/alfa.md |',
  '| [[beta\\|Beta]] | 1 | 2026-10-02 |',
  '| sesión 01-01-01 (relación con el módulo) | 2 | 2026-10-03 |', '',
].join('\n');

test('seccion: cuerpo hasta el siguiente ##, sin comentarios; vacío si no existe', () => {
  assert.match(perfil.seccion(ALUMNO, 'Cómo explicarle'), /Ejemplo con cifras/);
  assert.equal(perfil.seccion(ALUMNO, 'Qué funcionó'), '');
  assert.equal(perfil.seccion(ALUMNO, 'No existe'), '');
});

test('seccion: lee igual un fichero con finales de línea de Windows', () => {
  const crlf = ALUMNO.replace(/\n/g, '\r\n');
  assert.match(perfil.seccion(crlf.replace(/\r\n/g, '\n'), 'Cómo explicarle'), /Ejemplo con cifras/);
  const raiz = cursoTemporal({ 'config/alumno.md': crlf });
  assert.match(perfil.seccion(perfil.leerConfig(raiz, 'alumno.md'), 'Cómo explicarle'), /Ejemplo con cifras/);
});

test('tieneContenido: una tabla con solo cabecera está vacía; con una fila, no', () => {
  assert.equal(perfil.tieneContenido(''), false);
  assert.equal(perfil.tieneContenido('| A | B |\n|---|---|'), false);
  assert.equal(perfil.tieneContenido('| A | B |\n|---|---|\n| 1 | 2 |'), true);
  assert.equal(perfil.tieneContenido('- una línea'), true);
});

test('intentosDe: lee el histórico, acepta coma decimal e ignora notas que no son número', () => {
  const texto = [
    '# Examen', '', '## Histórico de intentos', '',
    '| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |', '|---|---|---|---|---|---|---|',
    '| 2 | 2026-10-09 | 6,5 | 5 | 1 | 1 | 0 |',
    '| 1 | 2026-10-01 | 4 | 3 | 1 | 2 | 1 |',
    '| 3 | 2026-10-12 | 7/10 | 6 | 0 | 1 | 0 |', '',
    '> [!example]- Intento 1 · 2026-10-01',
  ].join('\n');
  assert.deepEqual(perfil.intentosDe(texto), [
    { intento: 1, fecha: '2026-10-01', nota: 4 },
    { intento: 2, fecha: '2026-10-09', nota: 6.5 },
  ]);
});

test('examenesConIntentos: sin histórico usa el frontmatter; los parciales no cuentan', () => {
  const raiz = cursoTemporal({
    'estudio/examenes/01-examen-2026-10-01.md': '---\ntipo: examen\nunidad: 01\nfecha: 2026-10-01\nnota: 5,5\n---\n# Examen\n',
    'estudio/examenes/01-02-examen-2026-10-02.md': '---\ntipo: examen\nunidad: 01-02\nfecha: 2026-10-02\nnota: 2\nparcial: true\n---\n# Parcial\n',
  });
  const lista = perfil.examenesConIntentos(raiz);
  assert.equal(lista.length, 1);
  assert.deepEqual(lista[0].intentos, [{ intento: 1, fecha: '2026-10-01', nota: 5.5 }]);
});

test('leerDudas: filas de concepto y de otra cosa, alias limpio, de más a menos', () => {
  const raiz = cursoTemporal({ 'config/alumno.md': ALUMNO });
  assert.deepEqual(perfil.leerDudas(raiz).map(d => [d.concepto, d.veces]), [
    ['alfa', 3], ['sesión 01-01-01 (relación con el módulo)', 2], ['beta', 1],
  ]);
});

test('conceptosPorBloque: cuenta estados por eje y bloque; sin bloques: va a "Sin bloque"', () => {
  const raiz = cursoTemporal({
    'estudio/conceptos/beta.md': '---\ntipo: concepto\nalias: []\nbloques: [2]\n---\n# Beta\n\n## El ejemplo\n\nDos.\n',
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n'
      + '| [[alfa]] | ✅ sólido | 🔴 falló dos veces |\n| [[beta]] | 🟡 flojo | ⬜ sin evaluar |\n',
  });
  const bloques = new Map(perfil.conceptosPorBloque(raiz));
  assert.deepEqual(bloques.get('Bloque 2').teoria, { '✅': 0, '🟡': 1, '🔴': 0, '⬜': 0 });
  assert.deepEqual(bloques.get('Sin bloque').aplicacion, { '✅': 0, '🟡': 0, '🔴': 1, '⬜': 0 });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: FAIL — `Cannot find module '../lib/perfil'`.

- [ ] **Step 3: Implement**

```js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');
const indice = require('./indice');

// estudio/mi-perfil.md y las señales de estado.js: lo que el profesor sabe del alumno y cómo va, juntado desde
// config/alumno.md, config/profesor.md, los exámenes y progreso.md. Aquí solo se calcula; quien escribe es
// guardar.js. No se inventa nada: lo que no está escrito sale como "Todavía nada".

const ESTADOS = ['✅', '🟡', '🔴', '⬜'];
const SEPARADOR = /^\|[\s:|-]+\|$/;

function leerConfig(raiz, nombre) {
  const f = path.join(raiz, 'config', nombre);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '';
}

// El cuerpo de `## <titulo>` hasta el siguiente `## ` (o el final), sin los comentarios de la plantilla.
function seccion(texto, titulo) {
  const escapado = titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`^## ${escapado}[ \\t]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(texto);
  return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : '';
}

// Una tabla con solo cabecera y separador (la de la plantilla) no cuenta como contenido.
function tieneContenido(cuerpo) {
  const lineas = cuerpo.split('\n').map(l => l.trim()).filter(Boolean);
  const filas = lineas.filter((l, i) => l.startsWith('|') && !SEPARADOR.test(l) && !SEPARADOR.test(lineas[i + 1] || ''));
  return lineas.some(l => !l.startsWith('|')) || filas.length > 0;
}

// La tabla "## Histórico de intentos" que escribe /examen: | Intento | Fecha | Nota | … |
function intentosDe(texto) {
  const intentos = [];
  for (const linea of seccion(texto.replace(/\r\n/g, '\n'), 'Histórico de intentos').split('\n')) {
    const c = linea.split('|').map(x => x.trim());
    if (c.length < 5 || !/^\d+$/.test(c[1]) || !/^\d{4}-\d{2}-\d{2}$/.test(c[2])) continue;
    const nota = v.numero(c[3]);
    if (nota !== null) intentos.push({ intento: Number(c[1]), fecha: c[2], nota });
  }
  return intentos.sort((a, b) => a.intento - b.intento);
}

// Los exámenes completos con sus intentos. Sin histórico (un examen corregido antes de que existiera), el
// frontmatter cuenta como único intento.
function examenesConIntentos(raiz) {
  const base = v.baseAlumno(raiz);
  return indice.leerExamenes(raiz).filter(e => !e.parcial).map(e => {
    let intentos = intentosDe(fs.readFileSync(path.join(base, ...e.rel.split('/')), 'utf8'));
    if (!intentos.length && e.nota !== null && e.fecha) intentos = [{ intento: 1, fecha: e.fecha, nota: e.nota }];
    return { ...e, intentos };
  }).filter(e => e.intentos.length)
    .sort((a, b) => a.intentos[0].fecha.localeCompare(b.intentos[0].fecha) || a.rel.localeCompare(b.rel));
}

// "## Registro de dudas" de config/alumno.md: | Concepto | Nº de dudas | Última |. La celda del concepto puede
// ser un slug, un [[enlace\|alias]] o texto libre (una sesión): se deja legible, sin corchetes ni alias.
function leerDudas(raiz) {
  const dudas = [];
  for (const linea of seccion(leerConfig(raiz, 'alumno.md'), 'Registro de dudas').split('\n')) {
    const c = linea.split(/(?<!\\)\|/).map(x => x.trim());
    if (c.length < 4) continue;
    const veces = v.numero(c[2]);
    if (!Number.isInteger(veces) || veces <= 0) continue;
    const concepto = c[1].replace(/^\[\[/, '').replace(/\]\]$/, '').split(/\\?\|/)[0].trim();
    dudas.push({ concepto, veces, ultima: c[3] });
  }
  return dudas.sort((a, b) => b.veces - a.veces || a.concepto.localeCompare(b.concepto));
}

const cero = () => Object.fromEntries(ESTADOS.map(e => [e, 0]));

// Cuántos conceptos hay en cada estado, por eje y por bloque (el primero de `bloques:`, como formulario.md).
function conceptosPorBloque(raiz) {
  const base = v.baseAlumno(raiz);
  const bloques = new Map();
  for (const [slug, estado] of indice.leerProgreso(raiz)) {
    const f = path.join(base, 'conceptos', `${slug}.md`);
    const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) || {} : {};
    const bloque = Array.isArray(fm.bloques) && fm.bloques.length ? `Bloque ${fm.bloques[0]}` : 'Sin bloque';
    if (!bloques.has(bloque)) bloques.set(bloque, { teoria: cero(), aplicacion: cero() });
    bloques.get(bloque).teoria[estado.teoria]++;
    bloques.get(bloque).aplicacion[estado.aplicacion]++;
  }
  return [...bloques.entries()].sort(([a], [b]) => a.localeCompare(b));
}

module.exports = { ESTADOS, leerConfig, seccion, tieneContenido, intentosDe, examenesConIntentos, leerDudas, conceptosPorBloque };
```

- [ ] **Step 4: Run to verify they pass**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/perfil.js .kit/herramientas/tests/perfil.test.js
git commit -m "feat(perfil): lectores de alumno.md, histórico de exámenes, dudas y progreso"
```

---

### Task 2: `senales(raiz)`

**Files:**
- Modify: `.kit/herramientas/lib/perfil.js`
- Test: `.kit/herramientas/tests/perfil.test.js`

**Interfaces:**
- Consumes: `examenesConIntentos`, `leerDudas` (Task 1); `indice.leerAprobado`, `indice.leerProgreso`.
- Produces: `senales(raiz): Array<{ tipo: 'examen-suspenso'|'nota-baja'|'concepto-rojo'|'tercer-tropiezo', examen?: string, concepto?: string, detalle: string }>`, ordenadas por tipo en ese orden. También `fmt(n: number): string` (una cifra decimal con coma).

- [ ] **Step 1: Write the failing tests** (añadir a `perfil.test.js`)

```js
const examen = (nombre, fm, historico = '') => ({
  [`estudio/examenes/${nombre}.md`]: `---\ntipo: examen\n${fm}\n---\n# Examen\n${historico}`,
});
const HIST = filas => '\n## Histórico de intentos\n\n| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |\n'
  + `|---|---|---|---|---|---|---|\n${filas.map(([i, f, n]) => `| ${i} | ${f} | ${n} | 0 | 0 | 0 | 0 |`).join('\n')}\n`;

test('senales: las cuatro, en orden de prioridad', () => {
  const raiz = cursoTemporal({
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-09\nnota: 4', HIST([[1, '2026-10-01', '6'], [2, '2026-10-09', '4']])),
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 falló dos veces | ⬜ |\n',
    'config/alumno.md': ALUMNO,
  });
  assert.deepEqual(perfil.senales(raiz).map(s => s.tipo), ['examen-suspenso', 'nota-baja', 'concepto-rojo', 'tercer-tropiezo']);
  const [suspenso, baja] = perfil.senales(raiz);
  assert.match(suspenso.detalle, /4,0/);
  assert.match(baja.detalle, /de 6,0 a 4,0/);
});

test('senales: aprobado de config/curso.md; un parcial suspendido no da señal', () => {
  const raiz = cursoTemporal({
    'config/curso.md': '---\naprobado: 6\n---\n# Curso\n',
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-01\nnota: 5,5'),
    ...examen('01-02-parcial', 'unidad: 01-02\nfecha: 2026-10-02\nnota: 1\nparcial: true'),
  });
  assert.deepEqual(perfil.senales(raiz).map(s => [s.tipo, s.examen]), [['examen-suspenso', 'examenes/01-examen.md']]);
});

test('senales: curso sin datos, lista vacía', () => {
  assert.deepEqual(perfil.senales(cursoTemporal()), []);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: FAIL — `perfil.senales is not a function`.

- [ ] **Step 3: Implement** (añadir a `perfil.js`, antes de `module.exports`, y exportar `senales` y `fmt`)

```js
const UMBRAL_TROPIEZO = 3;
const fmt = n => n.toFixed(1).replace('.', ',');
const nombreExamen = e => `examen ${e.unidades.join(', ') || path.posix.basename(e.rel, '.md')}`;

// Lo que dice que algo no funciona, calculado. El profesor las lee en estado.js --json (arranque, /examen, /dudas).
function senales(raiz) {
  const aprobado = indice.leerAprobado(raiz);
  const examenes = examenesConIntentos(raiz);
  const lista = [];
  for (const e of examenes) {
    const ultimo = e.intentos[e.intentos.length - 1];
    if (ultimo.nota < aprobado) {
      lista.push({ tipo: 'examen-suspenso', examen: e.rel, detalle: `${nombreExamen(e)}: ${fmt(ultimo.nota)} en el intento ${ultimo.intento} (aprobado: ${fmt(aprobado)})` });
    }
  }
  for (const e of examenes.filter(x => x.intentos.length > 1)) {
    const [antes, ahora] = e.intentos.slice(-2);
    if (ahora.nota < antes.nota) lista.push({ tipo: 'nota-baja', examen: e.rel, detalle: `${nombreExamen(e)}: de ${fmt(antes.nota)} a ${fmt(ahora.nota)}` });
  }
  for (const [slug, estado] of indice.leerProgreso(raiz)) {
    const ejes = [estado.teoria === '🔴' && 'teoría', estado.aplicacion === '🔴' && 'aplicación'].filter(Boolean);
    if (ejes.length) lista.push({ tipo: 'concepto-rojo', concepto: slug, detalle: `${slug}: falló dos veces (${ejes.join(' y ')})` });
  }
  for (const d of leerDudas(raiz).filter(x => x.veces >= UMBRAL_TROPIEZO)) {
    lista.push({ tipo: 'tercer-tropiezo', concepto: d.concepto, detalle: `${d.concepto}: ${d.veces} dudas` });
  }
  return lista;
}
```

`module.exports` pasa a: `{ ESTADOS, leerConfig, seccion, tieneContenido, intentosDe, examenesConIntentos, leerDudas, conceptosPorBloque, senales, fmt }`.

- [ ] **Step 4: Run to verify they pass**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/perfil.js .kit/herramientas/tests/perfil.test.js
git commit -m "feat(perfil): señales de que algo no funciona"
```

---

### Task 3: `markdownPerfil(raiz)`

**Files:**
- Modify: `.kit/herramientas/lib/perfil.js`
- Test: `.kit/herramientas/tests/perfil.test.js`

**Interfaces:**
- Consumes: todo lo de Tasks 1-2.
- Produces: `PERFIL = 'mi-perfil.md'`, `TODAVIA_NADA` (string), `markdownPerfil(raiz): string`.

- [ ] **Step 1: Write the failing tests**

```js
const PROFESOR = '---\ntono: cercano\n---\n# El profesor\n\n## Tono\n\nDirecto y cálido.\n\n'
  + '## Qué le funciona a este alumno al explicar\n\n## Historial de cambios\n<!-- fecha · qué -->\n';

test('markdownPerfil: copia lo que hay, "Todavía nada" en lo vacío, y no enseña lo interno', () => {
  const raiz = cursoTemporal({
    'config/alumno.md': ALUMNO + '\n## Cómo escribe en sus notas\n\n| Propiedad | Escribió |\n|---|---|\n| estudiada | sí |\n'
      + '\n## Nivel de partida\n\n- Módulo 1: 1\n',
    'config/profesor.md': PROFESOR,
  });
  const md = perfil.markdownPerfil(raiz);
  assert.match(md, /^# Mi perfil/);
  assert.match(md, /díselo/i);
  assert.match(md, /## Cómo te explico y por qué[\s\S]*### Tono\n\nDirecto y cálido\.[\s\S]*### Cómo explicarte\n\n\| Funciona/);
  assert.doesNotMatch(md, /### Lo que te funciona/);                 // sección vacía en profesor.md: no sale
  assert.match(md, /## Lo que te entró a la primera\n\n\*Todavía nada/);
  assert.match(md, /## Cambios en cómo te explico\n\n\*Todavía nada/);
  assert.doesNotMatch(md, /Cómo escribe en sus notas|estudiada \| sí|Nivel de partida/);
  assert.match(md, /### Donde más dudas\n\n- alfa: 3 dudas/);
});

test('markdownPerfil: tabla de exámenes con cada intento y si aprueba', () => {
  const raiz = cursoTemporal({
    ...examen('01-examen', 'unidad: 01\nfecha: 2026-10-09\nnota: 6,5', HIST([[1, '2026-10-01', '4'], [2, '2026-10-09', '6,5']])),
  });
  const md = perfil.markdownPerfil(raiz);
  assert.match(md, /\| \[\[examenes\/01-examen\\\|Examen 01\]\] \| 4,0 \(2026-10-01\) → 6,5 \(2026-10-09\) \| ✅ aprobado \|/);
});

test('markdownPerfil: curso recién instalado, sin alumno.md ni profesor.md ni exámenes', () => {
  const raiz = cursoTemporal();
  require('node:fs').rmSync(require('node:path').join(raiz, 'config', 'profesor.md'));
  const md = perfil.markdownPerfil(raiz);
  assert.equal((md.match(/Todavía nada/g) || []).length >= 4, true);
  assert.match(md, /### Conceptos, por bloque/);   // progreso.md de la base tiene [[alfa]] ⬜
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: FAIL — `perfil.markdownPerfil is not a function`.

- [ ] **Step 3: Implement** (añadir a `perfil.js` y exportar `PERFIL`, `TODAVIA_NADA`, `markdownPerfil`)

```js
const PERFIL = 'mi-perfil.md';
const TODAVIA_NADA = '*Todavía nada: se irá llenando con tus exámenes y tus dudas.*';
const MAX_DUDAS = 5;

// Qué se copia y bajo qué título. [fichero de config/, sección de origen, subtítulo en la hoja (null: sin subtítulo)].
// Lo que no está aquí no se enseña: "Cómo escribe en sus notas" es para las herramientas; "Nivel de partida" ya
// está en la hoja del test inicial; "Quién es" lo dijo el propio alumno.
const GRUPOS = [
  ['Cómo te explico y por qué', [
    ['profesor.md', 'Tono', 'Tono'],
    ['profesor.md', 'Qué le funciona a este alumno al explicar', 'Lo que te funciona'],
    ['alumno.md', 'Cómo explicarle', 'Cómo explicarte'],
    ['alumno.md', 'Qué funcionó', 'Lo que te desbloqueó algo'],
  ]],
  ['Lo que te cuesta', [
    ['alumno.md', 'Conceptos que costaron', 'Conceptos que te costaron'],
    ['alumno.md', 'Errores repetidos', 'Errores que se repiten'],
  ]],
  ['Lo que te entró a la primera', [['alumno.md', 'Conceptos que entraron a la primera', null]]],
];
const HISTORIAL = ['Cambios en cómo te explico', [['profesor.md', 'Historial de cambios', null]]];

function evolucion(raiz) {
  const aprobado = indice.leerAprobado(raiz);
  const examenes = examenesConIntentos(raiz);
  const bloques = conceptosPorBloque(raiz);
  const dudas = leerDudas(raiz).slice(0, MAX_DUDAS);
  const l = ['## Tu evolución', ''];
  if (!examenes.length && !bloques.length && !dudas.length) return [...l, TODAVIA_NADA, ''];
  if (examenes.length) {
    l.push('### Exámenes', '', '| Examen | Intentos | Último |', '|---|---|---|');
    for (const e of examenes) {
      const ultimo = e.intentos[e.intentos.length - 1];
      const nombre = `Examen ${e.unidades.join(', ') || path.posix.basename(e.rel, '.md')}`;
      const intentos = e.intentos.map(i => `${fmt(i.nota)} (${i.fecha})`).join(' → ');
      l.push(`| [[${e.rel.replace(/\.md$/, '')}\\|${nombre}]] | ${intentos} | ${ultimo.nota >= aprobado ? '✅ aprobado' : '❌ suspenso'} |`);
    }
    l.push('');
  }
  if (bloques.length) {
    l.push('### Conceptos, por bloque', '', 'Cuántos hay en cada estado: ✅ sólido · 🟡 flojo · 🔴 falló dos veces · ⬜ sin evaluar.', '',
      '| Bloque | Teoría ✅ · 🟡 · 🔴 · ⬜ | Aplicación ✅ · 🟡 · 🔴 · ⬜ |', '|---|---|---|');
    for (const [b, c] of bloques) l.push(`| ${b} | ${ESTADOS.map(e => c.teoria[e]).join(' · ')} | ${ESTADOS.map(e => c.aplicacion[e]).join(' · ')} |`);
    l.push('');
  }
  if (dudas.length) {
    l.push('### Donde más dudas', '');
    for (const d of dudas) l.push(`- ${d.concepto}: ${d.veces} ${d.veces === 1 ? 'duda' : 'dudas'} (última: ${d.ultima})`);
    l.push('');
  }
  return l;
}

// estudio/mi-perfil.md: lo que el profesor sabe del alumno, con su prueba, y cómo va. Se copia literal lo que
// escribió el profesor en config/ (el alumno ve lo mismo que él: una sola verdad) y se calcula la evolución.
function markdownPerfil(raiz) {
  const textos = { 'alumno.md': leerConfig(raiz, 'alumno.md'), 'profesor.md': leerConfig(raiz, 'profesor.md') };
  const l = ['# Mi perfil', '',
    '> Lo que tu profesor sabe de ti, con la prueba de cada cosa, y cómo vas. Lo genera él cada vez que guarda:',
    '> **no lo edites**. Si algo no es verdad, **díselo** y lo corrige.', ''];
  const grupo = ([titulo, partes]) => {
    l.push(`## ${titulo}`, '');
    const llenas = partes.map(([f, s, sub]) => [sub, seccion(textos[f], s)]).filter(([, c]) => tieneContenido(c));
    if (!llenas.length) { l.push(TODAVIA_NADA, ''); return; }
    for (const [sub, c] of llenas) { if (sub) l.push(`### ${sub}`, ''); l.push(c, ''); }
  };
  GRUPOS.forEach(grupo);
  l.push(...evolucion(raiz));
  grupo(HISTORIAL);
  return l.join('\n');
}
```

`module.exports` final: `{ PERFIL, TODAVIA_NADA, ESTADOS, leerConfig, seccion, tieneContenido, intentosDe, examenesConIntentos, leerDudas, conceptosPorBloque, senales, fmt, markdownPerfil }`.

- [ ] **Step 4: Run to verify they pass**

Run: `node --test .kit/herramientas/tests/perfil.test.js`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/perfil.js .kit/herramientas/tests/perfil.test.js
git commit -m "feat(perfil): la hoja mi-perfil"
```

---

### Task 4: Conectar la hoja (`guardar.js`, `inicio.md`, `preparar.js`)

**Files:**
- Modify: `.kit/herramientas/guardar.js:43-49` (`regenerarGenerados`)
- Modify: `.kit/herramientas/lib/indice.js:9` (`OTRAS_HOJAS`)
- Modify: `.kit/herramientas/preparar.js` (`ficheroResoluble`, la lista de basenames)
- Test: `.kit/herramientas/tests/guardar.test.js`, `.kit/herramientas/tests/preparar.test.js`

**Interfaces:**
- Consumes: `perfil.PERFIL`, `perfil.markdownPerfil` (Task 3).

- [ ] **Step 1: Write the failing tests**

En `guardar.test.js` (usa sus imports existentes; si no importa `regenerarGenerados` y `cursoTemporal`, añadirlos):

```js
test('regenerarGenerados: escribe mi-perfil.md e inicio.md la enlaza desde el primer guardado', () => {
  const raiz = cursoTemporal();
  const base = path.join(raiz, 'estudio');
  assert.match(fs.readFileSync(path.join(base, 'mi-perfil.md'), 'utf8'), /^# Mi perfil/);
  assert.match(fs.readFileSync(path.join(base, 'inicio.md'), 'utf8'), /\[\[mi-perfil\]\]/);
});
```

En `preparar.test.js`, dentro del test `ficheroResoluble` existente, añadir:

```js
  assert.equal(ficheroResoluble('estudio/mi-perfil.md'), true);
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/guardar.test.js .kit/herramientas/tests/preparar.test.js`
Expected: FAIL — `ENOENT … mi-perfil.md` y `false !== true`.

- [ ] **Step 3: Implement**

`guardar.js`: `const perfil = require('./lib/perfil');` junto a los otros `require`, y en `regenerarGenerados`, justo después de la línea de `formulario.md`:

```js
  escribirSiCambia(path.join(base, perfil.PERFIL), perfil.markdownPerfil(raiz));
```

(El comentario de encima pasa a decir "Antes que inicio.md: "Otras hojas" mira si formulario.md y mi-perfil.md existen en disco…".)

`lib/indice.js`:

```js
const OTRAS_HOJAS = ['mi-perfil', 'mapa-del-curso', 'progreso', 'formulario', 'test-inicial', 'como-usar-tu-profesor'];
```

`preparar.js`, en `ficheroResoluble`:

```js
  return rel.startsWith('estudio/') && ['inicio.md', 'pendientes.md', 'formulario.md', 'auditoria-del-material.md', 'mi-perfil.md'].includes(base);
```

- [ ] **Step 4: Run the whole suite** (el cambio en `cursoTemporal` afecta a todos los tests)

Run: `npm test`
Expected: PASS. Si algún test compara `inicio.md` literal con "Otras hojas", actualizar su esperado para que incluya `[[mi-perfil]]` primero.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/guardar.js .kit/herramientas/lib/indice.js .kit/herramientas/preparar.js .kit/herramientas/tests
git commit -m "feat: guardar.js genera mi-perfil.md y inicio la enlaza"
```

---

### Task 5: Señales en `estado.js`

**Files:**
- Modify: `.kit/herramientas/estado.js` (`calcularEstado`, `imprimir`)
- Test: `.kit/herramientas/tests/estado.test.js`

**Interfaces:**
- Consumes: `perfil.senales` (Task 2).
- Produces: `calcularEstado(raiz).senales: Array<{ tipo, examen?, concepto?, detalle }>`.

- [ ] **Step 1: Write the failing tests**

```js
test('senales: van en el JSON y una por línea en el texto', () => {
  const raiz = raizAlDia({
    'estudio/progreso.md': '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | 🔴 falló dos veces | ⬜ |\n',
  });
  const estado = calcularEstado(raiz);
  assert.deepEqual(estado.senales.map(s => s.tipo), ['concepto-rojo']);
  const r = spawnSync(process.execPath, [require('node:path').join(__dirname, '..', 'estado.js'), '--raiz', raiz], { encoding: 'utf8' });
  assert.match(r.stdout, /Señal \(concepto-rojo\): alfa: falló dos veces \(teoría\)/);
});

test('senales: sin nada que decir, lista vacía y "Señales: ninguna"', () => {
  const raiz = raizAlDia();
  assert.deepEqual(calcularEstado(raiz).senales, []);
  const r = spawnSync(process.execPath, [require('node:path').join(__dirname, '..', 'estado.js'), '--raiz', raiz], { encoding: 'utf8' });
  assert.match(r.stdout, /Señales: ninguna/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/estado.test.js`
Expected: FAIL — `Cannot read properties of undefined (reading 'map')`.

- [ ] **Step 3: Implement**

`estado.js`: `const perfil = require('./lib/perfil');`. En `calcularEstado`, añadir `senales: perfil.senales(raiz),` al objeto devuelto (después de `caso`). En `imprimir`, al final antes del `console.log`:

```js
  if (estado.senales.length) for (const s of estado.senales) l.push(`Señal (${s.tipo}): ${s.detalle}`);
  else l.push('Señales: ninguna');
```

Y en el comentario de cabecera, una línea más: "Y las señales de que algo no funciona (`lib/perfil.js`), para que el profesor no tenga que acordarse de buscarlas."

- [ ] **Step 4: Run to verify they pass**

Run: `node --test .kit/herramientas/tests/estado.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/estado.js .kit/herramientas/tests/estado.test.js
git commit -m "feat(estado): señales de que algo no funciona en el JSON y en el texto"
```

---

### Task 6: Cómo trabaja el profesor (AGENTS.md, skills, guía) y documentación

**Files:**
- Modify: `AGENTS.md` (tres sitios), `.kit/skills/examen/SKILL.md`, `.kit/skills/dudas/SKILL.md`,
  `.kit/plantillas/guia-de-uso.md`, `.kit/CHANGELOG.md`, `.kit/VERSION`, `docs/arquitectura.md`,
  `docs/planes/2026-09-23-mi-perfil-y-evolucion.md` (desviaciones), `docs/auditoria/2026-09-23-auditoria-del-kit.md` (§0)

- [ ] **Step 1: `AGENTS.md`**

a) Después del punto de `estudio/formulario.md` y `estudio/ejercicios/_index.md` (sección "Motor y datos"), un punto nuevo:

```markdown
- **`estudio/mi-perfil.md` también lo escribe `guardar.js`**: copia de `config/alumno.md` y `config/profesor.md`
  lo que el alumno tiene que ver de sí mismo (cómo le explicas y por qué, qué le cuesta, qué le entró a la
  primera, los cambios en cómo le explicas) y calcula su evolución (exámenes intento a intento, conceptos por
  estado y bloque, dónde más dudas). No lo edites: si el alumno dice que algo no es verdad, lo corriges en
  `config/alumno.md` con la prueba `corrección del alumno, <fecha>`.
```

b) En "Cómo aprendes del alumno", después del primer punto:

```markdown
- **`config/alumno.md` lo lee el alumno** (sale en su **mi-perfil**). Se escribe como una evaluación de verdad:
  sincera, clara y con su prueba, sobre lo que hizo y no sobre cómo es. "No ha entendido la diferencia entre
  X e Y: en las preguntas 3 y 4 los confunde" sí; "no se entera" no. No se suaviza: si no lo ha entendido,
  se dice.
```

y el punto del tercer tropiezo termina con: "`estado.js` te lo recuerda con la señal `tercer-tropiezo`."

c) En "Al empezar cada sesión", paso 3, después de "**Es una sugerencia: la confirmas siempre con el alumno**, nunca la impones.":

```markdown
   Si trae **`senales`** (un examen suspendido, una nota que baja, un concepto en 🔴, una tercera duda), menciona
   **la primera** en una línea, con lo que propones: "el colchón financiero lleva tres dudas, ¿lo vemos desde otro
   ángulo?". Una línea, no un sermón. Las demás, cuando venga a cuento.
```

- [ ] **Step 2: Skills**

`.kit/skills/examen/SKILL.md`, sección "Cuando hay señal de que algo no funciona", tras el primer párrafo:

```markdown
Empieza por `node .kit/herramientas/estado.js --json` → `senales`: ahí están ya calculadas (examen suspendido,
nota que baja entre intentos, concepto en 🔴, tercera duda). No sustituyen tu juicio, te dicen dónde mirar.
```

`.kit/skills/dudas/SKILL.md`, el punto "**Si es la 3ª duda del mismo concepto:**" empieza así:
"**Si es la 3ª duda del mismo concepto** (`estado.js --json` la da como señal `tercer-tropiezo`):".

- [ ] **Step 3: Guía del alumno** — `.kit/plantillas/guia-de-uso.md`, al final de la sección 1 (antes de `## 2.`):

```markdown
Desde **inicio** llegas también a **mi-perfil**: lo que tu profesor sabe de ti (cómo te explica y por qué, qué
te cuesta, cómo vas en los exámenes), con la prueba de cada cosa. Si algo no es verdad, díselo y lo corrige.
```

- [ ] **Step 4: Versión y CHANGELOG** — `.kit/VERSION` → `0.23.0`; en `.kit/CHANGELOG.md`, antes de `## 0.22.0`:

```markdown
## 0.23.0
- **Nueva hoja, mi-perfil**, en inicio: lo que tu profesor sabe de ti, con la prueba de cada cosa. Cómo te
  explica y por qué, qué te cuesta, qué te entró a la primera y cómo vas: tus exámenes intento a intento, tus
  conceptos por bloque y dónde tienes más dudas. Se actualiza sola. Si algo no es verdad, díselo y lo corrige.
- Tu profesor se entera antes de que algo no funciona (un examen suspendido, una nota que baja, un concepto que
  fallas dos veces, la tercera duda sobre lo mismo) y te lo dice al empezar, en una línea.
- **Si ya tenías tu curso:** tu profesor te ofrece añadir a tu hoja *Cómo usar tu profesor* la línea que explica
  **mi-perfil**.
```

- [ ] **Step 5: `docs/arquitectura.md`**

- §3, tabla de `lib/`: fila `| \`perfil.js\` | Calcula \`estudio/mi-perfil.md\` (copia secciones de \`config/alumno.md\` y \`config/profesor.md\` y la evolución) y las señales que da \`estado.js\` |`.
- §3, fila de `estado.js`: añadir "y las señales de que algo no funciona (`lib/perfil.js#senales`)".
- §4, lista de `regenerarGenerados`: tras `formulario.md`, `3. estudio/mi-perfil.md — también antes que inicio.md` y renumerar.
- §9, en los unitarios, añadir `perfil.test.js`.
- §9, prueba real: sustituir "`alumno/respuestas-examen.md`… cómo "contestar" el examen" por "`alumno/perfil.md` (quién contesta el examen: el alumno simulado)".

- [ ] **Step 6: Corregir la especificación** con las seis desviaciones de la cabecera de este plan (§4 campo
  `examen` en vez de `unidad`; §3 bloque desde `bloques:`; §4 suspenso de cualquier examen completo; §5 sin
  `GENERADOS_CON_ENLACES`; §4 señal en el paso 3; §6 JSON desde una carpeta vacía).

- [ ] **Step 7: Auditoría §0** — la fila "§8.1 P4 + §8.2 E4" pasa a `✅ 0.23.0` con "`lib/perfil.js`, `estudio/mi-perfil.md`,
  señales en `estado.js`; tests en `tests/perfil.test.js`", y el estado de §8.1 dice "P4 hecho en 0.23.0"; §8.2
  "E4 hecho en 0.23.0". Añadir una fila "Plan 0.22 5b.4 Alumno simulado | — | ✅ 0.23.0 | `pruebas/lib/pasos.js`,
  paso `/examen (contestar)`".

- [ ] **Step 8: Run tests and lint**

Run: `npm test && npm run lint`
Expected: PASS (los de coherencia validan que lo que citan las skills existe y que VERSION = CHANGELOG).

- [ ] **Step 9: Commit**

```bash
git add AGENTS.md .kit docs
git commit -m "feat: el profesor usa mi-perfil y las señales (0.23.0)"
```

---

### Task 7: Alumno simulado en la prueba real

**Files:**
- Modify: `pruebas/lib/pasos.js` (quitar `parseTablaRespuestas`, `CICLO_POR_DEFECTO`, `rellenarRespuestasExamen`; añadir las funciones de abajo)
- Modify: `pruebas/prueba-real.js` (`pasoExamenContestar` nuevo, `pasoExamenCorregir`, `markdownResumen`, `ejecutar`)
- Create: `pruebas/curso-ejemplo/alumno/perfil.md`
- Delete: `pruebas/curso-ejemplo/alumno/respuestas-examen.md`
- Modify: `CONTRIBUTING.md:72`
- Test: `.kit/herramientas/tests/prueba-real.test.js`

**Interfaces:**
- Produces (en `pasos.js`): `examenSinSoluciones(texto): string`, `contarHuecos(texto): number`,
  `leerRespuestas(salida): string[] | null`, `ponerRespuestas(fichero, respuestas): { ok, huecos, respuestas?, enBlanco? }`,
  `promptAlumnoSimulado(perfil: string, examen: string, n: number): string`.
- Produces (en `prueba-real.js`): `markdownResumen({ …, perfil })` con `perfil = { existe: boolean, conContenido: number, total: number, senales: string[] } | undefined`.

- [ ] **Step 1: Write the failing tests** (en `prueba-real.test.js`; añadir `const p = require('../../../pruebas/lib/pasos');`)

```js
const EXAMEN = [
  '---', 'tipo: examen', '---', '# Examen', '', '## Uno', '', '**1.** ¿Qué es A?', '', '✍️ **Tu respuesta:**', '',
  '**2.** ¿Y B?', '', '✍️ **Tu respuesta:**', '',
  '> [!success]- Soluciones', '> 1. A es la primera.', '> 2. B es la segunda.', '',
  '## Histórico de intentos', '', '| Intento | Fecha | Nota |', '|---|---|---|', '| 1 | 2026-10-01 | 5 |',
].join('\n');

test('examenSinSoluciones: quita callouts y el histórico, deja las preguntas', () => {
  const limpio = p.examenSinSoluciones(EXAMEN);
  assert.match(limpio, /¿Qué es A\?/);
  assert.doesNotMatch(limpio, /primera|Soluciones|Histórico/);
  assert.equal(p.contarHuecos(limpio), 2);
});

test('leerRespuestas: saca el JSON aunque venga con texto alrededor; si no hay, null', () => {
  assert.deepEqual(p.leerRespuestas('Aquí van:\n{"respuestas": ["A es la primera", ""]}\nListo.'), ['A es la primera', '']);
  assert.equal(p.leerRespuestas('no sé'), null);
  assert.equal(p.leerRespuestas('{"otra": 1}'), null);
});

test('ponerRespuestas: escribe cada una tras su hueco; si no cuadran, no toca nada', () => {
  const dir = temporal('alumno-simulado-');
  const f = path.join(dir, 'examen.md');
  fs.writeFileSync(f, EXAMEN);
  assert.deepEqual(p.ponerRespuestas(f, ['solo una']), { ok: false, huecos: 2, respuestas: 1 });
  assert.equal(fs.readFileSync(f, 'utf8'), EXAMEN);
  assert.deepEqual(p.ponerRespuestas(f, ['A es la primera', '']), { ok: true, huecos: 2, enBlanco: 1 });
  assert.match(fs.readFileSync(f, 'utf8'), /✍️ \*\*Tu respuesta:\*\* A es la primera\n/);
});

test('promptAlumnoSimulado: lleva el perfil, el examen y el número exacto de respuestas', () => {
  const prompt = p.promptAlumnoSimulado('PERFIL-X', 'EXAMEN-Y', 7);
  assert.match(prompt, /PERFIL-X/);
  assert.match(prompt, /EXAMEN-Y/);
  assert.match(prompt, /exactamente 7/);
});

test('markdownResumen: sección Mi perfil con secciones y señales', () => {
  const md = markdownResumen({ fecha: '2026-10-01', version: '0.23.0', modelo: 'sonnet', sinLlm: false, pasos: [],
    informe: { errores: [], avisos: [] }, conteos: {}, perfil: { existe: true, conContenido: 4, total: 5, senales: ['concepto-rojo: alfa'] } });
  assert.match(md, /## Mi perfil[\s\S]*4 de 5 secciones con contenido[\s\S]*concepto-rojo: alfa/);
});
```

Y en el test existente `ejecutar({ sinLlm: true })…`, añadir: `assert.match(resumen, /## Mi perfil/);`.

- [ ] **Step 2: Run to verify they fail**

Run: `node --test .kit/herramientas/tests/prueba-real.test.js`
Expected: FAIL — `p.examenSinSoluciones is not a function`.

- [ ] **Step 3: Implement `pasos.js`** (sustituye `parseTablaRespuestas`, `CICLO_POR_DEFECTO` y `rellenarRespuestasExamen`)

```js
const HUECO = /✍️\s*\*\*Tu respuesta:\*\*/;

// Lo que ve el alumno simulado: el examen sin nada que le dé la respuesta. Fuera todos los callouts (las
// soluciones van plegadas en uno; la ampliación y los intentos anteriores, en otros) y todo desde el histórico.
function examenSinSoluciones(texto) {
  const lineas = texto.replace(/\r\n/g, '\n').split('\n');
  const corte = lineas.findIndex(l => /^## Histórico de intentos/.test(l));
  const salida = [];
  let enCallout = false;
  for (const l of corte >= 0 ? lineas.slice(0, corte) : lineas) {
    if (/^>\s*\[![^\]]+\]/.test(l)) { enCallout = true; continue; }
    if (enCallout && l.startsWith('>')) continue;
    enCallout = false;
    salida.push(l);
  }
  return salida.join('\n');
}

function contarHuecos(texto) { return texto.split(/\r?\n/).filter(l => HUECO.test(l)).length; }

// El alumno simulado devuelve {"respuestas": [...]} en algún punto de su salida.
function leerRespuestas(salida) {
  const i = salida.indexOf('{');
  const j = salida.lastIndexOf('}');
  if (i < 0 || j < i) return null;
  try {
    const r = JSON.parse(salida.slice(i, j + 1)).respuestas;
    return Array.isArray(r) ? r.map(x => String(x ?? '').replace(/\s*\n\s*/g, ' ').trim()) : null;
  } catch { return null; }
}

// Cada respuesta detrás de su `✍️ **Tu respuesta:**`, en orden. Si no hay tantas como huecos, no se toca nada:
// una respuesta desplazada corregiría la pregunta equivocada.
function ponerRespuestas(ficheroExamen, respuestas) {
  const lineas = fs.readFileSync(ficheroExamen, 'utf8').split(/\r?\n/);
  const huecos = lineas.map((l, i) => (HUECO.test(l) ? i : -1)).filter(i => i >= 0);
  if (huecos.length !== respuestas.length) return { ok: false, huecos: huecos.length, respuestas: respuestas.length };
  huecos.forEach((i, n) => { if (respuestas[n]) lineas[i] = `${lineas[i]} ${respuestas[n]}`; });
  fs.writeFileSync(ficheroExamen, lineas.join('\n'));
  return { ok: true, huecos: huecos.length, enBlanco: respuestas.filter(r => !r).length };
}

function promptAlumnoSimulado(perfil, examen, n) {
  return [
    'Eres un alumno haciendo un examen, no un profesor ni un asistente. Este es tu perfil:', '', perfil, '',
    'Este es el examen:', '', examen, '',
    `Contesta las ${n} preguntas que tienen la línea «✍️ Tu respuesta», en orden, como contestaría de verdad este alumno:`,
    'con sus palabras, con el nivel y la proporción de aciertos, medias respuestas, fallos y blancos que dice su perfil,',
    'y con errores creíbles, nunca absurdos. En una pregunta tipo test, contesta con la letra y, si quieres, una frase.',
    `Devuelve SOLO un JSON, sin nada más: {"respuestas": ["…", "…"]} con exactamente ${n} elementos; "" deja una en blanco.`,
  ].join('\n');
}
```

`module.exports` de `pasos.js`: quitar `parseTablaRespuestas, rellenarRespuestasExamen`; añadir
`examenSinSoluciones, contarHuecos, leerRespuestas, ponerRespuestas, promptAlumnoSimulado`.

- [ ] **Step 4: Implement `prueba-real.js`**

Import: `const { borrar, montarCurso, comprobarJson, carpetaTemporal } = require('./lib/montaje');`. Constantes:
`const NOTA_MIN = 3; const NOTA_MAX = 8;   // fuera de aquí, el simulado o la corrección no se portaron como se esperaba`.

Paso nuevo, entre `pasoExamenGenerar` y `pasoExamenCorregir`:

```js
// El alumno simulado (plan 0.22, 5b.4): otra llamada sin conversación, desde una carpeta vacía (no puede abrir el
// examen con las soluciones), que recibe el examen limpio y el perfil y devuelve sus respuestas en JSON.
function pasoExamenContestar(ctx) {
  if (ctx.sinLlm) return { ok: null, detalle: 'omitido (--sin-llm)' };
  if (!ctx.ficheroExamen) return { ok: false, detalle: 'no hay examen generado: no hay nada que contestar' };
  const examen = p.examenSinSoluciones(fs.readFileSync(ctx.ficheroExamen, 'utf8'));
  const n = p.contarHuecos(examen);
  const perfil = fs.readFileSync(path.join(ctx.datosCurso, 'alumno', 'perfil.md'), 'utf8');
  const vacia = carpetaTemporal();
  try {
    const r = invocarClaude({ prompt: p.promptAlumnoSimulado(perfil, examen, n), modelo: ctx.modelo, cwd: vacia, limiteMs: ctx.limiteMs });
    if (!r.ok) return { ok: false, detalle: `claude falló haciendo de alumno (código ${r.codigo})`, salidaLlm: r.salida };
    const respuestas = p.leerRespuestas(r.salida);
    if (!respuestas) return { ok: false, detalle: 'el alumno simulado no devolvió el JSON de respuestas', salidaLlm: r.salida };
    const puesto = p.ponerRespuestas(ctx.ficheroExamen, respuestas);
    if (!puesto.ok) return { ok: false, detalle: `el alumno simulado dio ${puesto.respuestas} respuestas para ${puesto.huecos} preguntas`, salidaLlm: r.salida };
    return { ok: true, detalle: `${puesto.huecos} preguntas contestadas por el alumno simulado, ${puesto.enBlanco} en blanco` };
  } finally {
    borrar(vacia);
  }
}
```

En `pasoExamenCorregir`: quitar las dos líneas de `tabla`/`contadas`; tras calcular `nota`:

```js
  const valor = nota ? Number(nota[1].replace(',', '.')) : null;
  const enMargen = valor !== null && valor >= NOTA_MIN && valor <= NOTA_MAX;
  const ok = !!nota && historico && progresoMovido && enMargen;
```

y el `detalle` empieza por `nota: ${nota ? nota[1] : 'no encontrada'} (margen esperado ${NOTA_MIN}-${NOTA_MAX}: ${enMargen ? 'sí' : 'no'}) · ` (sin "respuestas preparadas").

En `ejecutar`, entre generar y corregir: `ejecutarPaso(pasos, '/examen (contestar)', () => pasoExamenContestar(ctx));`.
Tras `comprobarJson(destino)`:

```js
    const perfil = resumenPerfil(destino);
```

con la función (junto a `contarNotas`):

```js
// Cómo quedó mi-perfil.md y qué señales da estado.js, con el motor del propio curso montado.
function resumenPerfil(destino) {
  const f = path.join(destino, 'estudio', 'mi-perfil.md');
  const senales = require(path.join(destino, '.kit', 'herramientas', 'estado.js')).calcularEstado(destino).senales || [];
  if (!fs.existsSync(f)) return { existe: false, conContenido: 0, total: 0, senales: senales.map(s => `${s.tipo}: ${s.detalle}`) };
  const partes = fs.readFileSync(f, 'utf8').split(/^## /m).slice(1);
  return {
    existe: true, total: partes.length, conContenido: partes.filter(x => !/Todavía nada/.test(x)).length,
    senales: senales.map(s => `${s.tipo}: ${s.detalle}`),
  };
}
```

y se pasa `perfil` a `markdownResumen`. En `markdownResumen({ …, perfil })`, antes de `## \`comprobar.js\``:

```js
  l.push('## Mi perfil', '');
  if (!perfil) l.push('- No calculado.', '');
  else {
    l.push(perfil.existe ? `- \`mi-perfil.md\`: ${perfil.conContenido} de ${perfil.total} secciones con contenido` : '- `mi-perfil.md`: **no existe**');
    l.push(perfil.senales.length ? `- Señales de \`estado.js\`: ${perfil.senales.join(' · ')}` : '- Señales de `estado.js`: ninguna', '');
  }
```

- [ ] **Step 5: Perfil del alumno simulado** — crear `pruebas/curso-ejemplo/alumno/perfil.md` y borrar `respuestas-examen.md`:

```markdown
# Perfil del alumno simulado

> Lo lee `pruebas/prueba-real.js` (paso `/examen (contestar)`): quien contesta el examen es otra llamada al
> asistente que hace de este alumno. No es `config/` del curso: el profesor no lo ve.

- Trabaja por su cuenta (diseño gráfico freelance); factura de forma irregular. Quiere el curso para organizar
  sus propias cuentas.
- Ha leído las clases del módulo 1 una vez, por encima, y ha hecho las flashcards sin repetirlas.
- Entiende las ideas con ejemplos de su vida, pero se le escapan los nombres exactos y los detalles de las cuentas.

**Cómo contesta** (de cada diez preguntas, más o menos):

- **4 bien**: la idea y, si se pide, la cifra.
- **3 a medias**: la idea bien pero sin la cifra o sin el porqué que se pedía, o la cifra sin el periodo ("25 %"
  en vez de "25 % al mes").
- **2 mal**, con errores creíbles: confunde conceptos cercanos (gasto variable con imprevisto, liquidez con
  ahorro), divide entre lo que no toca, elige la opción que suena bien.
- **1 en blanco**: la que no sabe, la deja.

Escribe corto, en primera persona a veces, sin tecnicismos que no haya visto en clase.
```

`CONTRIBUTING.md:72`: `pruebas/curso-ejemplo/alumno/respuestas-examen.md` → "contestadas por un alumno simulado con el perfil de `pruebas/curso-ejemplo/alumno/perfil.md`, sin ver las soluciones; la nota tiene que quedar entre 3 y 8".

- [ ] **Step 6: Run to verify**

Run: `node --test .kit/herramientas/tests/prueba-real.test.js && npm test && npm run lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add pruebas CONTRIBUTING.md .kit/herramientas/tests/prueba-real.test.js
git commit -m "feat(prueba-real): el examen lo contesta un alumno simulado"
```

---

### Task 8: Prueba real y PR

- [ ] **Step 1:** Pedir a Roberto el sí para lanzar `npm run prueba-real` (≈ 50-60 min de su cuota). Con su sí,
  lanzarla en segundo plano.
- [ ] **Step 2:** Revisar `pruebas/curso-ejemplo/resultado/RESUMEN.md`: los pasos ✅, la nota del examen entre 3 y
  8, la sección **Mi perfil** con contenido y alguna señal; abrir `resultado/estudio/mi-perfil.md` y leerla como
  la leería el alumno (¿se entiende?, ¿es sincera sin juzgar?). Lo que salga mal se arregla antes del PR.
- [ ] **Step 3:** Commit del resultado: `git add pruebas/curso-ejemplo/resultado && git commit -m "prueba real 0.23.0"`.
- [ ] **Step 4:** Con el sí de Roberto: `gh auth status` (cuenta `rsotor`), push de la rama y PR a `main`.
  Esperar `tests-ok` (`gh pr checks <n> --watch`), mezclar con su sí y comprobar la release `v0.23.0` (`gh release list`).
