import { evaluarDeclaracion } from '@turenta/core';
import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

/** Evaluación determinista (recomendaciones + confiabilidad) de una declaración guardada. */
export async function GET(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const declaracionId = new URL(request.url).searchParams.get('declaracionId');
  if (!declaracionId) {
    return NextResponse.json({ error: 'Falta declaracionId' }, { status: 400 });
  }
  const estado = await obtenerRepositorio().cargarDeclaracion(sesion.usuarioId, declaracionId);
  if (!estado) {
    return NextResponse.json({ error: 'Declaración no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ evaluacion: evaluarDeclaracion(estado) });
}
