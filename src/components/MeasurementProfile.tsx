import { terrainProfile, sampledLineOfSight, craterCircle, chordDistance } from '@/lib/lunar-measurements';
import { bearing, type TerrainGrid, type TerrainPoint } from '@/lib/lunar-terrain';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { downloadReport } from '@/lib/planning-report';
export function MeasurementProfile({ grid, points, height, threshold, mode }: { grid: TerrainGrid; points: TerrainPoint[]; height: number | null; threshold: number | null; mode: 'distance' | 'path' | 'crater' }) {
  const profile = terrainProfile(grid, points), circle = mode === 'crater' ? craterCircle(points) : null;
  const los = profile && points.length === 2 && height !== null ? sampledLineOfSight(profile, height) : null;
  const first = points[0], last = points[points.length - 1];
  if (!profile) return <p role="status" className="mt-5 text-xs">Select at least two covered points, 40 m apart; maximum path 500 km.</p>;
  const low = profile.minElevationM, range = Math.max(1, profile.maxElevationM - low);
  return <section className="mt-6 border-y border-border py-5" aria-label="Terrain profile results"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
    ['Reference path', `${profile.lengthM.toFixed(0)} m`], ['Surface path', `${profile.surfaceDistanceM.toFixed(0)} m`], ['Maximum sampled slope', `${profile.maxSlopeDegrees.toFixed(1)}°`],
    ['Elevation range', `${low.toFixed(0)}–${profile.maxElevationM.toFixed(0)} m`],
    ...(first && last && points.length === 2 ? [['Reference chord', `${chordDistance(first, last).toFixed(0)} m`], ['Bearing A → B', `${bearing(first, last).toFixed(1)}°`]] : []),
    ...(los ? [['Minimum interior clearance', los.minimumClearanceM === null ? 'No interior sample' : `${los.minimumClearanceM.toFixed(1)} m`], ['Sampled line of sight', los.visible ? 'Clear' : `Obstructed at ${los.blockingPoint?.distanceM.toFixed(0) ?? '—'} m`]] : []),
    ...(threshold === null ? [] : [['User slope threshold', `${threshold}° · ${profile.maxSlopeDegrees <= threshold ? 'within threshold' : 'threshold exceeded'}`]]),
    ...(circle ? [['Three-point rim diameter', `${circle.diameterM.toFixed(0)} m`], ['Fitted center', `${circle.center.latitude.toFixed(5)}°, ${circle.center.longitude.toFixed(5)}°`]] : []),
  ].map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-2 font-soft text-lg font-bold">{value}</dd></div>)}</dl>
  <svg viewBox="0 0 700 160" className="mt-5 w-full" role="img" aria-label="Sampled LOLA elevation profile"><path className="lunar-earth-line" d={profile.samples.map((s, i) => `${i ? 'L' : 'M'}${s.distanceM / profile.lengthM * 700},${140 - (s.elevationM - low) / range * 120}`).join(' ')} /><text x="5" y="157" className="lunar-chart-label">0 m</text><text x="600" y="157" className="lunar-chart-label">{profile.lengthM.toFixed(0)} m</text></svg>
  <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadReport('SYNEXIS-terrain-profile.csv', 'distance_m,elevation_m,latitude_deg,longitude_deg\n' + profile.samples.map(s => `${s.distanceM},${s.elevationM},${s.latitude},${s.longitude}`).join('\n'), 'text/csv')}><Download />CSV profile</Button></div><p className="mt-3 text-[10px] text-muted-foreground">40 m source sampling · no route or landing safety certification. {mode === 'crater' ? circle?.method ?? 'Three non-collinear rim points are required; crater depth is not determined from rim points alone.' : 'Endpoint bearing/chord and line of sight apply to a two-point segment. Slope threshold is user-selected, not an operational safety standard.'}</p></section>;
}