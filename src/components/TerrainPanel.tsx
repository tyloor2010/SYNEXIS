import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { LunarResult } from '@/lib/lunar-data';
import { terrainElevation, horizonAngle, type TerrainGrid, type TerrainHorizon, type TerrainPoint } from '@/lib/lunar-terrain';
import { visibilityWindow } from '@/lib/lunar-planning';
import { CalculatedBrief } from './CalculatedBrief';
import { VisibilityTimeline } from './VisibilityTimeline';
import { Button } from './ui/button';
import { Map, Mountain } from 'lucide-react';
const Scene = lazy(() => import('./LocalTerrainScene'));

export function useSiteHorizon(grid: TerrainGrid | null, latitude: number, longitude: number, observerHeightM = 0) {
  const [horizon, setHorizon] = useState<TerrainHorizon | null>(null), [calculating, setCalculating] = useState(false);
  useEffect(() => {
    setHorizon(null);
    if (!grid) return;
    setCalculating(true);
    const worker = new Worker(new URL('../lib/terrain-horizon.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ horizon: TerrainHorizon | null }>) => { setHorizon(event.data.horizon); setCalculating(false); };
    worker.onerror = () => { setHorizon(null); setCalculating(false); };
    worker.postMessage({ grid, point: { latitude, longitude }, observerHeightM });
    return () => worker.terminate();
  }, [grid, latitude, longitude, observerHeightM]);
  return { horizon, calculating };
}
export function TerrainPanel({ grid, error, result, hour, point, horizon, calculating, markers, onSelect }: { grid: TerrainGrid | null; error: string; result: LunarResult | null; hour: number; point: TerrainPoint; horizon: TerrainHorizon | null; calculating: boolean; markers?: TerrainPoint[]; onSelect?: (point: TerrainPoint) => void }) {
  const [ready, setReady] = useState(false);
  const [regional, setRegional] = useState(false);
  const inCoverage = grid && terrainElevation(grid, point) !== null;
  const source = result?.status === 'connected' && result.scenario.latitude === point.latitude && result.scenario.longitude === point.longitude ? result : null;
  const sun = source?.sun[hour], earth = source?.earth[hour];
  const windows = useMemo(() => source ? { sun: visibilityWindow(source.sun, horizon, hour), earth: visibilityWindow(source.earth, horizon, hour) } : null, [source, horizon, hour]);
  const setting = (value: ReturnType<typeof visibilityWindow> | undefined) => !value ? '—' : !value.currentlyVisible ? 'Currently below horizon' : value.nextSetting ? `${value.nextSetting.earliestHours}–${value.nextSetting.latestHours} h from selected time` : 'No crossing in remaining window';
  return <section className="mt-8 border-t border-border pt-6" aria-label="Local LOLA terrain">
    <p className="text-[10px] uppercase text-muted-foreground">NASA LRO / LOLA · 40 m source grid</p><h3 className="mt-3 font-soft text-2xl font-bold">Beyond a flat horizon.</h3>
    <p role="status" className="mt-3 text-xs text-muted-foreground">{error || (!grid ? 'Loading and verifying official LOLA elevations…' : !inCoverage ? 'Outside the loaded south-polar terrain crop.' : calculating ? 'Calculating the local horizon…' : !horizon ? 'A complete 15 km horizon is unavailable at this location.' : `15 km sampled horizon · observer height ${horizon.observerHeightM} m · elevation ${horizon.elevationM.toFixed(0)} m`)}</p>
    {inCoverage && <div className="mt-4 flex gap-2" role="group" aria-label="Terrain detail"><Button size="sm" variant={!regional ? 'default' : 'outline'} onClick={() => setRegional(false)}><Mountain />Local</Button><Button size="sm" variant={regional ? 'default' : 'outline'} onClick={() => setRegional(true)}><Map />Regional</Button></div>}
    {inCoverage && grid && <div className="relative mt-5 h-[340px] bg-void sm:h-[460px]" data-terrain-ready={ready ? 'true' : undefined} aria-label="LOLA terrain surface"><Suspense fallback={<p className="p-5 text-xs text-background">Loading local terrain…</p>}><Scene grid={grid} point={point} sun={sun} markers={markers} regional={regional} onSelect={onSelect} onReady={() => setReady(true)} /></Suspense></div>}
    <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">{regional ? '40.96 km view · displayed mesh samples every 320 m' : '10.24 km view · displayed mesh samples every 80 m'}, from an unchanged 40 m grid. Vertical scale 1:1. {sun ? 'Shadow direction uses the selected JPL Sun position; ambient fill preserves readability.' : 'Inspection lighting only; no current scientific shadow claim.'} Missing surface coverage is clipped. Numerical horizon is calculated separately.</p>
    {source && <><p className="mt-5 text-xs font-bold">{horizon ? 'Local terrain estimates' : 'Spherical estimates only · terrain unavailable'}</p><dl className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[
      ['Sun above horizon', sun ? sun.elevation > (horizon ? horizonAngle(horizon, sun.azimuth) : 0) ? 'Yes · Sun center' : 'No · Sun center' : '—'],
      ['Available sunlight', windows ? `${windows.sun.hours.toFixed(1)} / ${windows.sun.durationHours} h` : '—'], ['Next sunset', setting(windows?.sun)],
      ['Earth above horizon', earth ? earth.elevation > (horizon ? horizonAngle(horizon, earth.azimuth) : 0) ? 'Yes · Earth center' : 'No · Earth center' : '—'],
      ['Earth-visible time', windows ? `${windows.earth.hours.toFixed(1)} / ${windows.earth.durationHours} h` : '—'], ['Next Earth interruption', setting(windows?.earth)],
    ].map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-2 font-soft text-lg font-bold">{value}</dd></div>)}</dl></>}
    {source && <><VisibilityTimeline result={source} horizon={horizon} /><CalculatedBrief result={source} horizon={horizon} /></>}
    {horizon && <svg viewBox="0 0 720 180" className="mt-6 w-full" role="img" aria-label="Terrain horizon elevation by azimuth"><path d={horizon.angles.map((v, i) => `${i ? 'L' : 'M'}${i * 2},${120 - Math.max(-10, Math.min(40, v)) * 2}`).join(' ')} className="lunar-earth-line" /><line x1="0" x2="720" y1="120" y2="120" className="lunar-horizon-line" />{[0, 90, 180, 270].map(a => <text key={a} x={a * 2 + 4} y="170" className="lunar-chart-label">{a}°</text>)}</svg>}
    <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">LDEM_85S_40M V2.0 · 2017-06-15 · spherical ME/DE421 frame. Horizon: 1° azimuth bins, 80 m radial sampling, lunar curvature, 15 km limit. Distant obstructions, solar-disc partial illumination, Earth-disc extent, eclipses and thermal behavior are excluded. Hourly crossing brackets and linear duration estimates can miss shorter events. Grid spacing is not a precision guarantee.</p>
  </section>;
}