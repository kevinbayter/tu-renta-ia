import { NextResponse } from 'next/server';

import { obtenerBovedaDian } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Qué accesos tiene guardados el usuario. Nunca devuelve el sobre cifrado. */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ accesos: [] }, { status: 401 });
  }
  const accesos = await obtenerBovedaDian()
    .listar(sesion.usuarioId)
    .catch(() => []);
  const salida = NextResponse.json({ accesos });
  salida.headers.set('Cache-Control', 'no-store');
  return salida;
}

/** Revocar: el acceso guardado desaparece de inmediato. */
export async function DELETE(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ mensaje: 'Debes iniciar sesión' }, { status: 401 });
  }
  const titular = new URL(request.url).searchParams.get('titular') ?? '';
  const borrado = await obtenerBovedaDian()
    .olvidar(sesion.usuarioId, titular.replace(/\D/g, ''))
    .catch(() => false);
  return NextResponse.json({ borrado });
}
