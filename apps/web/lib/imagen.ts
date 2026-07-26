/**
 * Image type detection by magic bytes. The client-sent MIME is not trusted:
 * an SVG (which can carry script) would pass a naive `image/*` check and become
 * stored XSS. Only real raster images are accepted.
 */

function esPng(b: Uint8Array): boolean {
  return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}

function esJpeg(b: Uint8Array): boolean {
  return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

/** RIFF....WEBP container. */
function esWebp(b: Uint8Array): boolean {
  return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[8] === 0x57 && b[9] === 0x45;
}

/** True only for PNG, JPEG or WebP; SVG and everything else is rejected. */
export function esRaster(b: Uint8Array): boolean {
  return esPng(b) || esJpeg(b) || esWebp(b);
}

/** Content-type for serving, derived from the same magic bytes. */
export function tipoImagen(foto: Uint8Array): string {
  if (esPng(foto)) {
    return 'image/png';
  }
  if (esJpeg(foto)) {
    return 'image/jpeg';
  }
  return 'image/webp';
}
