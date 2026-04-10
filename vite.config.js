import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 utilise Rolldown : manualChunks doit être une fonction
        manualChunks(id) {
          if (id.includes('three')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
        },
      },
    },
  },
})
