import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CalendarPlus, MoveRight, RefreshCw, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { getLunarScenario } from '@/lib/lunar.functions';
import { destination, terrainElevation, type TerrainGrid } from '@/lib/lunar-terrain';
import type { LunarResult } from '@/lib/lunar-data';
import { encodeScenario } from '@/lib/scenario-link';
import { useSiteHorizon } from './TerrainPanel';
import { visibilityIntervals } from '@/lib/lunar-windows';
function Change({
  result,
  baseline,
  grid,
}: {
  result: LunarResult;
  baseline: LunarResult;
  grid: TerrainGrid;
}) {
  const a = useSiteHorizon(
    grid,
    baseline.scenario.latitude,
    baseline.scenario.longitude,
    baseline.scenario.observerHeightM ?? 0,
  );
  const b = useSiteHorizon(
    grid,
    result.scenario.latitude,
    result.scenario.longitude,
    result.scenario.observerHeightM ?? 0,
  );
  if (a.calculating || b.calculating)
    return (
      <p role="status" className="text-xs">
        جارٍ حساب أفقَي التضاريس…
      </p>
    );
  if (!a.horizon || !b.horizon)
    return (
      <p role="status" className="text-xs">
        يلزم توفر تغطية تضاريس كاملة لهذا التحليل للحساسية.
      </p>
    );
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      {(
        [
          ['الإضاءة', baseline.sun, result.sun],
          ['ظهور الأرض', baseline.earth, result.earth],
        ] as const
      ).map(([label, old, next]) => {
        const x = visibilityIntervals(old, a.horizon),
          y = visibilityIntervals(next, b.horizon),
          delta = y.visibleHours - x.visibleHours;
        return (
          <div key={label}>
            <dt className="text-xs">{label}</dt>
            <dd className="mt-2 font-soft text-xl font-bold">
              {x.visibleHours.toFixed(1)} → {y.visibleHours.toFixed(1)} ساعة{' '}
              <span className="text-sm">
                ({delta >= 0 ? '+' : ''}
                {delta.toFixed(1)} ساعة)
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
export function ScenarioSensitivity({
  result,
  grid,
}: {
  result: LunarResult;
  grid: TerrainGrid | null;
}) {
  const fetchScenario = useServerFn(getLunarScenario),
    [alternative, setAlternative] = useState<LunarResult | null>(null),
    [loading, setLoading] = useState(false),
    [message, setMessage] = useState('');
  const evaluate = async (mode: 'day' | 'km') => {
    if (!grid) return;
    setLoading(true);
    setAlternative(null);
    setMessage('');
    const point = mode === 'km' ? destination(result.scenario, 1000, 90) : result.scenario;
    const elevation = terrainElevation(grid, point);
    if (elevation === null) {
      setMessage('البديل خارج تغطية التضاريس المُتحقق منها.');
      setLoading(false);
      return;
    }
    const d = new Date(`${result.scenario.date}T00:00:00Z`);
    if (mode === 'day') d.setUTCDate(d.getUTCDate() + 1);
    try {
      const next = await fetchScenario({
        data: {
          ...result.scenario,
          ...point,
          date: d.toISOString().slice(0, 10),
          name: `${result.scenario.name} · ${mode === 'day' ? 'يوم +1' : '1 كم شرقًا'}`,
          observerElevationKm: (elevation + (result.scenario.observerHeightM ?? 0)) / 1000,
        },
      });
      if (next.status === 'connected') setAlternative(next);
      else setMessage(next.message);
    } catch {
      setMessage('فشل الاسترجاع من المصدر؛ لا تُستخدم بدائل مُقدّرة.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="mt-6 border-t border-border pt-5">
      <h3 className="font-soft text-xl font-bold">يوم واحد. كيلومتر واحد.</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" disabled={!grid || loading} onClick={() => void evaluate('day')}>
          <CalendarPlus />
          يوم +1
        </Button>
        <Button variant="outline" disabled={!grid || loading} onClick={() => void evaluate('km')}>
          <MoveRight />1 كم شرقًا
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const url = new URL('/explorer', window.location.origin);
            url.searchParams.set('scenario', encodeScenario(result.scenario));
            try {
              await navigator.clipboard.writeText(url.href);
              setMessage('نُسخ رابط السيناريو. فتحه يسترجع بيانات مصدر حديثة.');
            } catch {
              setMessage(url.href);
            }
          }}
        >
          <Share2 />
          مشاركة
        </Button>
      </div>
      {loading && (
        <p role="status" className="mt-3 flex gap-2 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin" />
          جارٍ جلب البديل من JPL Horizons…
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 break-all text-xs">
          {message}
        </p>
      )}
      {alternative && grid && <Change result={alternative} baseline={result} grid={grid} />}
    </section>
  );
}
