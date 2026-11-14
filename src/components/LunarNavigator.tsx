import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Earth, Moon, Pause, Play, Plus, RefreshCw, Sun, Trash2 } from "lucide-react";
import { CustomCursor } from "@/components/CustomCursor";
import { Button } from "@/components/ui/button";
import { summarizeHorizon, type LunarResult, type LunarScenario } from "@/lib/lunar-data";
import { LANDING_SITES as LUNAR_SITES } from '@/lib/landing-sites';
import { getLunarScenario } from "@/lib/lunar.functions";
import { cn } from "@/lib/utils";
import { LunarMap } from "@/components/LunarMap";
import { SynexisHeader } from "@/components/SynexisHeader";
import { TerrainPanel, useSiteHorizon } from '@/components/TerrainPanel';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { terrainElevation } from '@/lib/lunar-terrain';
import { usePlanning } from '@/components/PlanningProvider';
import { Link } from '@tanstack/react-router';
import referenceSnapshot from '@/assets/lunar-reference-snapshot.json';
import { ScenarioSensitivity } from './ScenarioSensitivity';
import { decodeScenario } from '@/lib/scenario-link';

const angle = (value: number | undefined) => value === undefined ? "—" : `${value.toFixed(2)}°`;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="flex min-w-0 items-center gap-3 text-[10px] font-bold uppercase"><span className="h-px w-8 shrink-0 bg-current" />{children}</p>;
}

function HorizonPlot({ result, hour }: { result: LunarResult; hour: number }) {
  const path = (samples: LunarResult["sun"]) => samples.map((sample, index) => `${index === 0 ? "M" : "L"}${50 + index * 600 / Math.max(1, samples.length - 1)},${130 - sample.elevation * 1.1}`).join(" ");
  return <svg viewBox="0 0 700 280" className="lunar-horizon-plot w-full" role="img" aria-label="JPL Horizons Sun and Earth elevation over mission window">
    {[-90, -45, 0, 45, 90].map((elevation) => <g key={elevation}><line x1="50" x2="650" y1={130 - elevation * 1.1} y2={130 - elevation * 1.1} className={elevation === 0 ? "lunar-horizon-line" : "lunar-grid-line"} /><text x="8" y={134 - elevation * 1.1} className="lunar-chart-label">{elevation}°</text></g>)}
    <path d={path(result.sun)} className="lunar-sun-line" /><path d={path(result.earth)} className="lunar-earth-line" />
    <line x1={50 + hour * 600 / Math.max(1, result.sun.length - 1)} x2={50 + hour * 600 / Math.max(1, result.sun.length - 1)} y1="25" y2="232" className="lunar-time-line" />
    {[0, 1, 2, 3, 4].map((time) => <text key={time} x={50 + time * 150} y="260" textAnchor="middle" className="lunar-chart-label">{Math.round(time * (result.sun.length - 1) / 4)} h</text>)}
  </svg>;
}

