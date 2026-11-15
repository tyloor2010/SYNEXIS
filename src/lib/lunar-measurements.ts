import {
  angularDistance,
  destination,
  bearing,
  terrainElevation,
  type TerrainGrid,
  type TerrainPoint,
} from './lunar-terrain';
const R = 1737400;
export function chordDistance(a: TerrainPoint, b: TerrainPoint) {
  return 2 * R * Math.sin(angularDistance(a, b) / 2);
}
export function terrainProfile(grid: TerrainGrid, points: TerrainPoint[]) {
  if (points.length < 2 || points.length > 50) return null;
  const samples: { distanceM: number; elevationM: number; latitude: number; longitude: number }[] =
    [];
  let lengthM = 0,
    maxSlopeDegrees = 0,
    surfaceDistanceM = 0;
  for (let segment = 0; segment < points.length - 1; segment++) {
    const a = points[segment],
      b = points[segment + 1];
    if (!a || !b) return null;
    const d = angularDistance(a, b) * R;
    if (d < grid.spacingM || lengthM + d > 500000) return null;
    const count = Math.ceil(d / grid.spacingM),
      az = bearing(a, b);
    for (let i = segment ? 1 : 0; i <= count; i++) {
      const point = destination(a, (d * i) / count, az),
        h = terrainElevation(grid, point);
      if (h === null) return null;
      const distanceM = lengthM + (d * i) / count,
        last = samples[samples.length - 1];
      if (last) {
        const horizontal = distanceM - last.distanceM;
        maxSlopeDegrees = Math.max(
          maxSlopeDegrees,
          Math.abs((Math.atan2(h - last.elevationM, horizontal) * 180) / Math.PI),
        );
        surfaceDistanceM += Math.hypot(horizontal, h - last.elevationM);
      }
      samples.push({ distanceM, elevationM: h, ...point });
    }
    lengthM += d;
  }
  const heights = samples.map((s) => s.elevationM);
  return {
    samples,
    lengthM,
    surfaceDistanceM,
    maxSlopeDegrees,
    minElevationM: Math.min(...heights),
    maxElevationM: Math.max(...heights),
  };
}
export function sampledLineOfSight(
  profile: NonNullable<ReturnType<typeof terrainProfile>>,
  observerHeightM: number,
) {
  if (!Number.isFinite(observerHeightM) || observerHeightM < 0) return null;
  const first = profile.samples[0],
    last = profile.samples[profile.samples.length - 1];
  if (!first || !last) return null;
  const theta = profile.lengthM / R,
    xB = (R + last.elevationM + observerHeightM) * Math.sin(theta),
    yB =
      (R + last.elevationM + observerHeightM) * Math.cos(theta) -
      (R + first.elevationM + observerHeightM);
  let clearanceM = Infinity,
    blockingPoint: typeof first | null = null;
  for (const sample of profile.samples.slice(1, -1)) {
    const t = sample.distanceM / R,
      x = (R + sample.elevationM) * Math.sin(t),
      y = (R + sample.elevationM) * Math.cos(t) - (R + first.elevationM + observerHeightM),
      clearance = (yB / xB) * x - y;
    if (clearance < clearanceM) {
      clearanceM = clearance;
      blockingPoint = clearance <= 0 ? sample : null;
    }
  }
  return {
    visible: clearanceM > 0,
    minimumClearanceM: Number.isFinite(clearanceM) ? clearanceM : null,
    blockingPoint,
  };
}
export function craterCircle(points: TerrainPoint[]) {
  if (points.length !== 3) return null;
  const origin = points[0],
    p1 = points[1],
    p2 = points[2];
  if (!origin || !p1 || !p2) return null;
  const xy = (p: TerrainPoint) => {
    const d = R * angularDistance(origin, p),
      az = (bearing(origin, p) * Math.PI) / 180;
    return { x: d * Math.sin(az), y: d * Math.cos(az) };
  };
  const a = xy(p1),
    b = xy(p2),
    determinant = 2 * (a.x * b.y - a.y * b.x);
  if (Math.abs(determinant) < 1 || Math.max(Math.hypot(a.x, a.y), Math.hypot(b.x, b.y)) > 60000)
    return null;
  const aa = a.x ** 2 + a.y ** 2,
    bb = b.x ** 2 + b.y ** 2;
  const x = (aa * b.y - bb * a.y) / determinant,
    y = (a.x * bb - b.x * aa) / determinant,
    radiusM = Math.hypot(x, y);
  return {
    diameterM: 2 * radiusM,
    center: destination(origin, radiusM, (Math.atan2(x, y) * 180) / Math.PI),
    method:
      'Local tangent-plane circumcircle of three user-selected rim points; not automatic crater detection. Depth needs an independently selected floor point.',
  };
}
