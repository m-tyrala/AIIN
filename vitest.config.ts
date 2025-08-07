import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/tests/**', 'src/env.d.ts'],
    },
    include: [
      'tests/unit/**/*.{test,spec}.ts',
      'tests/unit/**/*.{test,spec}.tsx'
    ],
  },
});
