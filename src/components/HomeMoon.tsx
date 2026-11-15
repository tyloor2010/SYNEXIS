import { lazy, Suspense, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLunarScenario } from '@/lib/lunar.functions';
import type { LunarResult } from '@/lib/lunar-data';

const Globe = lazy(() => import('./LunarGlobe'));

export function HomeMoon() {
  const fetchScenario = useServerFn(getLunarScenario);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [point, setPoint] = useState({ latitude: -89.5, longitude: 0 });
  const [date, setDate] = useState('');
  const [result, setResult] = useState<LunarResult | null>(null);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!date) return;
    let live = true;
    setLoading(true);
    setResult(null);
    setHour(0);
    setPlaying(false);

    void fetchScenario({
      data: {
        name: 'مرجع القطب الجنوبي · تجربة حية',
        latitude: point.latitude,
        longitude: point.longitude,
        date,
        startHour: 0,
        durationHours: 24,
        observerHeightM: 0,
        observerElevationKm: 0,
      },
    })
      .then((response) => {
        if (live) setResult(response);
      })
      .catch(() => {
        if (live) {
          setResult({
            status: 'error',
            scenario: {
              name: 'مرجع القطب الجنوبي · تجربة حية',
              latitude: point.latitude,
              longitude: point.longitude,
              date,
              startHour: 0,
              durationHours: 24,
              observerHeightM: 0,
              observerElevationKm: 0,
            },
            sun: [],
            earth: [],
            retrievedAt: null,
            message: 'تعذر استرجاع بيانات NASA/JPL Horizons حاليًا. أعد المحاولة من المستكشف.',
          });
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [date, fetchScenario, point.latitude, point.longitude]);

  useEffect(() => {
    if (!playing || result?.status !== 'connected') return;
    const timer = window.setInterval(
      () => setHour((value) => (value + 1) % result.sun.length),
      900,
    );
    return () => window.clearInterval(timer);
  }, [playing, result]);

  const connected = result?.status === 'connected';

  return (
    <div
      className="relative mx-auto my-5 min-h-[320px] w-full bg-void p-3 sm:min-h-[360px]"
      data-scene-ready={ready ? 'true' : undefined}
      aria-label="تجربة تفاعلية للقمر ببيانات NASA/JPL Horizons"
    >
      <p className="absolute left-4 top-4 z-10 max-w-[75%] text-xs text-background" role="status">
        {loading
          ? 'جارٍ استدعاء بيانات الشمس والأرض مباشرةً من NASA/JPL Horizons…'
          : connected
            ? `بيانات JPL Horizons الحية · ${date} UTC · الشمس والأرض محسوبتان عند الساعة ${hour} UTC`
            : (result?.message ?? 'جارٍ تجهيز تجربة البيانات الحية…')}
      </p>
      {mounted && (
        <Suspense fallback={null}>
          <Globe
            result={connected ? result : null}
            hour={hour}
            mode={0}
            opacity={0}
            latitude={point.latitude}
            longitude={point.longitude}
            reset={0}
            onSelect={(latitude, longitude) => setPoint({ latitude, longitude })}
            onReady={() => setReady(true)}
          />
        </Suspense>
      )}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 bg-void/85 p-2 text-background">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={playing ? 'إيقاف حركة الوقت' : 'تشغيل حركة الوقت'}
          disabled={!connected}
          onClick={() => setPlaying((value) => !value)}
        >
          {loading ? <RefreshCw className="animate-spin" /> : playing ? <Pause /> : <Play />}
        </Button>
        <input
          aria-label="الوقت حسب بيانات JPL Horizons"
          type="range"
          min="0"
          max={Math.max(0, (result?.sun.length ?? 1) - 1)}
          value={hour}
          disabled={!connected}
          onChange={(event) => {
            setHour(Number(event.target.value));
            setPlaying(false);
          }}
          className="min-w-0 flex-1 accent-background"
        />
        <span className="text-[10px]">{connected ? `${hour}:00 UTC` : '24 ساعة'}</span>
      </div>
    </div>
  );
}
