import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.js'],
    reporter: ['json', { outputFile: 'results.json' }]  // Esto está bien, pero verifica si Vitest lo soporta
  },
  resolve: {
    alias: {
      'genosdb': path.resolve(__dirname, '../gdb/dist/index.js'),
    },
  },
});