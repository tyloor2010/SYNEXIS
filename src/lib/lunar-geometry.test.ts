import { describe, expect, it } from 'vitest';
import { bodyPosition, coordinatesFromPoint, elevationAt, surfaceNormal } from './lunar-geometry';

describe('spherical lunar geometry', () => {
  it('preserves east-positive coordinates for map selection', () => {
    const point = surfaceNormal(-89.5, 30);
    expect(coordinatesFromPoint(point).latitude).toBeCloseTo(-89.5, 8);
    expect(coordinatesFromPoint(point).longitude).toBeCloseTo(30, 8);
  });
  it('reconstructs the authentic source elevation at its observer location', () => {
    const site = { name: 'Apollo 11', latitude: 0.67416, longitude: 23.47314, date: '2026-11-08' };
    const body = bodyPosition(
      {
        time: '2026-Nov-08 00:00',
        azimuth: 286.180012,
        elevation: 70.580715,
        rangeKm: 0.0026212572705 * 149597870.7,
      },
      site,
    );
    expect(body).not.toBeNull();
    if (!body) throw new Error('Missing position');
    expect(elevationAt(surfaceNormal(site.latitude, site.longitude), body)).toBeCloseTo(
      70.580715,
      8,
    );
    expect(elevationAt(surfaceNormal(-site.latitude, site.longitude - 180), body)).toBeLessThan(0);
  });
  it('never constructs body positions without authentic range data', () => {
    expect(
      bodyPosition(
        { time: 'x', elevation: 10, azimuth: 20 },
        { name: 'x', latitude: 0, longitude: 0, date: '2026-11-08' },
      ),
    ).toBeNull();
  });
});
