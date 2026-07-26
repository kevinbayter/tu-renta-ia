/**
 * Rate limiter simple en memoria (por instancia). Suficiente para MVP;
 * en producción multi-instancia se reemplaza por Redis/Upstash.
 */
const ventanas = new Map<string, number[]>();

export function permitir(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const marcas = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (marcas.length >= maximo) {
    ventanas.set(clave, marcas);
    return false;
  }
  marcas.push(ahora);
  ventanas.set(clave, marcas);
  return true;
}

/**
 * Client IP for rate-limiting. Behind Cloudflare only `cf-connecting-ip` is
 * trustworthy: the first entry of `x-forwarded-for` is set by the client, so
 * keying limits on it lets anyone reset their own quota by spoofing the header
 * — which defeated the OTP and email limits entirely. Falls back to XFF only
 * when the Cloudflare header is absent (e.g. local development).
 */
export function ipConfiable(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip')?.trim();
  if (cf) {
    return cf;
  }
  const reenviada = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return reenviada && reenviada.length > 0 ? reenviada : 'local';
}

export function claveDesdeRequest(request: Request, sufijo: string): string {
  return `${ipConfiable(request)}:${sufijo}`;
}
