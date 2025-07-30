import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/lib/**/*'],
      exclude: ['src/apps/**/*', 'src/demos/**/*']
    })
  ],
  root: resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src'),
      '@/lib': resolve(__dirname, '..', 'src/lib'),
      '@/shared': resolve(__dirname, '..', 'src/shared')
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, '..', 'src/lib/index.ts'),
      name: 'MyRoomSystem',
      fileName: (format) => `myroom-system.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime'
        },
        // Optimize chunk splitting for better tree-shaking
        manualChunks: undefined
      }
    },
    sourcemap: true,
    // Ensure compatibility with older browsers
    target: 'es2015'
  },
  define: {
    global: 'globalThis'
  }
})