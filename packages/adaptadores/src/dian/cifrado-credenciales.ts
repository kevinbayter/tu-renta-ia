/**
 * Encryption for stored DIAN credentials.
 *
 * The key lives ONLY in the isolated worker, never in the web app, and the
 * ciphertext lives only in the database, which the worker cannot reach. Neither
 * half is enough on its own: stealing the database yields opaque blobs, and
 * compromising the worker yields no stored credential to decrypt.
 *
 * AES-256-GCM: authenticated, so a tampered blob fails to decrypt instead of
 * silently producing garbage.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';
const LARGO_CLAVE = 32;
const LARGO_NONCE = 12;

/** Bumped when the key rotates, so old blobs stay identifiable. */
export const VERSION_CIFRADO = 1;

export interface CredencialCifrada {
  version: number;
  nonce: string;
  tag: string;
  contenido: string;
}

export class ClaveNoConfigurada extends Error {
  constructor() {
    super('DIAN_CRED_KEY no está configurada: no se puede guardar el acceso');
  }
}

/** 32 bytes in hex. Anything else is a misconfiguration, not a value to guess. */
export function leerClaveMaestra(env: Record<string, string | undefined>): Buffer | null {
  const hex = env['DIAN_CRED_KEY'] ?? '';
  if (hex.length !== LARGO_CLAVE * 2) {
    return null;
  }
  return Buffer.from(hex, 'hex');
}

export function cifrarCredencial(texto: string, clave: Buffer): CredencialCifrada {
  const nonce = randomBytes(LARGO_NONCE);
  const cifrador = createCipheriv(ALGORITMO, clave, nonce);
  const contenido = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  return {
    version: VERSION_CIFRADO,
    nonce: nonce.toString('base64'),
    tag: cifrador.getAuthTag().toString('base64'),
    contenido: contenido.toString('base64'),
  };
}

/** Returns null on any tampering or wrong key: never throws the raw reason. */
export function descifrarCredencial(cifrada: CredencialCifrada, clave: Buffer): string | null {
  try {
    const descifrador = createDecipheriv(ALGORITMO, clave, Buffer.from(cifrada.nonce, 'base64'));
    descifrador.setAuthTag(Buffer.from(cifrada.tag, 'base64'));
    const claro = Buffer.concat([
      descifrador.update(Buffer.from(cifrada.contenido, 'base64')),
      descifrador.final(),
    ]);
    return claro.toString('utf8');
  } catch {
    return null;
  }
}
