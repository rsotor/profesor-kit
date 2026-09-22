# Índice del curso — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el alumno navegue su curso solo en Obsidian: una página `estudio/inicio.md` generada con el temario
entero y el estado de cada sesión, y un pie anterior / inicio / siguiente en cada nota de sesión.

**Architecture:** Un módulo puro nuevo, `.kit/herramientas/lib/indice.js`, lee sesiones, `progreso.md`, exámenes
y `config/estructura.json` y devuelve texto. `guardar.js` lo escribe en cada guardado (genera primero, comprueba
después). `comprobar.js` gana tres avisos y pierde la exigencia del mapa. Una migración 003 añade la casilla
`estudiada` a los cursos ya creados. Skills, plantillas y guías se alinean con el nuevo flujo.

**Tech Stack:** Node ≥ 18 sin dependencias (`node:fs`, `node:path`, `node:test`, `node:assert/strict`).

**Spec:** `docs/superpowers/specs/2026-09-22-indice-del-curso-design.md` — léela entera antes de empezar.

## Global Constraints

- Sin dependencias npm. Solo módulos `node:` estándar. `'use strict';` en cada fichero, como el resto.
- Solo Markdown que Obsidian dibuja de serie: enlaces, tablas, propiedades, comentarios `%% %%`. Ningún plugin.
- Enlaces con alias dentro de tablas: `[[nota\|texto]]`. Fuera de tablas: `[[nota|texto]]`.
- Los ficheros generados se escriben **solo si cambian** (un curso quieto no debe tener cambios en git).
- Se conserva el fin de línea (CRLF/LF) de cada nota que se toca.
- Las rutas dentro de notas son relativas a `estudio/`. En skills y `AGENTS.md`, las rutas del alumno llevan
  `estudio/` delante (lo vigila `generico.test.js`).
- Nunca `git add/commit/push` dentro de skills. En este repo (el kit) sí se hace commit al final de cada tarea.
- Tests: `node --test ".kit/herramientas/tests/*.test.js"` desde la raíz del repo. Todos en verde al cerrar
  cada tarea.
- Idioma: español, con tildes; mensajes al alumno sin jerga.
- Aprobado por defecto: **5**. Notas sobre 10, formato `7,5` (coma decimal, un decimal).

---

## Mapa de ficheros

| Fichero | Responsabilidad | Tarea |
|---|---|---|
| `.kit/herramientas/lib/vault.js` | Frontmatter con listas en bloque; `esCierto`, `numero`; `inicio.md` en `listarNotas` | 1 |
| `.kit/herramientas/lib/indice.js` (nuevo) | Leer sesiones/progreso/exámenes y calcular `inicio.md` y pies. No escribe | 2, 3, 4 |
| `.kit/herramientas/tests/indice.test.js` (nuevo) | Tests del índice | 2, 3, 4 |
| `.kit/herramientas/guardar.js` | `regenerarGenerados`: genera antes de comprobar | 5 |
| `.kit/herramientas/tests/ayuda.js` | El curso de pruebas nace con sus generados ya escritos | 5 |
| `.kit/herramientas/comprobar.js` | Quitar `comprobarMapa`; avisos `orden-ambiguo`, `examen-sin-nota`, `navegacion-rota` | 6 |
| `.kit/herramientas/migraciones/003-casilla-estudiada.js` (nuevo) + `.kit/motor.json` | Cursos existentes | 7 |
| `.kit/plantillas/sesion.md`, skills `sesion`/`examen`/`configurar`, `AGENTS.md`, `INSTALAR-AGENTE.md` | Flujo del profesor | 8 |
| `.kit/plantillas/guia-de-uso.md` | La hoja del alumno, reescrita | 9 |
| `extremo-a-extremo.test.js`, `.kit/CHANGELOG.md`, `docs/superpowers/pruebas/…` | Cierre | 10 |
| — | Validación con el curso real y con una persona | 11 |

`organizar.js` no cambia: `leerEstructura` ya admite campos extra en cada unidad, así que `titulo` pasa sin tocarlo.

---

### Task 1: `vault.js` — frontmatter robusto e `inicio.md` entre las notas

**Files:**
- Modify: `.kit/herramientas/lib/vault.js` (`leerFrontmatter` ~l.77-91, `listarNotas` ~l.40-50, `module.exports`)
- Test: `.kit/herramientas/tests/vault.test.js`

**Interfaces:**
- Produces: `leerFrontmatter(texto)` entiende listas en bloque. `esCierto(valor) → boolean` (solo `true`/`'true'`).
  `numero(valor) → number|null` (acepta coma decimal). `GENERADOS_CON_ENLACES = ['inicio.md']`, incluido por
  `listarNotas` si existe. Todo exportado desde `lib/vault.js`.

- [ ] **Step 1: Tests que fallan** — añadir al final de `vault.test.js`:

```js
test('leerFrontmatter entiende listas en bloque, como las escribe Obsidian al marcar una casilla', () => {
  const fm = v.leerFrontmatter('---\ntipo: sesion\nclases:\n  - 1.2.2\n  - "1.2.3"\nestudiada: true\nvacio:\n---\n# X\n');
  assert.deepEqual(fm.clases, ['1.2.2', '1.2.3']);
  assert.equal(fm.estudiada, 'true');
  assert.equal(fm.vacio, '');
  assert.deepEqual(v.leerFrontmatter('---\nclases: [1.1.2]\n---\n').clases, ['1.1.2']);
});

test('esCierto solo acepta true: "false" como texto no cuenta como marcado', () => {
  assert.equal(v.esCierto('true'), true);
  assert.equal(v.esCierto(true), true);
  assert.equal(v.esCierto(' TRUE '), true);
  for (const x of ['false', '', undefined, null, 'sí', '1']) assert.equal(v.esCierto(x), false, String(x));
});

test('numero lee enteros y decimales con coma o punto, y null si no es un número', () => {
  assert.equal(v.numero('7,5'), 7.5);
  assert.equal(v.numero('7.5'), 7.5);
  assert.equal(v.numero(2), 2);
  for (const x of ['', undefined, null, 'siete', '[]']) assert.equal(v.numero(x), null, String(x));
});

test('listarNotas incluye inicio.md si existe, para comprobar sus enlaces', () => {
  const raiz = cursoTemporal({ 'estudio/inicio.md': '# Inicio\n' });
  assert.ok(v.listarNotas(raiz).includes('inicio.md'));
});
```

(Si `vault.test.js` no importa ya `cursoTemporal`, añadir `const { cursoTemporal } = require('./ayuda');` y
`const v = require('../lib/vault');` según lo que tenga el fichero.)

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/vault.test.js`
Expected: FAIL (`v.esCierto is not a function`, listas en bloque vacías).

- [ ] **Step 3: Implementar** — en `lib/vault.js`:

Junto a `FICHEROS_VIVOS`:

```js
// Generados por guardar.js que enlazan a otras notas: se comprueban sus enlaces, pero no se exigen ni se reparan.
const GENERADOS_CON_ENLACES = ['inicio.md'];
```

En `listarNotas`, sustituir el bucle de `FICHEROS_VIVOS` por:

```js
  for (const f of [...FICHEROS_VIVOS, ...GENERADOS_CON_ENLACES]) {
    if (fs.existsSync(path.join(raiz, f))) notas.push(path.join(raiz, f));
  }
```

Sustituir `leerFrontmatter` por:

```js
function leerFrontmatter(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
  if (!m) return null;
  const datos = {};
  let lista = null;   // clave cuyo valor vino vacío: puede seguir una lista en bloque (`- item`)
  for (const linea of m[1].split(/\r?\n/)) {
    const item = lista && /^\s*-\s+(.*)$/.exec(linea);
    if (item) {
      if (!Array.isArray(datos[lista])) datos[lista] = [];
      const valor = limpiarValor(item[1]);
      if (valor !== '') datos[lista].push(valor);
      continue;
    }
    lista = null;
    const par = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(linea);
    if (!par) continue;
    const bruto = par[2].trim();
    const enLinea = /^\[(.*)\]/.exec(bruto);
    datos[par[1]] = enLinea
      ? enLinea[1].split(',').map(limpiarValor).filter(s => s !== '')
      : limpiarValor(bruto);
    if (datos[par[1]] === '') lista = par[1];
  }
  return datos;
}

// Obsidian guarda las casillas como `true`/`false`; leídas como texto, "false" sería verdadero.
const esCierto = valor => valor === true || String(valor ?? '').trim().toLowerCase() === 'true';

function numero(valor) {
  if (valor === undefined || valor === null || Array.isArray(valor)) return null;
  const texto = String(valor).trim().replace(',', '.');
  if (texto === '') return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}
```

Añadir `GENERADOS_CON_ENLACES, esCierto, numero` a `module.exports`.

- [ ] **Step 4: Verlos pasar, y la suite entera**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS (todo).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/vault.js .kit/herramientas/tests/vault.test.js
git commit -m "feat(vault): frontmatter con listas en bloque, esCierto/numero e inicio.md entre las notas"
```

---

### Task 2: `lib/indice.js` — sesiones, orden del temario y estado del profesor

**Files:**
- Create: `.kit/herramientas/lib/indice.js`
- Create: `.kit/herramientas/tests/indice.test.js`

**Interfaces:**
- Consumes: `v.recorrer`, `v.baseAlumno`, `v.aPosix`, `v.leerFrontmatter`, `v.esCierto`, `v.numero` (Task 1).
- Produces (exportado):
  - `leerSesiones(raiz) → Sesion[]` con `Sesion = { id, rel, titulo, clases: string[], numeros: number[]|null, clave: string|null, orden: number|null, estudiada: boolean, trabajada: string, conceptos: string[] }`. `rel` relativo a `estudio/`, con `.md`.
  - `compararSesiones(a, b) → number` (orden del temario).
  - `ordenAmbiguo(sesiones) → Sesion[]` (las que comparten `clave` y alguna del grupo no tiene `orden`).
  - `leerProgreso(raiz) → Map<slug, { teoria, aplicacion }>` con estados `'✅'|'🟡'|'🔴'|'⬜'`.
  - `estadoProfesor(conceptos: string[], progreso) → { marca: 'repasar'|'superada'|'faltan'|'vacio', faltan?: number }`.

- [ ] **Step 1: Tests que fallan** — crear `indice.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ix = require('../lib/indice');
const { cursoTemporal } = require('./ayuda');

const sesion = ({ fm = '', h1 = 'Tema', conceptos = '' } = {}) =>
  `---\ntipo: sesion\n${fm}---\n# ${h1}\n\n## Conceptos\n\n${conceptos}\n\n## Lo que hay que llevarse\n\n1. x\n`;

test('leerSesiones: id, título sin prefijo, clases, casilla, conceptos nuevos y ampliados', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/m1/01-02-02-03-ratios.md': sesion({
      fm: 'clases: [1.2.2, 1.2.3]\nestudiada: false\ntrabajada: 2026-09-22\n',
      h1: '01-02-02-03 · Ratios de rentabilidad',
      conceptos: '- [[roi]] (**nuevo**)\n- Ampliados: [[volatilidad]], [[roe|el ROE]]',
    }),
  });
  const s = ix.leerSesiones(raiz).find(x => x.id === '01-02-02-03-ratios');
  assert.equal(s.rel, 'sesiones/m1/01-02-02-03-ratios.md');
  assert.equal(s.titulo, 'Ratios de rentabilidad');
  assert.deepEqual(s.clases, ['1.2.2', '1.2.3']);
  assert.deepEqual(s.numeros, [1, 2, 2, 3]);
  assert.equal(s.clave, '01-02-02-03');
  assert.equal(s.estudiada, false);
  assert.deepEqual(s.conceptos, ['roi', 'volatilidad', 'roe']);
});

test('orden del temario: por números, luego orden:, nunca por el alfabeto del slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
    'estudio/sesiones/01-02-04-van-y-tir.md': sesion(),
    'estudio/sesiones/01-10-01-extra.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).filter(s => s.numeros).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids, ['01-02-04-van-y-tir', '01-03-01-renta-variable', '01-03-01-estilos-y-ciclos', '01-10-01-extra']);
});

test('ids sin números van detrás, por fecha trabajada y luego por slug', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/semana-b.md': sesion({ fm: 'trabajada: 2026-01-02\n' }),
    'estudio/sesiones/semana-a.md': sesion({ fm: 'trabajada: 2026-01-03\n' }),
    'estudio/sesiones/01-01-uno.md': sesion(),
  });
  const ids = ix.leerSesiones(raiz).sort(ix.compararSesiones).map(s => s.id);
  assert.deepEqual(ids.filter(i => i !== 's01-intro'), ['01-01-uno', 'semana-b', 'semana-a']);
});

