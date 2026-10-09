'use strict';
// pruebas/lib/pasos.js desde aquí (mismo patrón que prueba-real.test.js con un script fuera de .kit/).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ix = require('../lib/indice');
const { temporal, cursoTemporal, escribir } = require('./ayuda');
const pasos = require('../../../pruebas/lib/pasos');
const {
  insertarAntesDelPie, simularAlumnoTrasSesiones, quedaMarcador, sesionConEjercicio,
  respuestasEnLaTabla, dudasRespondidas, conceptosDelExamen, procesarClase, auditoriaRecoge, coberturaDelMaterial,
  ejerciciosConCasos, faltaInfoEnSesion, fotoDeEjercicios, ejercicioDelConcepto, sinonimoDelConcepto, conceptoCompartido,
  conceptoParaEjercicio, ejercicioPedido,
} = pasos;

test('insertarAntesDelPie: sin pie todavía, se añade al final', () => {
  const texto = '# Intro\n\nAlgo de contenido.\n';
  const resultado = insertarAntesDelPie(texto, '@@ una duda');
  assert.match(resultado, /Algo de contenido\.\n\n@@ una duda\n$/);
});

test('insertarAntesDelPie: con pie de navegación, se inserta antes del marcador (dentro del cuerpo)', () => {
  const pie = ix.pieDeSesion(null, null);
  const texto = `# Intro\n\nAlgo de contenido.\n\n${pie}\n`;
  const resultado = insertarAntesDelPie(texto, '@@ una duda');
  const iDuda = resultado.indexOf('@@ una duda');
  const iPie = resultado.indexOf(ix.MARCA_INICIO);
  assert.ok(iDuda >= 0 && iPie >= 0 && iDuda < iPie, 'la duda queda antes del pie, no detrás');
  assert.equal(ix.marcadoresRotos(resultado), false, 'el pie sigue teniendo sus dos marcadores intactos');
});

test('simularAlumnoTrasSesiones: la duda de la sesión queda dentro del cuerpo, no detrás del pie', () => {
  const destino = temporal('kit-pasos-');
  const sesionDir = path.join(destino, 'estudio', 'sesiones');
  fs.mkdirSync(sesionDir, { recursive: true });
  const pie = ix.pieDeSesion(null, null);
  fs.writeFileSync(
    path.join(sesionDir, 's01-intro.md'),
    `---\ntipo: sesion\nestudiada: false\n---\n# Intro\n\n## Conceptos\n\n- [[alfa]]\n\n${pie}\n`,
  );
  const conceptosDir = path.join(destino, 'estudio', 'conceptos');
  fs.mkdirSync(conceptosDir, { recursive: true });
  fs.writeFileSync(path.join(conceptosDir, 'alfa.md'), '---\ntipo: concepto\nalias: []\n---\n# Alfa\n');

  const tocado = simularAlumnoTrasSesiones(destino, '@@');
  assert.ok(tocado.sesion, 'tocó la sesión');
  const texto = fs.readFileSync(path.join(sesionDir, 's01-intro.md'), 'utf8');
  const iDuda = texto.indexOf('@@ ¿por qué esto importa');
  const iPie = texto.indexOf(ix.MARCA_INICIO);
  assert.ok(iDuda >= 0 && iPie >= 0 && iDuda < iPie);
  assert.equal(ix.marcadoresRotos(texto), false);
  assert.ok(quedaMarcador(destino, '@@'), 'la duda sigue ahí (aún no la resolvió /dudas)');
});

test('sesionConEjercicio: verde con el ejercicio en la carpeta de su unidad (.md o .html)', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios', 'modulo-01', '1.1-dinero');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '01-01-01-inflacion.html'), '<p>x</p>');
  const r = sesionConEjercicio(destino, '01-01');
  assert.equal(r.ok, true);
  assert.match(r.detalle, /01-01-01-inflacion\.html/);
});

test('sesionConEjercicio: verde con el ejercicio en plano (curso sin estructura)', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 's01-interes.md'), '# Ejercicio\n');
  assert.equal(sesionConEjercicio(destino, 's01').ok, true);
});

