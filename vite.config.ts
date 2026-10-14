import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: { enabled: true, crawlLinks: false, failOnError: true },
    }),
    viteReact(),
  ],
  server: { host: '0.0.0.0', port: 4173, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4175', changeOrigin: false, xfwd: true } } },
})
