import { defineConfig } from 'vitest/config';

const UM_MINUTO_MS = 60_000;
// Com a janela aberta as pausas deixam cada teste mais longo.
const LIMITE_POR_TESTE_MS = (process.env.E2E_SEM_TELA === '1' ? 2 : 4) * UM_MINUTO_MS;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/**/*.e2e.ts'],
    globalSetup: ['e2e/apoio/preparar.ts'],
    fileParallelism: false,
    bail: 1,
    testTimeout: LIMITE_POR_TESTE_MS,
    hookTimeout: LIMITE_POR_TESTE_MS,
  },
});
