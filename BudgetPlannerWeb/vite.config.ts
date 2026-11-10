import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Flask backend (Budget_planner_app/Budgetbackend/api_server.py) listens on 5001.
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:5001';

  return {
    plugins: [react()],
    server: {
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    preview: {
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
  };
});
