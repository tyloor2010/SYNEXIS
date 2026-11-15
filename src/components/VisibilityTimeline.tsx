import type { LunarResult } from '@/lib/lunar-data';
import type { TerrainHorizon } from '@/lib/lunar-terrain';
import { visibilityIntervals } from '@/lib/lunar-windows';
export function VisibilityTimeline({
  result,
  horizon,
}: {
  result: LunarResult;
  horizon: TerrainHorizon | null;
}) {
  return (
    <section className="mt-6 border-y border-border py-5" aria-label="نوافذ ظهور المهمة">
      <h3 className="font-soft text-lg font-bold">نوافذ الإضاءة وخط الأرض المباشر</h3>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {horizon ? 'أفق LOLA بالعينات' : 'كروي فقط · التضاريس غير متاحة'} · الساعات المنقضية منذ
        الهبوط · استيفاء خطي للزوايا عند مركز العينات الساعية
      </p>
      {(
        [
          ['الشمس', result.sun],
          ['الأرض', result.earth],
        ] as const
      ).map(([label, samples]) => {
        const windows = visibilityIntervals(samples, horizon);
        return (
          <div className="mt-5" key={label}>
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <strong>{label}</strong>
              <span>
                {windows.visiblePct?.toFixed(1) ?? '—'}% ظاهر · أطول{' '}
                {label === 'الشمس' ? 'ظلام' : 'انقطاع'} {windows.longestHiddenHours.toFixed(1)} h
              </span>
            </div>
            <svg
              viewBox="0 0 600 30"
              className="mt-2 h-7 w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label={`فواصل ظهور ${label}`}
            >
              <rect width="600" height="30" className="fill-muted" />
              {windows.intervals
                .filter((v) => v.visible)
                .map((v, i) => (
                  <rect
                    key={i}
                    x={(v.startHours / windows.durationHours) * 600}
                    width={((v.endHours - v.startHours) / windows.durationHours) * 600}
                    height="30"
                    className="fill-foreground"
                  >
                    <title>
                      {v.startHours.toFixed(2)}–{v.endHours.toFixed(2)} h
                    </title>
                  </rect>
                ))}
            </svg>
            <details className="mt-2 text-[10px]">
              <summary className="cursor-pointer">فواصل {label}</summary>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {windows.intervals.map((v, i) => (
                  <li key={i}>
                    {v.startHours.toFixed(2)}–{v.endHours.toFixed(2)} h ·{' '}
                    {v.visible ? 'فوق الأفق' : 'تحت الأفق'}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </section>
  );
}
