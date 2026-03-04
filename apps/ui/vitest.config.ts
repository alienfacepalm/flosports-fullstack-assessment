import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  test: {
    globals: true,
    environment: 'node',
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'html'],
    },
  }
});

