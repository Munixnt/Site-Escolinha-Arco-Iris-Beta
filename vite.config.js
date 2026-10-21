import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_PORT = process.env.PORT || 3001;

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Em desenvolvimento, a API e os uploads vêm do servidor Node (server/index.js)
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
      '/uploads': `http://localhost:${API_PORT}`,
    },
  },
});
