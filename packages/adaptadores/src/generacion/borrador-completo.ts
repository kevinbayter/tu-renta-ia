import { PDFDocument } from 'pdf-lib';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import { generarFormulario210 } from './formulario210/generar-formulario-210';
import { generarPdfBorrador210 } from './pdf-borrador-210';

import type { DatosDeclarante } from './pdf-borrador-210';

/**
 * Borrador completo: página 1 = formulario 210 OFICIAL de la DIAN diligenciado
 * (fidelidad 100%) + páginas de resumen legible con fecha límite y casillas.
 */
export async function generarBorradorCompleto(
  plantilla210: Uint8Array,
  declarante: DatosDeclarante,
  resultado: ResultadoDeclaracion,
): Promise<Uint8Array> {
  const formulario = await generarFormulario210(plantilla210, declarante, resultado);
  const resumenBytes = await generarPdfBorrador210(declarante, resultado);
  const resumen = await PDFDocument.load(resumenBytes);
  const paginas = await formulario.copyPages(resumen, resumen.getPageIndices());
  for (const pagina of paginas) {
    formulario.addPage(pagina);
  }
  return formulario.save();
}
