import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: mode === 'production' ? '/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/' : '/',
    plugins: [
      tsconfigPaths(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: { enabled: true },
        manifest: {
          name: env.VITE_APP_NAME,
          short_name: env.VITE_APP_NAME,
          description: 'A minimalist floor tracker',
          theme_color: '#f59e0b',
          background_color: '#0c0a09',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 3000,
    },
  };
});
