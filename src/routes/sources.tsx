import { createFileRoute, Link } from '@tanstack/react-router';
import { ExternalLink, Github, Satellite } from 'lucide-react';
import { PlanningPage } from '@/components/PlanningPage';
import { Button } from '@/components/ui/button';
import { canonicalLink } from '@/lib/seo-meta';

const SOURCES = [
  {
    name: 'NASA/JPL Horizons System',
    role: 'المصدر المباشر لمواضع الشمس والأرض والسمت والارتفاع والمدى حسب الموقع والوقت المختارين.',
    url: 'https://ssd.jpl.nasa.gov/horizons/',
    api: 'https://ssd.jpl.nasa.gov/api/horizons.api',
  },
  {
    name: 'NASA Lunar Reconnaissance Orbiter / LOLA',
    role: 'بيانات الارتفاعات القمرية المستخدمة في بلاطات التضاريس المحلية؛ التغطية الفعلية موضحة في المستكشف.',
    url: 'https://pds-geosciences.wustl.edu/missions/lro/lola.htm',
  },
  {
    name: 'PDS Geosciences Node',
    role: 'أرشيف بيانات علمية للمنتجات القمرية وبيانات بعثات NASA.',
    url: 'https://pds-geosciences.wustl.edu/',
  },
  {
    name: 'NASA Scientific Visualization Studio · CGI Moon Kit',
    role: 'مرجع مصدر نسيج القمر المستخدم في المجسم؛ النسيج المرئي ليس قياسًا مباشرًا لموضع الشمس.',
    url: 'https://svs.gsfc.nasa.gov/4720/',
  },
  {
    name: 'NASA Moon Trek',
    role: 'مرجع استكشاف وخرائط قمرية؛ ليس مصدرًا حيًا لحسابات الإضاءة في التطبيق.',
    url: 'https://trek.nasa.gov/moon/',
  },
  {
    name: 'LROC QuickMap · Arizona State University',
    role: 'مرجع بصري للتحقق من معالم القمر، وليس تغذية تشغيلية مباشرة للحسابات.',
    url: 'https://quickmap.lroc.asu.edu/',
  },
  {
    name: 'Lunar and Planetary Institute · South Pole Atlas',
    role: 'مرجع سياقي لمواقع ومعالم منطقة القطب الجنوبي.',
    url: 'https://www.lpi.usra.edu/lunar/lunar-south-pole-atlas/',
  },
] as const;

export const Route = createFileRoute('/sources')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'المصادر والبيانات العلمية — SYNEXIS' },
      { name: 'description', content: 'مصادر NASA وJPL وLOLA وروابط بيانات SYNEXIS والمنهجية وحدود التغطية.' },
      { property: 'og:title', content: 'المصادر والبيانات العلمية — SYNEXIS' },
      { property: 'og:description', content: 'تعرف على مصادر البيانات الحية والمرجعية في SYNEXIS.' },
    ],
    links: [canonicalLink('/sources')],
  }),
  component: SourcesPage,
});

function SourcesPage() {
  return (
    <PlanningPage eyebrow="المراجع والبيانات" title="مصادر يمكن تتبّعها.">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        بيانات الشمس والأرض في المستكشف تُطلب من NASA/JPL Horizons عبر الخادم عند اختيار الموقع والوقت. بيانات LOLA المحلية ملفات منشورة من بيانات البعثة ومتحقق من بصمتها؛ لا تعني أنها بث مباشر. عند غياب التغطية أو فشل المصدر نظهر ذلك ولا نستبدله بأرقام مختلقة.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SOURCES.map((source) => (
          <article key={source.name} className="border border-border bg-card p-5">
            <h2 className="font-soft text-lg font-bold">{source.name}</h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{source.role}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-primary" href={source.url} target="_blank" rel="noreferrer">
                صفحة المصدر <ExternalLink className="h-3 w-3" />
              </a>
              {'api' in source && <a className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-primary" href={source.api} target="_blank" rel="noreferrer">واجهة API <ExternalLink className="h-3 w-3" /></a>}
            </div>
          </article>
        ))}
      </div>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="flex items-center gap-2 font-soft text-2xl font-bold"><Satellite /> المشروع والكود</h2>
        <p className="mt-3 text-sm text-muted-foreground">المستودع يضم التطبيق، بيانات التضاريس المحلية، اختبارات الحسابات، وطريقة الاستدعاء.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline"><a href="https://github.com/tyloor2010/SYNEXIS" target="_blank" rel="noreferrer"><Github /> مستودع SYNEXIS على GitHub</a></Button>
          <Button asChild><Link to="/learn">اقرأ المنهجية والحدود</Link></Button>
        </div>
      </section>
      <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        SYNEXIS مشروع مستقل وغير تابع رسميًا لناسا. البيانات العشوائية، إن استُخدمت في وضع الاختبار، اصطناعية ومعلّمة بوضوح ولا تُستخدم في التحليل العلمي أو الذكاء الاصطناعي.
      </p>
    </PlanningPage>
  );
}
