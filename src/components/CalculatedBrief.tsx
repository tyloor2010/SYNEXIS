import type { LunarResult } from '@/lib/lunar-data';
import type { TerrainHorizon } from '@/lib/lunar-terrain';
import { executeSeleneTool } from '@/lib/selene-tools';
import type { visibilityIntervals } from '@/lib/lunar-windows';
export function CalculatedBrief({ result, horizon }: { result: LunarResult; horizon: TerrainHorizon | null }) {
  const context = { result, horizon, grid: null, specifications: null };
  const sun = executeSeleneTool('illumination_windows', {}, context).value as ReturnType<typeof visibilityIntervals>;
  const earth = executeSeleneTool('earth_windows', {}, context).value as ReturnType<typeof visibilityIntervals>;
  return <details className="mt-5 border-t border-border py-4"><summary className="cursor-pointer font-soft text-lg font-bold">Selene · calculated brief</summary><p className="mt-3 text-xs leading-relaxed">For {result.scenario.name}, the evaluated {sun.durationHours} h window contains {sun.visibleHours.toFixed(1)} h of sunlight and {earth.visibleHours.toFixed(1)} h of Earth-center visibility. The longest darkness is {sun.longestHiddenHours.toFixed(1)} h; the longest Earth interruption is {earth.longestHiddenHours.toFixed(1)} h. Source: NASA/JPL Horizons{horizon ? ' and sampled NASA/LRO/LOLA terrain' : ' with a spherical horizon only; terrain coverage is unavailable'}. These are calculated screening results, not mission or communications guarantees. Energy feasibility requires your equipment inputs.</p><p className="mt-2 text-[10px] text-muted-foreground">Deterministic explanation from the current source results · no model-generated numbers.</p></details>;
}