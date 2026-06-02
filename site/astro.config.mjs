// @ts-check
import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

// https://astro.build/config
// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    mdx(),
  ],
  // Si déployé sur un sous-chemin (ex: GitHub Pages), ajuster :
  // site: "https://exemple.com",
  // base: "/ift3225",
  markdown: {
    shikiConfig: {
      theme: "catppuccin-mocha",
      wrap: false,
    },
  },
});
