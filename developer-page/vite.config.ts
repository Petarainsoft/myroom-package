import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'myroom.petarainsoft.com',
      '2620-116-110-43-199.ngrok-free.app',
      '192.168.1.5',
      'myravt.s3.us-east-1.amazonaws.com'
    ],
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    proxy: {
      '/api': {
        target: 'https://settled-iguana-fast.ngrok-free.app',
        changeOrigin: true,
      }
    }
  }
});



