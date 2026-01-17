import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true, // Fail if port is already in use instead of using next available port
    host: true,
    open: false,
    watch: {
      ignored: ['**/.env', '**/.env.*', '**/.env.local'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react', 'framer-motion'],
        },
      },
    },
  },
})