test('sesionConEjercicio: rojo sin ninguno, aunque haya _index.md y .gitkeep (o ni exista la carpeta)', () => {
  const destino = temporal('kit-pasos-');
  assert.equal(sesionConEjercicio(destino, '01-01').ok, false);
  const dir = path.join(destino, 'estudio', 'ejercicios');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_index.md'), '01-01 aparece aquí\n');
  fs.writeFileSync(path.join(dir, '.gitkeep'), '');
  const r = sesionConEjercicio(destino, '01-01');
  assert.equal(r.ok, false);
  assert.match(r.detalle, /no hay ningún ejercicio/);
});

test('sesionConEjercicio: rojo si solo hay ejercicios de otra clase o entregas del alumno', () => {
  const destino = temporal('kit-pasos-');
  const dir = path.join(destino, 'estudio', 'ejercicios', 'modulo-01', '1.2-presupuesto');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '01-02-01-colchon.md'), '# Ejercicio\n');
  fs.mkdirSync(path.join(destino, 'estudio', 'ejercicios', 'entregas'), { recursive: true });
  fs.writeFileSync(path.join(destino, 'estudio', 'ejercicios', 'entregas', '01-01-mi-entrega.md'), 'x');
  assert.equal(sesionConEjercicio(destino, '01-01').ok, false);
  assert.equal(sesionConEjercicio(destino, '01-02').ok, true);
});

// --- Las comprobaciones del curso de ejemplo que mide más: cada una en verde, y en rojo con su «estropeo a mano» ---

const examenCorregido = (celda2) => '---\ntipo: examen\nunidad: 01\n---\n# Test\n\n**1.** Una cifra.\n\n✍️ **Tu respuesta:**\n\n'
  + '## Histórico de intentos\n\n| Intento | Nota |\n|---|---|\n| 1 | 5 |\n\n> [!example]- Intento 1 · 2026-10-03\n>\n'
  + '> | # | Tu respuesta | Resultado | Por qué |\n> |---|---|---|---|\n'
  + `> | 1 | 20 % | ✅ Correcta | ok |\n> | 2 | ${celda2} | ⚠️ Le falta: el periodo | ok |\n`;

test('respuestasEnLaTabla: verde con las respuestas citadas literales (con o sin markdown); rojo si una celda queda en blanco o reescrita', () => {
  const destino = temporal('kit-pasos-');
  const f = path.join(destino, 'examen.md');
  fs.writeFileSync(f, examenCorregido('2 %'));
  assert.equal(respuestasEnLaTabla(destino, f, ['20 %', '2 %', '']).ok, true, 'la tercera, en blanco, no se mira');
  fs.writeFileSync(f, examenCorregido('«2 %»'));
  assert.equal(respuestasEnLaTabla(destino, f, ['20 %', '2 %']).ok, true);
  fs.writeFileSync(f, examenCorregido(''));
  const r = respuestasEnLaTabla(destino, f, ['20 %', '2 %']);
  assert.equal(r.ok, false);
  assert.match(r.detalle, /p\.2: la celda está en blanco/);
  fs.writeFileSync(f, examenCorregido('*(en blanco)*'));
  assert.equal(respuestasEnLaTabla(destino, f, ['20 %', '2 %']).ok, false);
  fs.writeFileSync(f, examenCorregido('Un dos por ciento'));
  assert.match(respuestasEnLaTabla(destino, f, ['20 %', '2 %']).detalle, /p\.2: la celda dice/);
});

test('respuestasEnLaTabla: rojo si no hay ningún intento corregido (el paso de corregir no llegó a escribirlo)', () => {
  const destino = temporal('kit-pasos-');
  const f = path.join(destino, 'examen.md');
  fs.writeFileSync(f, '# Test\n\n**1.** Una cifra.\n\n✍️ **Tu respuesta:** 20 %\n');
  const r = respuestasEnLaTabla(destino, f);
  assert.equal(r.ok, false);
  assert.match(r.detalle, /ningún intento corregido/);
});

const notaConDuda = (cuerpo) => `---\ntipo: concepto\n---\n# Alfa\n\nTexto.\n\n${cuerpo}\n`;

