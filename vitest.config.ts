import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'apps/**/src/**/*.test.ts', 'packages/**/src/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@cs/domain': resolve(__dirname, 'packages/domain'),
      '@cs/agents': resolve(__dirname, 'packages/agents'),
      '@cs/knowledge': resolve(__dirname, 'packages/knowledge'),
      '@cs/runtime': resolve(__dirname, 'packages/runtime'),
    },
  },
});
