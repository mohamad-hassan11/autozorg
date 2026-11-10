import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { normalizeSiteUrl } from './src/lib/site-url.js';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const site = normalizeSiteUrl(loadEnv(mode, process.cwd(), '').SITE_URL);

export default defineConfig({
  site: site || undefined,
  output: 'static',
  trailingSlash: 'always',
  build: { assets: 'assets', inlineStylesheets: 'never' },
  // Keep browser scripts external so Cloudflare's script-src 'self' policy permits them.
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
