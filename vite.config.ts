import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'configure-pwa-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url === '/manifest-v1.2.0.json' || url === '/manifest.webmanifest' || url === '/manifest.json') {
              res.setHeader('Content-Type', 'application/manifest+json');
              res.setHeader('Cache-Control', 'no-cache');
            } else if (url === '/service-worker-v1.2.0.js' || url === '/service-worker.js') {
              res.setHeader('Content-Type', 'text/javascript');
              res.setHeader('Cache-Control', 'no-cache');
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url === '/manifest-v1.2.0.json' || url === '/manifest.webmanifest' || url === '/manifest.json') {
              res.setHeader('Content-Type', 'application/manifest+json');
              res.setHeader('Cache-Control', 'no-cache');
            } else if (url === '/service-worker-v1.2.0.js' || url === '/service-worker.js') {
              res.setHeader('Content-Type', 'text/javascript');
              res.setHeader('Cache-Control', 'no-cache');
            }
            next();
          });
        },
      },
    ],
    build: {
      rollupOptions: { output: { manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('motion')) return 'motion';
          return 'vendor';
        }
        const view = id.match(/src\/views\/([^/]+)\.tsx$/);
        if (view) return `view-${view[1]}`;
      } } },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Optional local-development HMR switch.
      // File watching follows the same development-only switch.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
