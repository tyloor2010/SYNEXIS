import type { LunarResult } from './lunar-data';
import { horizonAngle, type TerrainHorizon } from './lunar-terrain';
import { radioLink, type RadioSpecifications } from './lunar-site-details';
export const radioFields = [['frequencyGHz','Frequency · GHz'],['transmitPowerW','Transmit power · W'],['transmitGainDbi','Transmit gain · dBi'],['receiveGainDbi','Receive gain · dBi'],['lossesDb','Additional losses · dB'],['receiverThresholdDbm','Receiver threshold · dBm']] as const;
export function parseRadioInputs(values: Record<string,string>): RadioSpecifications | null {
  if (radioFields.some(([key]) => !values[key]?.trim() || !Number.isFinite(Number(values[key])))) return null;
  const spec = Object.fromEntries(radioFields.map(([key]) => [key,Number(values[key])])) as RadioSpecifications;
  return spec.frequencyGHz > 0 && spec.transmitPowerW > 0 && spec.lossesDb >= 0 ? spec : null;
}
export function predictCommunication(result: LunarResult, horizon: TerrainHorizon | null, specification: RadioSpecifications | null) {
  if (!horizon || !specification) return null;
  const samples = result.earth.map(sample => {
    const aboveTerrain = sample.elevation > horizonAngle(horizon,sample.azimuth);
    const link = aboveTerrain && sample.rangeKm ? radioLink(sample.rangeKm, Math.max(sample.elevation,Number.EPSILON), specification) : null;
    return { time:sample.time, aboveTerrain, marginDb: link?.marginDb ?? null, usable: !!link && link.marginDb >= 0 };
  });
  return { samples, usableSamples:samples.filter(s => s.usable).length, totalSamples:samples.length, method:'Hourly source ranges + complete sampled LOLA horizon + user-supplied Friis inputs; usable means sampled line of sight and nonnegative modeled margin. Not continuous link duration or operational guarantee.' };
}