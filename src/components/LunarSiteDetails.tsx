import { useState } from 'react';
import type { LunarResult } from '@/lib/lunar-data';
import { radioLink, siteDetails, type RadioSpecifications } from '@/lib/lunar-site-details';

const fields = [
  ['frequencyGHz', 'التردد · GHz'],
  ['transmitPowerW', 'القدرة المُرسَلة · واط'],
  ['transmitGainDbi', 'كسب الإرسال · dBi'],
  ['receiveGainDbi', 'كسب الاستقبال · dBi'],
  ['lossesDb', 'فقدان إضافي · dB'],
  ['receiverThresholdDbm', 'عتبة المستقبل · dBm'],
] as const;

export function LunarSiteDetails({
  result,
  hour,
  latitude,
  longitude,
  loading,
}: {
  result: LunarResult | null;
  hour: number;
  latitude: number;
  longitude: number;
  loading: boolean;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const details = loading ? null : siteDetails(result, hour, latitude, longitude);
  const complete = fields.every(
    ([key]) => inputs[key]?.trim() && Number.isFinite(Number(inputs[key])),
  );
  const specs = Object.fromEntries(
    fields.map(([key]) => [key, Number(inputs[key])]),
  ) as RadioSpecifications;
  const link =
    complete && details ? radioLink(details.earthRangeKm, details.earthElevation, specs) : null;
  const value = (n: number | undefined, unit: string) =>
    n === undefined ? '—' : `${n.toFixed(2)}${unit}`;
  return (
    <div className="mt-6 border-t border-border pt-6" aria-label="تفاصيل موقع الهبوط المختار">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h4 className="font-soft text-xl font-bold">موقع الهبوط المختار</h4>
        <p className="text-xs">
          {latitude.toFixed(5)}°N · {longitude.toFixed(5)}°E
        </p>
      </div>
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        {loading
          ? 'جارٍ جلب بيانات الشمس والأرض لهذا الموقع…'
          : details
            ? `${result?.scenario.date} · ${result?.sun[hour]?.time} UTC`
            : 'قيّم موقعًا لاسترجاع قياساته المصدرية.'}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-4">
        {[
          ['ارتفاع الشمس', value(details?.sunElevation, '°')],
          ['نسبة سقوط ضوء الشمس', value(details ? details.sunlight * 100 : undefined, '%')],
          ['ارتفاع الأرض', value(details?.earthElevation, '°')],
          [
            'ظهور الأرض المباشر',
            details ? (details.earthVisible ? 'فوق الأفق' : 'تحت الأفق') : '—',
          ],
          ['سمت الشمس', value(details ? result?.sun[hour]?.azimuth : undefined, '°')],
          ['سمت الأرض', value(details ? result?.earth[hour]?.azimuth : undefined, '°')],
          ['مدى الأرض', value(details?.earthRangeKm, ' كم')],
          [
            'قوة إشارة الراديو',
            link
              ? value(link.receivedPowerDbm, ' dBm · نمذجة')
              : details && !details.earthVisible
                ? 'لا يوجد خط رؤية مباشر'
                : 'يحتاج مواصفات المهمة',
          ],
        ].map(([label, content]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[10px] uppercase text-muted-foreground">{label}</dt>
            <dd className="mt-2 break-words font-soft text-lg font-bold">{content}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">
        JPL Horizons + حسابات كروية. نسبة سقوط ضوء الشمس = max(0, sin ارتفاع الشمس)، بالنسبة لشمس
        عمودية على سطح أفقي؛ ليست واط/م² ولا لوكس. لا تُقيَّم التضاريس ولا الكسوف ولا الحرارة ولا
        الميل ولا سلامة الهبوط.
      </p>
      <details className="mt-5 border-y border-border py-4">
        <summary className="cursor-pointer font-soft text-sm font-bold">
          نموذج وصلة الراديو · مواصفات المهمة
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([key, label]) => (
            <label key={key} className="lunar-label">
              {label}
              <input
                type="number"
                step="any"
                aria-label={label}
                value={inputs[key] ?? ''}
                onChange={(event) =>
                  setInputs((previous) => ({ ...previous, [key]: event.target.value }))
                }
                className="lunar-input"
              />
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {!complete
            ? 'أدخل كل القيم الست للمهمة؛ لا تُفترض أي مواصفات معدات.'
            : !details
              ? 'يلزم وجود بيانات المصدر للموقع المختار.'
              : !details.earthVisible
                ? 'الأرض تحت الأفق الهندسي؛ لا يوجد تقدير وصلة مباشرة.'
                : !link
                  ? 'يجب أن يكون التردد والقدرة موجبَين؛ والفقدان الإضافي غير سالب.'
                  : `فقدان الفضاء الحر: ${link.freeSpaceLossDb.toFixed(2)} dB · القدرة المستقبلة: ${link.receivedPowerDbm.toFixed(2)} dBm · فائض الوصلة: ${link.marginDb.toFixed(2)} dB`}
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          نموذج فريس مثالي باستخدام مدى المصدر. يجب أن تنطبق كسب الهوائيات في اتجاه الوصلة. الفقدان
          الإضافي وعتبة المستقبل من إدخال المستخدم. لا يوجد نموذج مرحل أو حجب تضاريسي أو غلاف جوي؛
          وليست قوة إشارة مقاسة أو وصلة مضمونة.
        </p>
      </details>
    </div>
  );
}
