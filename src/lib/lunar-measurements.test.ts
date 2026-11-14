import { it, expect } from 'vitest';
import { chordDistance, terrainProfile, sampledLineOfSight, craterCircle } from './lunar-measurements';
import { destination, type TerrainGrid } from './lunar-terrain';
const grid: TerrainGrid = { heights: new Int16Array(401 ** 2), width: 401, spacingM: 40, centerPixel: 200, scaleM: .5 };
const a = { latitude: -90, longitude: 0 };
it('uses the chord sine formula, not the incorrect inverse sine formula from the draft', () => { expect(chordDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 })).toBeCloseTo(3474800); });
it('returns a 1 km flat profile and curvature obstruction at ground level', () => { const p = terrainProfile(grid, [a, destination(a, 1000, 0)]); expect(p?.lengthM).toBeCloseTo(1000, 3); if (!p) throw Error('missing profile'); expect(sampledLineOfSight(p, 0)?.visible).toBe(false); expect(sampledLineOfSight(p, 10)?.visible).toBe(true); });
it('fits a two kilometer diameter circle to three one kilometer rim points', () => { expect(craterCircle([destination(a, 1000, 0), destination(a, 1000, 120), destination(a, 1000, 240)])?.diameterM).toBeCloseTo(2000, 0); });
it('withholds an incomplete terrain profile', () => { expect(terrainProfile(grid, [a, { latitude: 0, longitude: 0 }])).toBeNull(); });