import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'https://settled-iguana-fast.ngrok-free.app',
        changeOrigin: true,
      }
    },
    allowedHosts: ['myroom.petarainsoft.com']
  }
});
