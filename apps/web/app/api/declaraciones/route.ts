import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

import type { TitularDeclaracion } from '@turenta/core';

const TAMANO_MAXIMO_BYTES = 2_000_000;

/** Lista las declaraciones del usuario (propias y de terceros). */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const declaraciones = await obtenerRepositorio().listarDeclaraciones(sesion.usuarioId);
  return NextResponse.json({ declaraciones });
}

interface CuerpoGuardar {
  anioGravable?: number;
  titular?: TitularDeclaracion;
  estado?: unknown;
}

/** Guarda (upsert por titular+año) el estado del wizard. */
export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const crudo = await request.text();
  if (crudo.length > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: 'Estado demasiado grande' }, { status: 413 });
  }
  const cuerpo = JSON.parse(crudo) as CuerpoGuardar;
  const invalido = validar(cuerpo);
  if (invalido) {
    return NextResponse.json({ error: invalido }, { status: 400 });
  }
  const { id } = await obtenerRepositorio().guardarDeclaracion(
    sesion.usuarioId,
    cuerpo.anioGravable as number,
    cuerpo.titular as TitularDeclaracion,
    cuerpo.estado as object,
  );
  return NextResponse.json({ ok: true, id });
}

function validar(cuerpo: CuerpoGuardar): string | null {
  if (!cuerpo.anioGravable || !cuerpo.estado || typeof cuerpo.estado !== 'object') {
    return 'Faltan año gravable o estado';
  }
  const titular = cuerpo.titular;
  if (!titular?.nombres || !titular.apellidos || titular.identificacion.replace(/\D/g, '').length < 5) {
    return 'La declaración necesita el titular (nombres, apellidos y cédula)';
  }
  return null;
}

/** Elimina una declaración del usuario. */
export async function DELETE(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
  }
  await obtenerRepositorio().eliminarDeclaracion(sesion.usuarioId, id);
  return NextResponse.json({ ok: true });
}
