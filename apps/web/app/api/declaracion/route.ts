import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

const ANIO_GRAVABLE = 2025;
const TAMANO_MAXIMO_BYTES = 2_000_000;

/** Carga el estado guardado del wizard del usuario autenticado. */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const estado = await obtenerRepositorio().cargarDeclaracion(sesion.usuarioId, ANIO_GRAVABLE);
  return NextResponse.json({ estado });
}

/** Guarda el estado del wizard del usuario autenticado. */
export async function PUT(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const crudo = await request.text();
  if (crudo.length > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: 'Estado demasiado grande' }, { status: 413 });
  }
  const { estado } = JSON.parse(crudo) as { estado?: unknown };
  if (!estado || typeof estado !== 'object') {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }
  await obtenerRepositorio().guardarDeclaracion(sesion.usuarioId, ANIO_GRAVABLE, estado);
  return NextResponse.json({ ok: true });
}
