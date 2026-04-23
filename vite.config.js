import { defineConfig } from 'vite' // <--- CETTE LIGNE EST INDISPENSABLE
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // Ton code ici...
  base: command === 'serve' ? '/' : '/portfolio3D/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        os:   resolve(__dirname, 'os.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('three')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
        },
      },
    },
  },
}))