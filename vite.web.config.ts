import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { viteWatchIgnored } from './vite.watch-ignored'

/** 开发时访问 / 或 /index.html 时走 Web 入口，避免加载 Electron 版 main.tsx（无 Router）。 */
function webIndexFallbackPlugin(): Plugin {
  return {
    name: 'web-index-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        if (pathname === '/' || pathname === '/index.html') {
          req.url = '/index.web.html'
        }
        next()
      })
    },
  }
}

/**
 * Vite config for the browser (Web) build.
 *
 * Intentionally does NOT include vite-plugin-electron — running this config
 * starts a plain Vite dev server without spawning Electron.
 *
 * Entry HTML:  index.web.html  →  src/web-main.tsx
 * Dev URL:     https://localhost:5173/ （自签名证书，麦克风/语音需安全上下文）
 * API Server:  http://localhost:3001 (proxied via /api/*)
 */
const ai4scienceApiBase = process.env.VITE_AI4SCIENCE_API_BASE || 'http://127.0.0.1:8082'
const ai4scienceSrc = path.resolve(__dirname, '../ai4science/webui/src')

function resolveDevHttps(): { key: Buffer; cert: Buffer } | false {
  if (process.env.VITE_DEV_HTTPS === '0') return false
  const certDir = path.resolve(__dirname, '.certs')
  const keyPath = path.join(certDir, 'dev-key.pem')
  const certPath = path.join(certDir, 'dev.pem')
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) return false
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
}

const devHttps = resolveDevHttps()

export default defineConfig({
  define: {
    'import.meta.env.VITE_RUNTIME_TARGET': JSON.stringify('web'),
    'import.meta.env.VITE_AI4SCIENCE_API_PREFIX': JSON.stringify('/ai4science/api'),
  },

  plugins: [react(), webIndexFallbackPlugin()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(__dirname, 'tailwind.research.config.js') }),
        autoprefixer(),
      ],
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ai4science': ai4scienceSrc,
    },
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },

  optimizeDeps: {
    include: ['plotly.js-dist-min', 'react-plotly.js', 'papaparse'],
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    https: devHttps || undefined,
    open: devHttps ? 'https://localhost:5173/index.web.html' : '/index.web.html',
    watch: {
      ignored: viteWatchIgnored,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const message = err instanceof Error ? err.message : String(err)
            if (res && 'writeHead' in res && !(res as { headersSent?: boolean }).headersSent) {
              ;(res as { writeHead: (code: number, h: Record<string, string>) => void }).writeHead(503, {
                'Content-Type': 'application/json',
              })
              ;(res as { end: (body: string) => void }).end(
                JSON.stringify({ success: false, error: '主站 BFF 暂不可用，请稍后重试', detail: message }),
              )
              return
            }
            console.warn('[vite] /api 代理暂不可用:', message)
          })
        },
      },
      '/calc': {
        target: process.env.VITE_MATERIALS_CALC_BASE || 'http://127.0.0.1:8030',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/calc/, ''),
      },
      '/speech-realtime': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        rewrite: (path: string) => `/api${path}`,
      },
      '/paper-api': {
        target: process.env.VITE_PAPER_REMAKE_BASE || 'http://127.0.0.1:8020',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/paper-api/, ''),
      },
      '/ai4science/api': {
        target: ai4scienceApiBase,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/ai4science\/api/, '/api'),
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
