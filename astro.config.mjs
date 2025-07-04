// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Tryb hybrid: statyczne strony + SSR dla oznaczonych prerender=false
  output: 'server',
  adapter: node({
    mode: 'middleware'
  }),
  integrations: [react()],
  experimental: {
    session: true
  },

  vite: {
    plugins: [tailwindcss()]
  }
});