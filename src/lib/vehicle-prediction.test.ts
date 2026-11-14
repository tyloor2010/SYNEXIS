import { expect,it } from 'vitest';
import { parseRadioInputs,predictCommunication } from './vehicle-prediction';
import snapshot from '@/assets/lunar-reference-snapshot.json';
import type { LunarResult } from './lunar-data';
it('withholds vehicle communication predictions without equipment and terrain inputs',()=>{
 expect(parseRadioInputs({frequencyGHz:'2'})).toBeNull();
 expect(predictCommunication(snapshot as LunarResult,null,null)).toBeNull();
});
it('does not mark terrain-blocked hourly source samples as usable',()=>{
 const spec={frequencyGHz:2,transmitPowerW:100,transmitGainDbi:50,receiveGainDbi:50,lossesDb:0,receiverThresholdDbm:-150};
 const result={...snapshot,earth:snapshot.earth.map(s=>({...s,elevation:5}))} as LunarResult;
 const horizon={angles:Array(360).fill(10),radiusM:15000,observerHeightM:2,elevationM:0};
 expect(predictCommunication(result,horizon,spec)?.usableSamples).toBe(0);
});