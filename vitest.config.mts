import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Configuração do guia de Vitest do Next 16 (node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['app/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Cobertura da lógica (cliente da API, regras e formatação). Telas e hooks
      // entram quando houver testes de componente.
      include: ['app/lib/**/*.ts', 'app/**/validacao.ts'],
      exclude: ['app/**/*.test.ts', 'app/lib/use*.ts', 'app/lib/tipos.ts', 'app/lib/exemplos.ts'],
      reporter: ['text-summary', 'json-summary', 'lcov'],
      thresholds: { lines: 60 },
    },
  },
});
