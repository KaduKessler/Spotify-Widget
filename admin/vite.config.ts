import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:3000'
  const port = Number(env.VITE_DEV_PORT) || 5173

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
      port,
      proxy: {
        "/api": backend,
        "/widget": backend,
        "/auth": backend,
        "/oauth": backend,
      },
    },
  }
})
