import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSeoAudit } from '@/lib/seo-audit.functions';
import { SeoSuggestions } from '@/components/SeoSuggestions';

const auditQuery = queryOptions({ queryKey: ['published-seo-audit'], queryFn: () => getSeoAudit(), staleTime: 60_000 });
export const Route = createFileRoute('/seo')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'SEO Audit — SYNEXIS' },
    { name: 'description', content: 'Read-only SEO checks for the published SYNEXIS pages: titles, descriptions, canonical links and structured data.' },
    { property: 'og:title', content: 'SEO Audit — SYNEXIS' },
    { property: 'og:description', content: 'Actual on-page SEO results from the published SYNEXIS sitemap.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, follow' },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(auditQuery),
  component: SeoPanel,
});

function SeoPanel() {
  const initialAudit = Route.useLoaderData();
  const { data, refetch, isFetching } = useSuspenseQuery({ ...auditQuery, initialData: initialAudit });
  const checks = data.pages.flatMap(page => page.checks);
  return <main className="min-h-screen bg-background text-foreground font-soft px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Button asChild variant="ghost"><Link to="/"><ArrowLeft /> SYNEXIS</Link></Button>
      <header className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div><p className="font-mono text-sm text-muted-foreground">PUBLISHED SITE · SYNEXISS.SITE</p><h1 className="mt-3 text-3xl sm:text-4xl font-bold">SEO audit</h1></div>
        <Button onClick={() => refetch()} disabled={isFetching}><RefreshCw className={isFetching ? 'animate-spin' : ''} />{isFetching ? 'Checking…' : 'Refresh audit'}</Button>
      </header>
      <p className="mt-4 text-sm text-muted-foreground">Checked {new Date(data.checkedAt).toUTCString()} · Published HTML only. These checks do not establish indexing, rankings, or rich-result eligibility.</p>
      <div className="grid grid-cols-3 gap-3 py-8">
        {(['pass', 'warning', 'fail'] as const).map(status => <div key={status} className="border-l-2 border-border pl-3"><p className="text-3xl font-bold">{checks.filter(c => c.status === status).length}</p><p className="text-sm capitalize text-muted-foreground">{status === 'fail' ? 'Needs fixing' : status === 'warning' ? 'Review' : 'Passed'}</p></div>)}
      </div>
      {data.error && <p role="alert" className="border border-border p-4">{data.error}</p>}
      {data.totalPages > 50 && <p>Showing the first 50 of {data.totalPages} sitemap pages.</p>}
      <SeoSuggestions />
      {data.pages.map(page => <section key={page.url} className="border-t border-border py-6">
        <h2 className="font-mono text-base font-bold break-all"><a href={page.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{page.url}</a></h2>
        <p className="mt-2 text-sm text-muted-foreground">{page.httpStatus ? `HTTP ${page.httpStatus}` : 'Retrieval failed'}</p>
        {page.error && <p role="alert" className="mt-4">{page.error}</p>}
        <div className="mt-5 divide-y divide-border">{page.checks.map(check => {
          const Icon = check.status === 'pass' ? CheckCircle2 : check.status === 'fail' ? CircleX : AlertTriangle;
          return <article key={check.name} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr]">
            <h3 className="flex items-start gap-2 font-semibold"><Icon className="mt-0.5 size-5 shrink-0" />{check.name}</h3>
            <div className="min-w-0"><p className="text-xs font-mono uppercase text-muted-foreground">{check.status === 'fail' ? 'Needs fixing' : check.status === 'warning' ? 'Review' : 'Passed'}</p>
              {check.values.map((value, i) => <p key={i} className="mt-2 break-words [overflow-wrap:anywhere]">{value || '(Empty)'}</p>)}
              <p className="mt-2 text-sm text-muted-foreground">{check.message}</p>
            </div>
          </article>;
        })}</div>
      </section>)}
    </div>
  </main>;
}