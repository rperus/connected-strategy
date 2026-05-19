import { defineConfig } from 'vitest/config';

import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'tests/**/*.test.ts'],
    globals: true,
  },
  esbuild: {
    target: 'node20'
  }
});