test('dudasRespondidas: verde si el marcador pasó a «> [!question]- Duda» con su respuesta; rojo sin respuesta, con el marcador o sin callout', () => {
  const destino = temporal('kit-pasos-');
  const escribirNotas = (concepto, sesion) => {
    escribir(destino, { 'estudio/conceptos/alfa.md': notaConDuda(concepto), 'estudio/sesiones/s01-intro.md': notaConDuda(sesion) });
  };
  const bien = '> [!question]- Duda · 2026-10-03\n> ¿por qué?\n>\n> **Respuesta:** porque sí, con un ejemplo.';
  const tocado = { concepto: 'conceptos/alfa.md', sesion: 'sesiones/s01-intro.md' };
  escribirNotas(bien, bien);
  assert.equal(dudasRespondidas(destino, tocado, '@@').ok, true);
  // estropeo a mano: quitar la respuesta
  escribirNotas(bien, '> [!question]- Duda · 2026-10-03\n> ¿por qué?\n>\n> **Respuesta:**\n');
  const sinRespuesta = dudasRespondidas(destino, tocado, '@@');
  assert.equal(sinRespuesta.ok, false);
  assert.match(sinRespuesta.detalle, /sesiones\/s01-intro\.md: la duda no lleva/);
  // la marca de origen de AGENTS.md (regla 2) dentro de la etiqueta cuenta como respuesta (Codex, 2026-10-06)
  const conMarca = '> [!question]- Duda · 2026-10-03\n> ¿por qué?\n>\n> **Respuesta · Ampliación fuera de los apuntes:** un ejemplo nuevo.';
  escribirNotas(conMarca, conMarca);
  assert.equal(dudasRespondidas(destino, tocado, '@@').ok, true);
  escribirNotas(bien, '> [!question]- Duda · 2026-10-03\n> ¿por qué?\n>\n> **Respuesta · Ampliación fuera de los apuntes:**\n');
  assert.equal(dudasRespondidas(destino, tocado, '@@').ok, false, 'con marca pero sin texto sigue siendo rojo');
  escribirNotas(bien, '@@ ¿por qué?');
  assert.match(dudasRespondidas(destino, tocado, '@@').detalle, /sigue el marcador @@/);
  escribirNotas('Se ha borrado la duda sin más.', bien);
  assert.match(dudasRespondidas(destino, tocado, '@@').detalle, /no hay ningún «> \[!question\]- Duda»/);
});

function examenConClave(destino, { unidad = '01', conceptos, notas }) {
  const rel = 'examenes/m1/01-examen.md';
  escribir(destino, {
    [`estudio/${rel}`]: `---\ntipo: examen\nunidad: ${unidad}\n---\n# Examen\n`,
    'config/claves/m1/01-examen.json': JSON.stringify({ opciones: 4, preguntas: conceptos.map(c => ({ correctas: ['a'], concepto: c })) }),
  });
  for (const [slug, visto] of Object.entries(notas)) {
    escribir(destino, { [`estudio/conceptos/${slug}.md`]: `---\ntipo: concepto\nvisto_en: [${visto}]\nalias: []\n---\n# ${slug}\n` });
  }
  return path.join(destino, 'estudio', rel);
}

test('conceptosDelExamen: verde con ≤3 preguntas por concepto y todos de la unidad; rojo con una cuarta, o con un concepto que no existe o es de otra unidad', () => {
  const notas = { alfa: '01-01-01-intro', beta: '01-02-01-otra', gamma: '02-01-01-modulo-dos' };
  const destino = temporal('kit-pasos-');
  const bien = examenConClave(destino, { conceptos: ['alfa', 'alfa', 'alfa', 'beta'], notas });
  const r = conceptosDelExamen(destino, bien);
  assert.equal(r.ok, true, r.detalle);
  assert.match(r.detalle, /alfa 3, beta 1/);
  // estropeo a mano 1: una cuarta pregunta del mismo concepto
  const cuatro = temporal('kit-pasos-');
  const f4 = examenConClave(cuatro, { conceptos: ['alfa', 'alfa', 'alfa', 'alfa'], notas });
  assert.match(conceptosDelExamen(cuatro, f4).detalle, /4 preguntas del concepto «alfa» \(máximo 3\)/);
  // estropeo a mano 2: una clave de un concepto que no existe
  const falso = temporal('kit-pasos-');
  const f2 = examenConClave(falso, { conceptos: ['alfa', 'inventado'], notas });
  const noExiste = conceptosDelExamen(falso, f2);
  assert.equal(noExiste.ok, false);
  assert.match(noExiste.detalle, /«inventado» no existe/);
  // un concepto que existe pero es de otra unidad
  const otra = temporal('kit-pasos-');
  const f3 = examenConClave(otra, { conceptos: ['alfa', 'gamma'], notas });
  assert.match(conceptosDelExamen(otra, f3).detalle, /«gamma» no es de la unidad examinada/);
});

