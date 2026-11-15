import { useEffect, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Earth, Moon, Pause, Play, Plus, RefreshCw, Sun, Trash2 } from 'lucide-react';
import { CustomCursor } from '@/components/CustomCursor';
import { Button } from '@/components/ui/button';
import { summarizeHorizon, type LunarResult, type LunarScenario } from '@/lib/lunar-data';
import { LANDING_SITES as LUNAR_SITES } from '@/lib/landing-sites';
import { getLunarScenario } from '@/lib/lunar.functions';
import { cn } from '@/lib/utils';
import { LunarMap } from '@/components/LunarMap';
import { SynexisHeader } from '@/components/SynexisHeader';
import { TerrainPanel, useSiteHorizon } from '@/components/TerrainPanel';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { terrainElevation, terrainTileForPoint } from '@/lib/lunar-terrain';
import { usePlanning } from '@/components/PlanningProvider';
import { Link } from '@tanstack/react-router';
import referenceSnapshot from '@/assets/lunar-reference-snapshot.json';
import { ScenarioSensitivity } from './ScenarioSensitivity';
import { decodeScenario } from '@/lib/scenario-link';

const angle = (value: number | undefined) => (value === undefined ? '—' : `${value.toFixed(2)}°`);

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-3 text-[10px] font-bold uppercase">
      <span className="h-px w-8 shrink-0 bg-current" />
      {children}
    </p>
  );
}

function HorizonPlot({ result, hour }: { result: LunarResult; hour: number }) {
  const path = (samples: LunarResult['sun']) =>
    samples
      .map(
        (sample, index) =>
          `${index === 0 ? 'M' : 'L'}${50 + (index * 600) / Math.max(1, samples.length - 1)},${130 - sample.elevation * 1.1}`,
      )
      .join(' ');
  return (
    <svg
      viewBox="0 0 700 280"
      className="lunar-horizon-plot w-full"
      role="img"
      aria-label="ارتفاع الشمس والأرض حسب نافذة المهمة — JPL Horizons"
    >
      {[-90, -45, 0, 45, 90].map((elevation) => (
        <g key={elevation}>
          <line
            x1="50"
            x2="650"
            y1={130 - elevation * 1.1}
            y2={130 - elevation * 1.1}
            className={elevation === 0 ? 'lunar-horizon-line' : 'lunar-grid-line'}
          />
          <text x="8" y={134 - elevation * 1.1} className="lunar-chart-label">
            {elevation}°
          </text>
        </g>
      ))}
      <path d={path(result.sun)} className="lunar-sun-line" />
      <path d={path(result.earth)} className="lunar-earth-line" />
      <line
        x1={50 + (hour * 600) / Math.max(1, result.sun.length - 1)}
        x2={50 + (hour * 600) / Math.max(1, result.sun.length - 1)}
        y1="25"
        y2="232"
        className="lunar-time-line"
      />
      {[0, 1, 2, 3, 4].map((time) => (
        <text
          key={time}
          x={50 + time * 150}
          y="260"
          textAnchor="middle"
          className="lunar-chart-label"
        >
          {Math.round((time * (result.sun.length - 1)) / 4)} h
        </text>
      ))}
    </svg>
  );
}

