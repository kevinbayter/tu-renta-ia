import { normalizarPreferencias } from '@turenta/core';
import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Preferencias del usuario: widgets del panel y correos de vencimiento. */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const crudas = await obtenerRepositorio().obtenerPreferencias(sesion.usuarioId);
  return NextResponse.json({ preferencias: normalizarPreferencias(crudas) });
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const cuerpo = (await request.json()) as unknown;
  const preferencias = normalizarPreferencias(cuerpo);
  await obtenerRepositorio().guardarPreferencias(sesion.usuarioId, preferencias as unknown as Record<string, unknown>);
  return NextResponse.json({ ok: true, preferencias });
}
