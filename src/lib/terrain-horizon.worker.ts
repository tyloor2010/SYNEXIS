import { terrainHorizon, type TerrainGrid, type TerrainPoint } from './lunar-terrain';
self.onmessage = (event: MessageEvent<{ grid: TerrainGrid; point: TerrainPoint; observerHeightM: number }>) => {
  try { self.postMessage({ horizon: terrainHorizon(event.data.grid, event.data.point, event.data.observerHeightM) }); }
  catch { self.postMessage({ horizon: null }); }
};