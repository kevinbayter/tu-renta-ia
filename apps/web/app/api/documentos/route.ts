import { extraerTextoPdf, parsearExogena } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

import { completarTarea, consultarTarea, crearTarea, fallarTarea } from '@/server/documentos/tareas';

import { obtenerExtractor, obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

import type { ExtractorCertificados } from '@turenta/adaptadores';
import type { DocumentoFuente } from '@turenta/core';

export const maxDuration = 300;

/**
 * Recibe el archivo y responde de inmediato con un identificador: leerlo puede
 * tardar más de lo que el proxy aguanta con la petición abierta. El resultado
 * se consulta con GET.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  }
  const contenido = new Uint8Array(await archivo.arrayBuffer());
  // Lo traído de la DIAN ya viene identificado: clasificarlo otra vez con el
  // modelo duplicaba el tiempo sin aportar nada.
  const tipoConocido = tipoValido(formData.get('tipoConocido'));
  const tareaId = crearTarea();
  void procesarEnSegundoPlano(tareaId, archivo.name, contenido, tipoConocido);
  return NextResponse.json({ tareaId }, { status: 202 });
}

/** Consulta del resultado. El cliente pregunta hasta que deja de estar en curso. */
export function GET(request: Request): NextResponse {
  const id = new URL(request.url).searchParams.get('tarea') ?? '';
  const tarea = consultarTarea(id);
  if (!tarea) {
    return NextResponse.json({ error: 'La lectura del documento caducó' }, { status: 404 });
  }
  if (tarea.estado === 'en_curso') {
    return NextResponse.json({ estado: 'en_curso' });
  }
  if (tarea.estado === 'error') {
    return NextResponse.json({ error: tarea.error }, { status: 422 });
  }
  return NextResponse.json(tarea.resultado);
}

async function procesarEnSegundoPlano(
  tareaId: string,
  nombre: string,
  contenido: Uint8Array,
  tipoConocido: TipoConocido | null,
): Promise<void> {
  try {
    const cuerpo = await procesarArchivo(nombre, contenido, tipoConocido);
    await registrarProcesado(nombre, cuerpo);
    completarTarea(tareaId, cuerpo);
  } catch (error) {
    fallarTarea(tareaId, error instanceof Error ? error.message : 'Error procesando el documento');
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

/** Tipos cuyo origen ya los identifica sin ambigüedad. */
const TIPOS_CONOCIDOS = ['declaracion_anterior'] as const;

function tipoValido(valor: FormDataEntryValue | null): TipoConocido | null {
  const texto = typeof valor === 'string' ? valor : '';
  return TIPOS_CONOCIDOS.includes(texto as TipoConocido) ? (texto as TipoConocido) : null;
}

type TipoConocido = (typeof TIPOS_CONOCIDOS)[number];

async function procesarArchivo(
  nombre: string,
  contenido: Uint8Array,
  tipoConocido: TipoConocido | null,
): Promise<unknown> {
  if (esExcel(nombre)) {
    return { tipo: 'exogena', exogena: parsearExogena(contenido) };
  }
  const { texto, esEscaneado } = await extraerTextoPdf(contenido);
  if (esEscaneado) {
    throw new Error('Este PDF parece escaneado. Por ahora solo soportamos PDFs con texto (visión llega pronto).');
  }
  return extraerCertificado(obtenerExtractor(), { texto }, tipoConocido);
}

async function extraerCertificado(
  extractor: ExtractorCertificados,
  doc: DocumentoFuente,
  tipoConocido: TipoConocido | null,
): Promise<unknown> {
  const tipo = tipoConocido ?? (await extractor.clasificar(doc));
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
