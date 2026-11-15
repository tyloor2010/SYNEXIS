import { describe, expect, it } from 'vitest';
import {
  projectSouth,
  unprojectSouth,
  terrainElevation,
  terrainHorizon,
  terrainMetadata,
  terrainTileForPoint,
  measureTerrain,
  destination,
  type TerrainGrid,
} from './lunar-terrain';
import expandedMetadata from '@/assets/lola-south-expanded-metadata.json';
const flat: TerrainGrid = {
  heights: new Int16Array(401 ** 2),
  width: 401,
  spacingM: 40,
  centerPixel: 200,
  scaleM: 0.5,
};
describe('LOLA terrain calculations', () => {
  it('retains separate exact source-crop hashes for expanded coverage', () => {
    const metadata = terrainMetadata({ ...flat, tileSha256: expandedMetadata.tileSha256 });
    expect(metadata.width).toBe(2048);
    expect(metadata.spacingM).toBe(40);
    expect(metadata.sourceSha256).toBe(
      '1609e9b860748e0b9952a7239c51b37d3b2a799d35e9fc3c258526711cc1e51d',
    );
    expect(metadata.tileSha256).not.toBe(terrainMetadata(flat).tileSha256);
  });
  it('selects a tile by exact coverage, not a latitude band', () => {
    expect(terrainTileForPoint({ latitude: -89.5, longitude: 0 })).toBe('south');
    expect(terrainTileForPoint({ latitude: -88.8, longitude: 0 })).toBe('south');
    expect(terrainTileForPoint({ latitude: -85.99, longitude: -2.93 })).toBe('malapert');
    expect(terrainTileForPoint({ latitude: -87.0, longitude: 0 })).toBe('malapert');
    // The published crops leave a gap between roughly -88.65 and -87.7.
    // Those points must not be handed to the expanded tile just because of
    // their latitude; the UI reports that no published tile covers them.
    expect(terrainTileForPoint({ latitude: -88.0, longitude: 0 })).toBeNull();
    expect(terrainTileForPoint({ latitude: -88.4, longitude: 0 })).toBeNull();
    expect(terrainTileForPoint({ latitude: 0.67416, longitude: 23.47314 })).toBeNull();
  });
  it('matches catalog orientation and inverts south projection', () => {
    expect(projectSouth(-89, 0).y).toBeGreaterThan(0);
    expect(projectSouth(-89, 90).x).toBeGreaterThan(0);
    const xy = projectSouth(-89.5, 30),
      p = unprojectSouth(xy.x, xy.y);
    expect(p.latitude).toBeCloseTo(-89.5, 8);
    expect(p.longitude).toBeCloseTo(30, 8);
  });
  it('scales signed source heights and withholds uncovered elevations', () => {
    const grid = { ...flat, heights: new Int16Array(401 ** 2).fill(200) };
    expect(terrainElevation(grid, { latitude: -90, longitude: 0 })).toBe(100);
    expect(terrainElevation(grid, { latitude: 0, longitude: 0 })).toBeNull();
  });
  it('uses curvature on flat terrain and rejects partial horizon coverage', () => {
    const h = terrainHorizon(flat, { latitude: -90, longitude: 0 }, 0, 1000);
    expect(h?.angles[0]).toBeLessThan(0);
    expect(terrainHorizon(flat, { latitude: -90, longitude: 0 }, 0, 15000)).toBeNull();
  });
  it('detects an elevated ridge rather than a flat horizon', () => {
    const grid = { ...flat, heights: flat.heights.slice() };
    for (let c = 195; c <= 205; c++) grid.heights[195 * 401 + c] = 1000;
    expect(
      terrainHorizon(grid, { latitude: -90, longitude: 0 }, 0, 1000)?.angles[0],
    ).toBeGreaterThan(60);
  });
  it('measures one kilometer and curvature-blocked ground line of sight', () => {
    const a = { latitude: -90, longitude: 0 },
      b = destination(a, 1000, 0);
    const m = measureTerrain(flat, a, b, 0);
    expect(m?.distanceM).toBeCloseTo(1000, 3);
    expect(m?.slopeDegrees).toBe(0);
    expect(m?.visible).toBe(false);
    expect(measureTerrain(flat, a, b, 10)?.visible).toBe(true);
  });
});
