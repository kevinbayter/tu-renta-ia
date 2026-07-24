import { rgb } from 'pdf-lib';

import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';

/** Sistema de estilo del resumen (identidad TuRenta AI: verde esmeralda + navy). */

export const COLOR = {
  navy: rgb(0.043, 0.102, 0.18),
  navySuave: rgb(0.078, 0.153, 0.247),
  verde: rgb(0.086, 0.639, 0.29),
  verdeClaro: rgb(0.133, 0.773, 0.369),
  verdeSuave: rgb(0.925, 0.992, 0.953),
  ambar: rgb(0.706, 0.325, 0.035),
  ambarSuave: rgb(1, 0.984, 0.922),
  tinta: rgb(0.059, 0.09, 0.165),
  gris: rgb(0.392, 0.455, 0.545),
  zebra: rgb(0.973, 0.98, 0.988),
  borde: rgb(0.898, 0.918, 0.941),
  blanco: rgb(1, 1, 1),
};

export const ANCHO = 612;
export const ALTO = 792;
export const MARGEN = 52;

export interface Fuentes {
  normal: PDFFont;
  bold: PDFFont;
}

export interface Lienzo {
  doc: PDFDocument;
  pagina: PDFPage;
  fuentes: Fuentes;
  y: number;
}

/** Rectángulo con esquinas redondeadas (pdf-lib no lo trae nativo). */
export function rectanguloRedondeado(
  pagina: PDFPage,
  opciones: { x: number; y: number; ancho: number; alto: number; radio: number; color: RGB; opacidad?: number },
): void {
  const { x, y, ancho: w, alto: h, radio: r } = opciones;
  const ruta = `M ${String(r)} 0 H ${String(w - r)} Q ${String(w)} 0 ${String(w)} ${String(r)} V ${String(h - r)} Q ${String(w)} ${String(h)} ${String(w - r)} ${String(h)} H ${String(r)} Q 0 ${String(h)} 0 ${String(h - r)} V ${String(r)} Q 0 0 ${String(r)} 0 Z`;
  pagina.drawSvgPath(ruta, { x, y: y + h, color: opciones.color, opacity: opciones.opacidad ?? 1 });
}

/** Logo de marca: cuadrado verde redondeado con chulo blanco + texto. */
export function dibujarLogo(pagina: PDFPage, fuentes: Fuentes, x: number, y: number, claro: boolean): void {
  rectanguloRedondeado(pagina, { x, y, ancho: 14, alto: 14, radio: 4, color: COLOR.verde });
  pagina.drawLine({ start: { x: x + 3.5, y: y + 6.5 }, end: { x: x + 6, y: y + 4 }, thickness: 1.8, color: COLOR.blanco });
  pagina.drawLine({ start: { x: x + 6, y: y + 4 }, end: { x: x + 10.5, y: y + 10 }, thickness: 1.8, color: COLOR.blanco });
  pagina.drawText('TuRenta', { x: x + 19, y: y + 3, size: 11, font: fuentes.bold, color: claro ? COLOR.blanco : COLOR.tinta });
  pagina.drawText('AI', { x: x + 63, y: y + 3, size: 11, font: fuentes.bold, color: COLOR.verdeClaro });
}

/** Página nueva con encabezado y pie de marca. Devuelve el lienzo posicionado. */
export function nuevaPaginaConMarco(lienzo: Lienzo, subtitulo: string): void {
  lienzo.pagina = lienzo.doc.addPage([ANCHO, ALTO]);
  lienzo.pagina.drawRectangle({ x: 0, y: ALTO - 44, width: ANCHO, height: 44, color: COLOR.navy });
  dibujarLogo(lienzo.pagina, lienzo.fuentes, MARGEN, ALTO - 30, true);
  const anchoSub = lienzo.fuentes.normal.widthOfTextAtSize(subtitulo, 8);
  lienzo.pagina.drawText(subtitulo, { x: ANCHO - MARGEN - anchoSub, y: ALTO - 28, size: 8, font: lienzo.fuentes.normal, color: COLOR.blanco });
  dibujarPie(lienzo);
  lienzo.y = ALTO - 82;
}

function dibujarPie(lienzo: Lienzo): void {
  const numero = `Página ${String(lienzo.doc.getPageCount() + 1)}`; // +1: el formulario 210 va adelante
  const texto = `Borrador ilustrativo · No válido para presentar ante la DIAN · ${numero}`;
  lienzo.pagina.drawText(texto, { x: MARGEN, y: 26, size: 7, font: lienzo.fuentes.normal, color: COLOR.gris });
}

/** Título de sección con barra verde de acento. */
export function tituloSeccion(lienzo: Lienzo, titulo: string): void {
  lienzo.pagina.drawRectangle({ x: MARGEN, y: lienzo.y - 2, width: 22, height: 3.5, color: COLOR.verde });
  lienzo.y -= 16;
  lienzo.pagina.drawText(titulo, { x: MARGEN, y: lienzo.y, size: 15, font: lienzo.fuentes.bold, color: COLOR.tinta });
  lienzo.y -= 20;
}

/** Fila clave/valor con zebra dentro de una tabla. */
export function filaTabla(
  lienzo: Lienzo,
  clave: string,
  valor: string,
  opciones: { indice: number; destacar?: boolean; sangria?: number },
): void {
  const altoFila = opciones.destacar ? 20 : 16;
  if (opciones.indice % 2 === 1 && !opciones.destacar) {
    lienzo.pagina.drawRectangle({ x: MARGEN, y: lienzo.y - 4, width: ANCHO - 2 * MARGEN, height: altoFila - 2, color: COLOR.zebra });
  }
  if (opciones.destacar) {
    lienzo.pagina.drawRectangle({ x: MARGEN, y: lienzo.y - 5, width: ANCHO - 2 * MARGEN, height: altoFila - 2, color: COLOR.verdeSuave });
  }
  const fuente = opciones.destacar ? lienzo.fuentes.bold : lienzo.fuentes.normal;
  const tam = opciones.destacar ? 10 : 9;
  lienzo.pagina.drawText(clave, { x: MARGEN + 8 + (opciones.sangria ?? 0), y: lienzo.y, size: tam, font: fuente, color: opciones.destacar ? COLOR.tinta : COLOR.gris });
  const anchoValor = fuente.widthOfTextAtSize(valor, tam);
  lienzo.pagina.drawText(valor, { x: ANCHO - MARGEN - 8 - anchoValor, y: lienzo.y, size: tam, font: fuente, color: opciones.destacar ? COLOR.verde : COLOR.tinta });
  lienzo.y -= altoFila;
}

export function espacio(lienzo: Lienzo, alto: number): void {
  lienzo.y -= alto;
}

export function pesos(valor: number): string {
  if (valor === 0) {
    return '$ 0';
  }
  const signo = valor < 0 ? '- ' : '';
  return `${signo}$ ${Math.abs(valor).toLocaleString('es-CO')}`;
}

export function textoCentrado(pagina: PDFPage, texto: string, y: number, fuente: PDFFont, tam: number, color: RGB): void {
  const ancho = fuente.widthOfTextAtSize(texto, tam);
  pagina.drawText(texto, { x: (ANCHO - ancho) / 2, y, size: tam, font: fuente, color });
}
