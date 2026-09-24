'use strict';
// Lector de zip mínimo, sin dependencias: Word, PowerPoint y Excel (.docx, .pptx, .xlsx) son un zip con XML dentro.
// Lee el directorio central (el índice del final) y descomprime cada entrada: guardada (0) o deflate (8), que es lo
// que usan esos formatos. Sin zip64 ni cifrado: un fichero así no es material de clase normal, y se dice.
const zlib = require('node:zlib');

const FIN = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function leerZip(buffer) {
  // El registro final está en los últimos 22 bytes, más un comentario opcional de hasta 64 KB.
  let fin = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 22 - 0xffff); i--) {
    if (buffer.readUInt32LE(i) === FIN) { fin = i; break; }
  }
  if (fin < 0) throw new Error('no es un zip (ni un .docx, .pptx o .xlsx de verdad)');
  const total = buffer.readUInt16LE(fin + 10);
  let p = buffer.readUInt32LE(fin + 16);
  const entradas = new Map();
  for (let n = 0; n < total; n++) {
    if (buffer.readUInt32LE(p) !== CENTRAL) throw new Error('el índice del zip está roto');
    const metodo = buffer.readUInt16LE(p + 10);
    const comprimido = buffer.readUInt32LE(p + 20);
    const largoNombre = buffer.readUInt16LE(p + 28);
    const largoExtra = buffer.readUInt16LE(p + 30);
    const largoComentario = buffer.readUInt16LE(p + 32);
    const local = buffer.readUInt32LE(p + 42);
    const nombre = buffer.toString('utf8', p + 46, p + 46 + largoNombre);
    p += 46 + largoNombre + largoExtra + largoComentario;
    if (nombre.endsWith('/')) continue;
    if (buffer.readUInt32LE(local) !== LOCAL) throw new Error(`la entrada ${nombre} del zip está rota`);
    const inicio = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const datos = buffer.subarray(inicio, inicio + comprimido);
    if (metodo === 0) entradas.set(nombre, Buffer.from(datos));
    else if (metodo === 8) entradas.set(nombre, zlib.inflateRawSync(datos));
    else throw new Error(`la entrada ${nombre} usa una compresión que no sé leer (${metodo})`);
  }
  return entradas;
}

module.exports = { leerZip };
