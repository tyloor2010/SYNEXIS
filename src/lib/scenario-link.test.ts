import { it, expect } from 'vitest';
import { encodeScenario, decodeScenario } from './scenario-link';
it('shares inputs not invented measurements', () => {
  const value = decodeScenario(
    encodeScenario({
      name: 'South reference',
      latitude: -89.5,
      longitude: 0,
      date: '2026-11-14',
      durationHours: 48,
    }),
  );
  expect(value?.durationHours).toBe(48);
  expect(value?.latitude).toBe(-89.5);
});
it('rejects invalid shared coordinates and oversized inputs', () => {
  expect(
    decodeScenario(JSON.stringify({ name: 'x', latitude: 100, longitude: 0, date: '2026-11-14' })),
  ).toBeNull();
  expect(decodeScenario('a'.repeat(1001))).toBeNull();
});
it('accepts TanStack serialized string search values as the same validated input', () => {
  expect(
    decodeScenario(
      JSON.stringify(
        encodeScenario({
          name: 'Malapert',
          latitude: -85.99,
          longitude: -2.93,
          date: '2026-11-14',
        }),
      ),
    )?.latitude,
  ).toBe(-85.99);
});
