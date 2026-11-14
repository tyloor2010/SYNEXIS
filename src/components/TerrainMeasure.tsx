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
  const { grid, error } = useLunarTerrain(!!current && current.scenario.latitude < -85 && current.scenario.latitude > -88.5);
  const [a, setA] = useState<TerrainPoint | null>(null), [b, setB] = useState<TerrainPoint | null>(null), [target, setTarget] = useState<'a' | 'b'>('a');
  const [height, setHeight] = useState('');
  const [mode, setMode] = useState<'distance' | 'path' | 'crater'>('distance'), [points, setPoints] = useState<TerrainPoint[]>([]), [threshold, setThreshold] = useState('');
  const center = current?.scenario ?? { latitude: -89.5, longitude: 0 };
  const { horizon, calculating } = useSiteHorizon(grid, center.latitude, center.longitude, current?.scenario.observerHeightM ?? 0);
  const measured = grid && a && b && height.trim() && Number.isFinite(Number(height)) ? measureTerrain(grid, a, b, Number(height)) : null;
  return <PlanningPage title="Measure the terrain." eyebrow="02 / Real elevations, visible limits">
    <div className="flex flex-wrap justify-between gap-3"><div role="group" aria-label="Measurement endpoint" className="flex gap-2"><Button variant={target === 'a' ? 'default' : 'outline'} onClick={() => setTarget('a')}><Ruler />Point A</Button><Button variant={target === 'b' ? 'default' : 'outline'} onClick={() => setTarget('b')}><Ruler />Point B</Button></div><Button asChild variant="outline"><Link to="/explorer"><Moon />Navigator</Link></Button></div>
    <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Measurement mode">{([['distance', Ruler, 'Distance'], ['path', Route, 'Path'], ['crater', Circle, 'Crater']] as const).map(([id, Icon, label]) => <Button key={id} variant={mode === id ? 'default' : 'outline'} onClick={() => { setMode(id); setPoints([]); }}><Icon />{label}</Button>)}{mode !== 'distance' && <Button variant="outline" size="icon" title="Undo point" aria-label="Undo measurement point" onClick={() => setPoints(v => v.slice(0, -1))}><Undo2 /></Button>}</div>
    {mode !== 'distance' && <Button variant="outline" className="mt-4" disabled={!a || points.length >= (mode === 'crater' ? 3 : 50)} onClick={() => { if (a) setPoints(v => [...v, a]); }}><Plus />Add Point A to {mode === 'crater' ? 'rim' : 'path'}</Button>}
    {mode !== 'distance' && <ol className="mt-4 grid gap-2 text-xs sm:grid-cols-2">{points.map((p, i) => <li key={i}>{i + 1}. {p.latitude.toFixed(5)}°, {p.longitude.toFixed(5)}°</li>)}</ol>}
    <label className="lunar-label mt-5 block max-w-sm">User slope threshold · °<input aria-label="Slope threshold" className="lunar-input" type="number" min="0" max="90" value={threshold} onChange={e => setThreshold(e.target.value)} /></label>
    <div className="mt-5 grid gap-5 sm:grid-cols-2">{([['a', a, setA], ['b', b, setB]] as const).map(([id, point, setPoint]) => <fieldset key={id} className="min-w-0 border-t border-border pt-4"><legend className="font-soft font-bold">Point {id.toUpperCase()}</legend><div className="grid grid-cols-2 gap-3"><label className="lunar-label">Latitude °<input aria-label={`Point ${id.toUpperCase()} latitude`} className="lunar-input" type="number" step="any" min="-90" max="-85" value={point?.latitude ?? ''} onChange={e => setPoint({ latitude: Number(e.target.value), longitude: point?.longitude ?? center.longitude })} /></label><label className="lunar-label">Longitude °E<input aria-label={`Point ${id.toUpperCase()} longitude`} className="lunar-input" type="number" step="any" min="-180" max="180" value={point?.longitude ?? ''} onChange={e => setPoint({ latitude: point?.latitude ?? center.latitude, longitude: Number(e.target.value) })} /></label></div><p className="mt-3 text-xs text-muted-foreground">{point && grid ? `LOLA elevation: ${terrainElevation(grid, point)?.toFixed(0) ?? 'outside coverage'} m` : 'No endpoint selected'}</p></fieldset>)}</div>
    <label className="lunar-label mt-5 block max-w-sm">Observer height at both endpoints · m<input aria-label="Measurement observer height" className="lunar-input" type="number" step="any" min="0" value={height} onChange={e => setHeight(e.target.value)} /></label>
    <div className="mt-6 border-y border-border py-5" role="status">{measured ? <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{[
      ['Reference-sphere distance', `${measured.distanceM.toFixed(0)} m`], ['Sampled surface distance', `${measured.surfaceDistanceM.toFixed(0)} m`], ['Height difference B − A', `${measured.heightDifferenceM.toFixed(0)} m`], ['Average signed slope', `${measured.slopeDegrees.toFixed(1)}°`], ['Terrain line of sight', measured.visible ? 'Clear in sampled profile' : 'Obstructed in sampled profile'],
    ].map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-2 font-soft text-lg font-bold">{value}</dd></div>)}</dl> : <p className="text-xs text-muted-foreground">Select two covered points at least 40 m apart and supply a nonnegative observer height.</p>}</div>
    {grid && <MeasurementProfile grid={grid} points={mode === 'distance' ? [a, b].filter((p): p is TerrainPoint => p !== null) : points} height={height.trim() ? Number(height) : null} threshold={threshold.trim() && Number(threshold) >= 0 && Number(threshold) <= 90 ? Number(threshold) : null} mode={mode} />}
    <TerrainPanel grid={grid} error={error} result={current} hour={0} point={center} horizon={horizon} calculating={calculating} markers={mode === 'distance' ? [a, b].filter((p): p is TerrainPoint => p !== null) : points} onSelect={point => { if (mode !== 'distance') { setPoints(v => v.length < (mode === 'crater' ? 3 : 50) ? [...v, point] : v); return; } if (target === 'a') { setA(point); setTarget('b'); } else setB(point); }} />
    <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">Distances use a 1,737.4 km reference sphere and a 40 m sampled great-circle terrain profile. Surface distance is a sampled estimate, not a routing solution. Average slope is endpoint height difference over reference distance, not maximum local slope. Line of sight accounts for spherical curvature and equal supplied endpoint heights; obstacles smaller than the grid can be missed.</p>
  </PlanningPage>;
}