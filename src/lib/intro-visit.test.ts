import { expect, it } from 'vitest';
import { claimOpening } from './intro-visit';

function visit() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
}
it('plays once per visit, not again after navigating back or refreshing', () => {
  const storage = visit();
  expect(claimOpening(storage)).toBe(true);
  expect(claimOpening(storage)).toBe(false);
  expect(claimOpening(storage)).toBe(false);
});
it('allows the opening for a fresh visit', () => {
  expect(claimOpening(visit())).toBe(true);
});