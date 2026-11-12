// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { loadSitemapLastmod } from './src/lib/sitemap-lastmod.mjs';

// The config runs before Astro loads .env files; real env vars take precedence.
const fileEnv = Object.assign(
  {},
  ...['.env', '.env.local']
    .filter((file) => existsSync(file))
    .map((file) => parseEnv(readFileSync(file, 'utf8'))),
);
const lastmodFor = await loadSitemapLastmod({ ...fileEnv, ...process.env });

export default defineConfig({
  site: 'https://evenement24.com',
  output: 'static',

  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
      serialize(item) {
        const lastmod = lastmodFor(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    robotsTxt(),
  ],

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-display',
      subsets: ['latin', 'latin-ext'],
      weights: ['500', '600', '700'],
      styles: ['normal'],
    },
    {
      provider: fontProviders.google(),
      name: 'Source Sans 3',
      cssVariable: '--font-body',
      subsets: ['latin', 'latin-ext'],
      weights: ['400', '500', '600', '700'],
      styles: ['normal'],
    },
  ],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
