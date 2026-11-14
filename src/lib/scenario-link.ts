import { lunarScenarioSchema } from './lunar-planning';
import type { LunarScenario } from './lunar-data';
export function encodeScenario(scenario: LunarScenario) { return JSON.stringify(lunarScenarioSchema.parse(scenario)); }
export function decodeScenario(value: unknown): LunarScenario | null {
  if (typeof value !== 'string' || value.length > 1000) return null;
  try { const decoded: unknown = JSON.parse(value); return lunarScenarioSchema.parse(typeof decoded === 'string' ? JSON.parse(decoded) : decoded); } catch { return null; }
}