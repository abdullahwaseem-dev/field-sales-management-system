import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dark, light } from '@sfms/tokens';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const brandDir = fileURLToPath(new URL('../../packages/brand/interim/', import.meta.url));
const publicDir = fileURLToPath(new URL('./public/', import.meta.url));

/** Injects token colours into index.html's pre-paint script and syncs favicons from @sfms/brand. */
function zonaHtml(): Plugin {
  return {
    name: 'zona-html',
    buildStart() {
      mkdirSync(publicDir, { recursive: true });
      for (const f of ['favicon.ico', 'favicon-32.png']) copyFileSync(brandDir + f, publicDir + f);
    },
    transformIndexHtml: (html) =>
      html
        .replaceAll('__ZONA_CANVAS_LIGHT__', light.color.canvas)
        .replaceAll('__ZONA_CANVAS_DARK__', dark.color.canvas)
        .replaceAll('__ZONA_SURFACE_LIGHT__', light.color.surface),
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), zonaHtml()],
  // Read the repo-root .env; only VITE_-prefixed values ever reach the browser bundle.
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Dev: the portal calls /api on its own origin; Vite forwards to the API (no CORS, same as production behind one host).
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000', '/p/': 'http://localhost:3000' } },
});
