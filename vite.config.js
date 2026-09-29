import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],

    // Only used by "npm run dev". Local VITE_API_URL is "/api",
    // so send those calls to the backend on port 5000.
    server: {
      proxy: {
        '/api': env.DEV_API_TARGET || 'http://localhost:5000',
      },
    },
  }
})
