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
      // Use src/server.ts as the SSR entry so security headers and the
      // catastrophic-error fallback apply to every response.
      server: { entry: 'server' },
    }),
    ...(command === 'build'
      ? [
          nitro({
            preset: 'cloudflare-module',
            // Pin the compatibility date: Nitro's default ("latest") stamps the
            // local build date, which Wrangler can reject when it is past UTC midnight.
            compatibilityDate: '2026-11-14',
            cloudflare: { nodeCompat: true },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
