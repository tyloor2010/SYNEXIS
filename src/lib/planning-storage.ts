import type { LunarResult } from "./lunar-data";
import { lunarScenarioSchema, MAX_SCENARIOS } from "./lunar-planning";
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export function validStoredResult(value: unknown): value is LunarResult {
  if (!record(value) || value["status"] !== "connected") return false;
  const parsed = lunarScenarioSchema.safeParse(value["scenario"]);
  if (!parsed.success || !Array.isArray(value["sun"]) || !Array.isArray(value["earth"]))
    return false;
  const count = parsed.data.durationHours + 1;
  if (value["sun"].length !== count || value["earth"].length !== count) return false;
  if (
    typeof value["message"] !== "string" ||
    value["message"].length > 1000 ||
    typeof value["retrievedAt"] !== "string" ||
    !Number.isFinite(Date.parse(value["retrievedAt"]))
  )
    return false;
  const sample = (s: unknown) =>
    record(s) &&
    typeof s["time"] === "string" &&
    s["time"].length <= 64 &&
    typeof s["azimuth"] === "number" &&
    Number.isFinite(s["azimuth"]) &&
    s["azimuth"] >= 0 &&
    s["azimuth"] <= 360 &&
    typeof s["elevation"] === "number" &&
    Number.isFinite(s["elevation"]) &&
    Math.abs(s["elevation"]) <= 90 &&
    typeof s["rangeKm"] === "number" &&
    Number.isFinite(s["rangeKm"]) &&
    s["rangeKm"] > 0;
  return value["sun"].every(sample) && value["earth"].every(sample);
}
export function readPlanningStorage(raw: string | null) {
  const empty = { current: null as LunarResult | null, saved: [] as LunarResult[] };
  if (!raw || raw.length > 1_000_000) return empty;
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data)) return empty;
    return {
      current: validStoredResult(data["current"]) ? data["current"] : null,
      saved: Array.isArray(data["saved"])
        ? data["saved"].slice(0, MAX_SCENARIOS).filter(validStoredResult)
        : [],
    };
  } catch {
    return empty;
  }
}
