import { useEffect, useState } from 'react';
import { createFileRoute, notFound, Link } from '@tanstack/react-router';
import { findLandingSite } from '@/lib/landing-sites';
import { PlanningPage } from '@/components/PlanningPage';
import { Button } from '@/components/ui/button';
import { useLunarTerrain } from '@/hooks/use-lunar-terrain';
import { terrainElevation, angularDistance } from '@/lib/lunar-terrain';
import { TerrainPanel, useSiteHorizon } from '@/components/TerrainPanel';
import { usePlanning } from '@/components/PlanningProvider';
import { VisibilityTimeline } from '@/components/VisibilityTimeline';
import { encodeScenario } from '@/lib/scenario-link';
import { LANDING_SITES } from '@/lib/landing-sites';
import { canonicalLink } from '@/lib/seo-meta';

export const Route = createFileRoute('/sites/$siteId')({
  staticData: { sitemap: true },
  loader: ({ params }) => {
    const site = findLandingSite(params.siteId);
    if (!site) throw notFound();
    return site;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? 'موقع هبوط'} — SYNEXIS` },
      {
        name: 'description',
        content:
          'تضاريس مواقع قمرية قابلة لتتبع المصدر، زوايا الشمس، الإضاءة، المسافات ومعادلات المهمة.',
      },
      { property: 'og:title', content: `${loaderData?.name ?? 'موقع هبوط'} — SYNEXIS` },
      {
        property: 'og:description',
        content: 'افحص تضاريس LOLA الحقيقية وتنبيهات JPL المصدرية مع حدود علمية موثقة.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink(`/sites/${loaderData?.id ?? ''}`)],
  }),
  component: SitePage,
});
function SitePage() {
  const [date, setDate] = useState('');
  useEffect(() => setDate(new Date().toISOString().slice(0, 10)), []);
  const site = Route.useLoaderData();
  const { current } = usePlanning();
  const { grid, error, loading: terrainLoading } = useLunarTerrain(site);
  const result =
    current?.scenario.latitude === site.latitude && current.scenario.longitude === site.longitude
      ? current
      : null;
  const { horizon, calculating } = useSiteHorizon(
    grid,
    site.latitude,
    site.longitude,
    result?.scenario.observerHeightM ?? 0,
  );
  const elevation = grid ? terrainElevation(grid, site) : null;
  return (
    <PlanningPage title={site.name} eyebrow="سجل موقع الهبوط">
      <p className="text-sm text-muted-foreground">{site.note}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div>
          <dt>خط العرض</dt>
          <dd>{site.latitude}°</dd>
        </div>
        <div>
          <dt>خط الطول · موجب شرقًا</dt>
          <dd>{site.longitude}°</dd>
        </div>
        <div>
          <dt>ارتفاع LOLA</dt>
          <dd>
            {elevation === null ? 'غير متاح في التغطية المحمّلة' : `${elevation.toFixed(1)} م`}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        {date && (
          <Button asChild>
            <Link
              to="/explorer"
              search={{
                scenario: encodeScenario({
                  name: site.name,
                  latitude: site.latitude,
                  longitude: site.longitude,
                  date: result?.scenario.date ?? date,
                  durationHours: result?.scenario.durationHours ?? 24,
                }),
              }}
            >
              قيّم التاريخ
            </Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/compare">متطلبات المهمة</Link>
        </Button>
      </div>
      <TerrainPanel
        grid={grid}
        error={error}
        loading={terrainLoading}
        result={result}
        hour={0}
        point={site}
        horizon={horizon}
        calculating={calculating}
      />
      {result && (
        <>
          <h2 className="mt-6 font-soft text-xl font-bold">زوايا المصدر عند الهبوط</h2>
          <p className="mt-3 text-sm">
            الشمس {result.sun[0]?.elevation.toFixed(2)}° ارتفاع /{' '}
            {result.sun[0]?.azimuth.toFixed(2)}° سمت · الأرض {result.earth[0]?.elevation.toFixed(2)}
            ° ارتفاع
          </p>
          <VisibilityTimeline result={result} horizon={horizon} />
        </>
      )}
      <h2 className="mt-8 font-soft text-xl font-bold">المسافات · الكرة المرجعية</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LANDING_SITES.filter((s) => s.id !== site.id).map((s) => (
          <p key={s.id}>
            {s.name}: {(angularDistance(site, s) * 1737.4).toFixed(2)} km
          </p>
        ))}
      </div>
      <h2 className="mt-8 font-soft text-xl font-bold">معادلات المهمة</h2>
      <p className="mt-3 text-sm leading-relaxed">
        الطلب = الحمل × المدة. التوليد الشمسي = الإشعاع المورد × مساحة اللوح × الكفاءة × السقوط × (1
        − الفقدان). شحنة البطارية تتكامل مع التوليد ناقص الحمل بترتيب كفاءة الشحن والتفريغ الموردة.
        تُحل السعة المطلوبة وفق الافتراضات نفسها. لا توجد افتراضات لمعدات المركبة ولا ضمانات
        تشغيلية.
      </p>
      <p className="mt-5 text-xs text-muted-foreground">
        المصادر: NASA/JPL Horizons، NASA/LRO/LOLA، NASA Science، LPI LEAG. المراجع الإقليمية ليست
        أهداف هبوط معتمدة؛ يجب تقييم التواريخ ومواصفات المهمة بشكل مستقل.
      </p>
    </PlanningPage>
  );
}