test('ordenAmbiguo: mismas cifras y sin orden: → aviso; con orden: en todas → nada', () => {
  const sin = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion(),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion(),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(sin)).map(s => s.id).sort(), ['01-03-01-estilos-y-ciclos', '01-03-01-renta-variable']);
  const con = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': sesion({ fm: 'orden: 1\n' }),
    'estudio/sesiones/01-03-01-estilos-y-ciclos.md': sesion({ fm: 'orden: 2\n' }),
  });
  assert.deepEqual(ix.ordenAmbiguo(ix.leerSesiones(con)), []);
});

test('leerProgreso lee teoría y aplicación de cada fila, aunque el estado lleve texto', () => {
  const raiz = cursoTemporal({
    'estudio/progreso.md': '# P\n\n| Concepto | Teoría | Aplicación | Última prueba |\n|---|---|---|---|\n' +
      '| [[roi]] | ✅ sólido | 🟡 flojo | examen |\n| [[roe\\|ROE]] | ✅ | ⬜ sin evaluar | — |\n',
  });
  const p = ix.leerProgreso(raiz);
  assert.deepEqual(p.get('roi'), { teoria: '✅', aplicacion: '🟡' });
  assert.deepEqual(p.get('roe'), { teoria: '✅', aplicacion: '⬜' });
});

test('estadoProfesor: repasar > superada > faltan N > vacío', () => {
  const p = new Map([
    ['a', { teoria: '✅', aplicacion: '⬜' }],
    ['b', { teoria: '✅', aplicacion: '✅' }],
    ['c', { teoria: '⬜', aplicacion: '⬜' }],
    ['d', { teoria: '✅', aplicacion: '🔴' }],
  ]);
  assert.deepEqual(ix.estadoProfesor(['a', 'd'], p), { marca: 'repasar' });
  assert.deepEqual(ix.estadoProfesor(['a', 'b'], p), { marca: 'superada' });
  assert.deepEqual(ix.estadoProfesor(['a', 'c', 'x'], p), { marca: 'faltan', faltan: 2 });
  assert.deepEqual(ix.estadoProfesor(['c'], p), { marca: 'vacio' });
  assert.deepEqual(ix.estadoProfesor([], p), { marca: 'vacio' });
});
```

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/indice.test.js`
Expected: FAIL (`Cannot find module '../lib/indice'`).

- [ ] **Step 3: Implementar** — crear `lib/indice.js`:

```js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// El índice del curso: estudio/inicio.md y el pie de navegación de cada sesión. Aquí solo se calcula; quien
// escribe es guardar.js. Todo sale de lo que ya hay en disco: nadie rellena el índice a mano.

const ESTADO = /(✅|🟡|🔴|⬜)/u;
const SIN_EVALUAR = { teoria: '⬜', aplicacion: '⬜' };
const FALLADO = e => e === '🟡' || e === '🔴';
// Destino de un [[enlace]]: sin alias (| o \|), sin #sección, sin carpeta.
const destino = crudo => path.posix.basename(crudo.split(/\\?\|/)[0].split('#')[0].trim());

function conceptosDe(texto) {
  const m = /^## Conceptos\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto);
  if (!m) return [];
  return [...new Set([...m[1].matchAll(/\[\[([^\]]+)\]\]/g)].map(x => destino(x[1])).filter(Boolean))];
}

function tituloDe(texto, id) {
  const cuerpo = texto.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  const m = /^#\s+(.+)$/m.exec(cuerpo);
  return m ? m[1].replace(/^\S+\s+·\s+/, '').trim() : id;
}

function leerSesiones(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'sesiones'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const texto = fs.readFileSync(abs, 'utf8');
    const fm = v.leerFrontmatter(texto) || {};
    const id = path.basename(abs, '.md');
    const num = /^(\d+(?:-\d+)*)(?=-|$)/.exec(id);
    const clases = Array.isArray(fm.clases) ? fm.clases.map(String) : (fm.clases ? [String(fm.clases)] : []);
    return {
      id,
      rel: v.aPosix(path.relative(base, abs)),
      titulo: tituloDe(texto, id),
      clases,
      numeros: num ? num[1].split('-').map(Number) : null,
      clave: num ? num[1] : null,
      orden: v.numero(fm.orden),
      estudiada: v.esCierto(fm.estudiada),
      trabajada: String(fm.trabajada || ''),
      conceptos: conceptosDe(texto),
    };
  });
}

function compararNumeros(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === undefined) return -1;
    if (b[i] === undefined) return 1;
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Orden del temario: cifras del id; si empatan, `orden:`; el slug solo como último recurso (comprobar avisa).
function compararSesiones(a, b) {
  if (a.numeros && !b.numeros) return -1;
  if (!a.numeros && b.numeros) return 1;
  if (a.numeros) {
    const n = compararNumeros(a.numeros, b.numeros);
    if (n) return n;
    const oa = a.orden ?? Infinity;
    const ob = b.orden ?? Infinity;
    if (oa !== ob) return oa < ob ? -1 : 1;
  } else if (a.trabajada !== b.trabajada) {
    return a.trabajada < b.trabajada ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

function ordenAmbiguo(sesiones) {
  const grupos = new Map();
  for (const s of sesiones) if (s.clave) grupos.set(s.clave, [...(grupos.get(s.clave) || []), s]);
  return [...grupos.values()].filter(g => g.length > 1 && g.some(s => s.orden === null)).flat();
}

function leerProgreso(raiz) {
  const estados = new Map();
  const f = path.join(v.baseAlumno(raiz), 'progreso.md');
  if (!fs.existsSync(f)) return estados;
  const estado = celda => (ESTADO.exec(celda || '') || [null, '⬜'])[1];
  for (const linea of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const celdas = linea.split(/(?<!\\)\|/).map(c => c.trim());   // la \| de un alias no separa celdas
    const m = /^\[\[([^\]]+)\]\]/.exec(celdas[1] || '');
    if (!m) continue;
    estados.set(destino(m[1]), { teoria: estado(celdas[2]), aplicacion: estado(celdas[3]) });
  }
  return estados;
}

// Lo que el profesor tiene probado de una sesión. Un concepto está probado con la teoría en ✅ y nada fallado.
function estadoProfesor(conceptos, progreso) {
  const estados = conceptos.map(c => progreso.get(c) || SIN_EVALUAR);
  if (estados.some(e => FALLADO(e.teoria) || FALLADO(e.aplicacion))) return { marca: 'repasar' };
  const probados = estados.filter(e => e.teoria === '✅').length;
  if (probados === 0) return { marca: 'vacio' };
  if (probados === conceptos.length) return { marca: 'superada' };
  return { marca: 'faltan', faltan: conceptos.length - probados };
}

module.exports = { leerSesiones, compararSesiones, ordenAmbiguo, leerProgreso, estadoProfesor };
```

- [ ] **Step 4: Verlos pasar**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/indice.js .kit/herramientas/tests/indice.test.js
git commit -m "feat(indice): sesiones en orden del temario y estado del profesor desde progreso.md"
```

---

### Task 3: `lib/indice.js` — exámenes, notas y la página `inicio.md`

**Files:**
- Modify: `.kit/herramientas/lib/indice.js`
- Test: `.kit/herramientas/tests/indice.test.js`

**Interfaces:**
- Consumes: Task 2; `leerEstructura`, `unidadDe` de `.kit/herramientas/organizar.js` (ya exportados);
  `v.leerAjustes`.
- Produces (exportado):
  - `INICIO = 'inicio.md'`.
  - `leerExamenes(raiz) → Examen[]`, `Examen = { rel, unidades: string[], fecha: string|null, nota: number|null, parcial: boolean }`.
  - `notaDeUnidad(prefijo, examenes) → Examen|null` (último no parcial por fecha, `unidades` incluye exactamente el prefijo).
  - `leerAprobado(raiz) → number` (frontmatter `aprobado:` de `config/curso.md`, 5 si falta).
  - `enlace(sesion, enTabla = false) → string`.
  - `markdownInicio(raiz, { pendientes = 0 } = {}) → string`.

- [ ] **Step 1: Tests que fallan** — añadir a `indice.test.js`:

```js
const ESTRUCTURA = JSON.stringify({ unidades: [
  { prefijo: '01', carpeta: 'modulo-01', titulo: 'Módulo 1 · Conceptos' },
  { prefijo: '01-02', carpeta: 'modulo-01/1.2-medidores', titulo: '1.2 Medidores' },
  { prefijo: '02', carpeta: 'modulo-02-finanzas-personales' },
] });
const examen = (unidad, fecha, nota, extra = '') => `---\ntipo: examen\nunidad: ${unidad}\nfecha: ${fecha}\nnota: ${nota}\n${extra}---\n# Examen\n`;

function cursoConIndice(extra = {}) {
  return cursoTemporal({
    'config/ajustes.json': JSON.stringify({ nombre_curso: 'Inversión', version_datos: 3 }),
    'config/estructura.json': ESTRUCTURA,
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-01-interes.md': sesion({ fm: 'clases: [1.2.1]\nestudiada: true\n', h1: '01-02-01 · Interés', conceptos: '- [[a]]' }),
    'estudio/sesiones/modulo-01/1.2-medidores/01-02-04-van.md': sesion({ fm: 'clases: [1.2.4]\nestudiada: false\n', h1: '01-02-04 · VAN y TIR', conceptos: '- [[b]]\n- [[c]]' }),
    'estudio/progreso.md': '| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[a]] | ✅ | ⬜ |\n| [[b]] | ✅ | ⬜ |\n| [[c]] | ⬜ | ⬜ |\n',
    ...extra,
  });
}

test('notaDeUnidad: cuenta el último examen no parcial de exactamente esa unidad', () => {
  const raiz = cursoConIndice({
    'estudio/examenes/01-02-examen-2026-10-01.md': examen('01-02', '2026-10-01', '4'),
    'estudio/examenes/01-02-examen-2026-10-09.md': examen('01-02', '2026-10-09', '8,5'),
    'estudio/examenes/01-02-examen-2026-10-20.md': examen('01-02', '2026-10-20', '3', 'parcial: true\n'),
    'estudio/examenes/01-examen-varios.md': examen('[01-02, 01-03]', '2026-10-05', '6'),
  });
  const ex = ix.leerExamenes(raiz);
  assert.equal(ix.notaDeUnidad('01-02', ex).nota, 8.5);
  assert.equal(ix.notaDeUnidad('01-03', ex).nota, 6);
  assert.equal(ix.notaDeUnidad('01', ex), null);   // un examen de 1.2+1.3 no es examen de módulo
});

test('leerAprobado: 5 por defecto, o el aprobado: de config/curso.md', () => {
  assert.equal(ix.leerAprobado(cursoTemporal()), 5);
  assert.equal(ix.leerAprobado(cursoTemporal({ 'config/curso.md': '---\nestado: configurado\naprobado: 6\n---\n# C\n' })), 6);
});

