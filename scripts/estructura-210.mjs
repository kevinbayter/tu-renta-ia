/**
 * Muestra CÓMO viene el texto de un formulario 210 en PDF, con los montos
 * enmascarados. Sirve para ajustar el lector determinista sin ver tus cifras.
 *
 *   node scripts/estructura-210.mjs /ruta/a/tu-declaracion.pdf
 *
 * Los dígitos de los importes salen como X. Solo se conservan los números de
 * casilla (1-3 dígitos) y el año, que es lo que hace falta para los patrones.
 */
import { readFile } from 'node:fs/promises';

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: node scripts/estructura-210.mjs <archivo.pdf>');
  process.exit(1);
}

const { extraerTextoPdf } = await import('../packages/adaptadores/src/extraccion/pdf/extraer-texto.ts');

const { texto } = await extraerTextoPdf(new Uint8Array(await readFile(ruta)));

/** Enmascara cualquier cifra de 4 o más dígitos (los importes). */
function enmascarar(linea) {
  return linea.replace(/[\d.,]{4,}/g, (monto) => monto.replace(/\d/g, 'X'));
}

const lineas = texto
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);
const interesantes = lineas.filter((l) =>
  /(^|\s)(31|126|133|137)(\s|$)|patrimonio|impuesto neto|anticipo|saldo a favor|a[ñn]o/i.test(l),
);

console.log('=== LÍNEAS RELEVANTES (montos enmascarados) ===');
interesantes.slice(0, 40).forEach((l) => console.log(JSON.stringify(enmascarar(l))));

console.log('\n=== PRIMERAS 25 LÍNEAS DEL DOCUMENTO ===');
lineas.slice(0, 25).forEach((l) => console.log(JSON.stringify(enmascarar(l))));

console.log('\n=== TOTAL DE LÍNEAS ===', lineas.length);
