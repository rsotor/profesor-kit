'use strict';
// Lo común a las páginas del alumno (ejercicios y repasos en HTML): sacar el JS de sus <script> y ver si
// cargan algo de internet. Lo usan comprobar.js (compila el JS sin ejecutarlo, para el aviso de sintaxis) y
// verificar-ejercicio.js (lo ejecuta de verdad, con un DOM mínimo, para barrer casos).
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const ES_JS = atributos => {
  const tipo = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(atributos);
  return !/\bsrc\s*=/i.test(atributos) && (!tipo || /^(text|application)\/(javascript|ecmascript)$/i.test(tipo[1]));
};
// Lo que carga algo de fuera: <script src>, <link href>, <img src>… a http(s):// o //. Un <a href> no carga nada.
const CARGA_DE_FUERA = /<(?:script|link|img|iframe|audio|video|source)\b[^>]*?\b(?:src|href)\s*=\s*["']?((?:https?:)?\/\/[^"'\s>]+)/gi;

// Los <script> de JS de una página, en orden, con la línea 1-based del .html donde arranca cada uno (para
// señalar un error en la línea de la página, no en la del script suelto). Un <script src> o de otro tipo
// (JSON, un módulo) no se incluye.
function scriptsJs(html) {
  const resultado = [];
  for (const m of html.matchAll(SCRIPT)) {
    if (!ES_JS(m[1])) continue;
    const lineaInicial = html.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length - 1;
    resultado.push({ codigo: m[2], lineaInicial });
  }
  return resultado;
}

// Las URLs de fuera que carga una página (sin duplicados): tiene que funcionar con doble clic y sin red.
function cargasDeFuera(html) {
  return [...new Set([...html.matchAll(CARGA_DE_FUERA)].map(m => m[1]))];
}

module.exports = { scriptsJs, cargasDeFuera };