test('inicio: sigue por aquí, contadores, temario entero y tabla con alias escapado', () => {
  const md = ix.markdownInicio(cursoConIndice(), { pendientes: 3 });
  assert.match(md, /^# Inversión\n/);
  assert.match(md, /👉 Sigue por aquí: \[\[01-02-04-van\|1\.2\.4 VAN y TIR\]\]/);
  assert.match(md, /Estudiadas 1 de 3 · Pendientes abiertos: 3 → \[\[pendientes\]\]/);   // 3 = 2 + s01-intro de la base
  assert.match(md, /^## Módulo 1 · Conceptos · 1\/2 estudiadas · sin examen de módulo$/m);
  assert.match(md, /^### 1\.2 Medidores · 1\/2 estudiadas$/m);
  assert.match(md, /^\| \[\[01-02-01-interes\\\|1\.2\.1 Interés\]\] \| ✅ \| ✅ superada \|$/m);
  assert.match(md, /^\| \[\[01-02-04-van\\\|1\.2\.4 VAN y TIR\]\] \| ⬜ \| 📝 faltan 1 \|$/m);
  assert.match(md, /^## modulo 02 finanzas personales · aún sin sesiones$/m);   // sin titulo: la carpeta
  assert.match(md, /^## Sin unidad/m);   // s01-intro de la base no casa con ningún prefijo
});

test('inicio: 🔁 para repasar como lista, una sesión por línea, y nota suspensa', () => {
  const raiz = cursoConIndice({
    'estudio/progreso.md': '| C | T | A |\n|---|---|---|\n| [[a]] | 🟡 | ⬜ |\n| [[b]] | ✅ | 🔴 |\n| [[c]] | ⬜ | ⬜ |\n',
    'estudio/examenes/01-02-examen.md': examen('01-02', '2026-10-02', '4'),
  });
  const md = ix.markdownInicio(raiz);
  assert.match(md, /🔁 Para repasar:\n- \[\[01-02-01-interes\|1\.2\.1 Interés\]\]\n- \[\[01-02-04-van\|1\.2\.4 VAN y TIR\]\]\n/);
  assert.match(md, /^### 1\.2 Medidores · 1\/2 estudiadas · 📝 4,0 suspenso \(2026-10-02\)$/m);
});

test('inicio: módulo entero estudiado y sin examen → lo propone; con examen de módulo → su nota', () => {
  const todo = { 'estudio/sesiones/modulo-01/1.2-medidores/01-02-04-van.md': sesion({ fm: 'clases: [1.2.4]\nestudiada: true\n', h1: 'VAN', conceptos: '- [[b]]' }) };
  assert.match(ix.markdownInicio(cursoConIndice(todo)), /^## Módulo 1 · Conceptos · 2\/2 estudiadas · listo para el examen del módulo: pídeselo a tu profesor$/m);
  const conExamen = cursoConIndice({ ...todo, 'estudio/examenes/01-examen.md': examen('01', '2026-11-21', '7,5') });
  assert.match(ix.markdownInicio(conExamen), /^## Módulo 1 · Conceptos · 2\/2 estudiadas · 📝 7,5 \(2026-11-21\)$/m);
});

test('inicio sin estructura: una sola tabla con todas las sesiones', () => {
  const md = ix.markdownInicio(cursoTemporal());
  assert.match(md, /^## Sesiones$/m);
  assert.match(md, /\[\[s01-intro\\\|Intro\]\]/);
});

test('inicio solo enlaza las hojas que existen', () => {
  const md = ix.markdownInicio(cursoTemporal());
  assert.match(md, /\[\[mapa-del-curso\]\]/);
  assert.doesNotMatch(md, /como-usar-tu-profesor/);
});
```

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/indice.test.js`
Expected: FAIL (`ix.leerExamenes is not a function`).

- [ ] **Step 3: Implementar** — en `lib/indice.js`, añadir tras los requires:

```js
const { leerEstructura, unidadDe } = require('../organizar');

const INICIO = 'inicio.md';
const APROBADO_POR_DEFECTO = 5;
const OTRAS_HOJAS = ['mapa-del-curso', 'progreso', 'formulario', 'como-usar-tu-profesor'];
const MARCA = { repasar: () => '🔁 repasar', superada: () => '✅ superada', faltan: e => `📝 faltan ${e.faltan}`, vacio: () => '' };
```

y antes de `module.exports`:

```js
function leerExamenes(raiz) {
  const base = v.baseAlumno(raiz);
  return v.recorrer(path.join(base, 'examenes'), n => n.endsWith('.md') && !n.startsWith('_')).map(abs => {
    const fm = v.leerFrontmatter(fs.readFileSync(abs, 'utf8')) || {};
    const fecha = String(fm.fecha || '');
    return {
      rel: v.aPosix(path.relative(base, abs)),
      unidades: (Array.isArray(fm.unidad) ? fm.unidad : [fm.unidad]).filter(Boolean).map(String),
      fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
      nota: v.numero(fm.nota),
      parcial: v.esCierto(fm.parcial),
    };
  });
}

// La nota de una unidad es la de su último examen completo: nunca la media, que castiga haber mejorado.
function notaDeUnidad(prefijo, examenes) {
  const validos = examenes
    .filter(e => !e.parcial && e.nota !== null && e.fecha && e.unidades.includes(prefijo))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.rel.localeCompare(b.rel));
  return validos.length ? validos[validos.length - 1] : null;
}

function leerAprobado(raiz) {
  const f = path.join(raiz, 'config', 'curso.md');
  const fm = fs.existsSync(f) ? v.leerFrontmatter(fs.readFileSync(f, 'utf8')) : null;
  return v.numero(fm && fm.aprobado) ?? APROBADO_POR_DEFECTO;
}

const textoNota = (e, aprobado) =>
  `📝 ${e.nota.toFixed(1).replace('.', ',')}${e.nota < aprobado ? ' suspenso' : ''} (${e.fecha})`;

function enlace(s, enTabla = false) {
  const alias = `${s.clases.length ? s.clases.join('-') + ' ' : ''}${s.titulo}`.replace(/[[\]|\\]/g, '').trim();
  return `[[${s.id}${enTabla ? '\\|' : '|'}${alias}]]`;
}

function estructuraSegura(raiz) {
  try { return leerEstructura(raiz); } catch { return null; }   // una estructura rota no puede impedir guardar
}

function markdownInicio(raiz, { pendientes = 0 } = {}) {
  const base = v.baseAlumno(raiz);
  const sesiones = leerSesiones(raiz).sort(compararSesiones);
  const progreso = leerProgreso(raiz);
  const examenes = leerExamenes(raiz);
  const aprobado = leerAprobado(raiz);
  const estado = new Map(sesiones.map(s => [s.id, estadoProfesor(s.conceptos, progreso)]));
  const l = [`# ${v.leerAjustes(raiz).nombre_curso || 'Mi curso'}`, '',
    '> Lo genera tu profesor cada vez que guarda: **no lo edites**. Cuando estudies una sesión, marca la casilla',
    '> **estudiada** arriba de su nota; aquí se verá la próxima vez que trabajes con tu profesor.', ''];

  const repasar = sesiones.filter(s => estado.get(s.id).marca === 'repasar');
  if (repasar.length) l.push('🔁 Para repasar:', ...repasar.map(s => `- ${enlace(s)}`), '');
  if (sesiones.length) {
    const siguiente = sesiones.find(s => !s.estudiada);
    l.push(siguiente ? `👉 Sigue por aquí: ${enlace(siguiente)}` : '👉 Has estudiado todas las sesiones procesadas.', '');
    l.push(`Estudiadas ${sesiones.filter(s => s.estudiada).length} de ${sesiones.length} · Pendientes abiertos: ${pendientes} → [[pendientes]]`, '');
  } else {
    l.push('Todavía no hay clases procesadas: deja el material de la primera en **inbox** y díselo a tu profesor.', '');
  }

  const tabla = lista => ['| Sesión | Estudiada (tú) | Profesor |', '|---|---|---|',
    ...lista.map(s => `| ${enlace(s, true)} | ${s.estudiada ? '✅' : '⬜'} | ${MARCA[estado.get(s.id).marca](estado.get(s.id))} |`), ''];

  const estructura = estructuraSegura(raiz);
  if (!estructura) {
    if (sesiones.length) l.push('## Sesiones', '', ...tabla(sesiones));
  } else {
    const unidades = estructura.unidades.map(u => ({ ...u, hijas: [], sesiones: [] }));
    const porPrefijo = new Map(unidades.map(u => [u.prefijo, u]));
    const raices = [];
    for (const u of unidades) {
      const padre = unidades.filter(o => u.prefijo.startsWith(o.prefijo + '-')).sort((a, b) => b.prefijo.length - a.prefijo.length)[0];
      (padre ? padre.hijas : raices).push(u);
    }
    const sueltas = [];
    for (const s of sesiones) {
      const u = unidadDe(s.id, estructura);
      (u ? porPrefijo.get(u.prefijo).sesiones : sueltas).push(s);
    }
    const todasBajo = u => [...u.sesiones, ...u.hijas.flatMap(todasBajo)];
    const pintar = (u, nivel) => {
      const todas = todasBajo(u);
      const partes = [u.titulo || path.posix.basename(u.carpeta).replace(/-/g, ' ')];
      partes.push(todas.length ? `${todas.filter(s => s.estudiada).length}/${todas.length} estudiadas` : 'aún sin sesiones');
      const examen = notaDeUnidad(u.prefijo, examenes);
      if (examen) partes.push(textoNota(examen, aprobado));
      else if (nivel === 0 && todas.length) {
        partes.push(todas.every(s => s.estudiada) ? 'listo para el examen del módulo: pídeselo a tu profesor' : 'sin examen de módulo');
      }
      l.push(`${'#'.repeat(Math.min(nivel + 2, 6))} ${partes.join(' · ')}`, '');
      if (u.sesiones.length) l.push(...tabla(u.sesiones));
      for (const h of u.hijas) pintar(h, nivel + 1);
    };
    for (const u of raices) pintar(u, 0);
    if (sueltas.length) l.push('## Sin unidad', '', ...tabla(sueltas));
  }

  const hojas = OTRAS_HOJAS.filter(h => fs.existsSync(path.join(base, `${h}.md`)));
  if (hojas.length) l.push(`Otras hojas: ${hojas.map(h => `[[${h}]]`).join(' · ')}`, '');
  return l.join('\n');
}
```

Actualizar `module.exports`:

```js
module.exports = {
  INICIO, leerSesiones, compararSesiones, ordenAmbiguo, leerProgreso, estadoProfesor,
  leerExamenes, notaDeUnidad, leerAprobado, enlace, markdownInicio,
};
```

Nota: el `sesiones` de cada unidad ya queda ordenado porque se rellena recorriendo `sesiones` ordenadas.

- [ ] **Step 4: Verlos pasar**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/indice.js .kit/herramientas/tests/indice.test.js
git commit -m "feat(indice): exámenes, nota por unidad y la página inicio.md con el temario entero"
```

---

### Task 4: `lib/indice.js` — pie de navegación de cada sesión

**Files:**
- Modify: `.kit/herramientas/lib/indice.js`
- Test: `.kit/herramientas/tests/indice.test.js`

**Interfaces:**
- Produces (exportado): `MARCA_INICIO`, `MARCA_FIN`; `pieDeSesion(anterior|null, siguiente|null) → string` (sin EOL
  final); `ponerPie(texto, pie) → string`; `marcadoresRotos(texto) → boolean`; `piesDeSesion(raiz) → Map<rel, pie>`.

- [ ] **Step 1: Tests que fallan**

```js
test('pieDeSesion: anterior · inicio · siguiente, con línea en blanco antes de la raya', () => {
  const a = { id: 'a', clases: ['1.1'], titulo: 'Uno' };
  const b = { id: 'b', clases: [], titulo: 'Dos' };
  assert.equal(ix.pieDeSesion(a, b), `${ix.MARCA_INICIO}\n\n---\n← [[a|1.1 Uno]] · [[inicio|🏠 Inicio]] · [[b|Dos]] →\n${ix.MARCA_FIN}`);
  assert.match(ix.pieDeSesion(null, b), /\n\[\[inicio\|🏠 Inicio\]\] · \[\[b\|Dos\]\] →\n/);
  assert.match(ix.pieDeSesion(a, null), /\n← \[\[a\|1\.1 Uno\]\] · \[\[inicio\|🏠 Inicio\]\]\n/);
});

test('ponerPie: lo añade al final, lo reescribe entre marcadores y no toca el resto', () => {
  const pie1 = ix.pieDeSesion(null, { id: 'b', clases: [], titulo: 'Dos' });
  const pie2 = ix.pieDeSesion(null, { id: 'c', clases: [], titulo: 'Tres' });
  const con1 = ix.ponerPie('# X\n\nCuerpo.\n\n\n', pie1);
  assert.equal(con1, `# X\n\nCuerpo.\n\n${pie1}\n`);
  assert.equal(ix.ponerPie(con1, pie1), con1);                 // idempotente
  assert.equal(ix.ponerPie(con1, pie2), `# X\n\nCuerpo.\n\n${pie2}\n`);
});

test('ponerPie conserva CRLF y no toca una nota con los marcadores rotos', () => {
  const pie = ix.pieDeSesion(null, null);
  const crlf = ix.ponerPie('# X\r\n\r\nCuerpo.\r\n', pie);
  assert.ok(!/[^\r]\n/.test(crlf), 'todas las líneas en CRLF');
  const roto = `# X\n\n${ix.MARCA_INICIO}\nsin cierre\n`;
  assert.equal(ix.ponerPie(roto, pie), roto);
  assert.equal(ix.marcadoresRotos(roto), true);
  assert.equal(ix.marcadoresRotos(crlf), false);
});

test('piesDeSesion: cada sesión enlaza a la anterior y a la siguiente del temario', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-01-uno.md': sesion({ h1: 'Uno' }),
    'estudio/sesiones/01-02-dos.md': sesion({ h1: 'Dos' }),
  });
  const pies = ix.piesDeSesion(raiz);
  assert.match(pies.get('sesiones/01-01-uno.md'), /\[\[inicio\|🏠 Inicio\]\] · \[\[01-02-dos\|Dos\]\] →/);
  assert.match(pies.get('sesiones/01-02-dos.md'), /← \[\[01-01-uno\|Uno\]\] · \[\[inicio\|🏠 Inicio\]\] · \[\[s01-intro\|Intro\]\] →/);
});
```

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/indice.test.js`
Expected: FAIL (`ix.pieDeSesion is not a function`).

- [ ] **Step 3: Implementar** — en `lib/indice.js`:

```js
// El pie va entre comentarios de Obsidian, que no se ven al leer. La línea en blanco antes de `---` es obligatoria:
// sin ella, Markdown lee la línea de arriba como un título.
const MARCA_INICIO = '%% navegación: la genera guardar.js; no se edita a mano %%';
const MARCA_FIN = '%% fin de la navegación %%';

function pieDeSesion(anterior, siguiente) {
  const partes = [];
  if (anterior) partes.push(`← ${enlace(anterior)}`);
  partes.push('[[inicio|🏠 Inicio]]');
  if (siguiente) partes.push(`${enlace(siguiente)} →`);
  return [MARCA_INICIO, '', '---', partes.join(' · '), MARCA_FIN].join('\n');
}

function marcadoresRotos(texto) {
  const i = texto.indexOf(MARCA_INICIO);
  const f = texto.indexOf(MARCA_FIN);
  return (i >= 0) !== (f >= 0) || (i >= 0 && f < i);
}

// Solo toca lo que hay entre los marcadores. Respeta el fin de línea del fichero: si no, en Windows cada
// guardado reescribiría la nota entera.
function ponerPie(texto, pie) {
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const conEol = pie.split('\n').join(eol);
  if (marcadoresRotos(texto)) return texto;   // comprobar avisa; no se adivina dónde acaba
  const i = texto.indexOf(MARCA_INICIO);
  if (i >= 0) return texto.slice(0, i) + conEol + texto.slice(texto.indexOf(MARCA_FIN) + MARCA_FIN.length);
  return texto.replace(/(\r?\n)*$/, '') + eol + eol + conEol + eol;
}

function piesDeSesion(raiz) {
  const sesiones = leerSesiones(raiz).sort(compararSesiones);
  return new Map(sesiones.map((s, i) => [s.rel, pieDeSesion(sesiones[i - 1] || null, sesiones[i + 1] || null)]));
}
```

Añadir `MARCA_INICIO, MARCA_FIN, pieDeSesion, ponerPie, marcadoresRotos, piesDeSesion` a `module.exports`.

- [ ] **Step 4: Verlos pasar**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/lib/indice.js .kit/herramientas/tests/indice.test.js
git commit -m "feat(indice): pie de navegación anterior/inicio/siguiente en cada sesión"
```

---

### Task 5: `guardar.js` genera antes de comprobar

**Files:**
- Modify: `.kit/herramientas/guardar.js` (función `guardar`, ~l.23-33)
- Modify: `.kit/herramientas/tests/ayuda.js`
- Test: `.kit/herramientas/tests/guardar.test.js`

**Interfaces:**
- Consumes: `markdownInicio`, `piesDeSesion`, `ponerPie`, `INICIO` (Tasks 3-4); `pendientes`, `markdownPendientes`,
  `markdownAuditoria` de `comprobar.js`.
- Produces: `regenerarGenerados(raiz)` exportado desde `guardar.js` (escribe pies, `inicio.md`, `pendientes.md`,
  `auditoria-del-material.md`, cada uno solo si cambia).

- [ ] **Step 1: Tests que fallan** — añadir a `guardar.test.js`:

```js
test('un curso sin inicio.md se guarda y sale con él y con el pie en cada sesión', () => {
  const raiz = cursoTemporal();
  iniciarGit(raiz);
  fs.rmSync(path.join(raiz, 'estudio', 'inicio.md'));
  escribir(raiz, { 'estudio/sesiones/s02-tema.md': '---\ntipo: sesion\n---\n# Tema\n\n## Conceptos\n\n- [[alfa]]\n' });
  const r = guardar({ raiz, mensaje: 'sesion(s02): tema' });
  assert.equal(r.guardado, true, JSON.stringify(r.informe.errores));
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'inicio.md'), 'utf8'), /\[\[s01-intro\\\|Intro\]\]/);
  assert.match(fs.readFileSync(path.join(raiz, 'estudio', 'sesiones', 's02-tema.md'), 'utf8'), /← \[\[s01-intro\|Intro\]\] · \[\[inicio\|🏠 Inicio\]\]\n%% fin/);
  assert.equal(guardar({ raiz, mensaje: 'otra vez' }).motivo, 'sin-cambios');
});

