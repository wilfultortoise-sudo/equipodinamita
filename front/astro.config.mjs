import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
//import { size } from 'astro:schema';
// https://astro.build/config
export default defineConfig({
  integrations: [react()]
}); 

