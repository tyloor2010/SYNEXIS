import { lazy, Suspense, useEffect, useState } from 'react';
const Globe = lazy(() => import('./LunarGlobe'));
export function HomeMoon() {
  const [mounted, setMounted] = useState(false),
    [ready, setReady] = useState(false);
  const [point, setPoint] = useState({ latitude: -70, longitude: 20 });
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div
      className="relative mx-auto my-5 h-[280px] w-full bg-void sm:h-[320px]"
      data-scene-ready={ready ? 'true' : undefined}
      aria-label="استكشف القمر من الرئيسية"
    >
      {!ready && (
        <p className="absolute left-4 top-4 text-xs text-background">
          جارٍ تحميل سطح القمر من NASA…
        </p>
      )}
      {mounted && (
        <Suspense fallback={null}>
          <Globe
            result={null}
            hour={0}
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
    </div>
  );
}
