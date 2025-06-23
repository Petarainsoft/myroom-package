import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude : ["**/*.env"],
  plugins: [react({
    include: "**/*/tsx"
  })],
})