export function LunarNavigator() {
  const fetchScenario = useServerFn(getLunarScenario);
  const [siteId, setSiteId] = useState('south');
  const [latitude, setLatitude] = useState('-89.5');
  const [longitude, setLongitude] = useState('0');
  const [date, setDate] = useState('');
  const [result, setResult] = useState<LunarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historical, setHistorical] = useState(false);
  const requestId = useRef(0);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { current, saved, save, remove, setCurrent } = usePlanning();
  const restored = useRef(false);
  const sharedStarted = useRef(false);
  const [durationHours, setDurationHours] = useState(24),
    [startHour, setStartHour] = useState(0),
    [observerHeightM, setObserverHeightM] = useState(0);
  const terrainPoint =
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? { latitude: Number(latitude), longitude: Number(longitude) }
      : null;
  const {
    grid,
    error: terrainError,
    loading: terrainLoading,
    tile: terrainTile,
  } = useLunarTerrain(terrainPoint);
  const terrainPending = terrainTile !== null && !grid && !terrainError;
  const { horizon, calculating } = useSiteHorizon(
    grid,
    Number(latitude),
    Number(longitude),
    observerHeightM,
  );
  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);
  useEffect(() => {
    if (restored.current || !current || new URLSearchParams(window.location.search).has('scenario'))
      return;
    restored.current = true;
    setHistorical(current.message.includes('historical'));
    const scenario = current.scenario;
    setSiteId(
      LUNAR_SITES.find(
        (site) => site.latitude === scenario.latitude && site.longitude === scenario.longitude,
      )?.id ?? 'custom',
    );
    setLatitude(String(scenario.latitude));
    setLongitude(String(scenario.longitude));
    setDate(scenario.date);
    setStartHour(scenario.startHour ?? 0);
    setDurationHours(scenario.durationHours ?? 24);
    setObserverHeightM(scenario.observerHeightM ?? 0);
    setResult(current);
  }, [current]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setHour((value) => (value + 1) % (result?.sun.length ?? 25)),
      900,
    );
    return () => window.clearInterval(timer);
  }, [playing, result]);
  const selectedSite = LUNAR_SITES.find((site) => site.id === siteId);
  const valid =
    date &&
    latitude.trim() &&
    longitude.trim() &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    Math.abs(Number(latitude)) <= 90 &&
    Math.abs(Number(longitude)) <= 180;
  const changeSite = (id: string) => {
    requestId.current += 1;
    setLoading(false);
    setSiteId(id);
    setResult(null);
    setCurrent(null);
    setPlaying(false);
    const site = LUNAR_SITES.find((item) => item.id === id);
    if (site) {
      setLatitude(String(site.latitude));
      setLongitude(String(site.longitude));
    }
  };
  const load = async (picked?: LunarScenario, preserveHour = false) => {
    if ((!picked && !valid) || terrainPending) return;
    restored.current = true;
    setHistorical(false);
    const request = ++requestId.current;
    setLoading(true);
    setResult(null);
    setCurrent(null);
    if (!preserveHour) setHour(0);
    setPlaying(false);
    const location = picked ?? {
      name: selectedSite?.name ?? 'إحداثيات قمرية مخصصة',
      latitude: Number(latitude),
      longitude: Number(longitude),
      date,
    };
    const elevation = grid ? terrainElevation(grid, location) : null;
    const scenario: LunarScenario = {
      ...location,
      startHour,
      durationHours,
      observerHeightM,
      observerElevationKm: elevation === null ? 0 : (elevation + observerHeightM) / 1000,
    };
    try {
      const response = await fetchScenario({ data: scenario });
      if (request === requestId.current) {
        setResult(response);
        setCurrent(response.status === 'connected' ? response : null);
      }
    } catch {
      if (request === requestId.current)
        setResult({
          status: 'error',
          scenario,
          sun: [],
          earth: [],
          retrievedAt: null,
          message: 'تعذر الوصول إلى JPL Horizons. لا تُعرض قياسات بديلة.',
        });
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  };
  const sharedScenario = useRef<LunarScenario | null>(null);
  useEffect(() => {
    const shared = decodeScenario(new URLSearchParams(window.location.search).get('scenario'));
    if (!shared) return;
    sharedScenario.current = shared;
    setSiteId('custom');
    setLatitude(String(shared.latitude));
    setLongitude(String(shared.longitude));
    setDate(shared.date);
    setStartHour(shared.startHour ?? 0);
    setDurationHours(shared.durationHours ?? 24);
    setObserverHeightM(shared.observerHeightM ?? 0);
  }, []);
  useEffect(() => {
    const shared = sharedScenario.current;
    if (!shared || sharedStarted.current || terrainLoading) return;
    const expectedTile = terrainTileForPoint(shared);
    // Wait for the tile that actually covers the shared point. A point outside
    // both published crops is evaluated with an explicit spherical horizon.
    if (expectedTile !== null && (terrainTile !== expectedTile || (!grid && !terrainError))) return;
    sharedStarted.current = true;
    restored.current = true;
    const elevation = grid ? terrainElevation(grid, shared) : null;
    const request = ++requestId.current;
    const scenario = {
      ...shared,
      observerElevationKm:
        elevation === null ? 0 : (elevation + (shared.observerHeightM ?? 0)) / 1000,
    };
    setLoading(true);
    void fetchScenario({ data: scenario })
      .then((response) => {
        if (request !== requestId.current) return;
        setResult(response);
        setCurrent(response.status === 'connected' ? response : null);
      })
      .catch(() => {
        if (request === requestId.current)
          setResult({
            status: 'error',
            scenario,
            sun: [],
            earth: [],
            retrievedAt: null,
            message: 'تعذر الوصول إلى JPL Horizons. لا تُعرض قياسات بديلة.',
          });
      })
      .finally(() => {
        if (request === requestId.current) setLoading(false);
      });
  }, [grid, terrainLoading, terrainTile, terrainError, fetchScenario, setCurrent]);
  const invalidateSelection = () => {
    requestId.current += 1;
    setLoading(false);
    setResult(null);
    setCurrent(null);
    setPlaying(false);
  };
  const sun = result?.sun[hour];
  const earth = result?.earth[hour];
  const connected = result?.status === 'connected';
  const metrics = [
    {
      icon: Sun,
      label: 'ارتفاع الشمس',
      value: angle(sun?.elevation),
      detail: sun
        ? sun.elevation > 0
          ? 'فوق الأفق الهندسي'
          : 'تحت الأفق الهندسي'
        : 'بانتظار بيانات المصدر',
    },
    {
      icon: Earth,
      label: 'ارتفاع الأرض',
      value: angle(earth?.elevation),
      detail: earth
        ? earth.elevation > 0
          ? 'خط رؤية هندسي'
          : 'تحت الأفق الهندسي'
        : 'بانتظار بيانات المصدر',
    },
    {
      icon: Sun,
      label: 'سمت الشمس',
      value: angle(sun?.azimuth),
      detail: 'بحسب عقارب الساعة من الشمال',
    },
    {
      icon: Earth,
      label: 'سمت الأرض',
      value: angle(earth?.azimuth),
      detail: 'بحسب عقارب الساعة من الشمال',
    },
  ];
  return (
    <main className="stage-bg min-h-screen overflow-hidden font-mono-ui text-foreground synexis-app">
      <CustomCursor />
      <SynexisHeader explorer />
      <section id="navigator" className="px-5 py-8 md:px-14">
        <div className="mx-auto max-w-7xl">
          <Label>01 / ملاح مواقع الهبوط</Label>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
            <h1 className="font-soft text-3xl font-bold sm:text-5xl">مستكشف الهبوط على القمر</h1>
            <span role="status" className="text-[10px] uppercase text-muted-foreground">
              {terrainLoading
                ? 'جارٍ تحميل تضاريس LOLA المختارة'
                : loading
                  ? 'جارٍ جلب بيانات JPL Horizons'
                  : connected
                    ? historical
                      ? 'مرجع تاريخي من JPL · ليس حيًا'
                      : 'JPL Horizons · تم الاسترجاع'
                    : terrainError
                      ? 'تضاريس LOLA غير متاحة · بديل الأفق الكروي متاح'
                      : 'لم تُحمّل أي إفيميريدات'}
            </span>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="space-y-5"
            >
              <label className="lunar-label">
                موقع الهبوط
                <select
                  value={siteId}
                  onChange={(event) => changeSite(event.target.value)}
                  className="lunar-input"
                >
                  {LUNAR_SITES.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                  <option value="custom">إحداثيات مخصصة</option>
                </select>
              </label>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {selectedSite?.note ?? 'إحداثيات أدخلها المستخدم، خط الطول موجب شرقًا.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="lunar-label">
                  خط العرض °
                  <input
                    aria-label="خط العرض"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={latitude}
                    readOnly={siteId !== 'custom'}
                    onChange={(event) => {
                      setLatitude(event.target.value);
                      invalidateSelection();
                    }}
                    className="lunar-input"
                  />
                </label>
                <label className="lunar-label">
                  خط الطول °شرقًا
                  <input
                    aria-label="خط الطول"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={longitude}
                    readOnly={siteId !== 'custom'}
                    onChange={(event) => {
                      setLongitude(event.target.value);
                      invalidateSelection();
                    }}
                    className="lunar-input"
                  />
                </label>
              </div>
              <label className="lunar-label">
                تاريخ الهبوط · UTC
                <input
                  aria-label="تاريخ الهبوط"
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    invalidateSelection();
                  }}
                  className="lunar-input"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="lunar-label">
                  ساعة الهبوط · UTC
                  <input
                    type="number"
                    aria-label="ساعة الهبوط"
                    min="0"
                    max="23"
                    value={startHour}
                    className="lunar-input"
                    onChange={(e) => {
                      setStartHour(Number(e.target.value));
                      invalidateSelection();
                    }}
                  />
                </label>
                <label className="lunar-label">
                  مدة المهمة · ساعة
                  <input
                    type="number"
                    aria-label="مدة المهمة"
                    min="1"
                    max="168"
                    value={durationHours}
                    className="lunar-input"
                    onChange={(e) => {
                      setDurationHours(Number(e.target.value));
                      invalidateSelection();
                    }}
                  />
                </label>
              </div>
              <label className="lunar-label">
                ارتفاع الراصد فوق التضاريس · م
                <input
                  type="number"
                  aria-label="ارتفاع الراصد"
                  min="0"
                  max="100"
                  step="any"
                  value={observerHeightM}
                  className="lunar-input"
                  onChange={(e) => {
                    setObserverHeightM(Number(e.target.value));
                    invalidateSelection();
                  }}
                />
              </label>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !valid ||
                  loading ||
                  terrainPending ||
                  !Number.isInteger(durationHours) ||
                  durationHours < 1 ||
                  durationHours > 168 ||
                  !Number.isInteger(startHour) ||
                  startHour < 0 ||
                  startHour > 23 ||
                  observerHeightM < 0 ||
                  observerHeightM > 100
                }
              >
                <RefreshCw className={cn((loading || terrainLoading) && 'animate-spin')} />
                {terrainLoading ? 'جارٍ تحميل التضاريس…' : loading ? 'جارٍ الجلب…' : 'قيّم الموقع'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  const snapshot = referenceSnapshot as LunarResult;
                  requestId.current += 1;
                  restored.current = true;
                  setLoading(false);
                  setHistorical(true);
                  setSiteId('south');
                  setLatitude(String(snapshot.scenario.latitude));
                  setLongitude(String(snapshot.scenario.longitude));
                  setDate(snapshot.scenario.date);
                  setDurationHours(snapshot.scenario.durationHours ?? 48);
                  setStartHour(snapshot.scenario.startHour ?? 6);
                  setObserverHeightM(snapshot.scenario.observerHeightM ?? 2);
                  setHour(0);
                  setResult(snapshot);
                  setCurrent(snapshot);
                }}
              >
                <Moon />
                لقطة مرجعية
              </Button>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                عينات كل ساعة · حتى 7 أيام. يتبع ارتفاع الراصد تضاريس LOLA حيث تتوفر التغطية؛ وإلا
                مرجع كروي 0 كم.
              </p>
            </form>
            <div className="min-w-0">
              <LunarMap
                result={result}
                hour={hour}
                latitude={Number(latitude) || 0}
                longitude={Number(longitude) || 0}
                loading={loading}
                onHour={setHour}
                onSelect={(lat, lon) => {
                  setSiteId('custom');
                  setLatitude(String(lat));
                  setLongitude(String(lon));
                  setPlaying(false);
                  if (date)
                    void load(
                      { name: 'إحداثيات قمرية مخصصة', latitude: lat, longitude: lon, date },
                      true,
                    );
                }}
              />
              <TerrainPanel
                grid={grid}
                error={terrainError}
                result={result}
                hour={hour}
                point={{ latitude: Number(latitude), longitude: Number(longitude) }}
                horizon={horizon}
                calculating={calculating}
                onSelect={(point) => {
                  setSiteId('custom');
                  setLatitude(String(point.latitude));
                  setLongitude(String(point.longitude));
                  if (date) void load({ name: 'إحداثيات قمرية مخصصة', ...point, date }, true);
                }}
              />
              {connected && result && <ScenarioSensitivity result={result} grid={grid} />}
              <details className="mt-6 border-t border-border py-4">
                <summary className="cursor-pointer font-soft text-lg font-bold">
                  قياسات الأفق والمقارنة
                </summary>
                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {metrics.map((metric) => (
                    <article key={metric.label} className="metric-card lunar-metric">
                      <metric.icon className="h-5 w-5" />
                      <p className="mt-5 text-[9px] uppercase">{metric.label}</p>
                      <strong className="mt-2 block font-display text-3xl">{metric.value}</strong>
                      <p className="mt-3 text-[9px] text-muted-foreground">{metric.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="mt-6 border-y border-foreground/15 py-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <h3 className="font-soft text-lg font-bold">الشمس والأرض فوق الأفق</h3>
                    <div className="flex gap-5 text-[10px]">
                      <span className="text-lunar-sun">● Sun</span>
                      <span className="text-lunar-earth">● Earth</span>
                    </div>
                  </div>
                  {connected && result ? (
                    <>
                      <div className="mt-4 overflow-x-auto">
                        <HorizonPlot result={result} hour={hour} />
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={playing ? 'إيقاف الخط الزمني' : 'تشغيل الخط الزمني'}
                          onClick={() => setPlaying(!playing)}
                        >
                          {playing ? <Pause /> : <Play />}
                        </Button>
                        <input
                          aria-label="ساعة UTC"
                          type="range"
                          min="0"
                          max={Math.max(0, result.sun.length - 1)}
                          value={hour}
                          onChange={(event) => {
                            setHour(Number(event.target.value));
                            setPlaying(false);
                          }}
                          className="min-w-0 flex-1 accent-foreground"
                        />
                        <span className="max-w-48 text-right text-xs">
                          {result.sun[hour]?.time} UTC
                        </span>
                      </div>
                      <div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
                        {(
                          [
                            ['الشمس', result.sun],
                            ['الأرض', result.earth],
                          ] as const
                        ).map(([name, samples]) => {
                          const summary = summarizeHorizon(samples, hour);
                          return (
                            <div key={name}>
                              <strong>غروب {name}</strong>
                              <p className="mt-1 text-muted-foreground">
                                {samples[hour] && samples[hour].elevation <= 0
                                  ? 'تحت الأفق الهندسي حاليًا'
                                  : summary.setting
                                    ? `العبور خلال ${summary.setting} (قوس ساعة)`
                                    : 'لم يُكتشف غروب في بقية النافذة'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        className="mt-5"
                        disabled={saved.length >= 4}
                        onClick={() => {
                          save(result);
                          document
                            .getElementById('comparison')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Plus /> أضف إلى المقارنة
                      </Button>
                    </>
                  ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
                      <Moon className="h-8 w-8 opacity-40" />
                      <p className="max-w-md font-soft text-sm text-muted-foreground">
                        {loading
                          ? 'جارٍ طلب إفيميريدات الشمس والأرض من JPL Horizons…'
                          : terrainError ||
                            (result?.message ?? 'لم تُحمّل قياسات الشمس أو الأرض لهذا الاختيار.')}
                      </p>
                    </div>
                  )}
                </div>
                {connected && result && (
                  <p className="mt-4 break-words text-[9px] leading-relaxed text-muted-foreground">
                    المصدر: NASA/JPL Horizons · {result.scenario.name} · {result.scenario.latitude}°
                    شمالًا، {result.scenario.longitude}° شرقًا · {result.scenario.date} UTC · تم
                    الاسترجاع {result.retrievedAt} · زوايا ظاهرية بلا غلاف جوي؛ لا يوجد حجب تضاريسي.
                  </p>
                )}
              </details>
            </div>
          </div>
        </div>
      </section>
      <section id="comparison" className="bg-void px-5 py-16 text-background md:px-14">
        <div className="mx-auto max-w-6xl">
          <Label>02 / قارن السيناريوهات</Label>
          <h2 className="mt-4 font-soft text-3xl font-bold sm:text-5xl">
            المهمة نفسها. احتمالات مختلفة.
          </h2>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/compare">متطلبات المهمة والتقرير</Link>
          </Button>
          {saved.length ? (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[640px] text-right text-xs">
                <thead>
                  <tr className="border-b border-background/25">
                    {[
                      'الموقع / تاريخ UTC',
                      'الإحداثيات',
                      `الشمس · +${hour} ساعة`,
                      `الأرض · +${hour} ساعة`,
                      '',
                    ].map((label) => (
                      <th key={label} className="p-4">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saved.map((item, index) => (
                    <tr
                      key={`${item.scenario.name}-${index}`}
                      className="border-b border-background/15"
                    >
                      <td className="p-4">
                        <strong>{item.scenario.name}</strong>
                        <p className="mt-2 opacity-60">{item.scenario.date}</p>
                      </td>
                      <td className="p-4">
                        {item.scenario.latitude}°, {item.scenario.longitude}°
                      </td>
                      <td className="p-4">{angle(item.sun[hour]?.elevation)}</td>
                      <td className="p-4">{angle(item.earth[hour]?.elevation)}</td>
                      <td className="p-4">
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label={`احذف السيناريو ${index + 1}`}
                          onClick={() => remove(index)}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-[10px] opacity-60">
                المصدر: JPL Horizons · ارتفاعات كروية · الساعة المنقضية نفسها من كل وقت هبوط.
              </p>
            </div>
          ) : (
            <p className="mt-8 border-t border-background/20 pt-8 font-soft text-sm text-background/65">
              لم تُضف سيناريوهات مُقيّمة إلى المقارنة.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
