export type LunarSite = { id: string; name: string; latitude: number; longitude: number; note: string };
export const LUNAR_SITES: LunarSite[] = [
  { id: "apollo11", name: "Apollo 11 · Tranquility Base", latitude: 0.67416, longitude: 23.47314, note: "NASA / LRO landing-site coordinates" },
  { id: "apollo17", name: "Apollo 17 · Taurus–Littrow", latitude: 20.1911, longitude: 30.7723, note: "NASA / LRO landing-site coordinates" },
  { id: "south", name: "South polar reference", latitude: -89.5, longitude: 0, note: "Project-selected reference point; not a mission landing target" },
];
export type HorizonSample = { time: string; azimuth: number; elevation: number; rangeKm?: number };
export type LunarScenario = { name: string; latitude: number; longitude: number; date: string; startHour?: number; durationHours?: number; observerElevationKm?: number; observerHeightM?: number };
export type LunarResult = {
  status: "connected" | "error";
  scenario: LunarScenario;
  sun: HorizonSample[];
  earth: HorizonSample[];
  retrievedAt: string | null;
  message: string;
};

export function parseHorizons(text: string): HorizonSample[] {
  const block = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error("No ephemeris block");
  return block.trim().split(/\r?\n/).flatMap((line) => {
    const fields = line.split(",").map((part) => part.trim());
    const date = fields[0]?.replace(/^A\.D\.\s*/, "");
    const azimuth = Number(fields[3]);
    const elevation = Number(fields[4]);
    if (!date || !fields[3] || !fields[4] || !Number.isFinite(azimuth) || !Number.isFinite(elevation) || azimuth < 0 || azimuth > 360 || elevation < -90 || elevation > 90) return [];
    const rangeAu = Number(fields[5]);
    return [{ time: date, azimuth, elevation, ...(fields[5] && Number.isFinite(rangeAu) && rangeAu > 0 ? { rangeKm: rangeAu * 149597870.7 } : {}) }];
  });
}

export function summarizeHorizon(samples: HorizonSample[], from: number) {
  const selected = samples[from];
  if (!selected) return { above: 0, total: samples.length, setting: null };
  const nextSetting = samples.slice(from).findIndex((sample, index, rest) => index > 0 && (rest[index - 1]?.elevation ?? -90) > 0 && sample.elevation <= 0);
  return {
    above: samples.filter((sample) => sample.elevation > 0).length,
    total: samples.length,
    setting: nextSetting > 0 ? `${nextSetting - 1}–${nextSetting} h` : null,
  };
}