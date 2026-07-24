import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { cerrarSesion, leerSesion } from '@/server/sesion';

/**
 * Habeas data (Ley 1581 de 2012, derecho de supresión): elimina la cuenta
 * y TODOS los datos del usuario (declaraciones, códigos) en cascada.
 */
export async function DELETE(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  await obtenerRepositorio().eliminarUsuario(sesion.usuarioId);
  await cerrarSesion();
  return NextResponse.json({ ok: true });
}
