import metadata from '@/assets/lola-south-metadata.json';

export const TERRAIN_META = metadata;
import expandedMetadata from '@/assets/lola-south-expanded-metadata.json';
const R = metadata.radiusM;
const rad = Math.PI / 180;
export type TerrainGrid = { heights: Int16Array; width: number; spacingM: number; centerPixel: number; centerPixelY?: number; tileSha256?: string; scaleM: number };
export function terrainMetadata(grid: TerrainGrid) { return grid.tileSha256 === expandedMetadata.tileSha256 ? expandedMetadata : metadata; }
export type TerrainPoint = { latitude: number; longitude: number };
export type TerrainHorizon = { angles: number[]; radiusM: number; observerHeightM: number; elevationM: number; tileSha256?: string; coverageWidthM?: number };

// Catalog forward X/Y: South longitude 0 is toward decreasing row;
// longitude 90E is toward increasing column. Do not use the inconsistent
// final inverse SIGN(LAT) formula in the catalog; invert its forward equations.
export function projectSouth(latitude: number, longitude: number) {
  const rho = 2 * R * Math.tan((90 + latitude) * rad / 2);
  return { x: rho * Math.sin(longitude * rad), y: rho * Math.cos(longitude * rad) };
}
export function unprojectSouth(x: number, y: number): TerrainPoint {
  return { latitude: -90 + 2 * Math.atan(Math.hypot(x, y) / (2 * R)) / rad, longitude: Math.atan2(x, y) / rad };
}
export function terrainElevation(grid: TerrainGrid, point: TerrainPoint): number | null {
  if (point.latitude < -90 || point.latitude > -85 || !Number.isFinite(point.longitude)) return null;
  const { x, y } = projectSouth(point.latitude, point.longitude);
  const col = x / grid.spacingM + grid.centerPixel, row = (grid.centerPixelY ?? grid.centerPixel) - y / grid.spacingM;
  if (col < 0 || row < 0 || col >= grid.width - 1 || row >= grid.width - 1) return null;
  const c = Math.floor(col), r = Math.floor(row), dx = col - c, dy = row - r;
  const a = grid.heights[r * grid.width + c], b = grid.heights[r * grid.width + c + 1];
  const d = grid.heights[(r + 1) * grid.width + c], e = grid.heights[(r + 1) * grid.width + c + 1];
  if (a === undefined || b === undefined || d === undefined || e === undefined) return null;
  return ((a * (1 - dx) + b * dx) * (1 - dy) + (d * (1 - dx) + e * dx) * dy) * grid.scaleM;
}
export function destination(point: TerrainPoint, distanceM: number, azimuth: number): TerrainPoint {
  const lat = point.latitude * rad, lon = point.longitude * rad, az = azimuth * rad, d = distanceM / R;
  const next = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(az));
  const lng = lon + Math.atan2(Math.sin(az) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(next));
  return { latitude: next / rad, longitude: ((lng / rad + 540) % 360) - 180 };
}
export function angularDistance(a: TerrainPoint, b: TerrainPoint) {
  const p = a.latitude * rad, q = b.latitude * rad;
  const h = Math.sin((q - p) / 2) ** 2 + Math.cos(p) * Math.cos(q) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function bearing(a: TerrainPoint, b: TerrainPoint) {
  const p = a.latitude * rad, q = b.latitude * rad, dl = (b.longitude - a.longitude) * rad;
  return (Math.atan2(Math.sin(dl) * Math.cos(q), Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(dl)) / rad + 360) % 360;
}
export function terrainHorizon(grid: TerrainGrid, point: TerrainPoint, observerHeightM = 0, radiusM = 15000): TerrainHorizon | null {
  const height = terrainElevation(grid, point);
  if (height === null || observerHeightM < 0 || !Number.isFinite(observerHeightM)) return null;
  const angles: number[] = [];
  for (let az = 0; az < 360; az++) {
    let max = -90;
    for (let d = grid.spacingM; d <= radiusM; d += grid.spacingM * 2) {
      const elevation = terrainElevation(grid, destination(point, d, az));
      if (elevation === null) return null; // No partial-horizon scientific result.
      const theta = d / R;
      const vertical = (R + elevation) * Math.cos(theta) - (R + height + observerHeightM);
      const horizontal = (R + elevation) * Math.sin(theta);
      max = Math.max(max, Math.atan2(vertical, horizontal) / rad);
    }
    angles.push(max);
  }
  return { angles, radiusM, observerHeightM, elevationM: height, tileSha256: terrainMetadata(grid).tileSha256, coverageWidthM: grid.width * grid.spacingM };
}
export function horizonAngle(horizon: TerrainHorizon, azimuth: number) {
  const az = ((azimuth % 360) + 360) % 360, i = Math.floor(az), f = az - i;
  return (horizon.angles[i] ?? 0) * (1 - f) + (horizon.angles[(i + 1) % 360] ?? 0) * f;
}
export function measureTerrain(grid: TerrainGrid, a: TerrainPoint, b: TerrainPoint, observerHeightM: number) {
  const ha = terrainElevation(grid, a), hb = terrainElevation(grid, b);
  if (ha === null || hb === null || observerHeightM < 0 || !Number.isFinite(observerHeightM)) return null;
  const theta = angularDistance(a, b), distanceM = theta * R;
  if (distanceM < grid.spacingM) return null;
  const az = bearing(a, b), count = Math.ceil(distanceM / grid.spacingM);
  let surfaceDistanceM = 0, previousHeight = ha, visible = true;
  const targetAngle = Math.atan2((R + hb + observerHeightM) * Math.cos(theta) - (R + ha + observerHeightM), (R + hb + observerHeightM) * Math.sin(theta));
  for (let i = 1; i <= count; i++) {
    const d = distanceM * i / count, h = terrainElevation(grid, destination(a, d, az));
    if (h === null) return null;
    surfaceDistanceM += Math.hypot(distanceM / count, h - previousHeight); previousHeight = h;
    if (i < count) {
      const t = d / R;
      const angle = Math.atan2((R + h) * Math.cos(t) - (R + ha + observerHeightM), (R + h) * Math.sin(t));
      if (angle >= targetAngle) visible = false;
    }
  }
  return { distanceM, surfaceDistanceM, heightDifferenceM: hb - ha, slopeDegrees: Math.atan2(hb - ha, distanceM) / rad, visible };
}