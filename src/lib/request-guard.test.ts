import { describe, expect, it } from 'vitest';
import { consumeRateLimit } from './request-guard.server';

describe('request guard', () => {
  it('allows the configured number of requests in a window', () => {
    const key = `test-${Math.random()}`;
    expect(consumeRateLimit(key, 2, 1_000, 1_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 1_000, 1_000)).toBe(true);
    expect(consumeRateLimit(key, 2, 1_000, 1_000)).toBe(false);
  });
  it('resets after the window and rejects invalid limits', () => {
    const key = `test-${Math.random()}`;
    expect(consumeRateLimit(key, 1, 1_000, 1_000)).toBe(true);
    expect(consumeRateLimit(key, 1, 1_000, 2_001)).toBe(true);
    expect(consumeRateLimit(key, 0, 1_000, 2_001)).toBe(false);
  });
});
