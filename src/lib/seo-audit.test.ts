import { describe, expect, it } from 'vitest';
import { inspectPage } from './seo-audit';

describe('published page SEO audit', () => {
  it('reports missing title, description and canonical instead of inventing values', () => {
    const audit = inspectPage('<html></html>', 'https://synexiss.site/');
    expect(audit.checks.slice(0, 3).map(c => c.status)).toEqual(['fail', 'fail', 'fail']);
    expect(audit.checks[0]?.values).toEqual([]);
  });
  it('rejects duplicate metadata and malformed JSON-LD', () => {
    const audit = inspectPage('<title>One</title><title>Two</title><script type="application/ld+json">{bad}</script>', 'https://synexiss.site/');
    expect(audit.checks[0]?.status).toBe('fail');
    expect(audit.checks[3]?.status).toBe('fail');
  });
  it('recognizes a canonical and nested schema types', () => {
    const audit = inspectPage('<link rel="canonical" href="https://synexiss.site/"><script type="application/ld+json">{"@graph":[{"@type":"WebSite"}]}</script>', 'https://synexiss.site/');
    expect(audit.checks[2]?.status).toBe('pass');
    expect(audit.checks[3]?.values).toEqual(['WebSite']);
  });
});