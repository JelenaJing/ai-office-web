import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 8021,
    proxy: {
      '/api': {
        // 代理所有 /api 请求到后端
        target: 'http://localhost:8020',
        changeOrigin: true,
        secure: false,
        // 设置超时时间为30分钟，支持长时间运行的请求（如理论分析）
        // 如果任务可能超过30分钟，建议实现异步任务机制（后台任务+轮询）
        timeout: 1800000, // 30分钟（1800秒）
        // 不重写路径
        rewrite: (path) => path,
      },
    },
  },
  resolve: {
    alias: {
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
  },
  // 确保Monaco Editor的worker文件可以被正确加载
  publicDir: 'public',
})
