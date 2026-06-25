import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
    host: true,
    open: false,
    watch: {
      ignored: ['**/.env', '**/.env.*', '**/.env.local'],
    },
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('lucide-react') || id.includes('framer-motion')) return 'ui'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor'
        },
      },
    },
  },
})
