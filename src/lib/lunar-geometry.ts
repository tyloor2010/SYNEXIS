import type { HorizonSample, LunarScenario } from './lunar-data';

export const MOON_RADIUS_KM = 1737.4;
export type Vec3 = [number, number, number];
const radians = (degrees: number) => (degrees * Math.PI) / 180;
export function surfaceNormal(latitude: number, longitude: number): Vec3 {
  const lat = radians(latitude),
    lon = radians(longitude);
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon)];
}
export function coordinatesFromPoint(point: Vec3) {
  const length = Math.hypot(...point);
  return {
    latitude: (Math.asin(Math.max(-1, Math.min(1, point[1] / length))) * 180) / Math.PI,
    longitude: (Math.atan2(-point[2], point[0]) * 180) / Math.PI,
  };
}
// Reconstruct the body's apparent position from observer azimuth/elevation/range.
// Moon-fixed spherical geometry, not a SPICE terrain/occultation solution.
export function bodyPosition(sample: HorizonSample | undefined, site: LunarScenario): Vec3 | null {
  if (!sample?.rangeKm) return null;
  const lat = radians(site.latitude),
    lon = radians(site.longitude);
  const up = surfaceNormal(site.latitude, site.longitude);
  const east: Vec3 = [-Math.sin(lon), 0, -Math.cos(lon)];
  const north: Vec3 = [
    -Math.sin(lat) * Math.cos(lon),
    Math.cos(lat),
    Math.sin(lat) * Math.sin(lon),
  ];
  const az = radians(sample.azimuth),
    el = radians(sample.elevation);
  return up.map(
    (v, i) =>
      v * (1 + (site.observerElevationKm ?? 0) / MOON_RADIUS_KM) +
      ((sample.rangeKm ?? 0) / MOON_RADIUS_KM) *
        ((east[i] ?? 0) * Math.cos(el) * Math.sin(az) +
          (north[i] ?? 0) * Math.cos(el) * Math.cos(az) +
          v * Math.sin(el)),
  ) as Vec3;
}
export function elevationAt(normal: Vec3, body: Vec3): number {
  const d: Vec3 = [body[0] - normal[0], body[1] - normal[1], body[2] - normal[2]];
  const dot = (normal[0] * d[0] + normal[1] * d[1] + normal[2] * d[2]) / Math.hypot(...d);
  return (Math.asin(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI;
}
