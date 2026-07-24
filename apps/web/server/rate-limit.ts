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

export function claveDesdeRequest(request: Request, sufijo: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return `${ip}:${sufijo}`;
}
