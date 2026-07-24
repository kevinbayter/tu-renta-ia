import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Carga .env.local de la raíz del monorepo para el E2E (vitest no lee env files).
const rutaEnv = join(import.meta.dirname, '../../../../.env.local');

if (existsSync(rutaEnv)) {
  const lineas = readFileSync(rutaEnv, 'utf8').split('\n');
  for (const linea of lineas) {
    const coincidencia = /^([A-Z_]+)=(.*)$/.exec(linea.trim());
    if (coincidencia && !process.env[coincidencia[1] as string]) {
      process.env[coincidencia[1] as string] = coincidencia[2];
    }
  }
}
