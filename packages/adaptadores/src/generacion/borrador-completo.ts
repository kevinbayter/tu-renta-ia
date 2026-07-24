import { PDFDocument } from 'pdf-lib';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import { generarFormulario210 } from './formulario210/generar-formulario-210';
import { generarResumenElegante } from './resumen/resumen-elegante';

import type { DatosDeclarante } from './resumen/resumen-elegante';

/**
 * Borrador completo: página 1 = formulario 210 OFICIAL de la DIAN diligenciado
 * (fidelidad 100%) + resumen elegante de marca (portada, resultado, depuración,
 * guía DIAN y casillas).
 */
export async function generarBorradorCompleto(
  plantilla210: Uint8Array,
  declarante: DatosDeclarante,
  resultado: ResultadoDeclaracion,
): Promise<Uint8Array> {
  const formulario = await generarFormulario210(plantilla210, declarante, resultado);
  const resumenBytes = await generarResumenElegante(declarante, resultado);
  const resumen = await PDFDocument.load(resumenBytes);
  const paginas = await formulario.copyPages(resumen, resumen.getPageIndices());
  for (const pagina of paginas) {
    formulario.addPage(pagina);
  }
  return formulario.save();
}
