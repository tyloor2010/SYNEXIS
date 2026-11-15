import { createServerFn } from '@tanstack/react-start';
import { parseHorizons, type LunarResult } from '@/lib/lunar-data';
import { lunarScenarioSchema } from '@/lib/lunar-planning';

const CACHE_TTL_MS = 10 * 60_000;
const CACHE_LIMIT = 100;
const cache = new Map<string, { expiresAt: number; result: LunarResult }>();
const inFlight = new Map<string, Promise<LunarResult>>();

function cacheKey(value: {
  latitude: number;
  longitude: number;
  date: string;
  startHour: number;
  durationHours: number;
  observerElevationKm: number;
}) {
  return [
    value.latitude,
    value.longitude,
    value.date,
    value.startHour,
    value.durationHours,
    value.observerElevationKm,
  ].join('|');
}

function pruneCache(now: number) {
  for (const [key, entry] of cache) if (entry.expiresAt <= now) cache.delete(key);
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export const getLunarScenario = createServerFn({ method: 'POST' })
  .validator((input) => lunarScenarioSchema.parse(input))
  .handler(async ({ data }): Promise<LunarResult> => {
    const { allowRequest } = await import('./request-guard.server');
    if (!allowRequest('jpl', 30, 60_000)) {
      return {
        status: 'error',
        scenario: data,
        sun: [],
        earth: [],
        retrievedAt: null,
        message: 'طلبات كثيرة. انتظر دقيقة وحاول مرة أخرى.',
      };
    }

    const { readBoundedText } = await import('./bounded-response.server');
    const start = new Date(`${data.date}T00:00:00Z`);
    const empty: LunarResult = {
      status: 'error',
      scenario: data,
      sun: [],
      earth: [],
      retrievedAt: null,
      message: 'JPL Horizons غير متاح لهذا الاختيار. لا تُعرض قياسات بديلة.',
    };
    if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== data.date)
      return { ...empty, message: 'اختر تاريخ UTC صالحًا.' };

    const key = cacheKey(data);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) return cached.result;
    const pending = inFlight.get(key);
    if (pending) return pending;

    const begin = new Date(start.getTime() + data.startHour * 3600000);
    const stop = new Date(begin.getTime() + data.durationHours * 3600000);
    const stamp = (value: Date) => value.toISOString().slice(0, 16).replace('T', ' ');

    const request = async (target: string) => {
      const params = new URLSearchParams({
        format: 'json',
        COMMAND: target,
        OBJ_DATA: 'NO',
        MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'OBSERVER',
        CENTER: 'coord@301',
        COORD_TYPE: 'GEODETIC',
        SITE_COORD: `${data.longitude},${data.latitude},${data.observerElevationKm}`,
        START_TIME: stamp(begin),
        STOP_TIME: stamp(stop),
        STEP_SIZE: '1 h',
        QUANTITIES: '4,20',
        CSV_FORMAT: 'YES',
      });
      const response = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`, {
        // Cloudflare Workers rejects "error"; "manual" is the supported strict
        // option and still lets us reject unexpected redirects ourselves.
        redirect: 'manual',
        signal: AbortSignal.timeout(30000),
        headers: { Accept: 'application/json' },
      });
      if (response.status >= 300 && response.status < 400) {
        throw new Error('JPL Horizons returned an unexpected redirect.');
      }
      if (!response.ok) throw new Error('Upstream request failed');
      const body = JSON.parse(await readBoundedText(response, 2_000_000)) as {
        result?: unknown;
        error?: unknown;
      };
      if (body.error || typeof body.result !== 'string')
        throw new Error('Invalid upstream response');
      const samples = parseHorizons(body.result);
      if (samples.length !== data.durationHours + 1 || samples.some((sample) => !sample.rangeKm))
        throw new Error('Incomplete ephemeris');
      return samples;
    };

    const work = (async (): Promise<LunarResult> => {
      try {
        const [sun, earth] = await Promise.all([request('10'), request('399')]);
        const result: LunarResult = {
          status: 'connected',
          scenario: data,
          sun,
          earth,
          retrievedAt: new Date().toISOString(),
          message: 'تم استرجاع إفيميريدات JPL Horizons.',
        };
        const current = Date.now();
        pruneCache(current);
        cache.set(key, { expiresAt: current + CACHE_TTL_MS, result });
        return result;
      } catch (error) {
        // Log only a bounded reason: never the caller's coordinates.
        console.error(
          'JPL Horizons request failed',
          error instanceof Error ? error.name : 'Unknown error',
        );
        return empty;
      } finally {
        inFlight.delete(key);
      }
    })();

    inFlight.set(key, work);
    return work;
  });
