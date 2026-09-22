/**
 * Verificar contra el PDF del borrador, que es EXACTAMENTE lo que se va a
 * firmar. Es más rápido que recorrer las 15 secciones y más fuerte como
 * prueba: mira el documento, no una pantalla intermedia del portal.
 *
 * Si el PDF no se puede leer o alguna cifra no aparece, no se firma: se vuelve
 * al formulario y se recorre completo.
 */

import { extractText, getDocumentProxy } from 'unpdf';

import { pulsarAccion } from './entrada-editor-210';

import type { Page } from 'playwright';

export type Veredicto = 'coincide' | 'difiere' | 'sin_pdf';

const VER_BORRADOR = /^\s*Ver borrador\s*$/;
const ESPERA_PDF_MS = 20_000;

/** Cifras que definen la declaración: si estas cuadran, el documento es el nuestro. */
const CLAVES = ['29', '31', '58', '61', '91', '97', '99', '101', '111', '136', '137'] as const;

export async function verificarBorradorEnPdf(
  editor: Page,
  casillas: Record<string, number>,
  esperaMs: number,
): Promise<Veredicto> {
  const texto = await textoDelBorrador(editor, esperaMs);
  if (texto === '') {
    return 'sin_pdf';
  }
  const numeros = new Set(texto.replace(/[.,]/g, '').match(/\d+/g) ?? []);
  const esperadas = CLAVES.map((casilla) => casillas[casilla] ?? 0).filter((valor) => valor > 0);
  const faltantes = esperadas.filter((valor) => !numeros.has(String(valor)));
  return faltantes.length === 0 ? 'coincide' : 'difiere';
}

/** "Ver borrador" abre el PDF en otra pestaña o lo descarga: se aceptan ambas. */
async function textoDelBorrador(editor: Page, esperaMs: number): Promise<string> {
  const descarga = editor.waitForEvent('download', { timeout: ESPERA_PDF_MS }).catch(() => null);
  const pestana = editor.context().waitForEvent('page', { timeout: ESPERA_PDF_MS }).catch(() => null);
  if (!(await pulsarAccion(editor, VER_BORRADOR, esperaMs))) {
    return '';
  }
  const archivo = await descarga;
  const ruta = archivo ? await archivo.path() : null;
  const datos = ruta ? await leerArchivo(ruta) : await descargarDesdeLaPestana(editor, await pestana);
  return datos ? extraerTexto(datos) : '';
}

async function descargarDesdeLaPestana(editor: Page, pagina: Page | null): Promise<Uint8Array | null> {
  if (!pagina) {
    return null;
  }
  await pagina.waitForLoadState('domcontentloaded').catch(() => null);
  const url = pagina.url();
  if (!url.startsWith('http')) {
    return null;
  }
  const respuesta = await editor.context().request.get(url).catch(() => null);
  const cuerpo = respuesta ? await respuesta.body().catch(() => null) : null;
  return cuerpo ? new Uint8Array(cuerpo) : null;
}

async function leerArchivo(ruta: string): Promise<Uint8Array | null> {
  const { readFile } = await import('node:fs/promises');
  return readFile(ruta)
    .then((datos) => new Uint8Array(datos))
    .catch(() => null);
}

async function extraerTexto(datos: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(datos).catch(() => null);
  if (!pdf) {
    return '';
  }
  const extraido = await extractText(pdf, { mergePages: true }).catch(() => null);
  const texto = extraido?.text ?? '';
  return Array.isArray(texto) ? texto.join(' ') : texto;
}
