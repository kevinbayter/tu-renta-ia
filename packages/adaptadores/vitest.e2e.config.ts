import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/e2e/**/*.test.ts'],
    setupFiles: ['./test/e2e/cargar-env.ts'],
    testTimeout: 1_200_000,
    hookTimeout: 120_000,
  },
});
