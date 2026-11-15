import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('upstream redirect policy', () => {
  it('never uses the redirect mode Cloudflare Workers rejects', () => {
    for (const path of ['lunar.functions.ts', 'seo-audit.functions.ts']) {
      const source = read(`./${path}`);
      expect(source).not.toMatch(/redirect:\s*["']error["']/);
      expect(source).toMatch(/redirect:\s*["']manual["']/);
    }
  });
});
