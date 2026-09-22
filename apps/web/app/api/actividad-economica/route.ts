import { extraerValidado } from '@turenta/core';
import {
  ACTIVIDADES_ECONOMICAS_DIAN,
  actividadSugeridaSchema,
  jsonSchemaActividadSugerida,
  nombreActividadEconomica,
} from '@turenta/shared';
import { NextResponse } from 'next/server';

import { obtenerLlm } from '@/server/composicion';
import { permitir } from '@/server/rate-limit';
import { leerSesion } from '@/server/sesion';

export const maxDuration = 60;

const CATALOGO = ACTIVIDADES_ECONOMICAS_DIAN.map(([codigo, nombre]) => `${codigo} ${nombre}`).join('\n');

/**
 * Casilla 24 cuando los ingresos no bastan para deducirla (independientes,
 * otras rentas): la IA elige del catálogo oficial con lo que el usuario contó.
 * Es una sugerencia preseleccionada; el usuario la confirma o la cambia.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  if (!permitir(`actividad:${sesion.usuarioId}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Vas muy rápido, espera un momento.' }, { status: 429 });
  }
  const cuerpo = (await request.json().catch(() => ({}))) as { contexto?: string };
  const contexto = (cuerpo.contexto ?? '').slice(0, 12_000);
  try {
    const sugerida = await extraerValidado(obtenerLlm(), entrada(contexto), actividadSugeridaSchema);
    const nombre = nombreActividadEconomica(sugerida.codigo);
    return nombre
      ? NextResponse.json({ codigo: sugerida.codigo, nombre, razon: sugerida.razon })
      : NextResponse.json({ error: 'La sugerencia no está en el catálogo de la DIAN' }, { status: 422 });
  } catch {
    return NextResponse.json({ error: 'No pudimos sugerir la actividad' }, { status: 502 });
  }
}

function entrada(contexto: string) {
  return {
    system: `Eres un asistente tributario colombiano. Elige el código de la casilla 24 del formulario 210 de la DIAN: la actividad económica que le generó MÁS ingresos a la persona en el año.
Reglas: asalariado = 0010; pensionado = 0020; rentista de capital (arriendos, intereses) = 0090; si trabaja por su cuenta (honorarios, servicios, ventas) elige el código CIIU más específico del catálogo según lo que describe. Responde SOLO con un código que exista en este catálogo y una razón de una frase.
CATÁLOGO (código nombre):
${CATALOGO}`,
    user: contexto || 'Sin información adicional.',
    jsonSchema: jsonSchemaActividadSugerida as unknown as Record<string, unknown>,
    esfuerzo: 'low' as const,
  };
}
