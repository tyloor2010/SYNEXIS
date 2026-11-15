import { useState } from 'react';
import { radioFields, parseRadioInputs, predictCommunication } from '@/lib/vehicle-prediction';
import type { LunarResult } from '@/lib/lunar-data';
import type { TerrainHorizon } from '@/lib/lunar-terrain';
export function VehiclePrediction({
  result,
  horizon,
}: {
  result: LunarResult;
  horizon: TerrainHorizon | null;
}) {
  const [name, setName] = useState(''),
    [values, setValues] = useState<Record<string, string>>({});
  const prediction = predictCommunication(result, horizon, parseRadioInputs(values));
  return (
    <details className="mt-5 border-y border-border py-4">
      <summary className="cursor-pointer font-soft font-bold">تنبؤ الاتصال بالمركبة</summary>
      <label className="lunar-label mt-4">
        ملف المركبة / المهمة
        <input
          className="lunar-input"
          aria-label="اسم ملف المركبة"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {radioFields.map(([key, label]) => (
          <label className="lunar-label" key={key}>
            {label}
            <input
              aria-label={label}
              type="number"
              step="any"
              className="lunar-input"
              value={values[key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <p className="mt-4 text-sm" role="status">
        {prediction
          ? `${name || 'ملف محدد من المستخدم'}: ${prediction.usableSamples} / ${prediction.totalSamples} عينة كل ساعة بخط رؤية واضح وفائض وصلة غير سالب`
          : 'يحتاج كل مدخلات الراديو الستة وتغطية تضاريس كاملة'}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        فريس: الاستقبال dBm = 10 لو₁₀(القدرة المُرسَلة W × 1000) + كسب الهوائيات − 20 لو₁₀(4π المدى
        / الطول الموجي) − الفقدان. فائض الوصلة = القدرة المستقبلة − عتبة المستقبل الموردة. عينات
        المصدر، وليست اتصالًا مستمرًا أو إشارة مقاسة. افتراضات القدرة والبطارية أعلاه تبقى من إدخال
        المستخدم.
      </p>
    </details>
  );
}
