import { createServerFn } from '@tanstack/react-start';
import { inspectPage, type PageAudit } from './seo-audit';

const origin = 'https://synexiss.site';
const CACHE_TTL_MS = 5 * 60_000;
const ERROR_TTL_MS = 60_000;

type Audit = {
  checkedAt: string;
  pages: PageAudit[];
  totalPages: number;
  error: string | null;
};

let cached: { value: Audit; expiresAt: number } | null = null;
let inFlight: Promise<Audit> | null = null;

async function readPublic(url: string) {
  const { readBoundedText } = await import('./bounded-response.server');
  const response = await fetch(url, {
    // Cloudflare Workers rejects "error". "manual" is supported, and rejecting
    // redirects explicitly keeps the audit pinned to the published origin.
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers: { Accept: 'text/html, application/xml' },
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error('The published page returned an unexpected redirect.');
  }
  const text = await readBoundedText(response, 2_000_000);
  return { response, text };
}

async function runAudit(): Promise<Audit> {
  const checkedAt = new Date().toISOString();
  try {
    const { load } = await import('cheerio/slim');
    const sitemap = await readPublic(`${origin}/sitemap.xml`);
    if (!sitemap.response.ok) throw new Error('The published sitemap could not be read.');
    const $ = load(sitemap.text, { xmlMode: true });
    const urls = [
      ...new Set(
        $('loc')
          .map((_, el) => $(el).text().trim())
          .get(),
      ),
    ].filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.origin === origin && !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    });
    if (!urls.length) throw new Error('No public pages found in the published sitemap.');
    const pages: PageAudit[] = [];
    // Bound work and concurrency; never fetch arbitrary user-provided URLs.
    for (let i = 0; i < Math.min(urls.length, 50); i += 5) {
      pages.push(
        ...(await Promise.all(
          urls.slice(i, Math.min(i + 5, 50)).map(async (url) => {
            try {
              const { response, text } = await readPublic(url);
              if (!response.ok)
                return {
                  url,
                  httpStatus: response.status,
                  checks: [],
                  error: `Page returned HTTP ${response.status}.`,
                };
              return inspectPage(text, url, response.status);
            } catch {
              return {
                url,
                httpStatus: null,
                checks: [],
                error: 'Page could not be retrieved. Retry or check the published URL.',
              };
            }
          }),
        )),
      );
    }
    return { checkedAt, pages, totalPages: urls.length, error: null };
  } catch (error) {
    return {
      checkedAt,
      pages: [] as PageAudit[],
      totalPages: 0,
      error: error instanceof Error ? error.message : 'Audit unavailable.',
    };
  }
}

export const getSeoAudit = createServerFn({ method: 'GET' }).handler(async (): Promise<Audit> => {
  const { allowRequest } = await import('./request-guard.server');
  if (!allowRequest('seo-audit', 12, 60_000)) {
    return {
      checkedAt: new Date().toISOString(),
      pages: [],
      totalPages: 0,
      error: 'Too many audit requests. Wait a minute and try again.',
    };
  }

  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  if (inFlight) return inFlight;

  const work = runAudit().then((value) => {
    cached = {
      value,
      expiresAt: Date.now() + (value.error ? ERROR_TTL_MS : CACHE_TTL_MS),
    };
    return value;
  });
  inFlight = work;
  try {
    return await work;
  } finally {
    inFlight = null;
  }
});
