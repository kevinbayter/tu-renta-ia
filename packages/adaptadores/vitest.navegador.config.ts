import { defineConfig } from 'vitest/config';

/**
 * Tests que necesitan Chromium real. Van aparte de `pnpm test` para no romper
 * máquinas sin navegador instalado, pero son BLOQUEANTES en CI: un skip
 * silencioso es como se llega a "CI en verde, producción rota".
 */
export default defineConfig({
  test: {
    include: ['test/navegador/**/*.test.ts'],
    // Levantar Chromium y navegar es más lento que un test unitario.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
