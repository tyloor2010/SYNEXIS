import { describe, expect, it } from 'vitest';
import {
  appendScenario,
  lunarScenarioSchema,
  MAX_SCENARIOS,
  parsePowerInputs,
  powerBudget,
  sizeMission,
  visibilityWindow,
  type PowerSpecifications,
} from './lunar-planning';
import type { LunarResult } from './lunar-data';
describe('Mission planning rules', () => {
  it('limits comparisons to four scenarios', () => {
    expect(MAX_SCENARIOS).toBe(4);
    expect(appendScenario([1, 2, 3], 4)).toEqual([1, 2, 3, 4]);
    expect(appendScenario([1, 2, 3, 4], 5)).toEqual([1, 2, 3, 4]);
  });
  it('accepts bounded durations and rejects invalid duration', () => {
    const base = { name: 'Test', latitude: -89.5, longitude: 0, date: '2026-11-14' };
    expect(lunarScenarioSchema.parse({ ...base, durationHours: 72 }).durationHours).toBe(72);
    expect(lunarScenarioSchema.safeParse({ ...base, durationHours: 0 }).success).toBe(false);
    expect(lunarScenarioSchema.safeParse({ ...base, durationHours: 169 }).success).toBe(false);
  });
  it('25 hourly samples represent 24 hours, not 25', () => {
    expect(
      visibilityWindow(
        Array.from({ length: 25 }, () => ({ time: 'source', azimuth: 0, elevation: 1 })),
        null,
      ).hours,
    ).toBe(24);
  });
  it('integrates a crossing and reports a bracket', () => {
    const window = visibilityWindow(
      [1, -1].map((elevation) => ({ time: 'source', azimuth: 0, elevation })),
      null,
    );
    expect(window.hours).toBe(0.5);
    expect(window.nextSetting).toEqual({ earliestHours: 0, latestHours: 1 });
  });
  it('withholds power specifications when mission inputs are missing', () => {
    expect(parsePowerInputs({ loadW: '20' })).toBeNull();
  });
  it('reports battery depletion concretely and cannot certify missing terrain', () => {
    const result: LunarResult = {
      status: 'connected',
      scenario: { name: 'Test', date: '2026-11-14', latitude: -90, longitude: 0 },
      sun: Array.from({ length: 3 }, () => ({ time: 'source', azimuth: 0, elevation: -1 })),
      earth: [],
      retrievedAt: null,
      message: '',
    };
    const specs: PowerSpecifications = {
      loadW: 100,
      areaM2: 1,
      efficiencyPct: 20,
      irradianceWm2: 1300,
      lossPct: 0,
      tiltDegrees: 0,
      azimuthDegrees: 0,
      capacityWh: 100,
      initialPct: 100,
      reservePct: 0,
      chargeEfficiencyPct: 100,
      dischargeEfficiencyPct: 100,
    };
    const budget = powerBudget(
      result,
      { angles: Array(360).fill(0), radiusM: 15000, elevationM: 0, observerHeightM: 0 },
      specs,
    );
    expect(budget.demandWh).toBe(200);
    expect(budget.generatedWh).toBe(0);
    expect(budget.deficitWh).toBeCloseTo(100, 5);
    expect(budget.status).toBe('المتطلبات غير مستوفاة');
    expect(powerBudget(result, null, specs).status).toBe('بيانات غير كافية');
    const sized = sizeMission(
      result,
      { angles: Array(360).fill(0), radiusM: 15000, elevationM: 0, observerHeightM: 0 },
      specs,
    );
    expect(sized?.requiredBatteryWh).toBeCloseTo(200, 3);
    expect(sized?.requiredArrayM2).toBeNull();
  });
  it('reports the modeled minimum before the reserve floor', () => {
    const result: LunarResult = {
      status: 'connected',
      scenario: { name: 'Test', date: '2026-11-14', latitude: -90, longitude: 0 },
      sun: Array.from({ length: 3 }, () => ({ time: 'source', azimuth: 0, elevation: -1 })),
      earth: [],
      retrievedAt: null,
      message: '',
    };
    const horizon = {
      angles: Array(360).fill(0),
      radiusM: 15000,
      elevationM: 0,
      observerHeightM: 0,
    };
    const specs: PowerSpecifications = {
      loadW: 100,
      areaM2: 1,
      efficiencyPct: 20,
      irradianceWm2: 1300,
      lossPct: 0,
      tiltDegrees: 0,
      azimuthDegrees: 0,
      capacityWh: 100,
      initialPct: 100,
      reservePct: 40,
      chargeEfficiencyPct: 100,
      dischargeEfficiencyPct: 100,
    };
    const budget = powerBudget(result, horizon, specs);
    expect(budget.deficitWh).toBeGreaterThan(0);
    expect(budget.minChargeWh).toBeLessThan(40);
    expect(budget.minChargeWh).toBeCloseTo(100 - (37 * 100) / 60, 5);
  });
});
