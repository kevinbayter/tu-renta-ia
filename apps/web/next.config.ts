import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { NextConfig } from 'next';

// Carga el .env.local de la RAÍZ del monorepo (secretos únicos para todo el repo).
cargarEnvRaiz();

// Hay un package-lock.json suelto en ~/projects que hace que Turbopack infiera
// mal el root (<monorepo>/..) y vigile todos los repos hermanos →
// presión de memoria y caídas con exit 143 (SIGTERM). Fijar el monorepo real.
const monorepoRoot = join(__dirname, '../..');

const nextConfig: NextConfig = {
  transpilePackages: ['@turenta/motor-fiscal', '@turenta/core', '@turenta/adaptadores', '@turenta/shared'],
  outputFileTracingRoot: monorepoRoot,
  // Servidor autocontenido para la imagen Docker (Dokploy): copia solo lo necesario.
  output: 'standalone',
  turbopack: {
    root: monorepoRoot,
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
