
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 如果你的仓库名不是 <username>.github.io，
  // 比如仓库名是 shift-clock，这里需要设置为 '/shift-clock/'
  base: './', 
})