test('una sesión que no está en mapa-del-curso.md ya no impide guardar', () => {
  const raiz = cursoTemporal({ 'estudio/mapa-del-curso.md': '# Mapa\n' });
  iniciarGit(raiz);
  escribir(raiz, { 'estudio/formulario.md': '# F\n\nx\n' });
  assert.equal(guardar({ raiz, mensaje: 'x' }).guardado, true);
});
```

(El segundo pasa solo tras la Task 6; aquí se escribe ya y se ve fallar.)

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/guardar.test.js`
Expected: FAIL (no existe `estudio/inicio.md` en el curso de pruebas; el mapa da error).

- [ ] **Step 3: Implementar** — en `guardar.js`, cambiar el require de `comprobar` y añadir el de `indice`:

```js
const { comprobar, pendientes, markdownPendientes, markdownAuditoria, actualizarEstadoReadme } = require('./comprobar');
const indice = require('./lib/indice');
```

Añadir antes de `guardar`:

```js
// Lo que se escribe solo en cada guardado. Va ANTES de comprobar: así un curso al que aún le falta inicio.md no se
// queda sin poder guardar, y lo generado se comprueba en el mismo guardado. Solo se escribe lo que cambia: si no,
// un curso quieto parecería tener cambios.
function regenerarGenerados(raiz) {
  const base = path.join(raiz, CARPETA_ALUMNO);
  const escribirSiCambia = (fichero, texto) => {
    if (!fs.existsSync(fichero) || fs.readFileSync(fichero, 'utf8') !== texto) fs.writeFileSync(fichero, texto);
  };
  for (const [rel, pie] of indice.piesDeSesion(raiz)) {
    const fichero = path.join(base, ...rel.split('/'));
    escribirSiCambia(fichero, indice.ponerPie(fs.readFileSync(fichero, 'utf8'), pie));
  }
  escribirSiCambia(path.join(base, indice.INICIO), indice.markdownInicio(raiz, { pendientes: pendientes(raiz).length }));
  escribirSiCambia(path.join(base, 'pendientes.md'), markdownPendientes(raiz));
  escribirSiCambia(path.join(base, 'auditoria-del-material.md'), markdownAuditoria(raiz));
}
```

En `guardar`, sustituir desde `const informe = comprobar(raiz);` hasta el final del bucle `for` de generados por:

```js
  if (!g.esRepo(raiz)) return { guardado: false, motivo: 'sin-repo', subido: false, informe: comprobar(raiz) };
  regenerarGenerados(raiz);
  const informe = comprobar(raiz);
  if (informe.errores.length && !permitirErrores) return { guardado: false, motivo: 'errores', subido: false, informe };
```

(El resto de `guardar` —`actualizarEstadoReadme`, `hayCambios`, identidad, commit, push— queda igual.)
Exportar: `module.exports = { guardar, regenerarGenerados, anotarEnDiario, cli };`

En `tests/ayuda.js`: quitar de `BASE` las entradas `'estudio/pendientes.md'` y `'estudio/auditoria-del-material.md'`,
y cambiar `cursoTemporal` para que la base nazca con sus generados, como la dejaría un guardado:

```js
function cursoTemporal(ficheros = {}) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-'));
  escribir(raiz, BASE);
  require('../guardar').regenerarGenerados(raiz);   // como la dejaría un guardado: inicio, pies, pendientes
  escribir(raiz, ficheros);
  return raiz;
}
```

- [ ] **Step 4: Ejecutar la suite**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS todo salvo `una sesión que no está en mapa-del-curso.md ya no impide guardar` (se arregla en la
Task 6). Si falla algún test antiguo porque un curso de pruebas sobrescribe `s01-intro.md` y ahora el guardado
le añade el pie, el test es correcto y lo que cambia es la expectativa: ajustarla para que cuente con el pie,
nunca desactivar la generación.

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/guardar.js .kit/herramientas/tests/ayuda.js .kit/herramientas/tests/guardar.test.js
git commit -m "feat(guardar): genera inicio.md y los pies de sesión antes de comprobar"
```

---

### Task 6: `comprobar.js` — fuera la exigencia del mapa, tres avisos nuevos

**Files:**
- Modify: `.kit/herramientas/comprobar.js` (quitar `comprobarMapa` ~l.78-89 y su llamada en `comprobar`; añadir
  `comprobarIndiceDelCurso`)
- Modify: `.kit/herramientas/tests/comprobar-estructura.test.js` (~l.55-58: el test que espera la regla `mapa`)
- Test: `.kit/herramientas/tests/comprobar-avisos.test.js`

**Interfaces:**
- Consumes: `leerSesiones`, `ordenAmbiguo`, `leerExamenes`, `marcadoresRotos` (Tasks 2-4).
- Produces: avisos `orden-ambiguo`, `examen-sin-nota`, `navegacion-rota`. Ya no existe la regla `mapa`.

- [ ] **Step 1: Tests que fallan** — añadir a `comprobar-avisos.test.js` (usar sus helpers `reglas`/`cursoTemporal`
  si existen; si no, definir `const reglas = i => [...i.errores, ...i.avisos].map(x => x.regla);`):

```js
const ix = require('../lib/indice');

test('orden-ambiguo: dos sesiones con las mismas cifras y sin orden:', () => {
  const raiz = cursoTemporal({
    'estudio/sesiones/01-03-01-renta-variable.md': '---\ntipo: sesion\n---\n# A\n',
    'estudio/sesiones/01-03-01-estilos.md': '---\ntipo: sesion\n---\n# B\n',
  });
  const avisos = comprobar(raiz).avisos.filter(a => a.regla === 'orden-ambiguo');
  assert.equal(avisos.length, 2);
  assert.match(avisos[0].detalle, /orden:/);
});

test('examen-sin-nota: un examen sin nota: o sin fecha: válida', () => {
  const raiz = cursoTemporal({ 'estudio/examenes/01-examen.md': '---\nunidad: 01\nfecha: ayer\n---\n# E\n' });
  assert.ok(comprobar(raiz).avisos.some(a => a.regla === 'examen-sin-nota' && a.fichero === 'examenes/01-examen.md'));
});

test('navegacion-rota: un marcador del pie sin el otro', () => {
  const raiz = cursoTemporal({ 'estudio/sesiones/s01-intro.md': `---\ntipo: sesion\n---\n# Intro\n\n- [[alfa]]\n\n${ix.MARCA_INICIO}\n` });
  assert.ok(comprobar(raiz).avisos.some(a => a.regla === 'navegacion-rota'));
});

test('el curso de pruebas recién guardado no da ninguno de los avisos del índice', () => {
  const r = reglas(comprobar(cursoTemporal()));
  for (const regla of ['orden-ambiguo', 'examen-sin-nota', 'navegacion-rota']) assert.ok(!r.includes(regla), regla);
});
```

En `comprobar-estructura.test.js`, sustituir el test que espera `'mapa'` (el de `'estudio/mapa-del-curso.md': '# Mapa\n'`) por:

```js
test('una sesión que no está en mapa-del-curso.md no es error: el índice es inicio.md, y se genera solo', () => {
  const raiz = cursoTemporal({ 'estudio/mapa-del-curso.md': '# Mapa\n' });
  assert.ok(!reglas(comprobar(raiz)).includes('mapa'));
});
```

- [ ] **Step 2: Verlos fallar**

Run: `node --test .kit/herramientas/tests/comprobar-avisos.test.js .kit/herramientas/tests/comprobar-estructura.test.js`
Expected: FAIL (no hay avisos nuevos; la regla `mapa` sigue saliendo).

- [ ] **Step 3: Implementar** — en `comprobar.js`:

1. Borrar la función `comprobarMapa` entera y la línea `comprobarMapa(raiz, informe);` de `comprobar`.
2. Añadir `const indice = require('./lib/indice');` tras el require de `./lib/secretos`.
3. Añadir la función:

```js
// El índice del curso (inicio.md y los pies) sale de las sesiones y los exámenes: aquí se avisa de lo que haría
// que saliera mal. No son errores: el índice se genera igual.
function comprobarIndiceDelCurso(raiz, informe) {
  const sesiones = indice.leerSesiones(raiz);
  for (const s of indice.ordenAmbiguo(sesiones)) {
    informe.avisos.push({ regla: 'orden-ambiguo', fichero: s.rel, detalle: 'comparte cifras con otra sesión y el grupo no tiene `orden:` en todas: pon `orden: 1`, `orden: 2`… en su frontmatter para que la navegación siga el temario' });
  }
  for (const s of sesiones) {
    if (indice.marcadoresRotos(leer(raiz, s.rel))) informe.avisos.push({ regla: 'navegacion-rota', fichero: s.rel, detalle: 'el pie de navegación tiene un marcador %% sin el otro: guardar.js no lo toca hasta que se arregle (borra el pie entero y se vuelve a generar)' });
  }
  for (const e of indice.leerExamenes(raiz)) {
    if (e.nota === null || !e.fecha || !e.unidades.length) informe.avisos.push({ regla: 'examen-sin-nota', fichero: e.rel, detalle: 'le falta `unidad:`, `nota:` (sobre 10) o `fecha:` (AAAA-MM-DD) en el frontmatter: sin ellas no sale en inicio' });
  }
}
```

4. Llamarla en `comprobar`, justo después de `comprobarUnidades(raiz, informe);`:
   `comprobarIndiceDelCurso(raiz, informe);`

- [ ] **Step 4: Ejecutar la suite**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS todo (incluido el test de la Task 5 sobre el mapa).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/comprobar.js .kit/herramientas/tests/comprobar-avisos.test.js .kit/herramientas/tests/comprobar-estructura.test.js
git commit -m "feat(comprobar): avisos del índice (orden-ambiguo, examen-sin-nota, navegacion-rota); el mapa deja de ser obligatorio"
```

