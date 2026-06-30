import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@repo/config': path.resolve(__dirname, '../../packages/config/src'),
      '@repo/logger': path.resolve(__dirname, '../../packages/logger/src'),
      '@repo/types': path.resolve(__dirname, '../../packages/types/src'),
      '@repo/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@repo/medplum': path.resolve(__dirname, '../../packages/medplum/src'),
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@repo/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
