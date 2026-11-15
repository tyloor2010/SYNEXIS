import {
  terrainProfile,
  sampledLineOfSight,
  craterCircle,
  chordDistance,
} from '@/lib/lunar-measurements';
import { bearing, type TerrainGrid, type TerrainPoint } from '@/lib/lunar-terrain';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { downloadReport } from '@/lib/planning-report';
export function MeasurementProfile({
  grid,
  points,
  height,
  threshold,
  mode,
}: {
  grid: TerrainGrid;
  points: TerrainPoint[];
  height: number | null;
  threshold: number | null;
  mode: 'distance' | 'path' | 'crater';
}) {
  const profile = terrainProfile(grid, points),
    circle = mode === 'crater' ? craterCircle(points) : null;
  const los =
    profile && points.length === 2 && height !== null ? sampledLineOfSight(profile, height) : null;
  const first = points[0],
    last = points[points.length - 1];
  if (!profile)
    return (
      <p role="status" className="mt-5 text-xs">
        اختر نقطتين مغطاتين على الأقل على بعد 40 م؛ أقصى مسار 500 كم.
      </p>
    );
  const low = profile.minElevationM,
    range = Math.max(1, profile.maxElevationM - low);
  return (
    <section className="mt-6 border-y border-border py-5" aria-label="نتائج ملف التضاريس">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['المسار المرجعي', `${profile.lengthM.toFixed(0)} م`],
          ['المسار السطحي', `${profile.surfaceDistanceM.toFixed(0)} م`],
          ['أقصى ميل بالعينات', `${profile.maxSlopeDegrees.toFixed(1)}°`],
          ['مدى الارتفاع', `${low.toFixed(0)}–${profile.maxElevationM.toFixed(0)} م`],
          ...(first && last && points.length === 2
            ? [
                ['وتر المرجع', `${chordDistance(first, last).toFixed(0)} م`],
                ['الاتجاه A → B', `${bearing(first, last).toFixed(1)}°`],
              ]
            : []),
          ...(los
            ? [
                [
                  'أدنى خلوص داخلي',
                  los.minimumClearanceM === null
                    ? 'لا توجد عينة داخلية'
                    : `${los.minimumClearanceM.toFixed(1)} م`,
                ],
                [
                  'خط الرؤية بالعينات',
                  los.visible
                    ? 'واضح'
                    : `مسدود عند ${los.blockingPoint?.distanceM.toFixed(0) ?? '—'} م`,
                ],
              ]
            : []),
          ...(threshold === null
            ? []
            : [
                [
                  'حد الميل المحدد من المستخدم',
                  `${threshold}° · ${profile.maxSlopeDegrees <= threshold ? 'ضمن الحد' : 'تجاوز الحد'}`,
                ],
              ]),
          ...(circle
            ? [
                ['قطر حافة ثلاثية النقاط', `${circle.diameterM.toFixed(0)} م`],
                [
                  'المركز المُطابق',
                  `${circle.center.latitude.toFixed(5)}°, ${circle.center.longitude.toFixed(5)}°`,
                ],
              ]
            : []),
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] text-muted-foreground">{label}</dt>
            <dd className="mt-2 font-soft text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <svg
        viewBox="0 0 700 160"
        className="mt-5 w-full"
        role="img"
        aria-label="ملف ارتفاع LOLA بالعينات"
      >
        <path
          className="lunar-earth-line"
          d={profile.samples
            .map(
              (s, i) =>
                `${i ? 'L' : 'M'}${(s.distanceM / profile.lengthM) * 700},${140 - ((s.elevationM - low) / range) * 120}`,
            )
            .join(' ')}
        />
        <text x="5" y="157" className="lunar-chart-label">
          0 m
        </text>
        <text x="600" y="157" className="lunar-chart-label">
          {profile.lengthM.toFixed(0)} m
        </text>
      </svg>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() =>
            downloadReport(
              'SYNEXIS-terrain-profile.csv',
              'distance_m,elevation_m,latitude_deg,longitude_deg\n' +
                profile.samples
                  .map((s) => `${s.distanceM},${s.elevationM},${s.latitude},${s.longitude}`)
                  .join('\n'),
              'text/csv',
            )
          }
        >
          <Download />
          ملف CSV للارتفاعات
        </Button>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        عينات مصدر 40 م · لا توجد شهادة سلامة مسار أو هبوط.{' '}
        {mode === 'crater'
          ? (circle?.method ??
            'يلزم ثلاث نقاط غير متراصفة على الحافة؛ لا يُحدَّد عمق الفوهة من نقاط الحافة وحدها.')
          : 'الاتجاه والوتر وخط الرؤية تنطبق على مقطع ذي نقطتين فقط. حد الميل يُختاره المستخدم، وليس معيار سلامة تشغيليًا.'}
      </p>
    </section>
  );
}
