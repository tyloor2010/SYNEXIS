import { z } from 'zod';
import {
  chordDistance,
  terrainProfile,
  sampledLineOfSight,
  craterCircle,
} from './lunar-measurements';
import {
  bearing,
  angularDistance,
  terrainElevation,
  type TerrainGrid,
  type TerrainHorizon,
} from './lunar-terrain';
import { visibilityIntervals } from './lunar-windows';
import { powerBudget, sizeMission, type PowerSpecifications } from './lunar-planning';
import type { LunarResult } from './lunar-data';

const point = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
const pair = z.object({ a: point, b: point });
export const SELENE_TOOL_NAMES = [
  'geodesic_distance',
  'elevation_at',
  'terrain_profile',
  'line_of_sight',
  'illumination_windows',
  'earth_windows',
  'mission_sizing',
  'crater_measure',
] as const;
export type SeleneContext = {
  grid: TerrainGrid | null;
  result: LunarResult | null;
  horizon: TerrainHorizon | null;
  specifications: PowerSpecifications | null;
};
export function executeSeleneTool(name: string, input: unknown, context: SeleneContext) {
  const output = (value: unknown, unit: string, method: string, source: string) => ({
    value,
    unit,
    method,
    source,
    uncertainty: 'يتحدد حسب تباعد المصدر والعينات الزمنية وافتراضات النموذج؛ ليس شهادة مهمة.',
  });
  switch (name) {
    case 'geodesic_distance': {
      const { a, b } = pair.parse(input);
      return output(
        {
          surfaceM: angularDistance(a, b) * 1737400,
          chordM: chordDistance(a, b),
          bearingDegrees: bearing(a, b),
        },
        'm, degrees',
        'Reference sphere R=1737400 m; haversine and spherical chord',
        'COMPUTED',
      );
    }
    case 'elevation_at': {
      const p = point.parse(input);
      return output(
        context.grid ? terrainElevation(context.grid, p) : null,
        'm',
        'Bilinear signed 40 m LOLA crop; null outside coverage',
        'NASA/LRO/LOLA 40 m',
      );
    }
    case 'terrain_profile': {
      const args = z.object({ points: z.array(point).min(2).max(50) }).parse(input);
      return output(
        context.grid ? terrainProfile(context.grid, args.points) : null,
        'm, degrees',
        '40 m sampled great-circle polyline; maximum 500 km',
        'NASA/LRO/LOLA + COMPUTED',
      );
    }
    case 'line_of_sight': {
      const args = pair.extend({ observerHeightM: z.number().min(0).max(100) }).parse(input);
      const profile = context.grid ? terrainProfile(context.grid, [args.a, args.b]) : null;
      return output(
        profile ? sampledLineOfSight(profile, args.observerHeightM) : null,
        'm, boolean',
        'Spherical Cartesian sampled terrain clearance',
        'NASA/LRO/LOLA + COMPUTED',
      );
    }
    case 'illumination_windows':
    case 'earth_windows': {
      z.object({}).strict().parse(input);
      return output(
        context.result
          ? visibilityIntervals(
              name === 'earth_windows' ? context.result.earth : context.result.sun,
              context.horizon,
            )
          : null,
        'hours, percent',
        context.horizon
          ? 'Hourly linear center-direction crossings above sampled horizon'
          : 'Spherical only; terrain unavailable',
        'NASA/JPL Horizons + COMPUTED',
      );
    }
    case 'mission_sizing': {
      z.object({}).strict().parse(input);
      return output(
        context.result && context.specifications
          ? {
              budget: powerBudget(context.result, context.horizon, context.specifications),
              sizing: sizeMission(context.result, context.horizon, context.specifications),
            }
          : null,
        'Wh, m²',
        'User-specified mission balance and bounded single-variable bisection',
        'COMPUTED from current source inputs',
      );
    }
    case 'crater_measure': {
      const args = z.object({ points: z.array(point).length(3) }).parse(input);
      return output(
        craterCircle(args.points),
        'm, degrees',
        'Local tangent-plane circumcircle; no inferred depth',
        'COMPUTED from user-selected points',
      );
    }
    default:
      throw new Error('Tool not allowed.');
  }
}
export function executeSeleneRequests(
  requests: { name: string; input: unknown }[],
  context: SeleneContext,
) {
  if (requests.length > 4) throw new Error('At most four computational tools per request.');
  return requests.map((request) => executeSeleneTool(request.name, request.input, context));
}
