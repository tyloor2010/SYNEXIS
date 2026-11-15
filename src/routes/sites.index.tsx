import { createFileRoute, Link } from '@tanstack/react-router';
import { PlanningPage } from '@/components/PlanningPage';
import { LANDING_SITES } from '@/lib/landing-sites';
import { Button } from '@/components/ui/button';
import { canonicalLink } from '@/lib/seo-meta';
export const Route = createFileRoute('/sites/')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'مكتبة مواقع الهبوط — SYNEXIS' },
      {
        name: 'description',
        content: 'مواقع قمرية قائمة ومراجع لمنطقة القطب الجنوبي من مصادر مستقلة.',
      },
      { property: 'og:title', content: 'مكتبة مواقع الهبوط — SYNEXIS' },
      {
        property: 'og:description',
        content: 'تفحص التضاريس والمسافات وبيانات المصدر ومعادلات المهمة لكل موقع قمري.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/sites')],
  }),
  component: () => (
    <PlanningPage title="مكتبة مواقع الهبوط." eyebrow="المواقع والسجلات المصدرية">
      <div className="grid gap-4 sm:grid-cols-2">
        {LANDING_SITES.map((site) => (
          <article key={site.id} className="min-w-0 border border-border p-5">
            <h2 className="font-soft text-xl font-bold">{site.name}</h2>
            <p className="mt-3 text-xs text-muted-foreground">{site.note}</p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/sites/$siteId" params={{ siteId: site.id }}>
                تفحص الموقع
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </PlanningPage>
  ),
});
