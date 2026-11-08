import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Port tetap agar tidak tertukar dengan proyek lain (mis. Gerak di 5173).
  server: { port: 5180, strictPort: true },
})
