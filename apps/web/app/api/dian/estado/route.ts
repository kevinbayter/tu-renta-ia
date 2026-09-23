import { conexionDianHabilitada, variablesFaltantesDian } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

/**
 * Lets the UI hide the connect flow instead of asking for a password in vain.
 * Fuera de producción dice además qué variables faltan: en producción ocultar
 * es lo correcto, pero en desarrollo el botón desaparecía sin dejar pista.
 */
export function GET(): NextResponse {
  const habilitada = conexionDianHabilitada(process.env);
  const diagnostico = process.env.NODE_ENV === 'production' ? {} : { faltan: variablesFaltantesDian(process.env) };
  return NextResponse.json({ habilitada, ...diagnostico });
}
