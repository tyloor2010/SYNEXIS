import { useEffect, useState } from "react";
import asset from "@/assets/lola-south-40m.bin.asset.json";
import expandedAsset from '@/assets/lola-malapert-40m.bin.asset.json';
import expandedMetadata from '@/assets/lola-south-expanded-metadata.json';
import { TERRAIN_META, type TerrainGrid } from "@/lib/lunar-terrain";

let terrainPromise: Promise<TerrainGrid> | undefined;
let expandedPromise: Promise<TerrainGrid> | undefined;
async function loadTerrain(expanded = false) {
  const selected = expanded ? expandedAsset : asset;
  const metadata = expanded ? expandedMetadata : TERRAIN_META;
  let cache: Cache | null = null;
  try {
    if ("caches" in window) cache = await caches.open("synexis-verified-terrain-v1");
  } catch {
    /* Cache is optional. */
  }
  let response: Response;
  try {
    response = await fetch(selected.url);
  } catch {
    const stored = await cache?.match(selected.url);
    if (!stored) throw new Error("LOLA terrain unavailable");
    response = stored;
  }
  if (!response.ok) throw new Error("LOLA terrain unavailable");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== metadata.width ** 2 * 2) throw new Error("Invalid terrain size");
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  if (hex !== metadata.tileSha256) throw new Error("Terrain integrity check failed");
  try {
    await cache?.put(
      selected.url,
      new Response(buffer, { headers: { "Content-Type": "application/octet-stream" } }),
    );
  } catch {
    /* Valid terrain still works when storage is full. */
  }
  const view = new DataView(buffer),
    heights = new Int16Array(buffer.byteLength / 2);
  for (let i = 0; i < heights.length; i++) heights[i] = view.getInt16(i * 2, true);
  return {
    heights,
    width: metadata.width,
    spacingM: metadata.spacingM,
    centerPixel: metadata.centerPixel,
    centerPixelY: expanded ? expandedMetadata.centerPixelY : metadata.centerPixel,
    tileSha256: metadata.tileSha256,
    scaleM: metadata.scaleM,
  };
}
export function useLunarTerrain(expanded = false) {
  const [grid, setGrid] = useState<TerrainGrid | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const pending = expanded
      ? (expandedPromise ??= loadTerrain(true).catch(error => { expandedPromise = undefined; throw error; }))
      : (terrainPromise ??= loadTerrain().catch(error => { terrainPromise = undefined; throw error; }));
    setGrid(null); setError('');
    pending
      .then((value) => {
        if (live) setGrid(value);
      })
      .catch(() => {
        if (live)
          setError("The verified LOLA terrain could not load. No replacement terrain is shown.");
      });
    return () => {
      live = false;
    };
  }, [expanded]);
  return { grid, error };
}
