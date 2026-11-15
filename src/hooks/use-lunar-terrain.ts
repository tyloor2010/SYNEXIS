import { useEffect, useState } from 'react';
import {
  TERRAIN_TILES,
  terrainTileForPoint,
  type TerrainGrid,
  type TerrainPoint,
  type TerrainTileId,
} from '@/lib/lunar-terrain';

type TerrainState = {
  grid: TerrainGrid | null;
  error: string;
  loading: boolean;
  tile: TerrainTileId | null;
};

const promises = new Map<TerrainTileId, Promise<TerrainGrid>>();

async function loadTerrain(tile: TerrainTileId): Promise<TerrainGrid> {
  const { url, metadata } = TERRAIN_TILES[tile];
  let cache: Cache | null = null;
  try {
    if ('caches' in window) cache = await caches.open('synexis-verified-terrain-v1');
  } catch {
    /* Cache is optional. */
  }
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    const stored = await cache?.match(url);
    if (!stored) throw new Error('LOLA terrain unavailable');
    response = stored;
  }
  if (!response.ok) throw new Error('LOLA terrain unavailable');
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== metadata.width ** 2 * 2) throw new Error('Invalid terrain size');
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  if (hex !== metadata.tileSha256) throw new Error('Terrain integrity check failed');
  try {
    await cache?.put(
      url,
      new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream' } }),
    );
  } catch {
    /* Valid terrain still works when storage is full. */
  }
  const view = new DataView(buffer);
  const heights = new Int16Array(buffer.byteLength / 2);
  for (let i = 0; i < heights.length; i++) heights[i] = view.getInt16(i * 2, true);
  const grid: TerrainGrid = {
    heights,
    width: metadata.width,
    spacingM: metadata.spacingM,
    centerPixel: metadata.centerPixel,
    tileSha256: metadata.tileSha256,
    scaleM: metadata.scaleM,
    tile,
  };
  if (metadata.centerPixelY !== undefined) grid.centerPixelY = metadata.centerPixelY;
  return grid;
}

function requestTerrain(tile: TerrainTileId) {
  const pending = promises.get(tile);
  if (pending) return pending;
  const next = loadTerrain(tile).catch((error) => {
    promises.delete(tile);
    throw error;
  });
  promises.set(tile, next);
  return next;
}

/**
 * Loads only the tile that actually covers the requested point. Points outside
 * both published crops (for example Apollo 11) never download an 8 MB tile.
 */
export function useLunarTerrain(point: TerrainPoint | null): TerrainState {
  const tile = point ? terrainTileForPoint(point) : null;
  const [state, setState] = useState<TerrainState>({
    grid: null,
    error: '',
    loading: false,
    tile: null,
  });

  useEffect(() => {
    let live = true;
    if (!tile) {
      setState({ grid: null, error: '', loading: false, tile: null });
      return () => {
        live = false;
      };
    }
    setState({ grid: null, error: '', loading: true, tile });
    requestTerrain(tile)
      .then((grid) => {
        if (live) setState({ grid, error: '', loading: false, tile });
      })
      .catch(() => {
        if (live)
          setState({
            grid: null,
            error: 'The verified LOLA terrain could not load. No replacement terrain is shown.',
            loading: false,
            tile,
          });
      });
    return () => {
      live = false;
    };
  }, [tile]);

  return state;
}
