import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Where the client's API calls point to. A relative value (default /api)
  // means "same origin" — the Vite dev server proxies it to the backend,
  // and production serves it from the same Express app. An absolute URL
  // sends requests straight to a separate API host.
  const apiUrl = env.VITE_API_URL || '/api'
  const devApiTarget = env.DEV_API_TARGET || 'http://localhost:5000'
  const base = env.VITE_BASE || '/'

  const proxy = {}
  if (apiUrl.startsWith('/')) {
    proxy[apiUrl] = { target: devApiTarget, changeOrigin: true }
  }

  return {
    base,
    plugins: [react()],
    server: {
      proxy,
    },
  }
})