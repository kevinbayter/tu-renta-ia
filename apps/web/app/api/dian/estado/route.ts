import { conexionDianHabilitada } from '@turenta/adaptadores';
import { NextResponse } from 'next/server';

/** Lets the UI hide the connect flow instead of asking for a password in vain. */
export function GET(): NextResponse {
  return NextResponse.json({ habilitada: conexionDianHabilitada(process.env) });
}
