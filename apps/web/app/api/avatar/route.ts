import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { leerSesion } from '@/server/sesion';

const TAMANO_MAXIMO_BYTES = 200_000;

/** Foto de avatar del usuario autenticado (pequeña, guardada en la base). */
export async function GET(): Promise<Response> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const foto = await obtenerRepositorio().obtenerFotoAvatar(sesion.usuarioId);
  if (!foto) {
    return NextResponse.json({ error: 'Sin foto' }, { status: 404 });
  }
  return new Response(new Uint8Array(foto), {
    headers: { 'Content-Type': tipoImagen(foto), 'Cache-Control': 'private, no-cache' },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  const archivo = (await request.formData()).get('foto');
  if (!(archivo instanceof File) || !archivo.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Sube una imagen (JPG, PNG o WebP)' }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: 'La foto debe pesar máximo 200 KB' }, { status: 413 });
  }
  await obtenerRepositorio().guardarFotoAvatar(sesion.usuarioId, new Uint8Array(await archivo.arrayBuffer()));
  return NextResponse.json({ ok: true });
}

export async function DELETE(): Promise<NextResponse> {
  const sesion = await leerSesion();
  if (!sesion) {
    return NextResponse.json({ error: 'No has iniciado sesión' }, { status: 401 });
  }
  await obtenerRepositorio().guardarFotoAvatar(sesion.usuarioId, null);
  return NextResponse.json({ ok: true });
}

/** Detección por bytes mágicos: suficiente para JPG/PNG/WebP. */
function tipoImagen(foto: Uint8Array): string {
  if (foto[0] === 0x89 && foto[1] === 0x50) {
    return 'image/png';
  }
  if (foto[0] === 0xff && foto[1] === 0xd8) {
    return 'image/jpeg';
  }
  return 'image/webp';
}