test('conceptosDelExamen: sin concepto en una pregunta (o sin clave de concepto) solo se dice', () => {
  const destino = temporal('kit-pasos-');
  const f = examenConClave(destino, { conceptos: ['alfa', null], notas: { alfa: '01-01-01-intro' } });
  const r = conceptosDelExamen(destino, f);
  assert.equal(r.ok, true);
  assert.match(r.detalle, /observación: sin concepto en la clave: p\.2/);
});

test('procesarClase: verde con el curso sano; rojo con un % sin proteger en una fórmula, con una fila de progreso quitada o con algo evaluado', () => {
  const raiz = cursoTemporal();
  const progresoAntes = fs.readFileSync(path.join(raiz, 'estudio', 'progreso.md'), 'utf8');
  assert.equal(procesarClase(raiz, { id: 's01', progresoAntes }).ok, true);
  // estropeo a mano 1: un % sin proteger dentro de una fórmula
  const alfa = path.join(raiz, 'estudio', 'conceptos', 'alfa.md');
  const original = fs.readFileSync(alfa, 'utf8');
  fs.writeFileSync(alfa, `${original}\nCon $r = 5%$ sale así.\n`);
  const vera = procesarClase(raiz, { id: 's01', progresoAntes });
  assert.equal(vera.ok, false);
  assert.match(vera.detalle, /no-se-vera-bien/);
  fs.writeFileSync(alfa, original);
  // estropeo a mano 2: quitar la fila de progreso del concepto
  fs.writeFileSync(path.join(raiz, 'estudio', 'progreso.md'), '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n');
  const sinFila = procesarClase(raiz, { id: 's01', progresoAntes });
  assert.equal(sinFila.ok, false);
  assert.match(sinFila.detalle, /alfa no aparece en progreso\.md/);
  // procesar la clase evaluó un concepto
  fs.writeFileSync(path.join(raiz, 'estudio', 'progreso.md'), '# Progreso\n\n| Concepto | Teoría | Aplicación |\n|---|---|---|\n| [[alfa]] | ✅ sólido | ⬜ |\n');
  assert.match(procesarClase(raiz, { id: 's01', progresoAntes }).detalle, /evaluó conceptos/);
});

const conAuditoria = (id, auditoria) => {
  const destino = temporal('kit-pasos-');
  escribir(destino, { [`estudio/sesiones/${id}-tema.md`]: `# Sesión\n\n## Auditoría del material\n\n${auditoria}\n\n## Para pensarlo despacio\n\nUna.\n` });
  return destino;
};

test('auditoriaRecoge: verde con la cifra (742 o 27, con coma, punto o ceros); rojo si se borra; las observaciones no tumban', () => {
  for (const texto of ['El total es 742,00 € y no 715.', 'Suma 742 y 27 de diferencia.', 'Diferencia: 27.00 €', 'Son 742,0 euros']) {
    assert.equal(auditoriaRecoge(conAuditoria('01-02', texto), { id: '01-02', rojo: ['742', '27'] }).ok, true, texto);
  }
  // estropeo a mano: sin la cifra (y sin confundir 1.742, 7420 o 27,5 con ella)
  for (const texto of ['La hoja no cuadra, pero no digo cuánto.', 'Total 1.742,00 €', 'Son 7420', 'Subió 27,5 %']) {
    const r = auditoriaRecoge(conAuditoria('01-02', texto), { id: '01-02', rojo: ['742', '27'] });
    assert.equal(r.ok, false, texto);
  }
  assert.match(auditoriaRecoge(conAuditoria('01-02', ''), { id: '01-02', rojo: ['742'] }).detalle, /no hay auditoría/);
  const obs = auditoriaRecoge(conAuditoria('01-01', 'Todo bien.'), { id: '01-01', observar: ['97,09', 'diapositiva 6'] });
  assert.equal(obs.ok, true);
  assert.match(obs.detalle, /no recoge 97,09, diapositiva 6/);
  assert.doesNotMatch(auditoriaRecoge(conAuditoria('01-01', 'La cuenta exacta da 97.09 € (diapositiva 6).'), { id: '01-01', observar: ['97,09', 'diapositiva 6'] }).detalle, /observación/);
});

