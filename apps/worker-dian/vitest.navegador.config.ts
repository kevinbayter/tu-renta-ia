import { defineConfig } from 'vitest/config';

/** Integración del worker: necesita Chromium real, igual que en producción. */
export default defineConfig({
  test: {
    include: ['test/navegador/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
