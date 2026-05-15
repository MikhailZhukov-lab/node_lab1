import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    env: {
      NODE_ENV: 'test',
    },
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    setupFiles: ['./tests/setup/test-env.js'],
  },
});
