import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { Color, SRGBColorSpace, Vector3, type ShaderMaterial } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import moonAsset from '@/assets/lroc-moon.jpg.asset.json';
import { bodyPosition, coordinatesFromPoint, surfaceNormal } from '@/lib/lunar-geometry';
import type { LunarResult } from '@/lib/lunar-data';

type Props = { result: LunarResult | null; hour: number; mode: number; opacity: number; latitude: number; longitude: number; reset: number; onSelect: (latitude: number, longitude: number) => void; onReady: () => void };
const vertexShader = `varying vec2 vUv; varying vec3 vPosition;
void main(){vUv=uv;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragmentShader = `uniform sampler2D surface;uniform vec3 sun;uniform vec3 earth;uniform float ready;uniform float mode;uniform float opacity;uniform vec3 low;uniform vec3 mid;uniform vec3 high;varying vec2 vUv;varying vec3 vPosition;
void main(){vec3 n=normalize(vPosition);float base=dot(texture2D(surface,vUv).rgb,vec3(.2126,.7152,.0722));float light=max(0.0,dot(n,normalize(sun-n)));float earthEl=asin(clamp(dot(n,normalize(earth-n)),-1.0,1.0));float level=light;vec3 color=vec3(base*.8);
if(ready>.5){if(mode>.5&&mode<1.5){level=(earthEl+1.57079632679)/3.14159265359;}else if(mode>1.5){level=light*max(0.0,earthEl/1.57079632679);}vec3 heat=level<.5?mix(low,mid,level*2.0):mix(mid,high,(level-.5)*2.0);color=mix(color,heat,opacity);}
gl_FragColor=vec4(color,1.0);
#include <colorspace_fragment>
}`;

function Surface({ result, hour, mode, opacity, latitude, longitude, reset, onSelect, onReady }: Props) {
  const texture = useTexture(moonAsset.url);
  const controls = useRef<OrbitControlsType>(null);
  const material = useRef<ShaderMaterial>(null);
  const { camera, invalidate } = useThree();
  const ready = useRef(false);
  const sun = result?.status === 'connected' ? bodyPosition(result.sun[hour], result.scenario) : null;
  const earth = result?.status === 'connected' ? bodyPosition(result.earth[hour], result.scenario) : null;
  const normal = useMemo(() => surfaceNormal(latitude, longitude), [latitude, longitude]);
  const palette = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    return ['--lunar-heat-low', '--lunar-heat-mid', '--lunar-heat-high'].map(token => {
      if (!ctx) return new Color();
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim(); ctx.fillRect(0, 0, 1, 1);
      const pixel = ctx.getImageData(0, 0, 1, 1).data;
      return new Color().setRGB((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255, SRGBColorSpace);
    });
  }, []);
  const uniforms = useMemo(() => ({ surface: { value: texture }, sun: { value: new Vector3() }, earth: { value: new Vector3() }, mode: { value: 0 }, ready: { value: 0 }, opacity: { value: opacity }, low: { value: palette[0] }, mid: { value: palette[1] }, high: { value: palette[2] } }), [texture, palette, opacity]);
  texture.colorSpace = SRGBColorSpace;
  uniforms.sun.value.set(...(sun ?? [0, 0, 0]));
  uniforms.earth.value.set(...(earth ?? [0, 0, 0]));
  uniforms.mode.value = mode;
  uniforms.ready.value = sun && earth ? 1 : 0;
  useEffect(() => { camera.position.set(...normal.map(v => v * 3.4) as [number, number, number]); controls.current?.target.set(0, 0, 0); controls.current?.update(); invalidate(); }, [normal, reset, camera, invalidate]);
  useEffect(() => {
    if (material.current) {
      material.current.uniforms = uniforms;
      material.current.uniformsNeedUpdate = true;
    }
    invalidate();
  }, [result, hour, mode, opacity, invalidate, uniforms]);
  useFrame(() => { if (!ready.current) { ready.current = true; requestAnimationFrame(onReady); } });
  const pick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 5) return;
    event.stopPropagation();
    const p = coordinatesFromPoint([event.point.x, event.point.y, event.point.z]);
    onSelect(Number(p.latitude.toFixed(5)), Number(p.longitude.toFixed(5)));
  };
  const markerColor = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Color();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--eclipse-light').trim(); ctx.fillRect(0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    return new Color().setRGB((pixel[0] ?? 0) / 255, (pixel[1] ?? 0) / 255, (pixel[2] ?? 0) / 255, SRGBColorSpace);
  }, []);
  return <>
    <mesh onClick={pick}><sphereGeometry args={[1, 96, 64]} /><shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} /></mesh>
    <mesh position={normal.map(v => v * 1.018) as [number, number, number]}><sphereGeometry args={[.014, 16, 12]} /><meshBasicMaterial color={markerColor} /></mesh>
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping minDistance={1.5} maxDistance={6} />
  </>;
}
export default function LunarGlobe(props: Props) {
  return <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [3.4, 0, 0], fov: 42 }} fallback={<p className="p-8 text-background">3D rendering is unavailable in this browser. The source measurements remain available below.</p>}><Suspense fallback={null}><Surface {...props} /></Suspense></Canvas>;
}