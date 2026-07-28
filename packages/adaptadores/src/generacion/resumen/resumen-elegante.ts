import { PDFDocument, StandardFonts } from 'pdf-lib';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import {
  paginaCasillas,
  paginaDepuracion,
  paginaGuia,
  paginaPortada,
  paginaResultado,
} from './secciones';

import type { Lienzo } from './estilo';
import type { DatosDeclarante } from './secciones';

export type { DatosDeclarante } from './secciones';

/**
 * Resumen elegante de marca (estilo TuRenta AI, con un resumen de nivel profesional):
 * portada navy, resultado con desglose, depuración por cédulas, guía DIAN y casillas.
 */
export async function generarResumenElegante(
  declarante: DatosDeclarante,
  resultado: ResultadoDeclaracion,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fuentes = {
    normal: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const lienzo: Lienzo = { doc, fuentes, pagina: doc.addPage(), y: 0 };
  doc.removePage(0);
  paginaPortada(lienzo, declarante, resultado);
  paginaResultado(lienzo, resultado);
  paginaDepuracion(lienzo, resultado);
  paginaGuia(lienzo, declarante, resultado);
  paginaCasillas(lienzo, resultado);
  return doc.save();
}