export function LunarNavigator() {
  const fetchScenario = useServerFn(getLunarScenario);
  const [siteId, setSiteId] = useState("apollo11");
  const [latitude, setLatitude] = useState("0.67416");
  const [longitude, setLongitude] = useState("23.47314");
  const [date, setDate] = useState("");
  const [result, setResult] = useState<LunarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historical, setHistorical] = useState(false);
  const requestId = useRef(0);
  const [hour, setHour] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { current, saved, save, remove, setCurrent } = usePlanning();
  const restored = useRef(false);
  const sharedStarted = useRef(false);
  const [durationHours, setDurationHours] = useState(24), [startHour, setStartHour] = useState(0), [observerHeightM, setObserverHeightM] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const { grid, error: terrainError } = useLunarTerrain(expanded);
  const { horizon, calculating } = useSiteHorizon(grid, Number(latitude), Number(longitude), observerHeightM);
  useEffect(() => { setDate(new Date().toISOString().slice(0, 10)); }, []);
  useEffect(() => {
    if (restored.current || !current || new URLSearchParams(window.location.search).has('scenario')) return;
    restored.current = true;
    setHistorical(current.message.includes('historical'));
    const scenario = current.scenario;
    if (scenario.latitude < -85 && scenario.latitude > -88.5) setExpanded(true);
    setSiteId(LUNAR_SITES.find(site => site.latitude === scenario.latitude && site.longitude === scenario.longitude)?.id ?? 'custom');
    setLatitude(String(scenario.latitude)); setLongitude(String(scenario.longitude)); setDate(scenario.date);
    setStartHour(scenario.startHour ?? 0); setDurationHours(scenario.durationHours ?? 24); setObserverHeightM(scenario.observerHeightM ?? 0); setResult(current);
  }, [current]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setHour((value) => (value + 1) % (result?.sun.length ?? 25)), 900);
    return () => window.clearInterval(timer);
  }, [playing, result]);
  const selectedSite = LUNAR_SITES.find((site) => site.id === siteId);
  const valid = date && latitude.trim() && longitude.trim() && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180;
  const changeSite = (id: string) => {
    if (id === 'malapert') setExpanded(true);
    requestId.current += 1; setLoading(false); setSiteId(id); setResult(null); setCurrent(null); setPlaying(false);
    const site = LUNAR_SITES.find((item) => item.id === id);
    if (site) { setLatitude(String(site.latitude)); setLongitude(String(site.longitude)); }
  };
  const load = async (picked?: LunarScenario, preserveHour = false) => {
    if ((!picked && !valid) || (!grid && !terrainError)) return;
    restored.current = true;
    setHistorical(false);
    const request = ++requestId.current;
    setLoading(true); setResult(null); setCurrent(null); if (!preserveHour) setHour(0); setPlaying(false);
    const location = picked ?? { name: selectedSite?.name ?? "Custom lunar coordinates", latitude: Number(latitude), longitude: Number(longitude), date };
    const elevation = grid ? terrainElevation(grid, location) : null;
    const scenario: LunarScenario = { ...location, startHour, durationHours, observerHeightM, observerElevationKm: elevation === null ? 0 : (elevation + observerHeightM) / 1000 };
    try { const response = await fetchScenario({ data: scenario }); if (request === requestId.current) { setResult(response); setCurrent(response.status === "connected" ? response : null); } }
    catch { if (request === requestId.current) setResult({ status: "error", scenario, sun: [], earth: [], retrievedAt: null, message: "JPL Horizons could not be reached. No replacement measurements are shown." }); }
    finally { if (request === requestId.current) setLoading(false); }
  };
  useEffect(() => {
    if (sharedStarted.current || !grid) return;
    const shared = decodeScenario(new URLSearchParams(window.location.search).get('scenario'));
    if (!shared) return;
    if (shared.latitude < -85 && shared.latitude > -88.5 && !expanded) { setExpanded(true); return; }
    sharedStarted.current = true; restored.current = true;
    setSiteId('custom'); setLatitude(String(shared.latitude)); setLongitude(String(shared.longitude)); setDate(shared.date);
    setStartHour(shared.startHour ?? 0); setDurationHours(shared.durationHours ?? 24); setObserverHeightM(shared.observerHeightM ?? 0);
    const elevation = terrainElevation(grid, shared);
    const request = ++requestId.current;
    const scenario = { ...shared, observerElevationKm: elevation === null ? 0 : (elevation + (shared.observerHeightM ?? 0)) / 1000 };
    setLoading(true);
    void fetchScenario({ data: scenario }).then(response => {
      if (request !== requestId.current) return;
      setResult(response); setCurrent(response.status === 'connected' ? response : null);
    }).catch(() => {
      if (request === requestId.current) setResult({ status: 'error', scenario, sun: [], earth: [], retrievedAt: null, message: 'JPL Horizons could not be reached. No replacement measurements are shown.' });
    }).finally(() => { if (request === requestId.current) setLoading(false); });
  }, [grid, fetchScenario, setCurrent, expanded]);
  const invalidateSelection = () => { requestId.current += 1; setLoading(false); setResult(null); setCurrent(null); setPlaying(false); };
  const sun = result?.sun[hour];
  const earth = result?.earth[hour];
  const connected = result?.status === "connected";
  const metrics = [
    { icon: Sun, label: "Sun elevation", value: angle(sun?.elevation), detail: sun ? sun.elevation > 0 ? "Above geometric horizon" : "Below geometric horizon" : "Awaiting source data" },
    { icon: Earth, label: "Earth elevation", value: angle(earth?.elevation), detail: earth ? earth.elevation > 0 ? "Geometric line of sight" : "Below geometric horizon" : "Awaiting source data" },
    { icon: Sun, label: "Sun azimuth", value: angle(sun?.azimuth), detail: "Clockwise from north" },
    { icon: Earth, label: "Earth azimuth", value: angle(earth?.azimuth), detail: "Clockwise from north" },
  ];
  return <main className="stage-bg min-h-screen overflow-hidden font-mono-ui text-foreground synexis-app"><CustomCursor /><SynexisHeader explorer />
    <section id="navigator" className="px-5 py-8 md:px-14"><div className="mx-auto max-w-7xl"><Label>01 / Landing-site navigator</Label><div className="mt-4 flex flex-wrap items-end justify-between gap-5"><h1 className="font-soft text-3xl font-bold sm:text-5xl">Lunar landing explorer</h1><span role="status" className="text-[10px] uppercase text-muted-foreground">{loading ? "Retrieving JPL Horizons data" : connected ? historical ? "Historical JPL reference · not live" : "JPL Horizons · Retrieved" : "No ephemerides loaded"}</span></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]"><form onSubmit={(event) => { event.preventDefault(); void load(); }} className="space-y-5"><label className="lunar-label">Landing site<select value={siteId} onChange={(event) => changeSite(event.target.value)} className="lunar-input">{LUNAR_SITES.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}<option value="custom">Custom coordinates</option></select></label><p className="text-[10px] leading-relaxed text-muted-foreground">{selectedSite?.note ?? "User-entered coordinates, east-positive longitude."}</p><div className="grid grid-cols-2 gap-3"><label className="lunar-label">Latitude °<input aria-label="Latitude" type="number" step="any" min="-90" max="90" value={latitude} readOnly={siteId !== "custom"} onChange={(event) => { setLatitude(event.target.value); invalidateSelection(); }} className="lunar-input" /></label><label className="lunar-label">Longitude °E<input aria-label="Longitude" type="number" step="any" min="-180" max="180" value={longitude} readOnly={siteId !== "custom"} onChange={(event) => { setLongitude(event.target.value); invalidateSelection(); }} className="lunar-input" /></label></div><label className="lunar-label">Landing date · UTC<input aria-label="Landing date" type="date" value={date} onChange={(event) => { setDate(event.target.value); invalidateSelection(); }} className="lunar-input" /></label><div className="grid grid-cols-2 gap-3"><label className="lunar-label">Landing hour · UTC<input type="number" aria-label="Landing hour" min="0" max="23" value={startHour} className="lunar-input" onChange={e => { setStartHour(Number(e.target.value)); invalidateSelection(); }} /></label><label className="lunar-label">Mission duration · h<input type="number" aria-label="Mission duration" min="1" max="168" value={durationHours} className="lunar-input" onChange={e => { setDurationHours(Number(e.target.value)); invalidateSelection(); }} /></label></div><label className="lunar-label">Observer height above terrain · m<input type="number" aria-label="Observer height" min="0" max="100" step="any" value={observerHeightM} className="lunar-input" onChange={e => { setObserverHeightM(Number(e.target.value)); invalidateSelection(); }} /></label><Button type="submit" className="w-full" disabled={!valid || loading || !Number.isInteger(durationHours) || durationHours < 1 || durationHours > 168 || !Number.isInteger(startHour) || startHour < 0 || startHour > 23 || observerHeightM < 0 || observerHeightM > 100}><RefreshCw className={cn(loading && "animate-spin")} />{loading ? "Retrieving…" : "Evaluate site"}</Button><Button type="button" variant="outline" className="w-full" onClick={() => { const snapshot = referenceSnapshot as LunarResult; requestId.current += 1; restored.current = true; setLoading(false); setHistorical(true); setSiteId('south'); setLatitude(String(snapshot.scenario.latitude)); setLongitude(String(snapshot.scenario.longitude)); setDate(snapshot.scenario.date); setDurationHours(snapshot.scenario.durationHours ?? 48); setStartHour(snapshot.scenario.startHour ?? 6); setObserverHeightM(snapshot.scenario.observerHeightM ?? 2); setHour(0); setResult(snapshot); setCurrent(snapshot); }}><Moon />Reference snapshot</Button><p className="text-[10px] leading-relaxed text-muted-foreground">Hourly samples · up to 7 days. Observer elevation follows LOLA where covered; otherwise 0 km spherical reference.</p></form>
      <div className="min-w-0"><LunarMap result={result} hour={hour} latitude={Number(latitude) || 0} longitude={Number(longitude) || 0} loading={loading} onHour={setHour} onSelect={(lat, lon) => { setSiteId("custom"); setLatitude(String(lat)); setLongitude(String(lon)); setPlaying(false); if (date) void load({ name: "Custom lunar coordinates", latitude: lat, longitude: lon, date }, true); }} /><TerrainPanel grid={grid} error={terrainError} result={result} hour={hour} point={{ latitude: Number(latitude), longitude: Number(longitude) }} horizon={horizon} calculating={calculating} onSelect={point => { setSiteId('custom'); setLatitude(String(point.latitude)); setLongitude(String(point.longitude)); if (date) void load({ name: 'Custom lunar coordinates', ...point, date }, true); }} />{connected && result && <ScenarioSensitivity result={result} grid={grid} />}<details className="mt-6 border-t border-border py-4"><summary className="cursor-pointer font-soft text-lg font-bold">Horizon measurements & comparison</summary><div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="metric-card lunar-metric"><metric.icon className="h-5 w-5" /><p className="mt-5 text-[9px] uppercase">{metric.label}</p><strong className="mt-2 block font-display text-3xl">{metric.value}</strong><p className="mt-3 text-[9px] text-muted-foreground">{metric.detail}</p></article>)}</div><div className="mt-6 border-y border-foreground/15 py-5"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-soft text-lg font-bold">Sun & Earth above the horizon</h3><div className="flex gap-5 text-[10px]"><span className="text-lunar-sun">● Sun</span><span className="text-lunar-earth">● Earth</span></div></div>{connected && result ? <><div className="mt-4 overflow-x-auto"><HorizonPlot result={result} hour={hour} /></div><div className="mt-2 flex items-center gap-4"><Button type="button" variant="outline" size="icon" aria-label={playing ? "Pause timeline" : "Play timeline"} onClick={() => setPlaying(!playing)}>{playing ? <Pause /> : <Play />}</Button><input aria-label="UTC hour" type="range" min="0" max={Math.max(0, result.sun.length - 1)} value={hour} onChange={(event) => { setHour(Number(event.target.value)); setPlaying(false); }} className="min-w-0 flex-1 accent-foreground" /><span className="max-w-48 text-right text-xs">{result.sun[hour]?.time} UTC</span></div><div className="mt-5 grid gap-3 text-xs sm:grid-cols-2">{([['Sun', result.sun], ['Earth', result.earth]] as const).map(([name, samples]) => { const summary = summarizeHorizon(samples, hour); return <div key={name}><strong>{name} setting</strong><p className="mt-1 text-muted-foreground">{samples[hour] && samples[hour].elevation <= 0 ? "Currently below the geometric horizon" : summary.setting ? `Crossing within ${summary.setting} (hourly bracket)` : "No setting detected in remaining window"}</p></div>; })}</div><Button variant="outline" className="mt-5" disabled={saved.length >= 4} onClick={() => { save(result); document.getElementById("comparison")?.scrollIntoView({ behavior: "smooth" }); }}><Plus /> Add to comparison</Button></> : <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center"><Moon className="h-8 w-8 opacity-40" /><p className="max-w-md font-soft text-sm text-muted-foreground">{loading ? "Requesting Sun and Earth ephemerides from JPL Horizons…" : result?.message ?? "No Sun or Earth measurements loaded for this selection."}</p></div>}</div>{connected && result && <p className="mt-4 break-words text-[9px] leading-relaxed text-muted-foreground">Source: NASA/JPL Horizons · {result.scenario.name} · {result.scenario.latitude}°N, {result.scenario.longitude}°E · {result.scenario.date} UTC · Retrieved {result.retrievedAt} · Airless apparent angles; no terrain occlusion.</p>}</details></div></div>

    </div></section>
    <section id="comparison" className="bg-void px-5 py-16 text-background md:px-14"><div className="mx-auto max-w-6xl"><Label>02 / Compare scenarios</Label><h2 className="mt-4 font-soft text-3xl font-bold sm:text-5xl">Same mission. Different possibilities.</h2><Button asChild variant="secondary" className="mt-5"><Link to="/compare">Mission requirements & report</Link></Button>{saved.length ? <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead><tr className="border-b border-background/25">{["Site / UTC date", "Coordinates", `Sun · +${hour} h`, `Earth · +${hour} h`, ""].map((label) => <th key={label} className="p-4">{label}</th>)}</tr></thead><tbody>{saved.map((item, index) => <tr key={`${item.scenario.name}-${index}`} className="border-b border-background/15"><td className="p-4"><strong>{item.scenario.name}</strong><p className="mt-2 opacity-60">{item.scenario.date}</p></td><td className="p-4">{item.scenario.latitude}°, {item.scenario.longitude}°</td><td className="p-4">{angle(item.sun[hour]?.elevation)}</td><td className="p-4">{angle(item.earth[hour]?.elevation)}</td><td className="p-4"><Button size="icon" variant="secondary" aria-label={`Remove scenario ${index + 1}`} onClick={() => remove(index)}><Trash2 /></Button></td></tr>)}</tbody></table><p className="mt-5 text-[10px] opacity-60">Source: JPL Horizons · spherical elevations · same elapsed hour from each landing time.</p></div> : <p className="mt-8 border-t border-background/20 pt-8 font-soft text-sm text-background/65">No evaluated scenarios added to comparison.</p>}</div></section>
  </main>;
}
