import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Actividad reciente del usuario (eventos reales registrados por la plataforma). */
export async function GET(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const limite = Number(new URL(request.url).searchParams.get('limite') ?? '20');
  const actividad = await obtenerRepositorio().listarActividad(sesion.usuarioId, acotar(limite));
  return NextResponse.json({ actividad });
}

function acotar(limite: number): number {
  if (!Number.isFinite(limite) || limite < 1) {
    return 20;
  }
  return Math.min(Math.trunc(limite), 100);
}
