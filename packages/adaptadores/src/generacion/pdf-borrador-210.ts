import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import type { PDFFont, PDFPage } from 'pdf-lib';

export interface DatosDeclarante {
  nombres: string;
  apellidos: string;
  identificacion: string;
  fechaVencimiento: string;
}

const ANCHO = 595;
const ALTO = 842;
const MARGEN = 48;
const INDIGO = rgb(0.31, 0.27, 0.9);
const GRIS = rgb(0.45, 0.42, 0.4);
const NEGRO = rgb(0.11, 0.09, 0.09);

interface Lienzo {
  pagina: PDFPage;
  fuente: PDFFont;
  fuenteBold: PDFFont;
  y: number;
  doc: PDFDocument;
}

/** Genera el PDF del borrador del formulario 210 con marca de agua BORRADOR. */
export async function generarPdfBorrador210(
  declarante: DatosDeclarante,
  resultado: ResultadoDeclaracion,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const fuenteBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const lienzo: Lienzo = { doc, fuente, fuenteBold, pagina: nuevaPagina(doc, fuente), y: ALTO - MARGEN };
  dibujarEncabezado(lienzo, declarante, resultado);
  dibujarResumen(lienzo, resultado);
  dibujarCasillas(lienzo, resultado);
  dibujarPieDePagina(lienzo);
  return doc.save();
}

function nuevaPagina(doc: PDFDocument, fuente: PDFFont): PDFPage {
  const pagina = doc.addPage([ANCHO, ALTO]);
  pagina.drawText('BORRADOR', {
    x: 90,
    y: 260,
    size: 96,
    font: fuente,
    color: rgb(0.93, 0.91, 0.98),
    rotate: degrees(35),
  });
  return pagina;
}

function saltarLinea(lienzo: Lienzo, alto: number): void {
  lienzo.y -= alto;
  if (lienzo.y > MARGEN + 40) {
    return;
  }
  lienzo.pagina = nuevaPagina(lienzo.doc, lienzo.fuente);
  lienzo.y = ALTO - MARGEN;
}

function texto(lienzo: Lienzo, contenido: string, opciones: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; x?: number }): void {
  lienzo.pagina.drawText(contenido, {
    x: opciones.x ?? MARGEN,
    y: lienzo.y,
    size: opciones.size ?? 10,
    font: opciones.bold ? lienzo.fuenteBold : lienzo.fuente,
    color: opciones.color ?? NEGRO,
  });
}

function filaClaveValor(lienzo: Lienzo, clave: string, valor: string, destacar = false): void {
  texto(lienzo, clave, { size: destacar ? 11 : 9.5, bold: destacar, color: destacar ? NEGRO : GRIS });
  const anchoValor = (destacar ? lienzo.fuenteBold : lienzo.fuente).widthOfTextAtSize(valor, destacar ? 11 : 9.5);
  texto(lienzo, valor, { size: destacar ? 11 : 9.5, bold: destacar, x: ANCHO - MARGEN - anchoValor });
  saltarLinea(lienzo, destacar ? 18 : 15);
}

function dibujarEncabezado(lienzo: Lienzo, declarante: DatosDeclarante, resultado: ResultadoDeclaracion): void {
  texto(lienzo, 'TuRenta AI', { size: 12, bold: true, color: INDIGO });
  saltarLinea(lienzo, 20);
  texto(lienzo, `Borrador — Declaración de Renta y Complementario AG ${String(resultado.anioGravable)}`, {
    size: 16,
    bold: true,
  });
  saltarLinea(lienzo, 16);
  texto(lienzo, 'Personas naturales y asimiladas — Formulario 210 (ilustrativo, no válido para presentar)', {
    size: 9,
    color: GRIS,
  });
  saltarLinea(lienzo, 24);
  filaClaveValor(lienzo, 'Declarante', `${declarante.nombres} ${declarante.apellidos}`.trim());
  filaClaveValor(lienzo, 'Identificación', declarante.identificacion);
  filaClaveValor(lienzo, 'Fecha límite de presentación', declarante.fechaVencimiento);
  saltarLinea(lienzo, 8);
}

function dibujarResumen(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  const l = resultado.liquidacion;
  texto(lienzo, 'Resumen de la liquidación', { size: 12, bold: true, color: INDIGO });
  saltarLinea(lienzo, 20);
  filaClaveValor(lienzo, 'Patrimonio bruto', pesos(resultado.patrimonioBruto));
  filaClaveValor(lienzo, 'Renta líquida gravable', pesos(resultado.cedulaGeneral.rentaLiquidaGravable));
  filaClaveValor(lienzo, 'Impuesto neto de renta', pesos(l.impuestoNetoRenta));
  filaClaveValor(lienzo, 'Retenciones del año', pesos(l.retenciones));
  filaClaveValor(lienzo, 'Saldo a favor de años anteriores', pesos(l.saldoFavorAnterior));
  filaClaveValor(lienzo, 'Anticipo año siguiente', pesos(l.anticipoAnioSiguiente));
  const esFavor = l.totalSaldoAFavor > 0;
  filaClaveValor(lienzo, esFavor ? 'TOTAL SALDO A FAVOR' : 'TOTAL SALDO A PAGAR', pesos(esFavor ? l.totalSaldoAFavor : l.saldoAPagar), true);
  saltarLinea(lienzo, 10);
}

function dibujarCasillas(lienzo: Lienzo, resultado: ResultadoDeclaracion): void {
  texto(lienzo, 'Casillas del formulario 210', { size: 12, bold: true, color: INDIGO });
  saltarLinea(lienzo, 20);
  const entradas = Object.entries(resultado.casillas).sort(([a], [b]) => Number(a) - Number(b));
  for (const [casilla, valor] of entradas) {
    filaClaveValor(lienzo, `Casilla ${casilla}`, pesos(valor));
  }
}

function dibujarPieDePagina(lienzo: Lienzo): void {
  saltarLinea(lienzo, 16);
  texto(lienzo, 'Documento ilustrativo generado por TuRenta AI. La declaración oficial se diligencia,', {
    size: 8,
    color: GRIS,
  });
  saltarLinea(lienzo, 11);
  texto(lienzo, 'firma y presenta por el contribuyente en el portal MUISCA de la DIAN.', { size: 8, color: GRIS });
}

function pesos(valor: number): string {
  return `$ ${valor.toLocaleString('es-CO')}`;
}
