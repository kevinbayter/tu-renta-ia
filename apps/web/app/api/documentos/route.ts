import { extraerTextoPdf, parsearExogena } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

import { obtenerExtractor, obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

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
    await registrarProcesado(archivo.name, cuerpo);
    return NextResponse.json(cuerpo);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error procesando el documento';
    return NextResponse.json({ error: mensaje }, { status: 422 });
  }
}

/** Deja huella en la actividad del usuario (si hay sesión); nunca rompe el flujo. */
async function registrarProcesado(nombreArchivo: string, cuerpo: unknown): Promise<void> {
  const sesion = await leerSesion().catch(() => null);
  if (!sesion) {
    return;
  }
  const tipo = (cuerpo as { tipo?: string }).tipo ?? 'otro';
  const evento =
    tipo === 'exogena'
      ? { tipo: 'exogena_importada', descripcion: `Información exógena importada — ${nombreArchivo}` }
      : { tipo: 'documento_procesado', descripcion: `Documento procesado (${tipo}) — ${nombreArchivo}` };
  await obtenerRepositorio()
    .registrarActividad(sesion.usuarioId, evento)
    .catch(() => null);
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
    case 'declaracion_anterior':
      return { tipo, ...(await extractor.extraerDeclaracionAnterior(doc)) };
    case 'exogena':
      throw new Error('Este documento parece la exógena: súbela como el archivo Excel descargado de la DIAN.');
    case 'otro':
      return { tipo: 'otro' };
  }
}

function esExcel(nombre: string): boolean {
  return /\.(xlsx|xls)$/i.test(nombre);
}
