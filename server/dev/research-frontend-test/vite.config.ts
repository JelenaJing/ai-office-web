import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const testBffPort = process.env.RESEARCH_TEST_BFF_PORT || '13001'
const testFastApiPort = process.env.RESEARCH_TEST_FASTAPI_PORT || '18020'
const apiBase = process.env.VITE_API_BASE || `http://127.0.0.1:${testBffPort}`
const paperBase = process.env.VITE_PAPER_REMAKE_BASE || `http://127.0.0.1:${testFastApiPort}`
const devPort = Number(process.env.RESEARCH_TEST_UI_PORT || 25176)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: devPort,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': { target: apiBase, changeOrigin: true },
      '/paper-api': { target: paperBase, changeOrigin: true, rewrite: (p) => p.replace(/^\/paper-api/, '') },
    },
  },
})
