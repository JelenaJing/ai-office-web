import { defineConfig } from 'vite'

const apiBase = process.env.VITE_API_BASE || 'http://127.0.0.1:3001'
const paperBase = process.env.VITE_PAPER_REMAKE_BASE || 'http://127.0.0.1:8020'

export default defineConfig({
  server: {
    port: 5175,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: apiBase, changeOrigin: true },
      '/paper-api': { target: paperBase, changeOrigin: true, rewrite: (p) => p.replace(/^\/paper-api/, '') },
    },
  },
})
