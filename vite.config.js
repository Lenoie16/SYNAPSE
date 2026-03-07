import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true, // Listen on all IPs (needed for mobile connection)
    watch: {
      // Prevent page reload when files are uploaded or DB is saved
      ignored: ['**/uploads/**', '**/synapse.db.json', '**/*.db', '**/*.sqlite']
    },
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true
      },
      '/upload': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
