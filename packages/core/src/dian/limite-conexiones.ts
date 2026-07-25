/**
 * Connection limits for the MUISCA portal (PLAN-DIAN §4). Pure logic with the
 * current instant as a parameter, so tests never wait for real time.
 *
 * These numbers are not about handling load: they are about not looking like a
 * credential-stuffing attack against the tax authority.
 */

export type AmbitoLimite = 'fallos' | 'usuario' | 'documento' | 'global';

export interface Limite {
  maximo: number;
  ventanaMs: number;
}

export interface Veredicto {
  permitido: boolean;
  ambito?: AmbitoLimite;
  /** For the `Retry-After` header. */
  esperarSegundos: number;
}

const MINUTO_MS = 60_000;

export const LIMITES: Record<AmbitoLimite, Limite> = {
  /** Rejected credentials: two tries and we stop for an hour. */
  fallos: { maximo: 2, ventanaMs: 60 * MINUTO_MS },
  /** A legitimate user connects once; three covers a typo. */
  usuario: { maximo: 3, ventanaMs: 15 * MINUTO_MS },
  /** Same national ID across several of our accounts: that account is the target. */
  documento: { maximo: 3, ventanaMs: 15 * MINUTO_MS },
  /** Ceiling for our own egress: each connection is a Chromium for up to 120 s. */
  global: { maximo: 10, ventanaMs: 5 * MINUTO_MS },
};

/** More than two simultaneous browsers is already a visible spike from MUISCA. */
export const MAXIMO_CONEXIONES_CONCURRENTES = 2;

export function vigentes(marcas: number[], ventanaMs: number, ahora: number): number[] {
  return marcas.filter((t) => ahora - t < ventanaMs);
}

export function evaluarAmbito(ambito: AmbitoLimite, marcas: number[], ahora: number): Veredicto {
  const { maximo, ventanaMs } = LIMITES[ambito];
  const activas = vigentes(marcas, ventanaMs, ahora);
  if (activas.length < maximo) {
    return { permitido: true, esperarSegundos: 0 };
  }
  const masAntigua = Math.min(...activas);
  return {
    permitido: false,
    ambito,
    esperarSegundos: Math.max(1, Math.ceil((masAntigua + ventanaMs - ahora) / 1000)),
  };
}

/** Most specific scope wins over the global one. */
const ORDEN: AmbitoLimite[] = ['fallos', 'usuario', 'documento', 'global'];

export function evaluarConexionDian(
  marcasPorAmbito: Partial<Record<AmbitoLimite, number[]>>,
  ahora: number,
): Veredicto {
  const negado = ORDEN.map((ambito) =>
    evaluarAmbito(ambito, marcasPorAmbito[ambito] ?? [], ahora),
  ).find((v) => !v.permitido);
  return negado ?? { permitido: true, esperarSegundos: 0 };
}
