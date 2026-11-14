import { it, expect } from 'vitest';
import { visibilityIntervals } from './lunar-windows';
it('joins hourly darkness and interpolates crossings without counting endpoints as hours', () => {
  const samples = [1, -1, -1, 1].map(elevation => ({ elevation, azimuth: 0, time: 'source' }));
  const result = visibilityIntervals(samples, null);
  expect(result.visibleHours).toBe(1); expect(result.longestHiddenHours).toBe(2); expect(result.visiblePct).toBeCloseTo(100 / 3);
  expect(result.intervals).toEqual([{ startHours: 0, endHours: .5, visible: true }, { startHours: .5, endHours: 2.5, visible: false }, { startHours: 2.5, endHours: 3, visible: true }]);
});
it('reports a full 24 hour darkness interval from 25 source samples', () => { expect(visibilityIntervals(Array.from({ length: 25 }, () => ({ elevation: -1, azimuth: 0, time: 'source' })), null).longestHiddenHours).toBe(24); });