import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        os:   resolve(__dirname, 'os.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('three'))        return 'three'
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('react-dom'))    return 'react'
        },
      },
    },
  },
}))