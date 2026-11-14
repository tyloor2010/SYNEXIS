import { createServerFn } from "@tanstack/react-start";
import { parseHorizons, type LunarResult } from "@/lib/lunar-data";
import { lunarScenarioSchema } from "@/lib/lunar-planning";

export const getLunarScenario = createServerFn({ method: "POST" })
  .inputValidator((input) => lunarScenarioSchema.parse(input))
  .handler(async ({ data }): Promise<LunarResult> => {
    const { readBoundedText } = await import("./bounded-response.server");
    const start = new Date(`${data.date}T00:00:00Z`);
    const empty: LunarResult = {
      status: "error",
      scenario: data,
      sun: [],
      earth: [],
      retrievedAt: null,
      message:
        "JPL Horizons is unavailable for this selection. No replacement measurements are shown.",
    };
    if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== data.date)
      return { ...empty, message: "Select a valid UTC date." };
    const begin = new Date(start.getTime() + data.startHour * 3600000);
    const stop = new Date(begin.getTime() + data.durationHours * 3600000);
    const stamp = (value: Date) => value.toISOString().slice(0, 16).replace("T", " ");
    try {
      const request = async (target: string) => {
        const params = new URLSearchParams({
          format: "json",
          COMMAND: target,
          OBJ_DATA: "NO",
          MAKE_EPHEM: "YES",
          EPHEM_TYPE: "OBSERVER",
          CENTER: "coord@301",
          COORD_TYPE: "GEODETIC",
          SITE_COORD: `${data.longitude},${data.latitude},${data.observerElevationKm}`,
          START_TIME: stamp(begin),
          STOP_TIME: stamp(stop),
          STEP_SIZE: "1 h",
          QUANTITIES: "4,20",
          CSV_FORMAT: "YES",
        });
        const response = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, {
          redirect: "error",
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error("Upstream request failed");
        const body = JSON.parse(await readBoundedText(response, 2_000_000)) as {
          result?: unknown;
          error?: unknown;
        };
        if (body.error || typeof body.result !== "string")
          throw new Error("Invalid upstream response");
        const samples = parseHorizons(body.result);
        if (samples.length !== data.durationHours + 1 || samples.some((sample) => !sample.rangeKm))
          throw new Error("Incomplete ephemeris");
        return samples;
      };
      const [sun, earth] = await Promise.all([request("10"), request("399")]);
      return {
        status: "connected",
        scenario: data,
        sun,
        earth,
        retrievedAt: new Date().toISOString(),
        message: "JPL Horizons ephemerides retrieved.",
      };
    } catch {
      return empty;
    }
  });
