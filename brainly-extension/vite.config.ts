import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep output extension-friendly and predictable.
        manualChunks: undefined,
      },
    },
  },
})
