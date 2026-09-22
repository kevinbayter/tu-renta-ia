import { defineConfig } from 'vitest/config';

/**
 * Tests que necesitan Chromium real. Van aparte de `pnpm test` para no romper
 * máquinas sin navegador instalado, pero son BLOQUEANTES en CI: un skip
 * silencioso es como se llega a "CI en verde, producción rota".
 */
export default defineConfig({
  test: {
    include: ['test/navegador/**/*.test.ts'],
    // Levantar Chromium y navegar es más lento que un test unitario; firmar y
    // presentar recorre el formulario entero antes de llegar al acuse. El caso
    // más largo es el del código que nunca llega: espera un minuto al aviso de
    // la DIAN —como en producción— antes de rendirse y pedírselo al usuario.
    testTimeout: 210_000,
    hookTimeout: 60_000,
  },
});
