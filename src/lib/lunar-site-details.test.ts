import { describe, expect, it } from 'vitest';
import { radioLink, siteDetails, sunlightIncidence } from './lunar-site-details';

describe('landing-site details', () => {
  it('shows relative sunlight incidence, zero at night and full at overhead Sun', () => {
    expect(sunlightIncidence(-30)).toBe(0);
    expect(sunlightIncidence(30)).toBeCloseTo(0.5, 10);
    expect(sunlightIncidence(90)).toBe(1);
  });
  it('never supplies site data without source ephemerides', () => {
    expect(siteDetails(null, 0, 0, 0)).toBeNull();
  });
  const specs = {
    frequencyGHz: 2,
    transmitPowerW: 10,
    transmitGainDbi: 20,
    receiveGainDbi: 40,
    lossesDb: 3,
    receiverThresholdDbm: -100,
  };
  it('calculates a reproducible ideal free-space received power from explicit specifications', () => {
    const link = radioLink(384400, 30, specs);
    expect(link?.freeSpaceLossDb).toBeCloseTo(210.1640507, 6);
    expect(link?.receivedPowerDbm).toBeCloseTo(-113.1640507, 6);
    expect(link?.marginDb).toBeCloseTo(-13.1640507, 6);
  });
  it('withholds radio estimates when Earth is below the horizon', () => {
    expect(radioLink(384400, -1, specs)).toBeNull();
    expect(radioLink(384400, 0, specs)).toBeNull();
  });
  it('withholds radio estimates for incomplete or invalid specifications', () => {
    expect(radioLink(384400, 30, { ...specs, frequencyGHz: 0 })).toBeNull();
    expect(radioLink(384400, 30, { ...specs, transmitPowerW: NaN })).toBeNull();
    expect(radioLink(384400, 30, { ...specs, lossesDb: -1 })).toBeNull();
  });
});
