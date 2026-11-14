import { useState } from 'react';
import type { LunarResult } from '@/lib/lunar-data';
import { radioLink, siteDetails, type RadioSpecifications } from '@/lib/lunar-site-details';

const fields = [
  ['frequencyGHz', 'Frequency · GHz'], ['transmitPowerW', 'Transmit power · W'],
  ['transmitGainDbi', 'Transmit gain · dBi'], ['receiveGainDbi', 'Receive gain · dBi'],
  ['lossesDb', 'Additional losses · dB'], ['receiverThresholdDbm', 'Receiver threshold · dBm'],
] as const;

export function LunarSiteDetails({ result, hour, latitude, longitude, loading }: { result: LunarResult | null; hour: number; latitude: number; longitude: number; loading: boolean }) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const details = loading ? null : siteDetails(result, hour, latitude, longitude);
  const complete = fields.every(([key]) => inputs[key]?.trim() && Number.isFinite(Number(inputs[key])));
  const specs = Object.fromEntries(fields.map(([key]) => [key, Number(inputs[key])])) as RadioSpecifications;
  const link = complete && details ? radioLink(details.earthRangeKm, details.earthElevation, specs) : null;
  const value = (n: number | undefined, unit: string) => n === undefined ? '—' : `${n.toFixed(2)}${unit}`;
  return <div className="mt-6 border-t border-border pt-6" aria-label="Selected landing site details">
    <div className="flex flex-wrap items-end justify-between gap-3"><h4 className="font-soft text-xl font-bold">Selected landing site</h4><p className="text-xs">{latitude.toFixed(5)}°N · {longitude.toFixed(5)}°E</p></div>
    <p role="status" className="mt-2 text-xs text-muted-foreground">{loading ? 'Retrieving this site’s Sun and Earth data…' : details ? `${result?.scenario.date} · ${result?.sun[hour]?.time} UTC` : 'Evaluate a site to retrieve its source measurements.'}</p>
    <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-4">
      {[
        ['Sun elevation', value(details?.sunElevation, '°')],
        ['Relative sunlight incidence', value(details ? details.sunlight * 100 : undefined, '%')],
        ['Earth elevation', value(details?.earthElevation, '°')],
        ['Direct-to-Earth visibility', details ? details.earthVisible ? 'Above horizon' : 'Below horizon' : '—'],
        ['Sun azimuth', value(details ? result?.sun[hour]?.azimuth : undefined, '°')],
        ['Earth azimuth', value(details ? result?.earth[hour]?.azimuth : undefined, '°')],
        ['Earth range', value(details?.earthRangeKm, ' km')],
        ['Radio signal strength', link ? value(link.receivedPowerDbm, ' dBm · modeled') : details && !details.earthVisible ? 'No direct line of sight' : 'Needs mission specifications'],
      ].map(([label, content]) => <div key={label} className="min-w-0"><dt className="text-[10px] uppercase text-muted-foreground">{label}</dt><dd className="mt-2 break-words font-soft text-lg font-bold">{content}</dd></div>)}
    </dl>
    <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">JPL Horizons + spherical calculations. Sunlight incidence = max(0, sin Sun elevation), relative to an overhead Sun on a horizontal surface; not W/m² or lux. Terrain, eclipses, temperature, slope and landing safety are not evaluated.</p>
    <details className="mt-5 border-y border-border py-4"><summary className="cursor-pointer font-soft text-sm font-bold">Radio link model · mission specifications</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([key, label]) => <label key={key} className="lunar-label">{label}<input type="number" step="any" aria-label={label} value={inputs[key] ?? ''} onChange={event => setInputs(previous => ({ ...previous, [key]: event.target.value }))} className="lunar-input" /></label>)}</div>
      <p className="mt-4 text-xs text-muted-foreground">{!complete ? 'Enter all six mission values; no assumed equipment specifications.' : !details ? 'Source data is required for the selected site.' : !details.earthVisible ? 'Earth is below the geometric horizon; no direct-link estimate.' : !link ? 'Frequency and power must be positive; additional losses must be nonnegative.' : `Free-space loss: ${link.freeSpaceLossDb.toFixed(2)} dB · Received power: ${link.receivedPowerDbm.toFixed(2)} dBm · Link margin: ${link.marginDb.toFixed(2)} dB`}</p>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Ideal Friis model using source range. Antenna gains must apply in the link direction. Additional losses and receiver threshold are user-supplied. No relay, terrain obstruction or atmospheric model; not measured signal strength or a guaranteed link.</p>
    </details>
  </div>;
}