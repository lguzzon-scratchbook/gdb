import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.js']  // Path correcto

  },
  resolve: {
    alias: {
      'genosdb': path.resolve(__dirname, '../gdb/dist/index.js'),
    },
  },
});