import { it, expect } from 'vitest';
import { executeSeleneTool, executeSeleneRequests, type SeleneContext } from './selene-tools';
const context: SeleneContext = { grid: null, result: null, horizon: null, specifications: null };
it('rejects write actions and unknown tools', () => {
  expect(() => executeSeleneTool('save_scenario', {}, context)).toThrow('not allowed');
});
it('enforces four tools outside the model', () => {
  expect(() =>
    executeSeleneRequests(
      Array.from({ length: 5 }, () => ({ name: 'earth_windows', input: {} })),
      context,
    ),
  ).toThrow('four');
  expect(
    executeSeleneRequests(
      Array.from({ length: 4 }, () => ({ name: 'earth_windows', input: {} })),
      context,
    ),
  ).toHaveLength(4);
});
it('returns null for absent terrain without fabricated heights', () => {
  expect(
    executeSeleneTool('elevation_at', { latitude: -89.5, longitude: 0 }, context).value,
  ).toBeNull();
});
it('validates coordinate boundaries before calculations', () => {
  expect(() =>
    executeSeleneTool(
      'geodesic_distance',
      { a: { latitude: 91, longitude: 0 }, b: { latitude: 0, longitude: 0 } },
      context,
    ),
  ).toThrow();
});
