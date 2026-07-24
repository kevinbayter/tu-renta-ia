import { extraerTextoPdf, parsearExogena } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

import { obtenerExtractor } from '@/server/composicion';

import type { ExtractorCertificados } from '@turenta/adaptadores';
import type { DocumentoFuente } from '@turenta/core';

export const maxDuration = 300;

/** Recibe un archivo (XLSX de exógena o PDF de certificado), lo clasifica y extrae sus datos. */
export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  }
  try {
    const contenido = new Uint8Array(await archivo.arrayBuffer());
    const cuerpo = await procesarArchivo(archivo.name, contenido);
    return NextResponse.json(cuerpo);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error procesando el documento';
    return NextResponse.json({ error: mensaje }, { status: 422 });
  }
}

async function procesarArchivo(nombre: string, contenido: Uint8Array): Promise<unknown> {
  if (esExcel(nombre)) {
    return { tipo: 'exogena', exogena: parsearExogena(contenido) };
  }
  const { texto, esEscaneado } = await extraerTextoPdf(contenido);
  if (esEscaneado) {
    throw new Error('Este PDF parece escaneado. Por ahora solo soportamos PDFs con texto (visión llega pronto).');
  }
  return extraerCertificado(obtenerExtractor(), { texto });
}

async function extraerCertificado(extractor: ExtractorCertificados, doc: DocumentoFuente): Promise<unknown> {
  const tipo = await extractor.clasificar(doc);
  switch (tipo) {
    case 'certificado_220':
      return { tipo, ...(await extractor.extraer220(doc)) };
    case 'certificado_bancario':
      return { tipo, ...(await extractor.extraerBancario(doc)) };
    case 'medicina_prepagada':
      return { tipo, ...(await extractor.extraerPrepagada(doc)) };
    case 'exogena':
      throw new Error('Este documento parece la exógena: súbela como el archivo Excel descargado de la DIAN.');
    case 'otro':
      return { tipo: 'otro' };
  }
}

function esExcel(nombre: string): boolean {
  return /\.(xlsx|xls)$/i.test(nombre);
}
