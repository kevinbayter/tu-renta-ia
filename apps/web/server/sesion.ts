import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const NOMBRE_COOKIE = 'turenta_sesion';
const DURACION_DIAS = 30;

export interface Sesion {
  usuarioId: string;
  email: string;
}

function clave(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16) {
    throw new Error('AUTH_SECRET no configurado (mínimo 16 caracteres)');
  }
  return new TextEncoder().encode(secreto);
}

export async function crearSesion(sesion: Sesion): Promise<void> {
  const token = await new SignJWT({ email: sesion.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sesion.usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${String(DURACION_DIAS)}d`)
    .sign(clave());
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DURACION_DIAS * 24 * 60 * 60,
    path: '/',
  });
}

export async function leerSesion(): Promise<Sesion | null> {
  const almacen = await cookies();
  const token = almacen.get(NOMBRE_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verificarToken(token);
}

async function verificarToken(token: string): Promise<Sesion | null> {
  try {
    // Pin the algorithm: never let a token's own header pick how it is verified.
    const { payload } = await jwtVerify(token, clave(), { algorithms: ['HS256'] });
    return extraerSesion(payload);
  } catch {
    return null;
  }
}

function extraerSesion(payload: { sub?: string; email?: unknown }): Sesion | null {
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    return null;
  }
  return { usuarioId: payload.sub, email: payload.email };
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}