test('coberturaDelMaterial: siempre ok:true; dice qué diapositivas u hojas no tienen destino (tabla con «N ·», «Diapositivas 1-3», hojas)', () => {
  const destino = temporal('kit-pasos-');
  const material = path.join(destino, 'clase.md');
  fs.writeFileSync(material, '# Clase\n\n### Diapositiva 1 · Uno\n\n### Diapositiva 2 · Dos\n\n### Diapositiva 3 · Tres\n\n### Diapositiva 4 · Cuatro\n\n## Hoja "Gastos fijos"\n\n## Hoja "Resumen"\n');
  escribir(destino, { 'estudio/sesiones/01-01-tema.md': '# S\n\n## Cobertura del material\n\n| Parte | Destino |\n|---|---|\n| Diapositivas 1-2 | [[a]] |\n| 3 · Tres | [[b]] |\n| Hoja "Gastos fijos" | Auditoría |\n\n## Auditoría del material\n\nNada.\n' });
  const r = coberturaDelMaterial(destino, { id: '01-01', ficheros: [material] });
  assert.equal(r.ok, true);
  assert.match(r.detalle, /4 de 6 partes/);
  assert.match(r.detalle, /sin destino diapositiva 4, hoja «Resumen»/);
  assert.equal(coberturaDelMaterial(destino, { id: '09-09', ficheros: [material] }).ok, true, 'sin sesión, también ok');
});

const htmlEjercicio = '<input id="a" type="range" min="0" max="10"><script>window.verificar = function (c) { return c.a > 5 ? "alto" : "bajo"; };</script>';

test('ejerciciosConCasos: verde si pasa sus casos; rojo si cambia un «esperado»; sin casos a mano, observación', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, {
    'estudio/ejercicios/m1/01-01-uno.html': htmlEjercicio,
    'estudio/ejercicios/m1/01-01-dos.html': htmlEjercicio,
    'config/casos/01-01-uno.json': JSON.stringify([{ a: 8, esperado: 'alto' }, { a: 2, esperado: 'bajo' }]),
  });
  const bien = ejerciciosConCasos(destino);
  assert.equal(bien.ok, true, bien.detalle);
  assert.match(bien.detalle, /1 con casos a mano y pasando/);
  assert.match(bien.detalle, /observación: sin casos a mano 01-01-dos/);
  // estropeo a mano: un `esperado` que no es
  fs.writeFileSync(path.join(destino, 'config', 'casos', '01-01-uno.json'), JSON.stringify([{ a: 8, esperado: 'bajo' }]));
  const mal = ejerciciosConCasos(destino);
  assert.equal(mal.ok, false);
  assert.match(mal.detalle, /01-01-uno: .*esperado "bajo", obtenido "alto"/);
});

test('ejerciciosConCasos: un caso con excepción tumba; sin ningún .html, verde', () => {
  const destino = temporal('kit-pasos-');
  assert.equal(ejerciciosConCasos(destino).ok, true);
  escribir(destino, {
    'estudio/ejercicios/01-01-roto.html': '<script>window.verificar = function () { throw new Error("mal"); };</script>',
    'config/casos/01-01-roto.json': JSON.stringify([{ a: 1 }]),
  });
  assert.equal(ejerciciosConCasos(destino).ok, false);
});

