import type { LunarResult } from './lunar-data';
import { TERRAIN_META, type TerrainHorizon } from './lunar-terrain';
import { visibilityIntervals } from './lunar-windows';
import {
  powerBudget,
  sizeMission,
  visibilityWindow,
  type PowerSpecifications,
} from './lunar-planning';

export function planningReport(
  result: LunarResult,
  horizon: TerrainHorizon | null,
  specifications: PowerSpecifications | null,
) {
  return {
    project: 'SYNEXIS',
    scenario: result.scenario,
    retrievedAt: result.retrievedAt,
    sourceStatus: result.message,
    retrievalMode: result.message.toLowerCase().includes('historical')
      ? 'لقطة مرجعية تاريخية'
      : 'بيانات مصدر مسترجعة',
    ephemeridesSource: 'NASA/JPL Horizons',
    sampleIntervalHours: 1,
    terrain: horizon
      ? {
          product: TERRAIN_META.product,
          sourceDate: TERRAIN_META.sourceDate,
          sourceSha256: TERRAIN_META.sourceSha256,
          tileSha256: horizon.tileSha256 ?? TERRAIN_META.tileSha256,
          coverageWidthM: horizon.coverageWidthM ?? TERRAIN_META.width * TERRAIN_META.spacingM,
          spacingM: 40,
          radialSamplingM: 80,
          azimuthSamplingDegrees: 1,
          horizonRadiusM: horizon.radiusM,
          observerHeightM: horizon.observerHeightM,
          observerElevationM: horizon.elevationM,
        }
      : null,
    sunlightWindows: visibilityIntervals(result.sun, horizon),
    earthWindows: visibilityIntervals(result.earth, horizon),
    sunlight: visibilityWindow(result.sun, horizon),
    earthVisibility: visibilityWindow(result.earth, horizon),
    specifications,
    sizing: specifications ? sizeMission(result, horizon, specifications) : null,
    power: specifications ? powerBudget(result, horizon, specifications) : null,
    limitations:
      'فحص تعليمي وليس شهادة مهمة. ظهور المراكز فقط؛ تُستثنى مدى قرص الشمس والأرض والكسوف. الأفق محدود بـ 15 كم؛ والعوائق البعيدة غير الممذجة قد تغير النتيجة. شبكة DEM مُستوفاة وليست ضمانًا للدقة. الاستيفاء الخطي كل ساعة قد يفوت أحداثًا أقصر. القدرة تفترض حملًا ثابتًا موردًا واتجاه لوح ثابت وإشعاعًا/كفاءات موردة، دون نمذجة للتدهور أو الحرارة. غياب التضاريس يمنع فحصًا كاملًا. ظهور الأرض ليس اتصالًا مضمونًا.',
    samples: result.sun.map((sun, index) => ({ sun, earth: result.earth[index] })),
  };
}
export function downloadReport(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readableReport(report: ReturnType<typeof planningReport>) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
    );
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>SYNEXIS — تقرير السيناريو</title></head><body><h1>SYNEXIS — تقرير السيناريو</h1><h2>${escape(report.scenario.name)}</h2><p>${escape(report.scenario.date)} · ${report.scenario.latitude}°N, ${report.scenario.longitude}°E</p><p>الإضاءة: ${report.sunlight.hours.toFixed(1)} ساعة · ظهور الأرض: ${report.earthVisibility.hours.toFixed(1)} ساعة / ${report.sunlight.durationHours} ساعة</p><p>التضاريس: ${report.terrain ? `${escape(report.terrain.product)} · شبكة 40 م · أفق 15 كم بالعينات` : 'غير متاحة؛ تقديرات كروية فقط'}</p><p>حالة القدرة: ${escape(report.power?.status ?? 'بيانات غير كافية')}</p><p>${escape(report.limitations)}</p><h2>المدخلات والمصادر والحسابات</h2><pre>${escape(JSON.stringify(report, null, 2))}</pre></body></html>`;
}
export function csvReport(report: ReturnType<typeof planningReport>) {
  return (
    'utc,sun_azimuth_deg,sun_elevation_deg,earth_azimuth_deg,earth_elevation_deg,earth_range_km\n' +
    report.samples
      .map(({ sun, earth }) =>
        [
          safeCsvText(sun.time),
          sun.azimuth,
          sun.elevation,
          earth?.azimuth ?? '',
          earth?.elevation ?? '',
          earth?.rangeKm ?? '',
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')
  );
}
export function safeCsvText(value: string) {
  return /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
}
