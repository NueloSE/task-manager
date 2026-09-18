import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // send API calls to the Express server
    proxy: { '/api': 'http://localhost:3001' },
  },
  test: {
    env: { DB_PATH: ':memory:' },
  },
});
