import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'lim.localtest.me',
    port: 5173,
    fs: {
      // 로컬 파일 시스템 접근 허용
      allow: ['..', 'C:/Users/zks14/Desktop/multi_module'],
    },
  },
})
