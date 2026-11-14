import { createFileRoute, Link } from '@tanstack/react-router';
import { PlanningPage } from '@/components/PlanningPage';
import { LANDING_SITES } from '@/lib/landing-sites';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/sites/')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'Landing-site Library — SYNEXIS' }, { name: 'description', content: 'Existing lunar sites and independently sourced south-polar region references.' }, { property: 'og:title', content: 'Landing-site Library — SYNEXIS' }, { property: 'og:description', content: 'Inspect terrain, distances, source data and mission equations for each lunar site.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: () => <PlanningPage title="Landing-site library." eyebrow="Locations & source records"><div className="grid gap-4 sm:grid-cols-2">{LANDING_SITES.map(site => <article key={site.id} className="min-w-0 border border-border p-5"><h2 className="font-soft text-xl font-bold">{site.name}</h2><p className="mt-3 text-xs text-muted-foreground">{site.note}</p><Button asChild variant="outline" className="mt-5"><Link to="/sites/$siteId" params={{ siteId: site.id }}>Inspect site</Link></Button></article>)}</div></PlanningPage>,
});