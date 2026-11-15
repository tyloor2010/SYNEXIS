import { expect, it } from 'vitest';
import snapshot from '@/assets/lunar-reference-snapshot.json';
import { readPlanningStorage, validStoredResult } from './planning-storage';
it('keeps authentic results and at most four stored comparisons', () => {
  expect(validStoredResult(snapshot)).toBe(true);
  expect(
    readPlanningStorage(JSON.stringify({ saved: Array(5).fill(snapshot) })).saved,
  ).toHaveLength(4);
});
it('rejects null samples without breaking remaining valid scenarios', () => {
  const broken = { ...snapshot, sun: [null, ...snapshot.sun.slice(1)] };
  expect(validStoredResult(broken)).toBe(false);
  expect(readPlanningStorage(JSON.stringify({ saved: [broken, snapshot] })).saved).toHaveLength(1);
  expect(readPlanningStorage('null')).toEqual({ current: null, saved: [] });
});
it('does not parse oversized storage', () => {
  expect(readPlanningStorage(' '.repeat(1_000_001)).current).toBeNull();
});
