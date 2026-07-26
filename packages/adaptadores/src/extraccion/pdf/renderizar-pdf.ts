/**
 * Renders PDF pages to images so the model can read them with vision.
 *
 * Forms like the DIAN 210 extract as a single flattened line where labels and
 * figures end up apart, which forces the model to rebuild the layout in its
 * head — slow and error-prone. Seeing the page, every figure is already in its
 * box. Measured against a real return: minutes down to seconds.
 */

import { renderPageAsImage } from 'unpdf';

/** Enough to read printed digits without inflating the payload. */
const ESCALA = 2;
const MAXIMO_PAGINAS = 3;

const canvasImport = () => import('@napi-rs/canvas');

async function renderizarPagina(contenido: Uint8Array, pagina: number): Promise<string | null> {
  const imagen = await renderPageAsImage(contenido, pagina, { scale: ESCALA, canvasImport }).catch(
    () => null,
  );
  return imagen ? Buffer.from(imagen).toString('base64') : null;
}

/**
 * Returns the pages as base64 PNG, or an empty array if rendering is not
 * possible: the caller then falls back to plain text rather than failing.
 */
export async function renderizarPdf(contenido: Uint8Array, totalPaginas: number): Promise<string[]> {
  const cuantas = Math.min(totalPaginas, MAXIMO_PAGINAS);
  const paginas = Array.from({ length: cuantas }, (_, i) => i + 1);
  const imagenes = await Promise.all(paginas.map((n) => renderizarPagina(contenido, n)));
  return imagenes.filter((i): i is string => i !== null);
}
