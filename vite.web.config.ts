import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { viteWatchIgnored } from './vite.watch-ignored'

/**
 * Vite config for the browser (Web) build.
 *
 * Intentionally does NOT include vite-plugin-electron — running this config
 * starts a plain Vite dev server without spawning Electron.
 *
 * Entry HTML:  index.web.html  →  src/web-main.tsx
 * Dev URL:     http://localhost:5173/
 * API Server:  http://localhost:3001 (proxied via /api/*)
 */
export default defineConfig({
  define: {
    'import.meta.env.VITE_RUNTIME_TARGET': JSON.stringify('web'),
  },

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    open: '/index.web.html',
    watch: {
      ignored: viteWatchIgnored,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist-web',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.web.html'),
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/')
          if (!norm.includes('/node_modules/')) return undefined
          if (norm.includes('/react/') || norm.includes('/react-dom/') || norm.includes('/scheduler/')) return 'vendor-react'
          if (norm.includes('/@tiptap/')) return 'vendor-editor'
          if (norm.includes('/styled-components/') || norm.includes('/lucide-react/')) return 'vendor-ui'
          if (norm.includes('/katex/') || norm.includes('/marked/') || norm.includes('/turndown/') || norm.includes('/mammoth/') || norm.includes('/jszip/')) return 'vendor-doc'
          return 'vendor-shared'
        },
      },
    },
  },
})