---

### Task 7: Migración 003 — la casilla "estudiada" en los cursos ya creados

**Files:**
- Create: `.kit/herramientas/migraciones/003-casilla-estudiada.js`
- Modify: `.kit/motor.json` (`"version_datos": 3`)
- Test: `.kit/herramientas/tests/actualizar.test.js` (junto al test de la migración 002)

**Interfaces:**
- Consumes: `v.recorrer`, `v.baseAlumno` de `lib/vault.js`.
- Produces: módulo `{ descripcion, migrar(raiz) }` según `migraciones/LEEME.md`.

- [ ] **Step 1: Test que falla** — añadir a `actualizar.test.js`:

```js
test('migración 003: cada sesión gana estudiada: false, sin duplicar ni tocar el resto, y es idempotente', () => {
  const m = require('../migraciones/003-casilla-estudiada');
  const raiz = cursoTemporal({
    'estudio/sesiones/m1/01-01-uno.md': '---\ntipo: sesion\nclases: [1.1]\n---\n# Uno\n',
    'estudio/sesiones/m1/01-01-dos.md': '---\ntipo: sesion\nestudiada: true\n---\n# Dos\n',
    'estudio/sesiones/m1/01-01-crlf.md': '---\r\ntipo: sesion\r\n---\r\n# Tres\r\n',
    'estudio/sesiones/m1/01-01-sin-fm.md': '# Cuatro\n',
  });
  m.migrar(raiz);
  m.migrar(raiz);
  const s = rel => leer(raiz, `estudio/sesiones/m1/${rel}`);
  assert.equal(s('01-01-uno.md'), '---\ntipo: sesion\nclases: [1.1]\nestudiada: false\n---\n# Uno\n');
  assert.equal(s('01-01-dos.md'), '---\ntipo: sesion\nestudiada: true\n---\n# Dos\n');
  assert.equal(s('01-01-crlf.md'), '---\r\ntipo: sesion\r\nestudiada: false\r\n---\r\n# Tres\r\n');
  assert.equal(s('01-01-sin-fm.md'), '---\nestudiada: false\n---\n# Cuatro\n');
});
```

- [ ] **Step 2: Verlo fallar**

Run: `node --test .kit/herramientas/tests/actualizar.test.js`
Expected: FAIL (`Cannot find module '../migraciones/003-casilla-estudiada'`).

- [ ] **Step 3: Implementar** — crear `migraciones/003-casilla-estudiada.js`:

```js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('../lib/vault');

// Formato v3: cada nota de sesión tiene la propiedad `estudiada`, que Obsidian dibuja como casilla y alimenta
// estudio/inicio.md. Los cursos creados antes no la tienen. inicio.md y los pies los escribe el guardado final.
module.exports = {
  descripcion: 'Cada sesión gana la casilla "estudiada" para la página de inicio del curso',
  migrar(raiz) {
    const dir = path.join(v.baseAlumno(raiz), 'sesiones');
    for (const abs of v.recorrer(dir, n => n.endsWith('.md') && !n.startsWith('_'))) {
      const texto = fs.readFileSync(abs, 'utf8');
      const eol = texto.includes('\r\n') ? '\r\n' : '\n';
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto);
      if (!m) { fs.writeFileSync(abs, `---${eol}estudiada: false${eol}---${eol}${texto}`); continue; }
      if (/^estudiada:/m.test(m[1])) continue;
      const cierre = m.index + m[0].length - 3;   // donde empieza el --- de cierre
      fs.writeFileSync(abs, texto.slice(0, cierre) + `estudiada: false${eol}` + texto.slice(cierre));
    }
  },
};
```

En `.kit/motor.json`: `"version_datos": 3`.

- [ ] **Step 4: Ejecutar la suite**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS (incluido `coherencia.test.js`: `version_datos` = migración más alta).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/migraciones/003-casilla-estudiada.js .kit/motor.json .kit/herramientas/tests/actualizar.test.js
git commit -m "feat(migracion): 003 añade la casilla estudiada a las sesiones de cursos existentes"
```

---

### Task 8: El profesor trabaja con el índice — plantilla, skills, AGENTS.md e instalación

**Files:**
- Modify: `.kit/plantillas/sesion.md`
- Modify: `.kit/skills/sesion/SKILL.md` (~l.110-111 "Fechas", ~l.117-118 "Al crear la nota…", ~l.147 fichero vivo 3)
- Modify: `.kit/skills/examen/SKILL.md` (§1 Alcance, §3 Formato, §4 paso 6)
- Modify: `.kit/skills/configurar/SKILL.md` (bloque A, punto 5 y 6)
- Modify: `AGENTS.md` ("Motor y datos" y "Al empezar cada sesión")
- Modify: `.kit/guias/INSTALAR-AGENTE.md` (Paso 9, tras "Comprueba que ha ido bien")
- Test: `node --test ".kit/herramientas/tests/*.test.js"` (coherencia y genérico vigilan nombres y rutas)

**Interfaces:**
- Consumes: los nombres fijados en Tasks 3-7: `estudio/inicio.md`, propiedades `estudiada`, `orden`, `nota`, `fecha`,
  `unidad`, `parcial`, `aprobado`, campo `titulo` en `config/estructura.json`.

- [ ] **Step 1: Plantilla de sesión** — en `.kit/plantillas/sesion.md`, el frontmatter queda:

```yaml
---
tipo: sesion
bloque:
clases:                 # tal como las numera el centro; ver config/curso.md
trabajada: YYYY-MM-DD   # cuándo se procesó la clase
fuente: inbox/<fichero>
estudiada: false
---
```

(Los comentarios que ya había se quedan; no se añade ninguno nuevo: Obsidian los borra al marcar la casilla.)

- [ ] **Step 2: Skill `sesion`**

Sustituir el párrafo de fechas:

```markdown
**Fechas: solo `trabajada:`, el día que se procesa la clase.** El orden lo da el id de la sesión, que sigue el
temario: `estudio/inicio.md` y el pie de cada sesión (anterior · inicio · siguiente) los escribe `guardar.js`
con ese orden. **Si una clase se parte en varias notas**, dales `orden: 1`, `orden: 2`… en el frontmatter, en
el orden en que se estudian: con las mismas cifras en el id, sin `orden:` no hay forma de saber cuál va antes
(`comprobar.js` avisa con `orden-ambiguo`). **`estudiada:` se deja en `false`:** la marca el alumno, nunca tú
al procesar.
```

Sustituir "Al crear la nota, actualiza también `estudio/mapa-del-curso.md`: marca la clase como procesada con su
fecha." por:

```markdown
Al crear la nota, actualiza en `estudio/mapa-del-curso.md` la cobertura del material (qué clase del centro
quedó en qué sesión, y qué falta). **No listes ahí las sesiones:** la lista navegable es `estudio/inicio.md`, y
la escribe `guardar.js`. Si la sesión es de una unidad que no está en `config/estructura.json`, añádela con su
`titulo` (el nombre que le da el centro) y ejecuta `node .kit/herramientas/organizar.js`.
```

En "Actualizar los ficheros vivos", el punto 3 queda:

```markdown
3. `estudio/mapa-del-curso.md` — cobertura del material de la clase y estado del bloque (sin lista de sesiones:
   esa es `estudio/inicio.md`, y se escribe sola)
```

- [ ] **Step 3: Skill `examen`**

En §1 Alcance, añadir al final:

```markdown
**"Lo que me falta".** Si pide un test "de lo que me falta" de una unidad o sesión, el alcance son **solo** los
conceptos de esas sesiones que en `estudio/progreso.md` no tienen la teoría en ✅ (es lo que `estudio/inicio.md`
enseña como "📝 faltan N"). 3-5 preguntas, las justas para cubrirlos. Es un examen **parcial**: mueve
`estudio/progreso.md`, pero no pone nota a la unidad.
```

En §3 Formato, sustituir la frase del frontmatter `(con `unidad: <prefijo>` en el frontmatter; …)` por:

```markdown
con este frontmatter, que es lo que lee `estudio/inicio.md`:

    ---
    tipo: examen
    unidad: 01-02          # prefijo de la unidad; si abarca varias, lista: [01-02, 01-03]
    fecha: 2026-10-02
    nota:                  # sobre 10; se rellena al corregir
    parcial: true          # solo en los de "lo que me falta"
    ---

La carpeta es la de la unidad más amplia que contenga todo el alcance; sin estructura, directamente en
`estudio/examenes/`. **Examen de módulo** es solo el que tiene `unidad:` exactamente el prefijo del módulo: un
examen de 1.2 + 1.3 lleva `unidad: [01-02, 01-03]`, no `01`. Si el alumno lo prefiere como página HTML
autocorregible, va en la misma carpeta **y además** su `.md` con este frontmatter (sin él no sale en inicio).
```

En §4, antes del paso 6 (guardar), añadir:

```markdown
6. **Pon la nota** en el frontmatter del examen (`nota:`, sobre 10, con un decimal si hace falta). El aprobado
   es `aprobado:` del frontmatter de `config/curso.md` (5 si no está).
7. **Si aprueba** (y no es parcial), marca `estudiada: true` en las notas de sesión que cubría el examen: las de
   su unidad y las de todas las unidades que cuelgan de ella. Es la única vez que el profesor marca esa casilla.
```

y renumerar el antiguo paso 6 (guardar) como 8.

- [ ] **Step 3b: Skill `examen` — se contesta en la nota y se puede repetir (spec §8)**

En §3 Formato, añadir tras el bloque del frontmatter:

```markdown
**Debajo de cada pregunta**, una línea vacía para contestar en la propia nota:

    ✍️ **Tu respuesta:**

El alumno escribe a continuación (en esa línea o en las siguientes, hasta la siguiente pregunta). También
puede contestar en el chat; si dice "he terminado el examen", lee las respuestas **de la nota**.
```

En §4 Corregir, sustituir los pasos 6-8 (nota, estudiada, guardar) por:

```markdown
6. **Guarda el intento aparte**, en `## Histórico de intentos` al final de la nota (créala la primera vez):
   - una fila en `| Intento | Fecha | Nota | Enteras | A medias | Falladas | En blanco |`;
   - un bloque plegado `> [!example]- Intento N · <fecha> · tus respuestas y la corrección` con el veredicto y la
     tabla `| # | Tu respuesta | Resultado | Por qué |`, con sus respuestas **literales**.
7. **Frontmatter:** `nota:` y `fecha:` son las de **este** intento (`nota` sobre 10, un número: `2`, nunca
   `2/10`); `intentos:` sube en uno. El aprobado es `aprobado:` del frontmatter de `config/curso.md` (5 si no está).
8. **Limpia el examen:** cada `✍️ **Tu respuesta:**` vuelve a quedar vacío. Las preguntas, las cifras, el orden
   de las opciones y las soluciones **no cambian**: al repetirlo, el alumno compara intento a intento.
9. **Si aprueba** (y no es parcial), marca `estudiada: true` en las notas de sesión que cubría el examen: las de
   su unidad y las de todas las unidades que cuelgan de ella. Es la única vez que el profesor marca esa casilla.
