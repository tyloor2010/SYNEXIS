import { useEffect, useState } from 'react';
import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { findLandingSite } from '@/lib/landing-sites';
import { PlanningPage } from '@/components/PlanningPage';
import { Button } from '@/components/ui/button';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { terrainElevation, angularDistance } from '@/lib/lunar-terrain';
import { TerrainPanel, useSiteHorizon } from '@/components/TerrainPanel';
import { usePlanning } from '@/components/PlanningProvider';
import { VisibilityTimeline } from '@/components/VisibilityTimeline';
import { encodeScenario } from '@/lib/scenario-link';
import { LANDING_SITES } from '@/lib/landing-sites';

export const Route = createFileRoute('/sites/$siteId')({
  staticData: { sitemap: true },
  loader: ({ params }) => { const site = findLandingSite(params.siteId); if (!site) throw notFound(); return site; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.name ?? 'Landing site'} — SYNEXIS` },
    { name: 'description', content: 'Source-traceable lunar site terrain, solar angles, illumination, distances and mission equations.' },
    { property: 'og:title', content: `${loaderData?.name ?? 'Landing site'} — SYNEXIS` },
    { property: 'og:description', content: 'Inspect authentic LOLA terrain and evaluated JPL source observations with documented scientific limits.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SitePage,
});
function SitePage() {
  const [date,setDate] = useState('');
  useEffect(()=>setDate(new Date().toISOString().slice(0,10)),[]);
  const site = Route.useLoaderData();
  const { current } = usePlanning();
  const { grid, error } = useLunarTerrain(site.expanded);
  const result = current?.scenario.latitude === site.latitude && current.scenario.longitude === site.longitude ? current : null;
  const { horizon, calculating } = useSiteHorizon(grid, site.latitude, site.longitude, result?.scenario.observerHeightM ?? 0);
  const elevation = grid ? terrainElevation(grid, site) : null;
  return <PlanningPage title={site.name} eyebrow="Landing-site record">
    <p className="text-sm text-muted-foreground">{site.note}</p>
    <dl className="mt-6 grid gap-4 sm:grid-cols-3"><div><dt>Latitude</dt><dd>{site.latitude}°</dd></div><div><dt>Longitude · east-positive</dt><dd>{site.longitude}°</dd></div><div><dt>LOLA elevation</dt><dd>{elevation === null ? 'Unavailable in loaded coverage' : `${elevation.toFixed(1)} m`}</dd></div></dl>
    <div className="mt-6 flex flex-wrap gap-3">{date && <Button asChild><Link to="/explorer" search={{ scenario: encodeScenario({ name: site.name, latitude: site.latitude, longitude: site.longitude, date: result?.scenario.date ?? date, durationHours: result?.scenario.durationHours ?? 24 }) }}>Evaluate date</Link></Button>}<Button asChild variant="outline"><Link to="/compare">Mission requirements</Link></Button></div>
    <TerrainPanel grid={grid} error={error} result={result} hour={0} point={site} horizon={horizon} calculating={calculating} />
    {result && <><h2 className="mt-6 font-soft text-xl font-bold">Source angles at landing</h2><p className="mt-3 text-sm">Sun {result.sun[0]?.elevation.toFixed(2)}° elevation / {result.sun[0]?.azimuth.toFixed(2)}° azimuth · Earth {result.earth[0]?.elevation.toFixed(2)}° elevation</p><VisibilityTimeline result={result} horizon={horizon} /></>}
    <h2 className="mt-8 font-soft text-xl font-bold">Distances · reference sphere</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{LANDING_SITES.filter(s => s.id !== site.id).map(s => <p key={s.id}>{s.name}: {(angularDistance(site,s)*1737.4).toFixed(2)} km</p>)}</div>
    <h2 className="mt-8 font-soft text-xl font-bold">Mission equations</h2><p className="mt-3 text-sm leading-relaxed">Demand = load × duration. Solar generation = supplied irradiance × panel area × efficiency × incidence × (1 − losses). Battery charge integrates generation minus load with supplied charge/discharge efficiencies. Required capacity is solved under those same assumptions. No vehicle equipment defaults or operational guarantees.</p>
    <p className="mt-5 text-xs text-muted-foreground">Sources: NASA/JPL Horizons, NASA/LRO/LOLA, NASA Science, LPI LEAG. Region references are not certified landing targets; dates and mission specifications must be evaluated independently.</p>
  </PlanningPage>;
}