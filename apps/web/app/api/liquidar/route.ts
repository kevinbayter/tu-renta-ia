import { construirPerfilFiscal } from '@turenta/core';
import { liquidarDeclaracion } from '@turenta/motor-fiscal';
import { NextResponse } from 'next/server';

import type { InsumosPerfil } from '@turenta/core';

/** Liquida la declaración con el motor determinista. El LLM no participa aquí. */
export async function POST(request: Request): Promise<NextResponse> {
  const insumos = (await request.json()) as InsumosPerfil;
  try {
    const perfil = construirPerfilFiscal(insumos);
    const resultado = liquidarDeclaracion(perfil);
    return NextResponse.json({ perfil, resultado });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error liquidando la declaración';
    return NextResponse.json({ error: mensaje }, { status: 422 });
  }
}
