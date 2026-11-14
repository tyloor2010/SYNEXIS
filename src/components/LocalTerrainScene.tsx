import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, Color, SRGBColorSpace, CanvasTexture } from 'three';
import { angularDistance, bearing, destination, terrainElevation, type TerrainGrid, type TerrainPoint } from '@/lib/lunar-terrain';
import type { HorizonSample } from '@/lib/lunar-data';

type Props = { grid: TerrainGrid; point: TerrainPoint; sun?: HorizonSample | undefined; markers?: TerrainPoint[] | undefined; regional?: boolean | undefined; onSelect?: ((point: TerrainPoint) => void) | undefined; onReady: () => void };
function Marker({ index, position }: { index: number; position: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      const css = getComputedStyle(document.documentElement);
      context.fillStyle = css.getPropertyValue('--background').trim(); context.beginPath(); context.arc(64, 64, 57, 0, Math.PI * 2); context.fill();
      context.strokeStyle = css.getPropertyValue('--foreground').trim(); context.lineWidth = 4; context.stroke();
      context.fillStyle = css.getPropertyValue('--foreground').trim(); context.font = 'bold 60px monospace'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(String(index + 1), 64, 67);
    }
    const value = new CanvasTexture(canvas); value.colorSpace = SRGBColorSpace; return value;
  }, [index]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <sprite position={position} scale={[.35, .35, 1]}><spriteMaterial map={texture} depthTest={false} /></sprite>;
}
function Surface({ grid, point, sun, markers = [], regional = false, onSelect, onReady }: Props) {
  const ready = useRef(false);
  const { invalidate } = useThree();
  const size = 128, spacing = regional ? 320 : 80;
  const origin = useMemo(() => ({ latitude: point.latitude, longitude: point.longitude }), [point.latitude, point.longitude]);
  const color = useMemo(() => {
    const c = document.createElement('canvas').getContext('2d');
    if (!c) return new Color();
    c.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--eclipse-light').trim(); c.fillRect(0, 0, 1, 1);
    const p = c.getImageData(0, 0, 1, 1).data;
    return new Color().setRGB((p[0] ?? 0) / 255, (p[1] ?? 0) / 255, (p[2] ?? 0) / 255, SRGBColorSpace);
  }, []);
  const geometry = useMemo(() => {
    const g = new BufferGeometry(), positions: number[] = [], indices: number[] = [];
    const originHeight = terrainElevation(grid, origin) ?? 0;
    for (let r = 0; r <= size; r++) for (let c = 0; c <= size; c++) {
      const east = (c - size / 2) * spacing, north = (size / 2 - r) * spacing, d = Math.hypot(east, north);
      const target = destination(origin, d, Math.atan2(east, north) * 180 / Math.PI);
      const h = terrainElevation(grid, target);
      // Clip triangles with unavailable source values, never interpolate a fallback surface.
      positions.push(east / 1000, h === null ? NaN : ((1737400 + h) * Math.cos(d / 1737400) - 1737400 - originHeight) / 1000, -north / 1000);
    }
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      const a = r * (size + 1) + c, b = a + 1, d = a + size + 1, e = d + 1;
      if ([a, b, d, e].every(i => Number.isFinite(positions[i * 3 + 1]))) indices.push(a, d, b, b, d, e);
    }
    // Isolated unavailable vertices are unused by indices; keep geometry bounds finite.
    for (let i = 1; i < positions.length; i += 3) if (!Number.isFinite(positions[i])) positions[i] = 0;
    g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }, [grid, origin, spacing]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => { invalidate(); }, [sun, geometry, invalidate]);
  useFrame(() => { if (!ready.current) { ready.current = true; requestAnimationFrame(onReady); } });
  const az = (sun?.azimuth ?? 0) * Math.PI / 180, el = (sun?.elevation ?? 35) * Math.PI / 180;
  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (!onSelect || event.delta > 5) return;
    event.stopPropagation();
    const east = event.point.x * 1000, north = -event.point.z * 1000;
    onSelect(destination(point, Math.hypot(east, north), Math.atan2(east, north) * 180 / Math.PI));
  };
  return <>
    <ambientLight intensity={sun ? .8 : 1.2} />
    {(!sun || sun.elevation > -5) && <directionalLight color={color} position={[Math.cos(el) * Math.sin(az) * 20, Math.sin(el) * 20, -Math.cos(el) * Math.cos(az) * 20]} intensity={sun ? 3 : 1} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={50} shadow-bias={-.00005} />}
    <mesh geometry={geometry} receiveShadow castShadow onClick={pick}><meshStandardMaterial color={color} roughness={1} /></mesh>
    {markers.map((marker, index) => { const distance = angularDistance(point, marker) * 1737400, az = bearing(point, marker) * Math.PI / 180, elevation = terrainElevation(grid, marker), base = terrainElevation(grid, point); if (elevation === null || base === null) return null; return <Marker key={index} index={index} position={[distance * Math.sin(az) / 1000, ((1737400 + elevation) * Math.cos(distance / 1737400) - 1737400 - base) / 1000 + .08, -distance * Math.cos(az) / 1000]} />; })}
    <OrbitControls makeDefault enableDamping minDistance={2} maxDistance={regional ? 100 : 25} maxPolarAngle={Math.PI / 2.05} />
  </>;
}
export default function LocalTerrainScene(props: Props) {
  return <Canvas key={props.regional ? 'regional' : 'local'} shadows frameloop="demand" dpr={[1, 1.5]} camera={{ position: props.regional ? [28, 28, 32] : [7, 7, 8], fov: 45 }} fallback={<p className="p-6 text-background">3D is unavailable. Terrain calculations remain available.</p>}><Surface {...props} /></Canvas>;
}