test('faltaInfoEnSesion: verde con «FALTA INFO:» en una línea que nombra el patrón oro; rojo si se quita o si es de otra sesión o de otro tema', () => {
  const sesion = (extra) => `# S\n\n## Pendiente\n\n- ⚠️ **FALTA INFO:** ¿cuánto cuestan las suscripciones? (diapositiva 6)\n${extra}\n`;
  const destino = temporal('kit-pasos-');
  escribir(destino, { 'estudio/sesiones/01-01-tema.md': sesion('- ⚠️ **FALTA INFO:** Patrón oro (diapositiva 6): el PDF solo traía el título.') });
  assert.equal(faltaInfoEnSesion(destino, { id: '01-01', ancla: 'patrón oro' }).ok, true);
  assert.equal(faltaInfoEnSesion(destino, { id: '01-01', ancla: 'patron oro' }).ok, true, 'sin acentos también');
  // estropeo a mano: quitar esa línea (queda el FALTA INFO de otra cosa, con «diapositiva 6»)
  escribir(destino, { 'estudio/sesiones/01-01-tema.md': sesion('') });
  const r = faltaInfoEnSesion(destino, { id: '01-01', ancla: 'patrón oro' });
  assert.equal(r.ok, false);
  assert.match(r.detalle, /hay 1 FALTA INFO sobre otra cosa/);
  // el patrón oro en un TODO o en prosa, o en otra sesión, no vale
  escribir(destino, {
    'estudio/sesiones/01-01-tema.md': sesion('- **TODO:** decidir si el patrón oro merece nota.\nEl patrón oro es de la diapositiva 6.'),
    'estudio/sesiones/01-02-otra.md': '# S\n\n- **FALTA INFO:** patrón oro\n',
    'estudio/pendientes.md': '- FALTA INFO: patrón oro\n',
  });
  assert.equal(faltaInfoEnSesion(destino, { id: '01-01', ancla: 'patrón oro' }).ok, false);
  assert.equal(faltaInfoEnSesion(destino, { id: '09-09', ancla: 'patrón oro' }).ok, false);
});

const notaDeConcepto = (slug, extra = '') => `---\ntipo: concepto\nvisto_en: [01-01-01-x]\nalias: []\n${extra}---\n# ${slug}\n\n## Practícalo\n\n`;

test('ejercicioDelConcepto: verde con un ejercicio nuevo o modificado desde la foto y enlazado; rojo si no se tocó ninguno', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, { 'estudio/ejercicios/m1/01-01-previo.md': 'previo', 'estudio/ejercicios/_index.md': 'x', 'estudio/conceptos/liquidez.md': notaDeConcepto('liquidez') });
  const foto = fotoDeEjercicios(destino);
  assert.deepEqual(Object.keys(foto), ['m1/01-01-previo.md'], 'sin _index.md');
  // estropeo a mano: no se toca ningún ejercicio (ni siquiera el _index.md, que escribe guardar.js)
  fs.writeFileSync(path.join(destino, 'estudio', 'ejercicios', '_index.md'), 'otra cosa');
  const nada = ejercicioDelConcepto(destino, { slug: 'liquidez', foto });
  assert.equal(nada.ok, false);
  assert.match(nada.detalle, /no se creó ni se tocó ningún fichero/);
  // nuevo, enlazado desde `ejercicio:`
  escribir(destino, { 'estudio/ejercicios/m1/01-01-liquidez.html': '<p>x</p>', 'estudio/conceptos/liquidez.md': notaDeConcepto('liquidez', 'ejercicio: 01-01-liquidez\n') });
  assert.equal(ejercicioDelConcepto(destino, { slug: 'liquidez', foto }).ok, true);
  // nuevo, enlazado desde `## Practícalo`
  escribir(destino, { 'estudio/conceptos/liquidez.md': `${notaDeConcepto('liquidez')}[[ejercicios/m1/01-01-liquidez.html]]: mueve la urgencia.\n` });
  assert.equal(ejercicioDelConcepto(destino, { slug: 'liquidez', foto }).ok, true);
});

test('ejercicioDelConcepto: verde también con un ejercicio previo MODIFICADO (lo amplía); rojo si lo toca y la nota no lo enlaza', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, { 'estudio/ejercicios/m1/01-01-previo.md': 'previo', 'estudio/conceptos/liquidez.md': notaDeConcepto('liquidez', 'ejercicio: 01-01-previo\n') });
  const foto = fotoDeEjercicios(destino);
  fs.writeFileSync(path.join(destino, 'estudio', 'ejercicios', 'm1', '01-01-previo.md'), 'previo, ampliado con otro caso');
  assert.equal(ejercicioDelConcepto(destino, { slug: 'liquidez', foto }).ok, true);
  escribir(destino, { 'estudio/conceptos/liquidez.md': notaDeConcepto('liquidez') });
  const sinEnlace = ejercicioDelConcepto(destino, { slug: 'liquidez', foto });
  assert.equal(sinEnlace.ok, false);
  assert.match(sinEnlace.detalle, /la nota del concepto no lo enlaza/);
  assert.equal(ejercicioDelConcepto(destino, { slug: 'no-existe', foto }).ok, false);
});

