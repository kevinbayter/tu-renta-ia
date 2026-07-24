import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import type { ResultadoDeclaracion } from '@turenta/motor-fiscal';

import { CASILLAS_210, ENCABEZADO_210, FUENTE_VALORES } from './coordenadas-ag2025';

import type { PDFFont, PDFPage } from 'pdf-lib';

export interface Declarante210 {
  nombres: string;
  apellidos: string;
  identificacion: string;
}

const TINTA = rgb(0.13, 0.13, 0.13);
const VERDE = rgb(0.19, 0.65, 0.36);

/**
 * Llena la plantilla OFICIAL del formulario 210 (DIAN) con los valores calculados.
 * Fidelidad 100%: la página base ES el formulario oficial; solo se dibujan encima
 * los valores dinámicos y la marca BORRADOR (como hace la industria).
 */
export async function generarFormulario210(
  plantilla: Uint8Array,
  declarante: Declarante210,
  resultado: ResultadoDeclaracion,
): Promise<PDFDocument> {
  const doc = await PDFDocument.load(plantilla);
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const fuenteBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pagina = doc.getPage(0);
  dibujarMontos(pagina, fuente, resultado.casillas);
  dibujarEncabezado(pagina, fuente, declarante, resultado.anioGravable);
  dibujarMarcaBorrador(pagina, fuenteBold);
  return doc;
}

function dibujarMontos(pagina: PDFPage, fuente: PDFFont, casillas: Record<string, number>): void {
  for (const [casilla, posicion] of Object.entries(CASILLAS_210)) {
    // Fidelidad DIAN: las casillas sin valor calculado se muestran en 0, como en el formulario real.
    const valor = casillas[casilla] ?? 0;
    const texto = formatearMonto(valor);
    const ancho = fuente.widthOfTextAtSize(texto, FUENTE_VALORES);
    pagina.drawText(texto, {
      x: posicion.xDerecha - ancho,
      y: posicion.y,
      size: FUENTE_VALORES,
      font: fuente,
      color: TINTA,
    });
  }
}

function dibujarEncabezado(
  pagina: PDFPage,
  fuente: PDFFont,
  declarante: Declarante210,
  anioGravable: number,
): void {
  dibujarDigitos(pagina, fuente, String(anioGravable).split(''), ENCABEZADO_210.anio.xs, ENCABEZADO_210.anio.y);
  dibujarNit(pagina, fuente, declarante.identificacion);
  dibujarNombres(pagina, fuente, declarante);
  dibujarSecuencia(pagina, fuente, '0010', ENCABEZADO_210.actividadEconomica);
}

function dibujarNit(pagina: PDFPage, fuente: PDFFont, identificacion: string): void {
  const digitos = identificacion.replace(/\D/g, '').slice(0, ENCABEZADO_210.nit.digitos).split('');
  const xs = digitos.map((_, i) => ENCABEZADO_210.nit.xInicio + i * ENCABEZADO_210.nit.paso);
  dibujarDigitos(pagina, fuente, digitos, xs, ENCABEZADO_210.nit.y);
  const dv = calcularDigitoVerificacion(identificacion);
  pagina.drawText(dv, { x: ENCABEZADO_210.dv.x, y: ENCABEZADO_210.dv.y, size: FUENTE_VALORES, font: fuente, color: TINTA });
}

function dibujarNombres(pagina: PDFPage, fuente: PDFFont, declarante: Declarante210): void {
  const [primerApellido, ...restoApellidos] = declarante.apellidos.trim().toUpperCase().split(/\s+/);
  const [primerNombre, ...restoNombres] = declarante.nombres.trim().toUpperCase().split(/\s+/);
  const campos: [string | undefined, { x: number; y: number }][] = [
    [primerApellido, ENCABEZADO_210.primerApellido],
    [restoApellidos.join(' ') || undefined, ENCABEZADO_210.segundoApellido],
    [primerNombre, ENCABEZADO_210.primerNombre],
    [restoNombres.join(' ') || undefined, ENCABEZADO_210.otrosNombres],
  ];
  campos
    .filter((campo): campo is [string, { x: number; y: number }] => Boolean(campo[0]))
    .forEach(([texto, posicion]) => {
      pagina.drawText(texto, { x: posicion.x, y: posicion.y, size: FUENTE_VALORES, font: fuente, color: TINTA });
    });
}

function dibujarSecuencia(
  pagina: PDFPage,
  fuente: PDFFont,
  valor: string,
  config: { y: number; xInicio: number; paso: number; digitos: number },
): void {
  const digitos = valor.slice(0, config.digitos).split('');
  const xs = digitos.map((_, i) => config.xInicio + i * config.paso);
  dibujarDigitos(pagina, fuente, digitos, xs, config.y);
}

function dibujarDigitos(pagina: PDFPage, fuente: PDFFont, digitos: string[], xs: number[], y: number): void {
  digitos.forEach((digito, i) => {
    const x = xs[i];
    if (x !== undefined) {
      pagina.drawText(digito, { x, y, size: FUENTE_VALORES, font: fuente, color: TINTA });
    }
  });
}

function dibujarMarcaBorrador(pagina: PDFPage, fuenteBold: PDFFont): void {
  // En el "Espacio reservado para la DIAN" (queda en blanco en la plantilla limpia)
  pagina.drawText('BORRADOR ILUSTRATIVO DE CÓMO', { x: 66, y: 680, size: 17, font: fuenteBold, color: VERDE });
  pagina.drawText('QUEDARÍA LA DECLARACIÓN', { x: 66, y: 658, size: 17, font: fuenteBold, color: VERDE });
  pagina.drawText('Generado por TuRenta AI — no válido para presentar ante la DIAN', {
    x: 66,
    y: 642,
    size: 7.5,
    font: fuenteBold,
    color: VERDE,
  });
}

function formatearMonto(valor: number): string {
  return Math.round(valor).toLocaleString('en-US');
}

/** Dígito de verificación DIAN (algoritmo oficial de pesos módulo 11). */
export function calcularDigitoVerificacion(identificacion: string): string {
  const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digitos = identificacion.replace(/\D/g, '');
  let suma = 0;
  for (let i = 0; i < digitos.length; i += 1) {
    const digito = Number(digitos[digitos.length - 1 - i]);
    suma += digito * (PESOS[i] ?? 0);
  }
  const residuo = suma % 11;
  return String(residuo > 1 ? 11 - residuo : residuo);
}
