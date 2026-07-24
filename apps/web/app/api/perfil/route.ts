import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Perfil del usuario autenticado (nombres, apellidos, cédula). */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const perfil = await obtenerRepositorio().obtenerPerfil(sesion.usuarioId);
  return NextResponse.json({ perfil, email: sesion.email });
}

export async function PUT(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const cuerpo = (await request.json()) as { nombres?: string; apellidos?: string; identificacion?: string };
  const nombres = (cuerpo.nombres ?? '').trim();
  const apellidos = (cuerpo.apellidos ?? '').trim();
  const identificacion = (cuerpo.identificacion ?? '').replace(/\D/g, '');
  if (!nombres || !apellidos || identificacion.length < 5) {
    return NextResponse.json({ error: 'Completa nombres, apellidos y una cédula válida' }, { status: 400 });
  }
  await obtenerRepositorio().actualizarPerfil(sesion.usuarioId, { nombres, apellidos, identificacion });
  return NextResponse.json({ ok: true });
}
