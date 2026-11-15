import { expect, it } from 'vitest';
import { LANDING_SITES, findLandingSite } from './landing-sites';
it('preserves existing sites and uses independently sourced Malapert coordinates', () => {
  expect(LANDING_SITES.map((s) => s.id)).toEqual(['apollo11', 'apollo17', 'south', 'malapert']);
  expect(findLandingSite('malapert')?.latitude).toBe(-85.99);
  expect(findLandingSite('malapert')?.longitude).toBe(-2.93);
  expect(findLandingSite('malapert')?.sources).toHaveLength(2);
});
