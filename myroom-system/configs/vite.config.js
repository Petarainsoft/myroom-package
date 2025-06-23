import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Custom plugin to ensure config-domain.js is copied to dist
function copyConfigDomainPlugin() {
  return {
    name: 'copy-config-domain',
    writeBundle() {
      // Source file path
      const sourcePath = path.resolve(__dirname, '..', 'public', 'config-domain.js');
      // Destination file path
      const destPath = path.resolve(__dirname, '..', 'dist', 'config-domain.js');
      
      // Copy the file
      if (fs.existsSync(sourcePath)) {
        // Create dist directory if it doesn't exist
        if (!fs.existsSync(path.dirname(destPath))) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
        }
        
        // Copy the file
        fs.copyFileSync(sourcePath, destPath);
        console.log('✓ config-domain.js copied to dist');
      } else {
        console.error('✗ config-domain.js not found in public directory');
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyConfigDomainPlugin()],
  root: resolve(__dirname, '..'),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, '..', 'index.html'),
        embed: resolve(__dirname, '..', 'embed.html')
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'myroom.petarainsoft.com'
    ]
  },
  define: {
    // Ensure compatibility
    global: 'globalThis'
  }
})
