import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.env'],
  plugins: [
    react({
      include: '**/*/tsx',
    }),
    [visualizer({ filename: './dist/report.html' })],
  ],
  // build: {
  //   sourcemap: true,
  // },
  server: {
    watch: {
      usePolling: true,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/common/styles/_base.scss" as *;`,
      },
    },
  },
  build: {
    rollupOptions: {
      external: ['lodash-es'],
      output: {
        // manualChunks
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@Modal': path.resolve(__dirname, './src/pages/_shared/modal'),
    },
  },
});
