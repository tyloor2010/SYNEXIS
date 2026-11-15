import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Earth, Sun, Layers, LocateFixed, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LunarResult } from '@/lib/lunar-data';
import { LunarSiteDetails } from './LunarSiteDetails';

const Globe = lazy(() => import('./LunarGlobe'));
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <p role="alert" className="p-8 text-background">
        تعذر تحميل سطح القمر. قياسات JPL ما زالت متاحة.
      </p>
    ) : (
      this.props.children
    );
  }
}
export function LunarMap({
  result,
  hour,
  latitude,
  longitude,
  loading,
  onSelect,
  onHour,
}: {
  result: LunarResult | null;
  hour: number;
  latitude: number;
  longitude: number;
  loading: boolean;
  onSelect: (lat: number, lon: number) => void;
  onHour: (hour: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState(0);
  const [reset, setReset] = useState(0);
  const [play, setPlay] = useState(false);
  const [opacity, setOpacity] = useState(45);
  const available =
    result?.status === 'connected' && !!result.sun[hour]?.rangeKm && !!result.earth[hour]?.rangeKm;
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!play || !available) return;
    const timer = setInterval(() => onHour((hour + 1) % (result?.sun.length ?? 25)), 1200);
    return () => clearInterval(timer);
  }, [play, available, hour, onHour, result]);
  return (
    <section id="lunar-map" className="border-t border-border py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">
            نموذج كروي للقمر / هندسة مشتقة من JPL
          </p>
          <h3 className="mt-3 font-soft text-2xl font-bold">القمر، بكل أبعاده.</h3>
        </div>
        <span role="status" className="text-[10px] uppercase text-muted-foreground">
          {loading
            ? 'جارٍ جلب الإفيميريدات'
            : available
              ? `${result.scenario.date} · ${result?.sun[hour]?.time ?? `${String(hour).padStart(2, '0')}:00`} UTC`
              : 'خريطة السطح فقط · لا توجد بيانات إضاءة'}
        </span>
      </div>
      <div className="my-5 flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="طبقات الخريطة">
          {[
            { name: 'الإضاءة', icon: Sun },
            { name: 'ظهور الأرض', icon: Earth },
            { name: 'مجمّع', icon: Layers },
          ].map((item, index) => (
            <Button
              key={item.name}
              variant={mode === index ? 'default' : 'outline'}
              aria-pressed={mode === index}
              onClick={() => setMode(index)}
            >
              <item.icon />
              {item.name}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="وسط الموقع المختار"
          title="وسط الموقع المختار"
          onClick={() => setReset((v) => v + 1)}
        >
          <LocateFixed />
        </Button>
      </div>
      <label className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        شفافية الطبقة
        <input
          type="range"
          aria-label="شفافية الطبقة"
          min="0"
          max="80"
          value={opacity}
          onChange={(event) => setOpacity(Number(event.target.value))}
          className="min-w-0 flex-1 accent-foreground"
        />
        <span>{opacity}%</span>
      </label>
      <div
        className="relative h-[380px] w-full bg-void sm:h-[520px]"
        data-scene-ready={ready ? 'true' : undefined}
        aria-label="كرة القمر التفاعلية"
      >
        {!ready && (
          <p className="absolute left-5 top-5 text-xs text-background" role="status">
            جارٍ تحميل سطح القمر من NASA…
          </p>
        )}
        {mounted && (
          <MapBoundary>
            <Suspense fallback={null}>
              <Globe
                result={result}
                hour={hour}
                mode={mode}
                opacity={opacity / 100}
                latitude={latitude}
                longitude={longitude}
                reset={reset}
                onSelect={onSelect}
                onReady={() => setReady(true)}
              />
            </Suspense>
          </MapBoundary>
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 bg-void/80 p-3 text-[10px] text-background">
          {available ? (
            <>
              <div className="lunar-heat-legend" />
              <p className="mt-2">
                {mode === 0
                  ? '0–100% نسبة سقوط ضوء الشمس'
                  : mode === 1
                    ? 'ارتفاع الأرض فوق الأفق: −90° إلى +90° · هندسة، لا قوة راديو'
                    : 'نسبة ضوء الشمس × ارتفاع الأرض الموجب · مؤشر هندسي'}
              </p>
            </>
          ) : (
            'صور سطح محايدة؛ لا توجد طبقة علمية معروضة'
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          disabled={!available}
          aria-label={play ? 'إيقاف الخط الزمني للخريطة' : 'تشغيل الخط الزمني للخريطة'}
          onClick={() => setPlay(!play)}
        >
          {play ? <Pause /> : <Play />}
        </Button>
        <input
          type="range"
          aria-label="ساعة UTC في الخريطة"
          min="0"
          max={Math.max(0, (result?.sun.length ?? 25) - 1)}
          value={hour}
          disabled={!available}
          onChange={(e) => {
            setPlay(false);
            onHour(Number(e.target.value));
          }}
          className="min-w-24 flex-1 accent-foreground"
        />
        <span className="text-xs">
          {result?.sun[hour]?.time ?? `${String(hour).padStart(2, '0')}:00`} UTC
        </span>
      </div>
      <LunarSiteDetails
        result={result}
        hour={hour}
        latitude={latitude}
        longitude={longitude}
        loading={loading}
      />
      <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
        المصدر: NASA SVS / LROC WAC mosaic (نسيج سطحي لعام 2019، مُعاد حجمه). الطبقات: حسابات زوايا
        ومسافات JPL الظاهرية على كرة نصف قطرها 1,737.4 كم؛ ليست محسومة بالتضاريس ولا مجوبية للكسوف.
        ظهور الأرض ليس قوة إشارة. ظلال نسيج السطح ليست إضاءة حالية.
      </p>
    </section>
  );
}
