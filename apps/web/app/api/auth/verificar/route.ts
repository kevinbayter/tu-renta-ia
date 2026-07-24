import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { obtenerRepositorio } from '@/server/composicion';
import { claveDesdeRequest, permitir } from '@/server/rate-limit';
import { crearSesion } from '@/server/sesion';

/** Verifica el código OTP y abre sesión (cookie httpOnly firmada, 30 días). */
export async function POST(request: Request): Promise<NextResponse> {
  if (!permitir(claveDesdeRequest(request, 'verificar'), 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }
  const { email, codigo } = (await request.json()) as { email?: string; codigo?: string };
  if (!email || !codigo) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }
  const usuario = await obtenerRepositorio().buscarUsuarioPorEmail(email);
  if (!usuario) {
    return NextResponse.json({ error: 'Código inválido o vencido' }, { status: 401 });
  }
  const codigoHash = createHash('sha256').update(codigo.trim()).digest('hex');
  const valido = await obtenerRepositorio().consumirOtp(usuario.id, codigoHash, new Date());
  if (!valido) {
    return NextResponse.json({ error: 'Código inválido o vencido' }, { status: 401 });
  }
  await crearSesion({ usuarioId: usuario.id, email: usuario.email });
  const perfil = await obtenerRepositorio().obtenerPerfil(usuario.id);
  const perfilCompleto = Boolean(perfil?.nombres && perfil.apellidos && perfil.identificacion);
  return NextResponse.json({ ok: true, email: usuario.email, perfilCompleto });
}
