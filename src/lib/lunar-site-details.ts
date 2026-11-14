import type { LunarResult } from './lunar-data';
import { bodyPosition, elevationAt, MOON_RADIUS_KM, surfaceNormal } from './lunar-geometry';

// Fraction of normal-incidence sunlight intercepted by a horizontal surface.
// Not irradiance, electrical output, or a terrain/eclipses solution.
export function sunlightIncidence(elevation: number) {
  return Math.max(0, Math.sin(elevation * Math.PI / 180));
}

export function siteDetails(result: LunarResult | null, hour: number, latitude: number, longitude: number) {
  if (result?.status !== 'connected') return null;
  const sun = bodyPosition(result.sun[hour], result.scenario);
  const earth = bodyPosition(result.earth[hour], result.scenario);
  if (!sun || !earth) return null;
  const normal = surfaceNormal(latitude, longitude);
  const sunElevation = elevationAt(normal, sun);
  const earthElevation = elevationAt(normal, earth);
  const earthRangeKm = Math.hypot(...earth.map((v, i) => v - (normal[i] ?? 0))) * MOON_RADIUS_KM;
  return { sunElevation, earthElevation, earthRangeKm, sunlight: sunlightIncidence(sunElevation), earthVisible: earthElevation > 0 };
}

export type RadioSpecifications = { frequencyGHz: number; transmitPowerW: number; transmitGainDbi: number; receiveGainDbi: number; lossesDb: number; receiverThresholdDbm: number };
// Ideal free-space Friis link model. Gains must be in the actual link direction.
// User-supplied losses may include pointing, polarization and hardware losses.
export function radioLink(rangeKm: number, earthElevation: number, specs: RadioSpecifications) {
  if (![rangeKm, earthElevation, ...Object.values(specs)].every(Number.isFinite) || rangeKm <= 0 || specs.frequencyGHz <= 0 || specs.transmitPowerW <= 0 || specs.lossesDb < 0 || earthElevation <= 0) return null;
  const wavelengthM = 299792458 / (specs.frequencyGHz * 1e9);
  const freeSpaceLossDb = 20 * Math.log10(4 * Math.PI * rangeKm * 1000 / wavelengthM);
  const receivedPowerDbm = 10 * Math.log10(specs.transmitPowerW * 1000) + specs.transmitGainDbi + specs.receiveGainDbi - freeSpaceLossDb - specs.lossesDb;
  return { freeSpaceLossDb, receivedPowerDbm, marginDb: receivedPowerDbm - specs.receiverThresholdDbm };
}