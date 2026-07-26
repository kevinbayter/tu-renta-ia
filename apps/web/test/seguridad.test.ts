import { describe, expect, it } from 'vitest';

import { esRaster } from '@/lib/imagen';
import { claveDesdeRequest, ipConfiable, permitir } from '@/server/rate-limit';
import { completarTarea, consultarTarea, crearTarea } from '@/server/documentos/tareas';

/**
 * Regression tests for the security review. Each one fails if the corresponding
 * fix is reverted.
 */

function pedir(cabeceras: Record<string, string>): Request {
  return new Request('https://turenta.tax/api/x', { headers: cabeceras });
}

describe('rate-limit: la IP no se puede falsear con X-Forwarded-For', () => {
  it('usa cf-connecting-ip y NO el primer valor de x-forwarded-for', () => {
    const req = pedir({ 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': '1.1.1.1, 2.2.2.2' });
    // Spoofing XFF must not change the identity the limiter keys on.
    expect(ipConfiable(req)).toBe('9.9.9.9');
    expect(claveDesdeRequest(req, 'otp')).toBe('9.9.9.9:otp');
  });

  it('solo cae a x-forwarded-for cuando no hay cabecera de Cloudflare', () => {
    expect(ipConfiable(pedir({ 'x-forwarded-for': '3.3.3.3' }))).toBe('3.3.3.3');
    expect(ipConfiable(pedir({}))).toBe('local');
  });

  it('un atacante que rota el XFF no amplía su cuota si la IP real es la misma', () => {
    const real = '9.9.9.9';
    const clave = (xff: number) =>
      claveDesdeRequest(pedir({ 'cf-connecting-ip': real, 'x-forwarded-for': String(xff) }), 'brute');
    const intentos = Array.from({ length: 10 }, (_, i) => permitir(clave(i), 3, 60_000));
    // Same real IP → capped at the limit despite a different spoofed XFF each try.
    expect(intentos.filter(Boolean)).toHaveLength(3);
  });
});

describe('avatar: solo imágenes raster reales', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0]);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0]);
  const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
  const svg = new TextEncoder().encode('<svg onload="alert(1)"><script>x</script></svg>');

  it('acepta PNG, JPEG y WebP', () => {
    expect(esRaster(png)).toBe(true);
    expect(esRaster(jpeg)).toBe(true);
    expect(esRaster(webp)).toBe(true);
  });

  it('rechaza SVG y otros formatos que pueden ejecutar script', () => {
    expect(esRaster(svg)).toBe(false);
    expect(esRaster(new TextEncoder().encode('GIF89a'))).toBe(false);
    expect(esRaster(new TextEncoder().encode('<html>'))).toBe(false);
  });
});

describe('tareas de documentos: aisladas por usuario', () => {
  it('el dueño lee su tarea; otro usuario no', () => {
    const id = crearTarea('usuario-A');
    completarTarea(id, { tipo: 'exogena' });
    expect(consultarTarea(id, 'usuario-A')?.estado).toBe('listo');
    // The UUID alone must not grant access to another user's extracted data.
    expect(consultarTarea(id, 'usuario-B')).toBeNull();
  });
});
