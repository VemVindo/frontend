import { defineConfig } from 'vitest/config';

const UM_MINUTO_MS = 60_000;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/**/*.e2e.ts'],
    fileParallelism: false,
    bail: 1,
    testTimeout: 2 * UM_MINUTO_MS,
    hookTimeout: 2 * UM_MINUTO_MS,
  },
});
