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

// Separate Vite config for web component build
export default defineConfig({
  plugins: [react(), copyConfigDomainPlugin()],
  root: resolve(__dirname, '..'),
  build: {
    lib: {
      entry: resolve(__dirname, '..', 'src/apps/webcomponent/index.ts'),
      name: 'MyRoom',
      fileName: (format) => `myroom-webcomponent.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // Externalize dependencies to reduce bundle size
      external: [],
      output: {
        exports: 'named',
        globals: {
          // Define globals if needed
        },
        // Optimize chunk splitting
        manualChunks: undefined
      }
    },
    // Optimize for production
    minify: false, // Disable minify to avoid terser errors
    // Target modern browsers
    target: 'es2018',
    // Optimize bundle size
    chunkSizeWarningLimit: 2000
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"production"'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src')
    }
  }
})