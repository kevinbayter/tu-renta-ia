import { extraerTextoPdf, parsearExogena, renderizarPdf } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

import { completarTarea, consultarTarea, crearTarea, fallarTarea } from '@/server/documentos/tareas';

import { obtenerExtractor, obtenerRepositorio } from '@/server/composicion';
import { permitir } from '@/server/rate-limit';
import { leerSesion } from '@/server/sesion';

import type { ExtractorCertificados } from '@turenta/adaptadores';
import type { DocumentoFuente } from '@turenta/core';

export const maxDuration = 300;

/** A tax certificate or return PDF is comfortably under this; larger uploads
 * only serve to exhaust memory since the file is read whole into a buffer. */
const TAMANO_MAXIMO_BYTES = 15 * 1024 * 1024;

/**
 * Recibe el archivo y responde de inmediato con un identificador: leerlo puede
 * tardar más de lo que el proxy aguanta con la petición abierta. El resultado
 * se consulta con GET.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  // Processing runs the model (vision for the 210): cap it per user so an
  // account cannot be scripted to burn tokens or pin CPU/memory.
  if (!permitir(`documentos:${sesion.usuarioId}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Vas muy rápido, espera un momento.' }, { status: 429 });
  }
  const formData = await request.formData();
  const archivo = formData.get('archivo');
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el máximo de 15 MB' }, { status: 413 });
  }
  const contenido = new Uint8Array(await archivo.arrayBuffer());
  // Lo traído de la DIAN ya viene identificado: clasificarlo otra vez con el
  // modelo duplicaba el tiempo sin aportar nada.
  const tipoConocido = tipoValido(formData.get('tipoConocido'));
  const tareaId = crearTarea(sesion.usuarioId);
  void procesarEnSegundoPlano(sesion.usuarioId, tareaId, archivo.name, contenido, tipoConocido);
  return NextResponse.json({ tareaId }, { status: 202 });
}

/** Consulta del resultado. El cliente pregunta hasta que deja de estar en curso. */
export async function GET(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('tarea') ?? '';
  const tarea = consultarTarea(id, sesion.usuarioId);
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
  usuarioId: string,
  tareaId: string,
  nombre: string,
  contenido: Uint8Array,
  tipoConocido: TipoConocido | null,
): Promise<void> {
  try {
    const cuerpo = await procesarArchivo(nombre, contenido, tipoConocido);
    await registrarProcesado(usuarioId, nombre, cuerpo);
    completarTarea(tareaId, cuerpo);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error procesando el documento';
    console.error(`[documentos] fallo leyendo "${nombre}" (tarea ${tareaId}): ${mensaje}`);
    fallarTarea(tareaId, mensaje);
  }
}

/** Deja huella en la actividad del usuario; nunca rompe el flujo. */
async function registrarProcesado(usuarioId: string, nombreArchivo: string, cuerpo: unknown): Promise<void> {
  const tipo = (cuerpo as { tipo?: string }).tipo ?? 'otro';
  const evento =
    tipo === 'exogena'
      ? { tipo: 'exogena_importada', descripcion: `Información exógena importada — ${nombreArchivo}` }
      : { tipo: 'documento_procesado', descripcion: `Documento procesado (${tipo}) — ${nombreArchivo}` };
  await obtenerRepositorio()
    .registrarActividad(usuarioId, evento)
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
  const { texto, esEscaneado, totalPaginas } = await extraerTextoPdf(contenido);
  if (esEscaneado) {
    throw new Error('Este PDF parece escaneado. Por ahora solo soportamos PDFs con texto (visión llega pronto).');
  }
  const doc = await conVision(contenido, texto, totalPaginas, tipoConocido);
  return extraerCertificado(obtenerExtractor(), doc, tipoConocido);
}

/**
 * El 210 se lee muchísimo mejor viendo la página: su texto plano llega con las
 * etiquetas separadas de las cifras y el modelo tenía que rehacer el formulario
 * de cabeza. Medido contra una declaración real: de minutos a segundos.
 */
async function conVision(
  contenido: Uint8Array,
  texto: string,
  totalPaginas: number,
  tipoConocido: TipoConocido | null,
): Promise<DocumentoFuente> {
  if (tipoConocido !== 'declaracion_anterior') {
    return { texto };
  }
  const imagenesBase64 = await renderizarPdf(contenido, totalPaginas);
  if (imagenesBase64.length === 0) {
    // Sin imagen no se puede leer bien este formulario: mejor decirlo que
    // devolver ceros que parecen datos.
    throw new Error('No pudimos convertir tu declaración a imagen para leerla. Súbela como PDF de nuevo.');
  }
  // Con la imagen delante, el texto plano de este formulario es ruido: llega
  // aplanado y con las cifras fuera de sus casillas, y contamina la lectura.
  return { texto: 'Formulario 210 adjunto como imagen.', imagenesBase64 };
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
