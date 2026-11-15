import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { LunarResult } from '@/lib/lunar-data';
import {
  terrainElevation,
  horizonAngle,
  type TerrainGrid,
  type TerrainHorizon,
  type TerrainPoint,
} from '@/lib/lunar-terrain';
import { visibilityWindow } from '@/lib/lunar-planning';
import { CalculatedBrief } from './CalculatedBrief';
import { VisibilityTimeline } from './VisibilityTimeline';
import { Button } from './ui/button';
import { Map, Mountain } from 'lucide-react';
const Scene = lazy(() => import('./LocalTerrainScene'));

export function useSiteHorizon(
  grid: TerrainGrid | null,
  latitude: number,
  longitude: number,
  observerHeightM = 0,
) {
  const [horizon, setHorizon] = useState<TerrainHorizon | null>(null),
    [calculating, setCalculating] = useState(false);
  useEffect(() => {
    setHorizon(null);
    if (!grid) {
      // Leaving coverage must clear a pending horizon: an in-flight worker is
      // terminated below and would otherwise leave `calculating` stuck true,
      // which blocks terrain-gated AI analysis.
      setCalculating(false);
      return;
    }
    setCalculating(true);
    const worker = new Worker(new URL('../lib/terrain-horizon.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<{ horizon: TerrainHorizon | null }>) => {
      setHorizon(event.data.horizon);
      setCalculating(false);
    };
    worker.onerror = () => {
      setHorizon(null);
      setCalculating(false);
    };
    worker.postMessage({ grid, point: { latitude, longitude }, observerHeightM });
    return () => worker.terminate();
  }, [grid, latitude, longitude, observerHeightM]);
  return { horizon, calculating };
}
export function TerrainPanel({
  grid,
  error,
  loading = false,
  result,
  hour,
  point,
  horizon,
  calculating,
  markers,
  onSelect,
}: {
  grid: TerrainGrid | null;
  error: string;
  loading?: boolean;
  result: LunarResult | null;
  hour: number;
  point: TerrainPoint;
  horizon: TerrainHorizon | null;
  calculating: boolean;
  markers?: TerrainPoint[];
  onSelect?: (point: TerrainPoint) => void;
}) {
  const [ready, setReady] = useState(false);
  const [regional, setRegional] = useState(false);
  const inCoverage = grid && terrainElevation(grid, point) !== null;
  const source =
    result?.status === 'connected' &&
    result.scenario.latitude === point.latitude &&
    result.scenario.longitude === point.longitude
      ? result
      : null;
  const sun = source?.sun[hour],
    earth = source?.earth[hour];
  const windows = useMemo(
    () =>
      source
        ? {
            sun: visibilityWindow(source.sun, horizon, hour),
            earth: visibilityWindow(source.earth, horizon, hour),
          }
        : null,
    [source, horizon, hour],
  );
  const setting = (value: ReturnType<typeof visibilityWindow> | undefined) =>
    !value
      ? '—'
      : !value.currentlyVisible
        ? 'تحت الأفق حاليًا'
        : value.nextSetting
          ? `${value.nextSetting.earliestHours}–${value.nextSetting.latestHours} ساعة من الوقت المختار`
          : 'لا يوجد عبور في بقية النافذة';
  return (
    <section className="mt-8 border-t border-border pt-6" aria-label="تضاريس LOLA المحلية">
      <p className="text-[10px] uppercase text-muted-foreground">
        NASA LRO / LOLA · شبكة مصدر 40 م
      </p>
      <h3 className="mt-3 font-soft text-2xl font-bold">أبعد من أفق مسطح.</h3>
      <p role="status" className="mt-3 text-xs text-muted-foreground">
        {error ||
          (loading
            ? 'جارٍ تحميل والتحقق من ارتفاعات LOLA الرسمية…'
            : !grid
              ? 'لا توجد بلاطة LOLA منشورة تغطي هذا الموقع. الحسابات تستخدم أفقًا كرويًا.'
              : !inCoverage
                ? 'خارج مقطع التضاريس الجنوبي المحمّل.'
                : calculating
                  ? 'جارٍ حساب الأفق المحلي…'
                  : !horizon
                    ? 'لم يتسنَّ إتمام أفق 15 كم في هذا الموقع.'
                    : `أفق 15 كم مُقيّد بالعينات · ارتفاع الراصد ${horizon.observerHeightM} م · الارتفاع ${horizon.elevationM.toFixed(0)} م`)}
      </p>
      {inCoverage && (
        <div className="mt-4 flex gap-2" role="group" aria-label="تفاصيل التضاريس">
          <Button
            size="sm"
            variant={!regional ? 'default' : 'outline'}
            onClick={() => setRegional(false)}
          >
            <Mountain />
            محلي
          </Button>
          <Button
            size="sm"
            variant={regional ? 'default' : 'outline'}
            onClick={() => setRegional(true)}
          >
            <Map />
            إقليمي
          </Button>
        </div>
      )}
      {inCoverage && grid && (
        <div
          className="relative mt-5 h-[340px] bg-void sm:h-[460px]"
          data-terrain-ready={ready ? 'true' : undefined}
          aria-label="سطح تضاريس LOLA"
        >
          <Suspense
            fallback={<p className="p-5 text-xs text-background">جارٍ تحميل التضاريس المحلية…</p>}
          >
            <Scene
              grid={grid}
              point={point}
              sun={sun}
              markers={markers}
              regional={regional}
              onSelect={onSelect}
              onReady={() => setReady(true)}
            />
          </Suspense>
        </div>
      )}
      {inCoverage && grid ? (
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          {regional
            ? 'عرض 40.96 كم · عينات الشبكة المعروضة كل 320 م'
            : 'عرض 10.24 كم · عينات الشبكة المعروضة كل 80 م'}
          ، من شبكة 40 م دون أي تعديل. المقياس الرأسي 1:1.{' '}
          {sun
            ? 'اتجاه الظل يستخدم موضع الشمس المختار من JPL؛ الإضاءة المحيطة تحافظ على الوضوح.'
            : 'إضاءة فحص فقط؛ لا يوجد ادعاء علمي بظلال حالية.'}{' '}
          التغطية المفقودة مقطوعة. الأفق العددي يُحسب منفصلًا.
        </p>
      ) : (
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          لا تعرض شبكة LOLA محلية لهذا الموقع. تستخدم الحسابات أفقًا كرويًا؛ ولا تُخترع تضاريس
          بديلة.
        </p>
      )}
      {source && (
        <>
          <p className="mt-5 text-xs font-bold">
            {horizon ? 'تقديرات التضاريس المحلية' : 'تقديرات كروية فقط · التضاريس غير متاحة'}
          </p>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                'الشمس فوق الأفق',
                sun
                  ? sun.elevation > (horizon ? horizonAngle(horizon, sun.azimuth) : 0)
                    ? 'نعم · مركز الشمس'
                    : 'لا · مركز الشمس'
                  : '—',
              ],
              [
                'الإضاءة المتاحة',
                windows ? `${windows.sun.hours.toFixed(1)} / ${windows.sun.durationHours} h` : '—',
              ],
              ['الغروب القادم', setting(windows?.sun)],
              [
                'الأرض فوق الأفق',
                earth
                  ? earth.elevation > (horizon ? horizonAngle(horizon, earth.azimuth) : 0)
                    ? 'نعم · مركز الأرض'
                    : 'لا · مركز الأرض'
                  : '—',
              ],
              [
                'وقت ظهور الأرض',
                windows
                  ? `${windows.earth.hours.toFixed(1)} / ${windows.earth.durationHours} h`
                  : '—',
              ],
              ['الانقطاع القادم للأرض', setting(windows?.earth)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-soft text-lg font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {source && (
        <>
          <VisibilityTimeline result={source} horizon={horizon} />
          <CalculatedBrief
            result={source}
            horizon={horizon}
            grid={grid}
            calculating={calculating || loading}
          />
        </>
      )}
      {horizon && (
        <svg
          viewBox="0 0 720 180"
          className="mt-6 w-full"
          role="img"
          aria-label="ارتفاع أفق التضاريس حسب الاتجاه"
        >
          <path
            d={horizon.angles
              .map((v, i) => `${i ? 'L' : 'M'}${i * 2},${120 - Math.max(-10, Math.min(40, v)) * 2}`)
              .join(' ')}
            className="lunar-earth-line"
          />
          <line x1="0" x2="720" y1="120" y2="120" className="lunar-horizon-line" />
          {[0, 90, 180, 270].map((a) => (
            <text key={a} x={a * 2 + 4} y="170" className="lunar-chart-label">
              {a}°
            </text>
          ))}
        </svg>
      )}
      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        LDEM_85S_40M V2.0 · 2017-06-15 · إطار كروي ME/DE421. الأفق: حاويات 1° في الاتجاه، عينات
        شعاعية 80 م، انحناء قمري، حد 15 كم. العوائق البعيدة والإضاءة الجزئية لقرص الشمس ومدى قرص
        الأرض والكسوف والسلوك الحراري مستثناة. أقواس العبور كل ساعة والتقدير الخطي للمدة قد تفوتهما
        أحداث أقصر. تباعد الشبكة ليس ضمانًا لدقة.
      </p>
    </section>
  );
}
