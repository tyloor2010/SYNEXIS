import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Ruler, Moon, Route, Circle, Undo2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanningPage } from './PlanningPage';
import { TerrainPanel, useSiteHorizon } from './TerrainPanel';
import { usePlanning } from './PlanningProvider';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { MeasurementProfile } from './MeasurementProfile';
import { measureTerrain, terrainElevation, type TerrainPoint } from '@/lib/lunar-terrain';

export function TerrainMeasure() {
  const { current } = usePlanning();
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [a, setA] = useState<TerrainPoint | null>(null),
    [b, setB] = useState<TerrainPoint | null>(null),
    [target, setTarget] = useState<'a' | 'b'>('a');
  const [height, setHeight] = useState('');
  const [mode, setMode] = useState<'distance' | 'path' | 'crater'>('distance'),
    [points, setPoints] = useState<TerrainPoint[]>([]),
    [threshold, setThreshold] = useState('');
  const center = current?.scenario ?? { latitude: -89.5, longitude: 0 };
  const { grid, error, loading: terrainLoading } = useLunarTerrain(terrainEnabled ? center : null);
  const { horizon, calculating } = useSiteHorizon(
    grid,
    center.latitude,
    center.longitude,
    current?.scenario.observerHeightM ?? 0,
  );
  const measured =
    grid && a && b && height.trim() && Number.isFinite(Number(height))
      ? measureTerrain(grid, a, b, Number(height))
      : null;
  return (
    <PlanningPage title="قِس التضاريس." eyebrow="02 / ارتفاعات حقيقية، حدود مرئية">
      <div className="flex flex-wrap justify-between gap-3">
        <div role="group" aria-label="نقطة النهاية للقياس" className="flex gap-2">
          <Button variant={target === 'a' ? 'default' : 'outline'} onClick={() => setTarget('a')}>
            <Ruler />
            النقطة A
          </Button>
          <Button variant={target === 'b' ? 'default' : 'outline'} onClick={() => setTarget('b')}>
            <Ruler />
            النقطة B
          </Button>
        </div>
        <Button asChild variant="outline">
          <Link to="/explorer">
            <Moon />
            الملاح
          </Link>
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="وضع القياس">
        {(
          [
            ['distance', Ruler, 'المسافة'],
            ['path', Route, 'المسار'],
            ['crater', Circle, 'فوهة'],
          ] as const
        ).map(([id, Icon, label]) => (
          <Button
            key={id}
            variant={mode === id ? 'default' : 'outline'}
            onClick={() => {
              setMode(id);
              setPoints([]);
            }}
          >
            <Icon />
            {label}
          </Button>
        ))}
        {mode !== 'distance' && (
          <Button
            variant="outline"
            size="icon"
            title="تراجع عن نقطة"
            aria-label="تراجع عن نقطة القياس"
            onClick={() => setPoints((v) => v.slice(0, -1))}
          >
            <Undo2 />
          </Button>
        )}
      </div>
      {mode !== 'distance' && (
        <Button
          variant="outline"
          className="mt-4"
          disabled={!a || points.length >= (mode === 'crater' ? 3 : 50)}
          onClick={() => {
            if (a) setPoints((v) => [...v, a]);
          }}
        >
          <Plus />
          أضف النقطة A إلى {mode === 'crater' ? 'حافة الفوهة' : 'المسار'}
        </Button>
      )}
      {mode !== 'distance' && (
        <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
          {points.map((p, i) => (
            <li key={i}>
              {i + 1}. {p.latitude.toFixed(5)}°, {p.longitude.toFixed(5)}°
            </li>
          ))}
        </ol>
      )}
      <label className="lunar-label mt-5 block max-w-sm">
        حد ميل المستخدم · °
        <input
          aria-label="حد الميل"
          className="lunar-input"
          type="number"
          min="0"
          max="90"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
      </label>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {(
          [
            ['a', a, setA],
            ['b', b, setB],
          ] as const
        ).map(([id, point, setPoint]) => (
          <fieldset key={id} className="min-w-0 border-t border-border pt-4">
            <legend className="font-soft font-bold">النقطة {id.toUpperCase()}</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="lunar-label">
                خط العرض °
                <input
                  aria-label={`خط عرض النقطة ${id.toUpperCase()}`}
                  className="lunar-input"
                  type="number"
                  step="any"
                  min="-90"
                  max="-85"
                  value={point?.latitude ?? ''}
                  onChange={(e) =>
                    setPoint({
                      latitude: Number(e.target.value),
                      longitude: point?.longitude ?? center.longitude,
                    })
                  }
                />
              </label>
              <label className="lunar-label">
                خط الطول °شرقًا
                <input
                  aria-label={`خط طول النقطة ${id.toUpperCase()}`}
                  className="lunar-input"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={point?.longitude ?? ''}
                  onChange={(e) =>
                    setPoint({
                      latitude: point?.latitude ?? center.latitude,
                      longitude: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {point && grid
                ? `ارتفاع LOLA: ${terrainElevation(grid, point)?.toFixed(0) ?? 'خارج التغطية'} م`
                : 'لم تُحدَّد نقطة نهاية'}
            </p>
          </fieldset>
        ))}
      </div>
      <label className="lunar-label mt-5 block max-w-sm">
        ارتفاع الراصد عند نقطتي النهاية · م
        <input
          aria-label="ارتفاع الراصد للقياس"
          className="lunar-input"
          type="number"
          step="any"
          min="0"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </label>
      <div className="mt-6 border-y border-border py-5" role="status">
        {measured ? (
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['المسافة على الكرة المرجعية', `${measured.distanceM.toFixed(0)} م`],
              ['المسافة السطحية بالعينات', `${measured.surfaceDistanceM.toFixed(0)} م`],
              ['فرق الارتفاع B − A', `${measured.heightDifferenceM.toFixed(0)} م`],
              ['متوسط الميل المُشار إليه', `${measured.slopeDegrees.toFixed(1)}°`],
              [
                'Terrain line of sight',
                measured.visible
                  ? 'خط الرؤية واضح في الملف الشخصي'
                  : 'خط الرؤية مسدود في الملف الشخصي',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-soft text-lg font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">
            اختر نقطتين مغطاتين على بعد 40 م على الأقل، ووفّر ارتفاع راصد غير سالب.
          </p>
        )}
      </div>
      {grid && (
        <MeasurementProfile
          grid={grid}
          points={
            mode === 'distance' ? [a, b].filter((p): p is TerrainPoint => p !== null) : points
          }
          height={height.trim() ? Number(height) : null}
          threshold={
            threshold.trim() && Number(threshold) >= 0 && Number(threshold) <= 90
              ? Number(threshold)
              : null
          }
          mode={mode}
        />
      )}
      {terrainEnabled ? (
        <TerrainPanel
          grid={grid}
          error={error}
          loading={terrainLoading}
          result={current}
          hour={0}
          point={center}
          horizon={horizon}
          calculating={calculating}
          markers={
            mode === 'distance' ? [a, b].filter((p): p is TerrainPoint => p !== null) : points
          }
          onSelect={(point) => {
            if (mode !== 'distance') {
              setPoints((v) => (v.length < (mode === 'crater' ? 3 : 50) ? [...v, point] : v));
              return;
            }
            if (target === 'a') {
              setA(point);
              setTarget('b');
            } else setB(point);
          }}
        />
      ) : (
        <section className="mt-8 border-t border-border pt-6">
          <p className="text-[10px] uppercase text-muted-foreground">
            NASA LRO / LOLA · شبكة مصدر 40 م
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            لا تُحمَّل التضاريس إلا عند الحاجة. تُخزَّن البلاطة الجنوبية المُتحقق منها (8 ميجابايت)
            في متصفحك بعد أول تحميل ناجح.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => setTerrainEnabled(true)}>
            <Ruler /> حمّل تضاريس LOLA
          </Button>
        </section>
      )}
      <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">
        المسافات تستخدم كرة مرجعية نصف قطرها 1,737.4 كم وملف تضاريس عبر العينات على قوس دائري أعظم
        40 م. المسافة السطحية تقدير بالعينات وليست حلًا للملاحة. متوسط الميل هو فرق ارتفاع نقطتي
        النهاية على المسافة المرجعية، وليس أقصى ميل محلي. يراعي خط الرؤية الانحناء الكروي وارتفاعَي
        الطرفين الموردين؛ قد تغيب العوائق الأصغر من الشبكة.
      </p>
    </PlanningPage>
  );
}