10. Guarda.
```

(Esto sustituye los pasos 6 y 7 que añadía el Step 3; el antiguo paso de guardar queda como 10.)

Y en §3 Formato, al final, añadir:

```markdown
**Versión nueva de un examen.** El examen limpio se queda para repasar. Si el alumno pide "otra versión", o si
tú lo propones porque el mismo examen ya lleva dos intentos y la nota puede ser memoria (propónlo; decide él),
crea un fichero nuevo en la misma carpeta: mismas preguntas y conceptos, mismo reparto, **otras cifras y otro
orden de opciones**, soluciones rehechas, con `version: 2` (3, 4…) y `anterior:` con el enlace al fichero de la
versión anterior en el frontmatter. Su histórico empieza vacío. La versión anterior no se toca. Al corregir la
nueva, el veredicto compara concepto a concepto con el último intento de la anterior.
```

- [ ] **Step 4: Skill `configurar`** — en el bloque A:

En el punto 5, sustituir el ejemplo JSON por:

```json
{ "unidades": [
  { "prefijo": "01",    "carpeta": "modulo-01-conceptos-esenciales", "titulo": "Módulo 1 · Conceptos esenciales" },
  { "prefijo": "01-02", "carpeta": "modulo-01-conceptos-esenciales/1.2-medidores-basicos", "titulo": "1.2 Medidores básicos" }
] }
```

y añadir tras "Un fichero pertenece a la unidad cuyo prefijo coincide…":

```markdown
**Escribe todas las unidades del temario**, tengan material o no, cada una con su `titulo` tal como la nombra el
centro (con tildes: es lo que el alumno lee en `estudio/inicio.md`). Así la página de inicio enseña el curso
entero desde el primer día, y el alumno ve lo que le queda.
```

Añadir un punto nuevo antes de "Cambia `estado: sin-configurar`…" (y renumerar):

```markdown
6. **El aprobado.** Pregunta sobre cuánto se aprueba (normalmente 5 sobre 10) y escríbelo en el frontmatter de
   `config/curso.md` como `aprobado: 5`. Es lo que separa "📝 7,5" de "📝 4,0 suspenso" en `estudio/inicio.md`.
```

- [ ] **Step 5: `AGENTS.md`**

En "Motor y datos", tras el punto de `estudio/pendientes.md`, añadir:

```markdown
- **`estudio/inicio.md` y el pie de navegación de cada sesión también los escribe `guardar.js`**: el temario
  entero, qué ha estudiado el alumno (la casilla `estudiada` de cada sesión, que marca él) y qué tiene probado
  (sale de `estudio/progreso.md`). No los edites ni los cites como fuente. Es la puerta del alumno al curso
  cuando estudia sin ti.
```

En "Al empezar cada sesión", punto 1, añadir al final:

```markdown
   Si `estudio/inicio.md` dice que un módulo está **listo para el examen del módulo**, menciónalo en esa misma
   frase ("y el módulo 1 ya está listo para su examen, cuando quieras").
```

- [ ] **Step 6: `INSTALAR-AGENTE.md`, paso 9** — tras el párrafo "Comprueba que ha ido bien…", añadir:

```markdown
**Que fije su página de inicio.** Tras el primer guardado existe **inicio**, en la columna izquierda: es la
puerta a todo el curso. Que haga clic en ella para abrirla, luego clic derecho en su pestaña (arriba) →
**Fijar** (*Pin*). Así queda abierta siempre que abra Obsidian. No se puede hacer por él: Obsidian guarda sus
pestañas mientras está abierto y pisaría cualquier cambio desde fuera.
```

- [ ] **Step 7: Ejecutar la suite**

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS. Si `generico.test.js` señala una línea, es una ruta del alumno sin `estudio/` delante: añadírselo.

- [ ] **Step 8: Commit**

```bash
git add .kit/plantillas/sesion.md .kit/skills/sesion/SKILL.md .kit/skills/examen/SKILL.md .kit/skills/configurar/SKILL.md AGENTS.md .kit/guias/INSTALAR-AGENTE.md
git commit -m "feat(skills): el profesor trabaja con inicio.md — orden:, nota y fecha en exámenes, lo que me falta, temario entero"
```

---

### Task 9: La hoja "Cómo usar tu profesor", reescrita

**Files:**
- Modify: `.kit/plantillas/guia-de-uso.md` (reescritura completa)
- Modify: `.kit/skills/configurar/SKILL.md` (sección "La hoja para otro día": la frase "No añadas secciones… una pantalla")

La migración 003 **no** reescribe la hoja de los cursos ya creados: sus huecos (`{{COMO_ABRIR_LA_TERMINAL}}`…)
dependen de cosas que la migración no sabe. La reescribe el profesor tras actualizar (Task 11, Step 4).

**Interfaces:**
- Consumes: los mismos huecos que hoy (`{{NOMBRE_DEL_CURSO}}`, `{{ATAJO}}`, `{{MARCADOR}}`,
  `{{TERMINAL_EN_OBSIDIAN}}`, `{{COMO_ABRIR_LA_TERMINAL}}`); no se añade ninguno.

- [ ] **Step 1: Reescribir `.kit/plantillas/guia-de-uso.md`** con este contenido (el orden sigue el criterio de
  aceptación de la spec §4.3: primero estudiar solo, luego el profesor):

```markdown
# Cómo usar tu profesor · {{NOMBRE_DEL_CURSO}}

> Esta hoja es tuya. Si algún día no sabes qué hacer, empieza por aquí.

## 1. Tu curso empieza en **inicio**

En la columna de la izquierda de Obsidian hay una nota que se llama **inicio**. Es la puerta a todo tu curso:
el temario entero, por módulos, con lo que ya has estudiado y lo que te queda.

**Déjala fijada** para que se abra siempre: haz clic en **inicio**, y luego clic derecho en su pestaña (la
etiqueta de arriba, donde pone *inicio*) → **Fijar**. Aparece una chincheta. Ya está.

## 2. Estudiar, sin necesitar a tu profesor

1. En **inicio**, haz clic en **👉 Sigue por aquí**. Es la primera sesión que aún no has estudiado.
2. Lee la sesión. Sus conceptos están enlazados: haz clic en cada uno. Para volver, la flecha **←** de arriba a
   la izquierda.
3. En el apartado **Material** de la sesión están sus **flashcards** (tápate la respuesta y contesta de cabeza)
   y su **ejercicio**, si lo tiene (los interactivos se abren en tu navegador).
4. Cuando la hayas estudiado, **marca la casilla "estudiada"**: está arriba del todo de la nota, en el recuadro
   de propiedades. Un clic y queda marcada.
5. Al final de la sesión tienes **← anterior · 🏠 Inicio · siguiente →**. Pulsa **siguiente** y sigues el
   temario sin buscar nada.

**Importante:** lo que marques se ve en **inicio** la próxima vez que trabajes con tu profesor (él la
actualiza al guardar). Tu casilla no se pierde: está guardada en la propia sesión.

## 3. Qué significa cada marca de inicio

| Marca | Qué quiere decir |
|---|---|
| ✅ en **Estudiada (tú)** | La marcaste tú: ya la has estudiado |
| ⬜ en **Estudiada (tú)** | Aún no la has marcado |
| ✅ superada | Tu profesor tiene comprobado que dominas todos sus conceptos |
| 📝 faltan 2 | Has demostrado parte; quedan 2 conceptos que nadie te ha preguntado aún |
| 🔁 repasar | Fallaste algo de esta sesión en un test o un ejercicio: vuelve a ella |
| 📝 7,5 | La nota de tu último examen de ese módulo o bloque |
| 📝 4,0 suspenso | Esa nota no llega al aprobado: repasa lo marcado 🔁 y vuelve a pedir el examen |

Arriba del todo, **🔁 Para repasar** junta las sesiones a las que tienes que volver, una por línea.

## 4. Abrir a tu profesor

Para lo que Obsidian no hace solo (preparar una clase nueva, hacerte un test), abre a tu profesor:

{{COMO_ABRIR_LA_TERMINAL}}

Se abre una ventana con letras. Escribe esta palabra y pulsa **Intro**:

    {{ATAJO}}

Tu profesor te saluda y espera a que le escribas. Se le habla con frases normales, como a una persona.
{{TERMINAL_EN_OBSIDIAN}}

## 5. Qué pedirle y cuándo

| Cuando… | Escríbele algo así |
|---|---|
| Has tenido clase y tienes apuntes, un PDF o las diapositivas | "He dejado los apuntes de hoy" |
| **inicio** dice "📝 faltan…" en una sesión | "Hazme un test de lo que me falta de la 1.2" |
| **inicio** dice que un módulo está listo para su examen | "Hazme el examen del módulo 1" |
| Tienes sesiones en 🔁 | "Ayúdame a repasar lo que fallé" |
| Has leído tus notas y algo no te ha quedado claro | "Tengo dudas" |
| Quieres practicar | "Ponme un ejercicio de…" y el tema |
| Te has equivocado o no te gusta lo que ha hecho | "Deshaz lo último" |
| Quieres que te explique de otra manera | Díselo tal cual: "más corto", "con más ejemplos" |
| No sabes qué toca | "¿Qué hago ahora?" |
| Te ha dicho al saludar que hay una versión nueva | "Actualiza el kit" |

No hace falta acertar con las palabras. Si no te entiende, te pregunta.

## 6. Dónde dejas el material de clase

En la carpeta **inbox**. Arrastra ahí el PDF, las fotos o el documento y dile a tu profesor que lo has dejado.
Lo mejor es PDF; si tienes una presentación, guárdala como PDF.

## 7. Cómo dejar una duda mientras lees

Escribe `{{MARCADOR}}` en la nota, justo donde te pierdes, y a continuación tu pregunta:

    {{MARCADOR}} no entiendo por qué pasa esto

Deja todas las que quieras. La próxima vez que abras a tu profesor, dile "tengo dudas": contesta cada una en su
sitio. Lo que queda por resolver está siempre en la nota **pendientes**.

## 8. Para terminar

Escribe "hasta luego" y espera a que se despida: así guarda lo último. Si cierras la ventana sin más, no se
pierde nada de lo terminado.

## 9. Si algo no cuadra

- **Marqué una sesión y en inicio sigue ⬜:** es normal. Inicio se pone al día cuando tu profesor guarda; abre
  a tu profesor y dile cualquier cosa, o espera a la próxima clase.
- **Una clase que ya procesó no aparece en inicio:** díselo a tu profesor.
- **Inicio ya no se abre al entrar:** se desfijó. Vuelve al punto 1.
- **Obsidian se abre vacío o con otra cosa:** icono de la bóveda (abajo a la izquierda) → **Abrir una carpeta
  como bóveda** → la carpeta **estudio** de tu curso.
- **Has borrado o movido algo sin querer:** díselo a tu profesor. Lo recupera él.
- **Te pregunta si puede hacer algo:** lee la frase; casi siempre es que sí.
- **No se abre al escribir `{{ATAJO}}`:** cierra la ventana de letras, ábrela otra vez y prueba de nuevo.
- **Sigue sin ir:** cuéntaselo a quien te instaló esto.
- **Algo de cómo trabaja tu profesor te molesta:** díselo tal cual, "esto es del kit". Él lo envía a quien lo
  mantiene.

## 10. Otro curso u otro asistente

- **Añadir otro curso:** abre la terminal, entra en tu carpeta de cursos, abre a tu asistente y pégale otra vez
  el **texto de arranque** de la guía de instalación.
- **Cambiar de asistente:** instala el otro, ábrelo en la carpeta de tu curso y dile "a partir de ahora
  trabajas tú con este curso". Tus notas y tu progreso no cambian.
```

- [ ] **Step 2: Skill `configurar`, "La hoja para otro día"** — sustituir "No añadas secciones ni comandos: una
  pantalla, sin jerga." por:

```markdown
No añadas secciones ni comandos, sin jerga: está escrita para leerse de arriba abajo la primera vez y para
buscar una respuesta las siguientes. Al presentarla, dile que empiece por el punto 1 (fijar **inicio**).
```

- [ ] **Step 3: Comprobar que ningún hueco se ha perdido**

Run: `grep -o '{{[A-Z_]*}}' .kit/plantillas/guia-de-uso.md | sort -u`
Expected: exactamente `{{ATAJO}}`, `{{COMO_ABRIR_LA_TERMINAL}}`, `{{MARCADOR}}`, `{{NOMBRE_DEL_CURSO}}`,
`{{TERMINAL_EN_OBSIDIAN}}`.

Run: `node --test ".kit/herramientas/tests/*.test.js"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .kit/plantillas/guia-de-uso.md .kit/skills/configurar/SKILL.md
git commit -m "docs(guia): la hoja del alumno empieza por inicio y explica cada marca"
```

---

### Task 10: Extremo a extremo, CHANGELOG y estado de validación

**Files:**
- Modify: `.kit/herramientas/tests/extremo-a-extremo.test.js` (test 5, ~l.66-75)
- Modify: `.kit/CHANGELOG.md` (entrada `## 1.0.0`)
- Modify: `docs/superpowers/pruebas/2026-09-21-pendiente-de-validar.md`

- [ ] **Step 1: Test de extremo a extremo** — en el test 5, quitar la línea que añade la sesión a
  `mapa-del-curso.md` y añadir al final del test:

```js
  const inicio = leer('estudio/inicio.md');
  assert.match(inicio, /👉 Sigue por aquí: \[\[01-01-intro\|Intro\]\]/);
  assert.match(leer('estudio/sesiones/modulo-01/01-01-intro.md'), /\[\[inicio\|🏠 Inicio\]\]/);
  assert.equal(ejecutar('git', ['status', '--porcelain']).salida, '');
```

