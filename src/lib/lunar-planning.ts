import { z } from 'zod';
import type { HorizonSample, LunarResult } from './lunar-data';
import { horizonAngle, type TerrainHorizon } from './lunar-terrain';

export const MAX_SCENARIOS = 4;
export const MAX_MISSION_HOURS = 168;
export function appendScenario<T>(items: T[], scenario: T): T[] { return items.length < MAX_SCENARIOS ? [...items, scenario] : items; }
export const lunarScenarioSchema = z.object({ name: z.string().min(1).max(100), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startHour: z.number().int().min(0).max(23).default(0), durationHours: z.number().int().min(1).max(MAX_MISSION_HOURS).default(24), observerElevationKm: z.number().min(-20).max(20).default(0), observerHeightM: z.number().min(0).max(100).default(0) });

// Linear crossing estimate within each source interval, never sample counts.
export function visibilityWindow(samples: HorizonSample[], horizon: TerrainHorizon | null, from = 0) {
  const elevations = samples.map(s => s.elevation - (horizon ? horizonAngle(horizon, s.azimuth) : 0));
  let hours = 0;
  let nextSetting: { earliestHours: number; latestHours: number } | null = null;
  for (let i = 0; i < elevations.length - 1; i++) {
    const a = elevations[i] ?? 0, b = elevations[i + 1] ?? 0;
    hours += a > 0 && b > 0 ? 1 : a <= 0 && b <= 0 ? 0 : a > 0 ? a / (a - b) : b / (b - a);
    if (i >= from && !nextSetting && a > 0 && b <= 0) nextSetting = { earliestHours: i - from, latestHours: i + 1 - from };
  }
  return { hours, durationHours: Math.max(0, samples.length - 1), nextSetting, currentlyVisible: (elevations[from] ?? -90) > 0, elevations };
}
export const powerFields = [
  ['loadW', 'Electrical load · W'], ['areaM2', 'Solar array area · m²'], ['efficiencyPct', 'Array conversion efficiency · %'],
  ['irradianceWm2', 'Normal-incidence solar irradiance · W/m²'], ['lossPct', 'Other generation losses · %'],
  ['tiltDegrees', 'Panel tilt from horizontal · °'], ['azimuthDegrees', 'Panel outward azimuth · ° clockwise from north'],
  ['capacityWh', 'Battery capacity · Wh'], ['initialPct', 'Starting charge · %'], ['reservePct', 'Minimum usable charge · %'],
  ['chargeEfficiencyPct', 'Charging efficiency · %'], ['dischargeEfficiencyPct', 'Discharging efficiency · %'],
] as const;
export type PowerSpecifications = Record<typeof powerFields[number][0], number>;
export function parsePowerInputs(inputs: Record<string, string>): PowerSpecifications | null {
  if (powerFields.some(([key]) => !inputs[key]?.trim() || !Number.isFinite(Number(inputs[key])))) return null;
  const v = Object.fromEntries(powerFields.map(([key]) => [key, Number(inputs[key])])) as PowerSpecifications;
  if (v.loadW < 0 || v.areaM2 <= 0 || v.irradianceWm2 <= 0 || v.capacityWh <= 0 || v.tiltDegrees < 0 || v.tiltDegrees > 180 || v.azimuthDegrees < 0 || v.azimuthDegrees > 360 || v.lossPct < 0 || v.lossPct >= 100) return null;
  if ([v.efficiencyPct, v.chargeEfficiencyPct, v.dischargeEfficiencyPct].some(x => x <= 0 || x > 100) || v.initialPct > 100 || v.reservePct < 0 || v.reservePct > v.initialPct) return null;
  return v;
}
export function powerBudget(result: LunarResult, horizon: TerrainHorizon | null, specs: PowerSpecifications) {
  const rad = Math.PI / 180;
  const generation = result.sun.map(s => {
    if (s.elevation <= (horizon ? horizonAngle(horizon, s.azimuth) : 0)) return 0;
    const incidence = Math.max(0, Math.sin(s.elevation * rad) * Math.cos(specs.tiltDegrees * rad) + Math.cos(s.elevation * rad) * Math.sin(specs.tiltDegrees * rad) * Math.cos((s.azimuth - specs.azimuthDegrees) * rad));
    return specs.irradianceWm2 * specs.areaM2 * specs.efficiencyPct / 100 * (1 - specs.lossPct / 100) * incidence;
  });
  let chargeWh = specs.capacityWh * specs.initialPct / 100, minChargeWh = chargeWh, generatedWh = 0, deficitWh = 0;
  const reserve = specs.capacityWh * specs.reservePct / 100;
  const history = [chargeWh];
  for (let i = 0; i < generation.length - 1; i++) {
    // Substeps avoid cancellation of daylight charging against dark-period load.
    for (let j = 0; j < 60; j++) {
      const p = (generation[i] ?? 0) + ((generation[i + 1] ?? 0) - (generation[i] ?? 0)) * ((j + .5) / 60);
      generatedWh += p / 60;
      const net = (p - specs.loadW) / 60;
      chargeWh += net >= 0 ? net * specs.chargeEfficiencyPct / 100 : net / (specs.dischargeEfficiencyPct / 100);
      if (chargeWh < reserve) { deficitWh += reserve - chargeWh; chargeWh = reserve; }
      chargeWh = Math.min(specs.capacityWh, chargeWh); minChargeWh = Math.min(minChargeWh, chargeWh);
    }
    history.push(chargeWh);
  }
  return { generatedWh, demandWh: specs.loadW * Math.max(0, result.sun.length - 1), minChargeWh, deficitWh, history, status: !horizon ? 'insufficient data' : deficitWh > 0 ? 'requirements not met' : 'requirements met under this model' };
}

export function sizeMission(result: LunarResult, horizon: TerrainHorizon | null, specs: PowerSpecifications) {
  if (!horizon) return null;
  const solve = (field: 'capacityWh' | 'areaM2', upper: number) => {
    let high = specs[field], low = 0;
    while (powerBudget(result, horizon, { ...specs, [field]: high }).deficitWh > 1e-6 && high < upper) high = Math.min(upper, high * 2);
    if (powerBudget(result, horizon, { ...specs, [field]: high }).deficitWh > 1e-6) return null;
    for (let i = 0; i < 40; i++) { const middle = (low + high) / 2; if (powerBudget(result, horizon, { ...specs, [field]: middle }).deficitWh > 1e-6) low = middle; else high = middle; }
    return high;
  };
  return { requiredBatteryWh: solve('capacityWh', 1e9), requiredArrayM2: solve('areaM2', 1e6), method: 'Bisection under the same hourly/minute battery model; vary one input while holding all others fixed. Battery ≤ 1 GWh; array ≤ 1,000,000 m². No feasible value within bounds returns unavailable, not infinity.' };
}