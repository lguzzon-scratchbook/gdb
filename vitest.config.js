import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.js'],
    reporter: 'html',
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
    },
    afterEach: async () => {
      // Close all IndexedDB connections to prevent conflicts
      if (typeof indexedDB !== 'undefined') {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name.startsWith('test-db')) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      }
    },
  },
  resolve: {
    alias: {
      'genosdb': path.resolve(__dirname, '../gdb/dist/index.js'),
    },
  },
});