import { getRequestIP } from '@tanstack/react-start/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Small in-isolate fixed-window limiter. It is not a global quota, but it
 * prevents a single client from hammering the upstream service from one edge
 * isolate. Place a platform/WAF rate limit in front for a hard guarantee.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(limit) || limit <= 0 || windowMs <= 0) return false;
  if (buckets.size > 2_000) {
    for (const [candidate, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(candidate);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function allowRequest(scope: string, limit: number, windowMs: number): boolean {
  let ip = 'unknown';
  try {
    ip = getRequestIP({ xForwardedFor: true }) ?? 'unknown';
  } catch {
    // A non-request context (for example a test) still gets a bounded bucket.
  }
  return consumeRateLimit(`${scope}:${ip}`, limit, windowMs);
}
