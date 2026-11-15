import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSeoAudit } from '@/lib/seo-audit.functions';
import { canonicalLink } from '@/lib/seo-meta';

const auditQuery = queryOptions({
  queryKey: ['published-seo-audit'],
  queryFn: () => getSeoAudit(),
  staleTime: 60_000,
});
export const Route = createFileRoute('/seo')({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: 'تدقيق SEO — SYNEXIS' },
      {
        name: 'description',
        content:
          'فحوص SEO للقراءة فقط لصفحات SYNEXIS المنشورة: العناوين والأوصاف والروابط القانونية والبيانات البنيوية.',
      },
      { property: 'og:title', content: 'تدقيق SEO — SYNEXIS' },
      {
        property: 'og:description',
        content: 'نتائج SEO فعلية من خريطة الموقع المنشور.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex, follow' },
    ],
    links: [canonicalLink('/seo')],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(auditQuery),
  component: SeoPanel,
});

function SeoPanel() {
  const initialAudit = Route.useLoaderData();
  const { data, refetch, isFetching } = useSuspenseQuery({
    ...auditQuery,
    initialData: initialAudit,
  });
  const checks = data.pages.flatMap((page) => page.checks);
  return (
    <main className="min-h-screen bg-background text-foreground font-soft px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="ghost">
          <Link to="/">
            <ArrowRight /> SYNEXIS
          </Link>
        </Button>
        <header className="mt-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-sm text-muted-foreground">
              الموقع المنشور · SYNEXISS.SITE
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold">تدقيق SEO</h1>
          </div>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'جارٍ الفحص…' : 'أعد الفحص'}
          </Button>
        </header>
        <p className="mt-4 text-sm text-muted-foreground">
          فُحصت {new Date(data.checkedAt).toUTCString()} · HTML المنشور فقط. هذه الفحوص لا تثبت
          الفهرسة أو الترتيب أو أهلية النتائج الغنية.
        </p>
        <div className="grid grid-cols-3 gap-3 py-8">
          {(['pass', 'warning', 'fail'] as const).map((status) => (
            <div key={status} className="border-l-2 border-border pl-3">
              <p className="text-3xl font-bold">
                {checks.filter((c) => c.status === status).length}
              </p>
              <p className="text-sm capitalize text-muted-foreground">
                {status === 'fail' ? 'يحتاج إصلاحًا' : status === 'warning' ? 'راجع' : 'نجح'}
              </p>
            </div>
          ))}
        </div>
        {data.error && (
          <p role="alert" className="border border-border p-4">
            {data.error}
          </p>
        )}
        {data.totalPages > 50 && (
          <p>تُعرض أول 50 صفحة فقط من {data.totalPages} صفحات في خريطة الموقع.</p>
        )}
        {data.pages.map((page) => (
          <section key={page.url} className="border-t border-border py-6">
            <h2 className="font-mono text-base font-bold break-all">
              <a
                href={page.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                {page.url}
              </a>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {page.httpStatus ? `HTTP ${page.httpStatus}` : 'فشل الاسترجاع'}
            </p>
            {page.error && (
              <p role="alert" className="mt-4">
                {page.error}
              </p>
            )}
            <div className="mt-5 divide-y divide-border">
              {page.checks.map((check) => {
                const Icon =
                  check.status === 'pass'
                    ? CheckCircle2
                    : check.status === 'fail'
                      ? CircleX
                      : AlertTriangle;
                return (
                  <article key={check.name} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr]">
                    <h3 className="flex items-start gap-2 font-semibold">
                      <Icon className="mt-0.5 size-5 shrink-0" />
                      {check.name}
                    </h3>
                    <div className="min-w-0">
                      <p className="text-xs font-mono uppercase text-muted-foreground">
                        {check.status === 'fail'
                          ? 'يحتاج إصلاحًا'
                          : check.status === 'warning'
                            ? 'راجع'
                            : 'نجح'}
                      </p>
                      {check.values.map((value, i) => (
                        <p key={i} className="mt-2 break-words [overflow-wrap:anywhere]">
                          {value || '(فارغ)'}
                        </p>
                      ))}
                      <p className="mt-2 text-sm text-muted-foreground">{check.message}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
