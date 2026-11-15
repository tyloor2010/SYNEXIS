import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Download, FileText, Trash2, Moon, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanningPage } from './PlanningPage';
import { usePlanning } from './PlanningProvider';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { useSiteHorizon } from './TerrainPanel';
import {
  powerFields,
  parsePowerInputs,
  powerBudget,
  sizeMission,
  visibilityWindow,
} from '@/lib/lunar-planning';
import { downloadReport, planningReport, readableReport, csvReport } from '@/lib/planning-report';
import type { LunarResult } from '@/lib/lunar-data';
import { VehiclePrediction } from './VehiclePrediction';

function Scenario({
  result,
  inputs,
  onRemove,
}: {
  result: LunarResult;
  inputs: Record<string, string>;
  onRemove: () => void;
}) {
  const { grid, error: terrainError, loading: terrainLoading } = useLunarTerrain(result.scenario);
  const { horizon, calculating } = useSiteHorizon(
    grid,
    result.scenario.latitude,
    result.scenario.longitude,
    result.scenario.observerHeightM ?? 0,
  );
  const specs = parsePowerInputs(inputs),
    sun = visibilityWindow(result.sun, horizon),
    earth = visibilityWindow(result.earth, horizon);
  const budget = useMemo(() => {
    const valid = parsePowerInputs(inputs);
    return valid ? powerBudget(result, horizon, valid) : null;
  }, [inputs, result, horizon]);
  const sizing = useMemo(() => {
    const valid = parsePowerInputs(inputs);
    return valid ? sizeMission(result, horizon, valid) : null;
  }, [inputs, result, horizon]);
  const [printError, setPrintError] = useState('');
  const print = () => {
    const page = window.open('', '_blank');
    if (!page) {
      setPrintError('اسمح بنافذة التقرير، أو نزّل التقرير واطبعه من متصفحك.');
      return;
    }
    page.opener = null;
    page.document.write(readableReport(report()));
    page.document.close();
    page.focus();
    page.print();
    setPrintError('');
  };
  const report = () => planningReport(result, horizon, specs);
  return (
    <article className="min-w-0 border border-border p-5">
      <VehiclePrediction result={result} horizon={horizon} />
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-soft text-xl font-bold">{result.scenario.name}</h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`احذف ${result.scenario.name}`}
          title="احذف السيناريو"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {result.scenario.date} · {result.scenario.startHour ?? 0}:00 UTC
        <br />
        {result.scenario.latitude.toFixed(4)}°N, {result.scenario.longitude.toFixed(4)}°E
        <br />
        مهمة {result.sun.length - 1} ساعة
      </p>
      <p role="status" className="mt-4 text-xs font-bold">
        {terrainLoading
          ? 'جارٍ تحميل تضاريس LOLA…'
          : terrainError
            ? 'تضاريس LOLA غير متاحة'
            : calculating
              ? 'جارٍ حساب التضاريس…'
              : horizon
                ? 'أفق LOLA 15 كم'
                : 'لا توجد بلاطة LOLA تغطي هذه النقطة · أفق كروي فقط'}
      </p>
      <dl className="mt-5 grid gap-4">
        {[
          ['مدة الإضاءة', `${sun.hours.toFixed(1)} ساعة`],
          ['مدة ظهور الأرض', `${earth.hours.toFixed(1)} ساعة`],
          [
            'الغروب القادم من الهبوط',
            sun.nextSetting
              ? `${sun.nextSetting.earliestHours}–${sun.nextSetting.latestHours} ساعة`
              : sun.currentlyVisible
                ? 'لا يوجد عبور في النافذة'
                : 'تحت الأفق عند الهبوط',
          ],
          [
            'الانقطاع القادم للأرض',
            earth.nextSetting
              ? `${earth.nextSetting.earliestHours}–${earth.nextSetting.latestHours} h`
              : earth.currentlyVisible
                ? 'لا يوجد عبور في النافذة'
                : 'تحت الأفق عند الهبوط',
          ],
          [
            'الطلب الطاقي',
            budget ? `${budget.demandWh.toFixed(1)} واط.ساعة` : 'يحتاج مدخلات المهمة',
          ],
          ['التوليد المُنمذج', budget ? `${budget.generatedWh.toFixed(1)} واط.ساعة` : '—'],
          [
            'البطارية المطلوبة (اللوح ثابت)',
            !specs || !horizon
              ? 'يحتاج مدخلات المهمة والتضاريس'
              : sizing?.requiredBatteryWh != null
                ? `${sizing.requiredBatteryWh.toFixed(0)} واط.ساعة`
                : 'لا يوجد حل محدود',
          ],
          [
            'اللوح المطلوب (البطارية ثابتة)',
            !specs || !horizon
              ? 'يحتاج مدخلات المهمة والتضاريس'
              : sizing?.requiredArrayM2 != null
                ? `${sizing.requiredArrayM2.toFixed(2)} م²`
                : 'لا يوجد حل محدود',
          ],
          [
            'أدنى شحنة للبطارية',
            budget && specs
              ? `${((budget.minChargeWh / specs.capacityWh) * 100).toFixed(1)}%`
              : '—',
          ],
          [
            'نقص الطاقة عند الحد الاحتياطي',
            budget ? `${budget.deficitWh.toFixed(1)} واط.ساعة · جانب البطارية` : '—',
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-soft text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-border pt-4 text-sm font-bold">
        فحص الطاقة: {budget?.status ?? 'بيانات غير كافية'}
      </p>
      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {!specs
          ? 'المدخلات الاثنا عشر للمهمة مطلوبة.'
          : !horizon
            ? 'يلزم توفر تغطية التضاريس كاملة للفحص.'
            : budget && budget.deficitWh > 0
              ? 'الطلب المُنمذج يتجاوز التوليد زائد الطاقة المخزنة القابلة للاستخدام خلال هذه النافذة.'
              : 'تبقى البطارية عند أو فوق الحد الاحتياطي المطلوب في هذا النموذج.'}{' '}
        يتغير التحجيم بمقدار مدخل واحد في كل مرة مع تثبيت الباقي. يُبلَّغ عن ظهور الاتصال بشكل
        منفصل؛ لا يوجد حكم على سلامة المهمة.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport('SYNEXIS-scenario-report.html', readableReport(report()), 'text/html')
          }
        >
          <FileText />
          التقرير
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport(
              'SYNEXIS-scenario-data.json',
              JSON.stringify(report(), null, 2),
              'application/json',
            )
          }
        >
          <Download />
          البيانات
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={calculating}
          onClick={() =>
            downloadReport('SYNEXIS-scenario-samples.csv', csvReport(report()), 'text/csv')
          }
        >
          <Download />
          CSV
        </Button>
        <Button size="sm" variant="outline" disabled={calculating} onClick={print}>
          <Printer />
          PDF
        </Button>
      </div>
      {printError && (
        <p role="alert" className="mt-3 text-xs text-muted-foreground">
          {printError}
        </p>
      )}
    </article>
  );
}
export function MissionCompare() {
  const { saved, current, save, remove } = usePlanning();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  return (
    <PlanningPage title="قارن المهمة." eyebrow="03 / السيناريوهات والمتطلبات">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {saved.length} / 4 سيناريوهات · تُحفظ على هذا المتصفح فقط
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!current || saved.length >= 4}
            onClick={() => {
              if (current) save(current);
            }}
          >
            <Plus />
            أضف السيناريو الحالي
          </Button>
          <Button asChild>
            <Link to="/explorer">
              <Moon />
              الملاح
            </Link>
          </Button>
        </div>
      </div>
      <details open className="mt-7 border-y border-border py-5">
        <summary className="cursor-pointer font-soft text-xl font-bold">
          متطلبات الطاقة والبطارية
        </summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {powerFields.map(([key, label]) => (
            <label key={key} className="lunar-label">
              {label}
              <input
                aria-label={label}
                type="number"
                step="any"
                value={inputs[key] ?? ''}
                onChange={(event) => setInputs((v) => ({ ...v, [key]: event.target.value }))}
                className="lunar-input"
              />
            </label>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {parsePowerInputs(inputs)
            ? 'مدخلات المهمة صحيحة. تُطبق بالتساوي على كل سيناريو.'
            : 'أدخل كل مواصفات المهمة بوحدات ونسب صحيحة. لا تُزوَّد أي افتراضات عن المعدات.'}
        </p>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          حمل ثابت واتجاه لوح ثابت؛ ناتج اللوح من الإشعاع المورد × المساحة × الكفاءة × السقوط، مع
          الفقدان المورد. مواضع JPL كل ساعة، وتكامل بالدقيقة للقدرة المستوفاة. لا يوجد نموذج حراري
          أو للتدهور أو للحد الأقصى للشحن أو لإلكترونيات القدرة.
        </p>
      </details>
      {saved.length ? (
        <div className="mt-7 grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {saved.map((result, index) => (
            <Scenario
              key={`${result.scenario.date}-${index}`}
              result={result}
              inputs={inputs}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      ) : (
        <div className="border-b border-border py-12">
          <h2 className="font-soft text-2xl font-bold">لا توجد سيناريوهات محفوظة.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            قيّم موقعًا وتاريخًا في الملاح، ثم أضف نتائجه المسترجعة.
          </p>
        </div>
      )}
      <p className="mt-6 text-[10px] text-muted-foreground">
        يتضمن التقرير مدخلات المهمة وبصمات المصدر ووقت الاسترجاع وتقديرات الفترات والقيود. افتح
        التقرير المُنزّل واستخدم خاصية الطباعة في متصفحك للحفظ كملف PDF.
      </p>
    </PlanningPage>
  );
}
