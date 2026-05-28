import { defineConfig } from 'vite'

const testBffPort = process.env.RESEARCH_TEST_BFF_PORT || '13001'
const testFastApiPort = process.env.RESEARCH_TEST_FASTAPI_PORT || '18020'
const apiBase = process.env.VITE_API_BASE || `http://127.0.0.1:${testBffPort}`
const paperBase = process.env.VITE_PAPER_REMAKE_BASE || `http://127.0.0.1:${testFastApiPort}`
const devPort = Number(process.env.RESEARCH_TEST_LAB_PORT || 25175)

export default defineConfig({
  server: {
    port: devPort,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: apiBase, changeOrigin: true },
      '/paper-api': { target: paperBase, changeOrigin: true, rewrite: (p) => p.replace(/^\/paper-api/, '') },
    },
  },
})
