import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< HEAD
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/monaco-editor/min/vs', dest: 'monaco-editor/min' }
      ]
    })
  ],
=======

export default defineConfig({
  root: '.',
  plugins: [react()],
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
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
<<<<<<< HEAD
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
=======
        target: 'http://localhost:3000',
        ws: true
      },
      '/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3000',
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
        changeOrigin: true
      }
    }
  }
});