Run: `node --test .kit/herramientas/tests/extremo-a-extremo.test.js`
Expected: PASS.

- [ ] **Step 2: CHANGELOG** — sustituir la entrada `## 1.0.0` por (escrita para el alumno, como pide la cabecera
  del fichero):

```markdown
## 1.0.0
- **Primera versión estable.** El kit ha procesado un módulo entero de un curso real y ha sustituido al
  material hecho a mano del que nació.
- **Tu curso tiene una página de inicio.** En Obsidian, la nota **inicio** enseña el temario entero por
  módulos, por dónde vas (👉 *Sigue por aquí*), lo que tienes que repasar y la nota de cada examen. Cada sesión
  acaba con *← anterior · 🏠 Inicio · siguiente →*: puedes estudiar el curso de principio a fin sin buscar en
  carpetas y sin abrir a tu profesor.
- **Tú marcas lo que has estudiado**, con la casilla *estudiada* de cada sesión; tu profesor marca lo que tienes
  demostrado. Puedes pedirle "hazme un test de lo que me falta" para completar huecos.
- Al actualizar, tu profesor añade la casilla a tus sesiones, completa el temario y te pide que fijes **inicio**
  (un clic). Tu hoja *Cómo usar tu profesor* se renueva.
- Probado a fondo en Mac con Claude Code. En Windows está probado el atajo y las herramientas; una
  instalación completa con curso en Windows aún no. Con otros asistentes, compatible pero sin probar.
```

- [ ] **Step 3: Estado de validación** — en `docs/superpowers/pruebas/2026-09-21-pendiente-de-validar.md`, añadir
  una sección:

```markdown
## Índice del curso (1.0.0)

- [ ] Migración 003 aplicada a `inversion-multimercado` (de 0.11.0 a 1.0.0) sin revertir.
- [ ] `inicio.md` del curso real revisado por Roberto en Obsidian: temario entero, orden 1.3.1 correcto, casilla.
- [ ] Hoja *Cómo usar tu profesor* probada por una persona sin perfil técnico, sin ayuda. Atascos anotados y
      corregidos.
```

- [ ] **Step 4: Suite completa y comprobar el propio kit**

Run: `node --test ".kit/herramientas/tests/*.test.js" && node .kit/herramientas/comprobar.js`
Expected: PASS y "Curso sano." (o solo avisos que ya había antes de esta rama).

- [ ] **Step 5: Commit**

```bash
git add .kit/herramientas/tests/extremo-a-extremo.test.js .kit/CHANGELOG.md docs/superpowers/pruebas/2026-09-21-pendiente-de-validar.md
git commit -m "docs: la 1.0.0 trae la página de inicio del curso; e2e y validación pendiente"
```

---

### Task 11: Validación con el curso real y con una persona (con Roberto; no se automatiza)

Nada de esta tarea se hace sin el sí de Roberto en el momento: toca su curso real y su GitHub.

- [ ] **Step 1: Copia de seguridad del curso real**

Run: `cd ~/Documents/cursos/inversion-multimercado && git status --porcelain && git log --oneline -1`
Expected: árbol limpio. Si no lo está, parar y preguntar.

- [ ] **Step 2: Ver qué traería la actualización (sin aplicar)**

Run: `node .kit/herramientas/actualizar.js --origen ~/Documents/courses/profesor-kit`
Expected: "Tienes la 0.11.0; hay una 1.0.0" y las novedades. Enseñárselas a Roberto.

- [ ] **Step 3: Aplicar, con su sí**

Run: `node .kit/herramientas/actualizar.js --origen ~/Documents/courses/profesor-kit --aplicar`
Expected: "Actualizado de 0.11.0 a 1.0.0. Datos migrados: 3." (y las que falten de antes). Si dice
"revertido", leer el detalle, no reintentar a ciegas.

- [ ] **Step 4: Tareas del profesor tras migrar** (en el curso real, como profesor):
  - Completar `config/estructura.json` con los módulos 2-12 y sus sub-bloques, cada uno con `titulo`, desde el
    temario de `config/curso.md`.
  - `orden: 1` en `01-03-01-renta-variable.md` y `orden: 2` en `01-03-01-estilos-y-ciclos.md` (confirmar el orden
    con Roberto).
  - Adaptar `estudio/examenes/2026-09-22-modulo-1.md` (spec §8.2): `unidad: 01`, `nota: 2`, `intentos: 1`, y un
    `✍️ **Tu respuesta:**` vacío bajo cada pregunta.
  - Reescribir `estudio/como-usar-tu-profesor.md` desde la plantilla nueva, con los mismos huecos que usó
    `/configurar` (atajo, marcador, nombre, terminal).
  - `node .kit/herramientas/comprobar.js` → sin errores ni `orden-ambiguo`; luego
    `node .kit/herramientas/guardar.js "config: índice del curso"`.

- [ ] **Step 5: Revisión de Roberto en Obsidian** — que abra **inicio**, la fije, recorra dos sesiones con
  *siguiente →*, marque una casilla, y diga qué sobra o falta. Cada cosa que no le cuadre vuelve a la rama como
  cambio con su test.

- [ ] **Step 6: Prueba con una persona** — Roberto da la hoja *Cómo usar tu profesor* a su padre sin explicarle
  nada; se anota dónde se atasca. Cada atasco → cambio en `.kit/plantillas/guia-de-uso.md` y en la hoja del curso.

- [ ] **Step 7: Marcar la validación** en `docs/superpowers/pruebas/2026-09-21-pendiente-de-validar.md` y
  commit. Solo entonces se vuelve a abrir la PR de la release.

---

### Task 12: Obsidian configurado de serie (spec §7)

Se ejecuta **después de la Task 10** y antes de la 11. Spec: §7 de `docs/superpowers/specs/2026-09-22-indice-del-curso-design.md`.

**Files:**
- Create: `.kit/plantillas/obsidian/app.json`, `.kit/plantillas/obsidian/appearance.json`, `.kit/plantillas/obsidian/core-plugins.json`
- Create: `.kit/herramientas/lib/obsidian.js`, `.kit/herramientas/obsidian.js`
- Create: `.kit/herramientas/tests/obsidian.test.js`
- Modify: `.kit/herramientas/lib/arranque.js` (admitir herramientas asíncronas)
- Modify: `.kit/herramientas/preparar-curso.js`, `.kit/herramientas/diagnostico.js` (~l.69), `.claude/settings.json`
- Modify: `.kit/herramientas/migraciones/003-casilla-estudiada.js` (también ajustes de Obsidian)
- Modify: `.kit/guias/INSTALAR-AGENTE.md` (paso 9 y la sección "Opcional — hablar contigo desde dentro de Obsidian")
- Modify: `.kit/plantillas/guia-de-uso.md`, `.kit/skills/configurar/SKILL.md` (fila `{{TERMINAL_EN_OBSIDIAN}}`), `.kit/skills/actualizar/SKILL.md`, `AGENTS.md` (tabla de herramientas)
- Modify tests: `diagnostico.test.js`, `preparar-curso.test.js`, `actualizar.test.js`

**Interfaces:**
- Produces: `lib/obsidian.js` → `AJUSTES`, `COMPLEMENTOS`, `aplicarAjustes(raiz) → string[]` (ficheros tocados),
  `async instalarComplementos(raiz, descargar?) → { instalados: string[], yaEstaban: string[], fallidos: {id, motivo}[] }`,
  `descargarDeGitHub(repo, fichero) → Promise<Buffer|null>` (null si 404).
  CLI: `node .kit/herramientas/obsidian.js [--sin-complementos]`.

- [ ] **Step 1: Plantillas** — crear los tres JSON (con salto de línea final):

`.kit/plantillas/obsidian/app.json`:
```json
{
  "showUnsupportedFiles": true,
  "promptDelete": false,
  "alwaysUpdateLinks": true
}
```

`.kit/plantillas/obsidian/appearance.json`:
```json
{
  "translucency": false
}
```

`.kit/plantillas/obsidian/core-plugins.json`:
```json
{
  "file-explorer": true,
  "global-search": true,
  "switcher": true,
  "graph": false,
  "backlink": true,
  "canvas": false,
  "outgoing-link": true,
  "tag-pane": true,
  "footnotes": false,
  "properties": true,
  "page-preview": true,
  "daily-notes": false,
  "templates": false,
  "note-composer": false,
  "command-palette": true,
  "slash-command": false,
  "editor-status": true,
  "bookmarks": true,
  "markdown-importer": false,
  "zk-prefixer": false,
  "random-note": false,
  "outline": true,
  "word-count": false,
  "slides": false,
  "audio-recorder": false,
  "workspaces": false,
  "file-recovery": true,
  "publish": false,
  "sync": false,
  "bases": false,
  "webviewer": false
}
```

- [ ] **Step 2: Tests que fallan** — crear `tests/obsidian.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ob = require('../lib/obsidian');
const { cursoTemporal } = require('./ayuda');

const KIT_REAL = path.resolve(__dirname, '..', '..');
function curso(ficheros = {}) {
  const raiz = cursoTemporal(ficheros);
  fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true });
  return raiz;
}
const leerJson = (raiz, f) => JSON.parse(fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', f), 'utf8'));

test('aplicarAjustes: en una bóveda sin configurar escribe los tres ficheros recomendados', () => {
  const raiz = curso();
  assert.deepEqual(ob.aplicarAjustes(raiz).sort(), ['app.json', 'appearance.json', 'core-plugins.json']);
  assert.equal(leerJson(raiz, 'app.json').showUnsupportedFiles, true);
  assert.equal(leerJson(raiz, 'core-plugins.json').properties, true);
  assert.equal(leerJson(raiz, 'core-plugins.json').sync, false);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'community-plugins.json')));
});

test('aplicarAjustes: nunca cambia lo que eligió el alumno, solo añade lo que falta, y es idempotente', () => {
  const raiz = curso({ 'estudio/.obsidian/app.json': JSON.stringify({ promptDelete: true, vimMode: true }) });
  ob.aplicarAjustes(raiz);
  const app = leerJson(raiz, 'app.json');
  assert.equal(app.promptDelete, true);
  assert.equal(app.vimMode, true);
  assert.equal(app.alwaysUpdateLinks, true);
  assert.deepEqual(ob.aplicarAjustes(raiz), []);
});

test('aplicarAjustes: un JSON roto no se toca', () => {
  const raiz = curso({ 'estudio/.obsidian/app.json': '{roto' });
  assert.ok(!ob.aplicarAjustes(raiz).includes('app.json'));
  assert.equal(fs.readFileSync(path.join(raiz, 'estudio', '.obsidian', 'app.json'), 'utf8'), '{roto');
});

test('instalarComplementos: descarga los que faltan, no activa ninguno y respeta los que ya están', async () => {
  const raiz = curso({ 'estudio/.obsidian/plugins/terminal/manifest.json': '{"id":"terminal"}' });
  const pedidos = [];
  const falso = async (repo, fichero) => { pedidos.push(`${repo}/${fichero}`); return fichero === 'styles.css' ? null : Buffer.from(`${repo} ${fichero}`); };
  const r = await ob.instalarComplementos(raiz, falso);
  assert.deepEqual(r.yaEstaban, ['terminal']);
  assert.deepEqual(r.instalados, ['code-files', 'realclaudian']);
  assert.deepEqual(r.fallidos, []);
  assert.ok(!pedidos.some(p => p.startsWith('polyipseity/')));
  const dir = path.join(raiz, 'estudio', '.obsidian', 'plugins');
  assert.equal(fs.readFileSync(path.join(dir, 'realclaudian', 'main.js'), 'utf8'), 'yishentu/claudian main.js');
  assert.ok(!fs.existsSync(path.join(dir, 'realclaudian', 'styles.css')));   // 404 → no se escribe
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'community-plugins.json')));
});

test('instalarComplementos: un fallo de red se cuenta, no revienta, y no deja carpetas a medias', async () => {
  const raiz = curso();
  const r = await ob.instalarComplementos(raiz, async () => { throw new Error('sin red'); });
  assert.deepEqual(r.instalados, []);
  assert.equal(r.fallidos.length, 3);
  assert.match(r.fallidos[0].motivo, /sin red/);
  assert.ok(!fs.existsSync(path.join(raiz, 'estudio', '.obsidian', 'plugins', 'terminal')));
});

test('los complementos son los del directorio oficial de Obsidian', () => {
  assert.deepEqual(ob.COMPLEMENTOS.map(c => [c.id, c.repo]), [
    ['terminal', 'polyipseity/obsidian-terminal'],
    ['code-files', 'lukasbach/obsidian-code-files'],
    ['realclaudian', 'yishentu/claudian'],
  ]);
});
```

Run: `node --test .kit/herramientas/tests/obsidian.test.js` → FAIL (`Cannot find module '../lib/obsidian'`).

- [ ] **Step 3: `lib/obsidian.js`**

