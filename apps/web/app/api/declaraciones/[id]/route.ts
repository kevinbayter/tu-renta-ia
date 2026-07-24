import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Carga el estado completo de una declaración del usuario. */
export async function GET(
  _request: Request,
  contexto: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const { id } = await contexto.params;
  const estado = await obtenerRepositorio().cargarDeclaracion(sesion.usuarioId, id);
  if (!estado) {
    return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ estado });
}
