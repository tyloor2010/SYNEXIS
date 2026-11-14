import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Earth, Sun, Layers, LocateFixed, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LunarResult } from '@/lib/lunar-data';
import { LunarSiteDetails } from './LunarSiteDetails';

const Globe = lazy(() => import('./LunarGlobe'));
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <p role="alert" className="p-8 text-background">The lunar surface could not load. The JPL measurements remain available.</p> : this.props.children; }
}
export function LunarMap({ result, hour, latitude, longitude, loading, onSelect, onHour }: { result: LunarResult | null; hour: number; latitude: number; longitude: number; loading: boolean; onSelect: (lat: number, lon: number) => void; onHour: (hour: number) => void }) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState(0);
  const [reset, setReset] = useState(0);
  const [play, setPlay] = useState(false);
  const [opacity, setOpacity] = useState(45);
  const available = result?.status === 'connected' && !!result.sun[hour]?.rangeKm && !!result.earth[hour]?.rangeKm;
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!play || !available) return; const timer = setInterval(() => onHour((hour + 1) % (result?.sun.length ?? 25)), 1200); return () => clearInterval(timer); }, [play, available, hour, onHour, result]);
  return <section id="lunar-map" className="border-t border-border py-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] uppercase text-muted-foreground">Spherical lunar model / JPL-derived geometry</p><h3 className="mt-3 font-soft text-2xl font-bold">The Moon, in perspective.</h3></div><span role="status" className="text-[10px] uppercase text-muted-foreground">{loading ? 'Retrieving ephemerides' : available ? `${result.scenario.date} · ${result?.sun[hour]?.time ?? `${String(hour).padStart(2, '0')}:00`} UTC` : 'Surface map only · no illumination data'}</span></div>
    <div className="my-5 flex flex-wrap justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="Map layer">{[{ name: 'Sunlight', icon: Sun }, { name: 'Earth visibility', icon: Earth }, { name: 'Combined', icon: Layers }].map((item, index) => <Button key={item.name} variant={mode === index ? 'default' : 'outline'} aria-pressed={mode === index} onClick={() => setMode(index)}><item.icon />{item.name}</Button>)}</div><Button variant="outline" size="icon" aria-label="Center selected site" title="Center selected site" onClick={() => setReset(v => v + 1)}><LocateFixed /></Button></div>
    <label className="mb-4 flex flex-wrap items-center gap-3 text-xs">Overlay opacity<input type="range" aria-label="Overlay opacity" min="0" max="80" value={opacity} onChange={event => setOpacity(Number(event.target.value))} className="min-w-0 flex-1 accent-foreground" /><span>{opacity}%</span></label>
    <div className="relative h-[380px] w-full bg-void sm:h-[520px]" data-scene-ready={ready ? 'true' : undefined} aria-label="Interactive lunar globe">
      {!ready && <p className="absolute left-5 top-5 text-xs text-background" role="status">Loading NASA lunar surface…</p>}
      {mounted && <MapBoundary><Suspense fallback={null}><Globe result={result} hour={hour} mode={mode} opacity={opacity / 100} latitude={latitude} longitude={longitude} reset={reset} onSelect={onSelect} onReady={() => setReady(true)} /></Suspense></MapBoundary>}
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 bg-void/80 p-3 text-[10px] text-background">{available ? <><div className="lunar-heat-legend" /><p className="mt-2">{mode === 0 ? '0–100% relative sunlight incidence' : mode === 1 ? 'Earth horizon elevation: −90° to +90° · geometry, not radio strength' : 'Relative sunlight × positive Earth horizon elevation · geometric index'}</p></> : 'Neutral surface imagery; no scientific layer displayed'}</div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button variant="outline" size="icon" disabled={!available} aria-label={play ? 'Pause map timeline' : 'Play map timeline'} onClick={() => setPlay(!play)}>{play ? <Pause /> : <Play />}</Button><input type="range" aria-label="Map UTC hour" min="0" max={Math.max(0, (result?.sun.length ?? 25) - 1)} value={hour} disabled={!available} onChange={e => { setPlay(false); onHour(Number(e.target.value)); }} className="min-w-24 flex-1 accent-foreground" /><span className="text-xs">{result?.sun[hour]?.time ?? `${String(hour).padStart(2, '0')}:00`} UTC</span></div>
    <LunarSiteDetails result={result} hour={hour} latitude={latitude} longitude={longitude} loading={loading} />
    <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">Source: NASA SVS / LROC WAC mosaic (2019 surface texture, resized). Layers: calculations from JPL apparent angles and ranges on a 1,737.4 km sphere; not terrain-resolved or eclipse-screened. Earth visibility is not signal strength. Surface texture shadows are not current illumination.</p>
  </section>;
}