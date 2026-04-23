import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@cs/domain': resolve(__dirname, 'packages/domain/src/index.ts'),
      '@cs/agents': resolve(__dirname, 'packages/agents/src/index.ts'),
      '@cs/knowledge': resolve(__dirname, 'packages/knowledge/src/index.ts'),
      '@cs/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
    },
  },
});
