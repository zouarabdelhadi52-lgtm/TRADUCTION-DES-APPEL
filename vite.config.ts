import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'VoxCall Translate - Traducteur Téléphonique',
          short_name: 'VoxCall',
          description: 'Application de traduction vocale des appels téléphoniques en temps réel avec synthèse audio instantanée et historique des enregistrements.',
          theme_color: '#0b0f19',
          background_color: '#0b0f19',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          protocol_handlers: [
            {
              protocol: 'web+call',
              url: '/?call=%s',
            },
          ],
          categories: ['utilities', 'productivity', 'communication'],
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          shortcuts: [
            {
              name: 'Nouvel Appel Traduit',
              short_name: 'Appel',
              description: 'Lancer un appel avec traduction vocale instantanée',
              url: '/?tab=call',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Interphone Bilingue',
              short_name: 'Interphone',
              description: 'Traduction orale alternée en face-à-face',
              url: '/?tab=intercom',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Historique des Appels',
              short_name: 'Historique',
              description: 'Consulter et réécouter vos enregistrements',
              url: '/?tab=history',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
            },
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