const nota = (titulo, alias = '', cuerpo = '') => `---\ntipo: concepto\nvisto_en: [01-02-01-x]\nalias: [${alias}]\n---\n# ${titulo}\n${cuerpo}`;

test('sinonimoDelConcepto: rojo con una nota aparte (título o alias); verde con el alias o un TODO; sin nada, ok con observación', () => {
  const destino = temporal('kit-pasos-');
  const comprueba = () => sinonimoDelConcepto(destino, { titulo: 'Colchón financiero', sinonimo: 'fondo de emergencia' });
  escribir(destino, { 'estudio/conceptos/colchon-financiero.md': nota('Colchón financiero') });
  const nadaMas = comprueba();
  assert.equal(nadaMas.ok, true);
  assert.match(nadaMas.detalle, /ni nota aparte, ni alias, ni TODO/);
  // verde: alias en la nota del concepto
  escribir(destino, { 'estudio/conceptos/colchon-financiero.md': nota('Colchón financiero', 'Fondo de Emergencia') });
  assert.match(comprueba().detalle, /queda como alias/);
  // verde: un TODO (en una sesión) que lo nombra
  escribir(destino, { 'estudio/conceptos/colchon-financiero.md': nota('Colchón financiero'), 'estudio/sesiones/02-02-ahorro.md': '# S\n\n- **TODO:** ¿«fondo de emergencia» es lo mismo que el colchón financiero?\n' });
  assert.match(comprueba().detalle, /TODO\/FALTA INFO en 02-02-ahorro\.md/);
  // estropeo a mano: una nota fondo-de-emergencia.md
  escribir(destino, { 'estudio/conceptos/fondo-de-emergencia.md': nota('Fondo de emergencia') });
  const duplicado = comprueba();
  assert.equal(duplicado.ok, false);
  assert.match(duplicado.detalle, /fondo-de-emergencia\.md/);
});

test('sinonimoDelConcepto: rojo si otra nota lo lleva solo como alias; no confunde la nota del concepto ni un TODO de otra cosa', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, {
    'estudio/conceptos/colchon-financiero.md': nota('Colchón financiero'),
    'estudio/conceptos/liquidez.md': nota('Liquidez', 'fondo de emergencia'),
    'estudio/sesiones/02-02-ahorro.md': '# S\n\n- **TODO:** revisar las cifras.\n',
  });
  assert.equal(sinonimoDelConcepto(destino, { titulo: 'Colchón financiero', sinonimo: 'fondo de emergencia' }).ok, false);
  const sinNota = temporal('kit-pasos-');
  escribir(sinNota, { 'estudio/conceptos/liquidez.md': nota('Liquidez') });
  const r = sinonimoDelConcepto(sinNota, { titulo: 'Colchón financiero', sinonimo: 'fondo de emergencia' });
  assert.equal(r.ok, true);
  assert.match(r.detalle, /no encuentro la nota de «Colchón financiero»/);
});

test('conceptoCompartido sigue igual tras sacar la normalización y los alias a funciones compartidas', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, {
    'estudio/conceptos/interes-compuesto.md': nota('Interés compuesto', 'capitalización compuesta').replace('01-02-01-x', '02-01-01-x, 02-02-01-y'),
    'estudio/progreso.md': '| [[interes-compuesto]] | ⬜ | ⬜ |\n',
  });
  assert.equal(conceptoCompartido(destino, { titulo: 'Interés compuesto', sesiones: ['02-01', '02-02'] }).ok, true);
  assert.equal(conceptoCompartido(destino, { titulo: 'Capitalización compuesta', sesiones: ['02-01'] }).ok, true, 'por alias');
});

// --- Qué pide el paso /ejercicio y cómo se da por bueno ---------------------------------------------------------

const conFormula = (slug, extra = '') => `---\ntipo: concepto\nvisto_en: [01-01-01-x]\nalias: []\n${extra}---\n# ${slug}\n\n## La fórmula\n\n$$ a = b $$\n\n## Practícalo\n\n`;

