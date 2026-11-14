import { createServerFn } from "@tanstack/react-start";
import { inspectPage, type PageAudit } from "./seo-audit";

const origin = "https://synexiss.site";
async function readPublic(url: string) {
  const { readBoundedText } = await import("./bounded-response.server");
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "text/html, application/xml" },
  });
  const text = await readBoundedText(response, 2_000_000);
  return { response, text };
}

export const getSeoAudit = createServerFn({ method: "GET" }).handler(async () => {
  const { load } = await import("cheerio/slim");
  const checkedAt = new Date().toISOString();
  try {
    const sitemap = await readPublic(`${origin}/sitemap.xml`);
    if (!sitemap.response.ok) throw new Error("The published sitemap could not be read.");
    const $ = load(sitemap.text, { xmlMode: true });
    const urls = [
      ...new Set(
        $("loc")
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
    if (!urls.length) throw new Error("No public pages found in the published sitemap.");
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
                error: "Page could not be retrieved. Retry or check the published URL.",
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
      error: error instanceof Error ? error.message : "Audit unavailable.",
    };
  }
});
