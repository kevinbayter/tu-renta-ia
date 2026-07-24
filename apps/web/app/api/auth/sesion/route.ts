import { NextResponse } from 'next/server';

import { cerrarSesion, leerSesion } from '@/server/sesion';

export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ sesion: null }, { status: 401 });
  }
  return NextResponse.json({ sesion: { email: sesion.email } });
}

/** Cerrar sesión. */
export async function DELETE(): Promise<NextResponse> {
  await cerrarSesion();
  return NextResponse.json({ ok: true });
}
