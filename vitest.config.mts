import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@cs/domain': path.resolve(__dirname, './packages/domain/src'),
      '@cs/agents': path.resolve(__dirname, './packages/agents/src'),
      '@cs/knowledge': path.resolve(__dirname, './packages/knowledge/src'),
      '@cs/reporting': path.resolve(__dirname, './packages/reporting/src'),
      '@cs/runtime': path.resolve(__dirname, './packages/runtime/src'),
      '@cs/prompt-packets': path.resolve(__dirname, './packages/prompt-packets/src')
    }
  },
  esbuild: {
    target: 'node20'
  }
});
