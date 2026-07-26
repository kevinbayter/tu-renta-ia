import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { NextConfig } from 'next';

// Carga el .env.local de la RAÍZ del monorepo (secretos únicos para todo el repo).
cargarEnvRaiz();

// Hay un package-lock.json suelto en ~/projects que hace que Turbopack infiera
// mal el root (<monorepo>/..) y vigile todos los repos hermanos →
// presión de memoria y caídas con exit 143 (SIGTERM). Fijar el monorepo real.
const monorepoRoot = join(__dirname, '../..');

/**
 * No external origins are loaded (next/font self-hosts, all fetches are
 * same-origin or server-side), so the CSP can stay tight. 'unsafe-inline' is
 * kept for scripts/styles because Next injects inline hydration and Tailwind
 * inline styles, and without middleware there is no nonce to replace it.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const CABECERAS_SEGURIDAD = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@turenta/motor-fiscal', '@turenta/core', '@turenta/adaptadores', '@turenta/shared'],
  outputFileTracingRoot: monorepoRoot,
  // Servidor autocontenido para la imagen Docker (Dokploy): copia solo lo necesario.
  output: 'standalone',
  // El canvas de napi trae un binario nativo que el empaquetador no puede
  // meter en un chunk: se resuelve en tiempo de ejecución, no en el build.
  serverExternalPackages: ['@napi-rs/canvas'],
  turbopack: {
    root: monorepoRoot,
  },
  async headers() {
    return [{ source: '/:path*', headers: CABECERAS_SEGURIDAD }];
  },
};

function cargarEnvRaiz(): void {
  const ruta = join(__dirname, '../../.env.local');
  if (!existsSync(ruta)) {
    return;
  }
  const lineas = readFileSync(ruta, 'utf8').split('\n');
  for (const linea of lineas) {
    const coincidencia = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
    if (coincidencia && coincidencia[1] && !process.env[coincidencia[1]]) {
      process.env[coincidencia[1]] = coincidencia[2];
    }
  }
}

export default nextConfig;
