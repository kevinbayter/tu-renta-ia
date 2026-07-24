import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

import type { PersonaAdministrada } from '@turenta/core';

/** Personas administradas del usuario (los titulares de declaraciones de terceros). */
export async function GET(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const personas = await obtenerRepositorio().listarPersonas(sesion.usuarioId);
  return NextResponse.json({ personas });
}

export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const cuerpo = (await request.json()) as Partial<Omit<PersonaAdministrada, 'id'>>;
  const invalido = validar(cuerpo);
  if (invalido) {
    return NextResponse.json({ error: invalido }, { status: 400 });
  }
  const repositorio = obtenerRepositorio();
  const { id } = await repositorio.guardarPersona(sesion.usuarioId, {
    nombres: (cuerpo.nombres ?? '').trim(),
    apellidos: (cuerpo.apellidos ?? '').trim(),
    identificacion: (cuerpo.identificacion ?? '').replace(/\D/g, ''),
    email: (cuerpo.email ?? '').trim(),
    telefono: (cuerpo.telefono ?? '').trim(),
  });
  await repositorio.registrarActividad(sesion.usuarioId, {
    tipo: 'persona_guardada',
    descripcion: `Persona guardada — ${(cuerpo.nombres ?? '').trim()} ${(cuerpo.apellidos ?? '').trim()}`,
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
  }
  await obtenerRepositorio().eliminarPersona(sesion.usuarioId, id);
  return NextResponse.json({ ok: true });
}

function validar(cuerpo: Partial<Omit<PersonaAdministrada, 'id'>>): string | null {
  if (!cuerpo.nombres?.trim() || !cuerpo.apellidos?.trim()) {
    return 'Faltan nombres o apellidos';
  }
  if ((cuerpo.identificacion ?? '').replace(/\D/g, '').length < 5) {
    return 'La cédula debe tener al menos 5 dígitos';
  }
  return null;
}
