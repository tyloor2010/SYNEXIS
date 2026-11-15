import type { HorizonSample } from './lunar-data';
import { horizonAngle, type TerrainHorizon } from './lunar-terrain';
export type VisibilityInterval = { startHours: number; endHours: number; visible: boolean };
export function visibilityIntervals(samples: HorizonSample[], horizon: TerrainHorizon | null) {
  const intervals: VisibilityInterval[] = [];
  const append = (startHours: number, endHours: number, visible: boolean) => {
    if (endHours <= startHours) return;
    const last = intervals[intervals.length - 1];
    if (last && last.visible === visible && Math.abs(last.endHours - startHours) < 1e-9)
      last.endHours = endHours;
    else intervals.push({ startHours, endHours, visible });
  };
  const elevations = samples.map(
    (s) => s.elevation - (horizon ? horizonAngle(horizon, s.azimuth) : 0),
  );
  for (let i = 0; i < elevations.length - 1; i++) {
    const a = elevations[i],
      b = elevations[i + 1];
    if (a === undefined || b === undefined) continue;
    if (a > 0 === b > 0) append(i, i + 1, a > 0);
    else {
      const crossing = i + a / (a - b);
      append(i, crossing, a > 0);
      append(crossing, i + 1, b > 0);
    }
  }
  const visibleHours = intervals
    .filter((v) => v.visible)
    .reduce((sum, v) => sum + v.endHours - v.startHours, 0);
  const durationHours = Math.max(0, samples.length - 1);
  const longestHiddenHours = intervals
    .filter((v) => !v.visible)
    .reduce((max, v) => Math.max(max, v.endHours - v.startHours), 0);
  return {
    intervals,
    visibleHours,
    durationHours,
    visiblePct: durationHours ? (visibleHours / durationHours) * 100 : null,
    longestHiddenHours,
  };
}
