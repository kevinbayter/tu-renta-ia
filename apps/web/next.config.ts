import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { NextConfig } from 'next';

// Carga el .env.local de la RAÍZ del monorepo (secretos únicos para todo el repo).
cargarEnvRaiz();

const nextConfig: NextConfig = {
  transpilePackages: ['@turenta/motor-fiscal', '@turenta/core', '@turenta/adaptadores', '@turenta/shared'],
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
