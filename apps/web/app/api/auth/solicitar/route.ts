import { createHash, randomInt } from 'node:crypto';

import { NextResponse } from 'next/server';

import { obtenerEmail, obtenerRepositorio } from '@/server/composicion';
import { claveDesdeRequest, permitir } from '@/server/rate-limit';

const VIGENCIA_MINUTOS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Solicita un código de ingreso por email (OTP de 6 dígitos, vigencia 10 min). */
export async function POST(request: Request): Promise<NextResponse> {
  if (!permitir(claveDesdeRequest(request, 'otp'), 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }
  const { email } = (await request.json()) as { email?: string };
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });
  }
  const usuario = await obtenerRepositorio().upsertUsuario(email);
  const codigo = String(randomInt(100000, 1000000));
  const expiraEn = new Date(Date.now() + VIGENCIA_MINUTOS * 60 * 1000);
  await obtenerRepositorio().guardarOtp(usuario.id, hash(codigo), expiraEn);
  await obtenerEmail().enviarCodigo(usuario.email, codigo);
  return NextResponse.json({ ok: true });
}

function hash(codigo: string): string {
  return createHash('sha256').update(codigo).digest('hex');
}