test('conceptoParaEjercicio: el primer concepto con fórmula sin ejercicio enlazado; si todos lo tienen, el primero con yaTenia', () => {
  const destino = temporal('kit-pasos-');
  assert.equal(conceptoParaEjercicio(destino), null, 'sin conceptos');
  escribir(destino, {
    'estudio/conceptos/a-uno.md': conFormula('a-uno', 'ejercicio: 01-01-a-uno\n'),
    'estudio/conceptos/b-dos.md': `${conFormula('b-dos')}`,
    'estudio/conceptos/c-sin-formula.md': '---\ntipo: concepto\n---\n# c\n\n## La fórmula\n\n$$ ... $$\n',
  });
  assert.deepEqual(conceptoParaEjercicio(destino), { slug: 'b-dos', yaTenia: false }, 'salta el que ya tiene ejercicio');
  escribir(destino, { 'estudio/conceptos/b-dos.md': `${conFormula('b-dos')}[[ejercicios/m1/01-01-b-dos.html]]\n` });
  assert.deepEqual(conceptoParaEjercicio(destino), { slug: 'a-uno', yaTenia: true }, 'todos enlazados: el primero con fórmula');
});

test('ejercicioPedido: «ya tienes uno» sin tocar nada es ok con observación solo si ya había uno enlazado; si no, rojo como ejercicioDelConcepto', () => {
  const destino = temporal('kit-pasos-');
  escribir(destino, { 'estudio/ejercicios/m1/01-01-a-uno.md': 'previo', 'estudio/conceptos/a-uno.md': conFormula('a-uno', 'ejercicio: 01-01-a-uno\n') });
  const foto = fotoDeEjercicios(destino);
  const yaTiene = ejercicioPedido(destino, { slug: 'a-uno', foto, yaTenia: true });
  assert.equal(yaTiene.ok, true);
  assert.match(yaTiene.detalle, /observación/);
  assert.equal(ejercicioPedido(destino, { slug: 'a-uno', foto, yaTenia: false }).ok, false, 'sin ejercicio previo, no tocar nada es rojo');
  // tocó algo con un ejercicio previo: manda ejercicioDelConcepto
  fs.writeFileSync(path.join(destino, 'estudio', 'ejercicios', 'm1', '01-01-a-uno.md'), 'previo, ampliado');
  assert.equal(ejercicioPedido(destino, { slug: 'a-uno', foto, yaTenia: true }).ok, true);
  escribir(destino, { 'estudio/conceptos/a-uno.md': conFormula('a-uno') });
  assert.equal(ejercicioPedido(destino, { slug: 'a-uno', foto, yaTenia: true }).ok, false, 'tocó un fichero que la nota no enlaza');
});

test('sinNoSeVeraBien: verde con el curso sano; rojo con un % sin proteger en una fórmula', () => {
  const raiz = cursoTemporal();
  assert.equal(pasos.sinNoSeVeraBien(raiz).ok, true);
  const alfa = path.join(raiz, 'estudio', 'conceptos', 'alfa.md');
  fs.appendFileSync(alfa, '\nCon $r = 5%$ sale así.\n');
  const vera = pasos.sinNoSeVeraBien(raiz);
  assert.equal(vera.ok, false);
  assert.match(vera.detalle, /no-se-vera-bien/);
});

test('coberturaDelMaterial: reconoce «Diap. N» abreviado en la tabla de cobertura', () => {
  const raiz = temporal('cobertura-diap-');
  escribir(raiz, {
    'material.md': '# Clase\n\n### Diapositiva 1 · Uno\n\ntexto\n\n### Diapositiva 2 · Dos\n\ntexto\n',
    'estudio/sesiones/s01-intro.md': '---\ntipo: sesion\n---\n# s01\n\n## Cobertura del material\n\n| Sección | Destino |\n|---|---|\n| Diap. 1 · Uno | [[alfa]] |\n| Diap. 2 · Dos | [[alfa]] |\n',
  });
  const r = coberturaDelMaterial(raiz, { id: 's01', ficheros: [path.join(raiz, 'material.md')] });
  assert.match(r.detalle, /2 de 2/);
});

test('procesarClase: una clase sin nota de sesión en el curso es rojo, no un verde vacío', () => {
  const raiz = cursoTemporal();
  const r = procesarClase(raiz, { id: '02-09' });
  assert.equal(r.ok, false);
  assert.match(r.detalle, /no hay nota de sesión/);
});
