import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/charter': 'http://backend:3000',
      '/api': 'http://backend:3000'
    }
  }
})