```js
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v = require('./vault');

// Obsidian viene configurado de serie: ajustes y componentes internos por defecto, y los complementos de la
// comunidad instalados pero SIN activar. Activarlos es decisión del alumno: son código de terceros.
// community-plugins.json (la lista de activados) no se escribe nunca.
const AJUSTES = ['app.json', 'appearance.json', 'core-plugins.json'];
const COMPLEMENTOS = [
  { id: 'terminal', repo: 'polyipseity/obsidian-terminal', ficheros: ['main.js', 'manifest.json', 'styles.css'] },
  { id: 'code-files', repo: 'lukasbach/obsidian-code-files', ficheros: ['main.js', 'manifest.json'] },
  { id: 'realclaudian', repo: 'yishentu/claudian', ficheros: ['main.js', 'manifest.json', 'styles.css'] },
];
const dirObsidian = raiz => path.join(v.baseAlumno(raiz), '.obsidian');

// Si un fichero ya existe solo se añaden las claves que falten: nunca se cambia lo que eligió el alumno.
function aplicarAjustes(raiz) {
  const origen = path.join(raiz, '.kit', 'plantillas', 'obsidian');
  const destino = dirObsidian(raiz);
  fs.mkdirSync(destino, { recursive: true });
  const tocados = [];
  for (const nombre of AJUSTES) {
    const recomendado = JSON.parse(fs.readFileSync(path.join(origen, nombre), 'utf8'));
    const fichero = path.join(destino, nombre);
    let actual = null;
    if (fs.existsSync(fichero)) {
      try { actual = JSON.parse(fs.readFileSync(fichero, 'utf8')); } catch { continue; }   // roto: no se toca
      if (Object.keys(recomendado).every(k => k in actual)) continue;
    }
    fs.writeFileSync(fichero, JSON.stringify({ ...recomendado, ...(actual || {}) }, null, 2) + '\n');
    tocados.push(nombre);
  }
  return tocados;
}

async function descargarDeGitHub(repo, fichero) {
  const r = await fetch(`https://github.com/${repo}/releases/latest/download/${fichero}`);
  if (r.status === 404) return null;   // ese complemento no publica ese fichero (styles.css es opcional)
  if (!r.ok) throw new Error(`${repo}/${fichero}: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// Descarga los que falten. Todo o nada por complemento: si falla una descarga, no queda una carpeta a medias.
async function instalarComplementos(raiz, descargar = descargarDeGitHub) {
  const resultado = { instalados: [], yaEstaban: [], fallidos: [] };
  for (const c of COMPLEMENTOS) {
    const dir = path.join(dirObsidian(raiz), 'plugins', c.id);
    if (fs.existsSync(path.join(dir, 'manifest.json'))) { resultado.yaEstaban.push(c.id); continue; }
    try {
      const contenidos = {};
      for (const f of c.ficheros) contenidos[f] = await descargar(c.repo, f);
      if (!contenidos['main.js'] || !contenidos['manifest.json']) throw new Error('la versión publicada no trae main.js y manifest.json');
      fs.mkdirSync(dir, { recursive: true });
      for (const [f, datos] of Object.entries(contenidos)) if (datos) fs.writeFileSync(path.join(dir, f), datos);
      resultado.instalados.push(c.id);
    } catch (e) {
      resultado.fallidos.push({ id: c.id, motivo: e.message });
    }
  }
  return resultado;
}

module.exports = { AJUSTES, COMPLEMENTOS, aplicarAjustes, descargarDeGitHub, instalarComplementos };
```

Run: `node --test .kit/herramientas/tests/obsidian.test.js` → PASS.

- [ ] **Step 4: `arranque.js` admite herramientas asíncronas** — sustituir `arrancar` por:

```js
function arrancar(cli, raiz, nombre) {
  const fallo = error => {
    console.error(`Fallo inesperado en ${nombre}: ${error.message}`);
    console.error('Esto es del kit, no del curso: abre una issue con node .kit/herramientas/issue.js (ver "Feedback al kit" en AGENTS.md).');
    process.exit(3);
  };
  try {
    const codigo = cli(process.argv.slice(2), raiz);
    if (codigo && typeof codigo.then === 'function') codigo.then(c => process.exit(c), fallo);
    else process.exit(codigo);
  } catch (error) {
    fallo(error);
  }
}
```

- [ ] **Step 5: la herramienta `obsidian.js`**

```js
'use strict';
const path = require('node:path');
const { aplicarAjustes, instalarComplementos } = require('./lib/obsidian');

// Deja Obsidian como lo recomienda el kit: ajustes (sin pisar los del alumno) y complementos instalados sin activar.
// Un fallo de red no es un error del curso: lo dice y sale bien.
async function cli(args, raiz, descargar) {
  const tocados = aplicarAjustes(raiz);
  console.log(tocados.length ? `Ajustes de Obsidian escritos: ${tocados.join(', ')}.` : 'Ajustes de Obsidian: ya estaban.');
  if (args.includes('--sin-complementos')) return 0;
  const r = await instalarComplementos(raiz, descargar);
  if (r.instalados.length) console.log(`Complementos instalados (sin activar): ${r.instalados.join(', ')}.`);
  if (r.yaEstaban.length) console.log(`Ya estaban: ${r.yaEstaban.join(', ')}.`);
  for (const f of r.fallidos) console.log(`No se pudo descargar ${f.id}: ${f.motivo}. Se puede repetir más tarde.`);
  return 0;
}

if (require.main === module) require('./lib/arranque').arrancar(cli, path.resolve(__dirname, '..', '..'), 'obsidian.js');

module.exports = { cli };
```

En `.claude/settings.json`, añadir tras la línea de `organizar.js`:
`"Bash(node .kit/herramientas/obsidian.js *)",`
(`coherencia-skills.test.js` exige que toda herramienta tenga permiso.)

En `AGENTS.md`, tabla de "Herramientas", añadir la fila:
`| Tras preparar el curso (paso 9) y tras actualizar un curso existente | \`node .kit/herramientas/obsidian.js\` |`

- [ ] **Step 6: `preparar-curso.js` configura Obsidian antes de la primera apertura**

Añadir `const { aplicarAjustes } = require('./lib/obsidian');` y, antes del `return` de `prepararCurso`:

```js
  // Antes de que el alumno abra la carpeta en Obsidian: así arranca ya configurado (abierto, pisaría los ficheros).
  const obsidian = aplicarAjustes(raiz);
```

y devolver `obsidian` en el objeto de resultado. En `preparar-curso.test.js`, el test principal comprueba que
existe `estudio/.obsidian/core-plugins.json` con `sync: false`; si los tests montan un curso sin
`.kit/plantillas/obsidian`, copiar las plantillas reales como ya hace el test de la migración 002
(`fs.cpSync(path.join(KIT_REAL, 'plantillas'), path.join(raiz, '.kit', 'plantillas'), { recursive: true })`).

- [ ] **Step 7: `diagnostico.js`** — la bóveda está abierta cuando Obsidian ha escrito su `workspace.json`
  (`.obsidian/` ya lo crea el kit):

```js
  anota('obsidian', existe(`${v.CARPETA_ALUMNO}/.obsidian/workspace.json`), 'La carpeta estudio está abierta en Obsidian', 'Falta abrir la carpeta estudio como bóveda en Obsidian (paso 9).', false);
```

En `diagnostico.test.js`, `cursoInstalado` pasa a escribir `'estudio/.obsidian/workspace.json': '{}'` en vez de
`app.json`, y se añade:

```js
test('una carpeta .obsidian creada por el kit no cuenta como bóveda abierta', () => {
  const { raiz, carpetaBin, entorno } = cursoInstalado();
  fs.rmSync(path.join(raiz, 'estudio', '.obsidian', 'workspace.json'));
  assert.ok(fallos(diagnostico({ raiz, carpetaBin, entorno, ejecutar: ordenador() })).includes('obsidian'));
});
```

- [ ] **Step 8: migración 003 también añade los ajustes que falten** — en `migrar(raiz)`, al final:

```js
    // Obsidian configurado de serie (sin red: los complementos los descarga el profesor con obsidian.js).
    require('../lib/obsidian').aplicarAjustes(raiz);
```

y actualizar su `descripcion` a `'Cada sesión gana la casilla "estudiada", y Obsidian los ajustes recomendados'`.
En `actualizar.test.js`, el test de la 003 copia las plantillas reales al curso de prueba (como el de la 002) y
comprueba además que `estudio/.obsidian/app.json` tiene `alwaysUpdateLinks: true` y que un `app.json` previo con
`promptDelete: true` lo conserva.

- [ ] **Step 9: guías y skills**

`INSTALAR-AGENTE.md`, paso 9: antes de "No existe forma de abrirle la bóveda desde aquí", añadir:

```markdown
**Antes de que la abra**, ejecuta `node .kit/herramientas/obsidian.js`: deja escritos los ajustes recomendados
(ya los puso `preparar-curso.js`; no pisa nada) y descarga los complementos **Terminal**, **Code Files** y
**Claudian** sin activarlos. Si no hay red, lo dice y sigue: se repite más tarde.
```

Sustituir el párrafo "**Que vea también los ejercicios.** …" por:

```markdown
**Los ejercicios web ya se ven:** la configuración recomendada activa "Detectar todas las extensiones de
archivo". Si `comprobar.js` avisa `obsidian-oculta-ejercicios`, es que el alumno lo desactivó: pregúntale antes
de volver a activarlo.
```

Sustituir la sección "### Opcional — hablar contigo desde dentro de Obsidian" entera por:

```markdown
### Extras de Obsidian — instalados, sin activar

Los complementos **Terminal** (una terminal dentro de Obsidian, para hablar contigo sin cambiar de ventana;
necesita Python 3.9 o superior), **Code Files** (ver y editar ficheros de código) y **Claudian** (Claude en un
panel lateral) ya están instalados, pero **apagados**: son de terceros, no de Obsidian ni del kit, y activarlos
es decisión suya. Díselo en una frase y que sepa que su hoja *Cómo usar tu profesor* explica cómo activarlos.
No los actives tú.
```

`.kit/skills/configurar/SKILL.md`, fila `{{TERMINAL_EN_OBSIDIAN}}`: cambiar la condición "Si tiene instalado el
complemento Terminal en Obsidian (existe `estudio/.obsidian/plugins/terminal/`)" por "Si tiene **activado** el
complemento Terminal (`estudio/.obsidian/community-plugins.json` incluye `"terminal"`)".

`.kit/skills/actualizar/SKILL.md`: tras aplicar la actualización, añadir el paso "Ejecuta
`node .kit/herramientas/obsidian.js` (descarga los complementos que falten; los ajustes ya los añadió la
migración). Si el alumno tenía Obsidian abierto durante la actualización, que lo cierre y lo abra."

`.kit/plantillas/guia-de-uso.md`: añadir antes de "## 9. Si algo no cuadra" (y renumerar las siguientes):

```markdown
## 9. Extras de Obsidian (opcionales)

Tu Obsidian trae tres complementos instalados pero **apagados**. Son de otras personas, no de Obsidian ni de tu
profesor: actívalos solo si te interesan.

| Complemento | Para qué sirve |
|---|---|
| **Terminal** | Hablar con tu profesor sin salir de Obsidian (necesita Python instalado; si no lo tienes, pídeselo a tu profesor) |
| **Code Files** | Ver y editar ficheros de código dentro de Obsidian |
| **Claudian** | Tener a Claude en un panel lateral de Obsidian |

Para activar uno: rueda dentada (abajo a la izquierda) → **Complementos de la comunidad** → **Activar
complementos de la comunidad** → en la lista, enciende el que quieras. Para apagarlo, lo mismo.
```

- [ ] **Step 10: Suite completa y commit**

Run: `node --test ".kit/herramientas/tests/*.test.js"` → PASS.
Run: `grep -o '{{[A-Z_]*}}' .kit/plantillas/guia-de-uso.md | sort -u` → los mismos cinco huecos de siempre.

```bash
git add .kit/plantillas/obsidian .kit/herramientas/lib/obsidian.js .kit/herramientas/obsidian.js .kit/herramientas/lib/arranque.js .kit/herramientas/preparar-curso.js .kit/herramientas/diagnostico.js .kit/herramientas/migraciones/003-casilla-estudiada.js .kit/herramientas/tests .claude/settings.json .kit/guias/INSTALAR-AGENTE.md .kit/plantillas/guia-de-uso.md .kit/skills/configurar/SKILL.md .kit/skills/actualizar/SKILL.md AGENTS.md
git commit -m "feat(obsidian): configurado de serie y complementos instalados sin activar"
```

La Task 11 (validación) gana un paso: en el curso real, tras actualizar, `node .kit/herramientas/obsidian.js` —
con los complementos de Roberto ya enlazados, debe decir "Ya estaban" y no tocar nada.
