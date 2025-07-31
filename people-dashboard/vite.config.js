import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configurazione base per differenti target
  base: process.env.ELECTRON_BUILD === 'true' ? './' : 
        process.env.NODE_ENV === 'production' ? '/dashboard/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
