import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      // Keep the custom SSR entry so security headers and the
      // catastrophic-error fallback apply to every response.
      server: { entry: 'server' },
    }),
    ...(command === 'build' ? [nitro({ preset: 'vercel' })] : []),
    viteReact(),
  ],
}));
