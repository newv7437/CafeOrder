import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const API_TARGET = process.env.API_PROXY_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // /api/* 요청을 로컬 API 서버(npm run dev:api, 포트 3000)로 전달
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        configure(proxy) {
          // API 서버가 꺼져 있으면 Vite 기본 동작은 "빈 본문 500" 응답 →
          // 프론트엔드에서 `Unexpected end of JSON input` 오류가 납니다.
          // 원인을 알 수 있도록 JSON 502 응답으로 바꿉니다.
          proxy.on('error', (err, req, res) => {
            console.error(`[vite proxy] ${req.method} ${req.url} → ${API_TARGET} 실패: ${err.code || err.message}`)
            if (res && typeof res.writeHead === 'function' && !res.headersSent && !res.writableEnded) {
              res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({
                error: `API 서버(${API_TARGET})에 연결할 수 없습니다. 'npm run dev:all' 또는 'npm run dev:api'로 API 서버를 실행하세요.`,
                code: 'API_SERVER_UNREACHABLE',
              }))
            }
          })
        },
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
})
