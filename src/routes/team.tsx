import { createFileRoute, Link } from '@tanstack/react-router';
import { Github, Linkedin, Globe, Users } from 'lucide-react';
import { PlanningPage } from '@/components/PlanningPage';
import { TEAM_MEMBERS, TEAM_NOTE } from '@/lib/team';
import { canonicalLink } from '@/lib/seo-meta';

export const Route = createFileRoute('/team')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'عن الفريق — SYNEXIS' },
      {
        name: 'description',
        content:
          'تعرّف على فريق SYNEXIS الذي يبني أداة مقارنة مواقع الهبوط على القطب الجنوبي للقمر من بيانات ناسا الحقيقية.',
      },
      { property: 'og:title', content: 'عن الفريق — SYNEXIS' },
      {
        property: 'og:description',
        content: 'الفريق الذي يقف خلف ملاح SYNEXIS — بيانات ناسا الحقيقية وواجهة مفتوحة.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/team')],
  }),
  component: Team,
});

function Team() {
  return (
    <PlanningPage eyebrow="عن الفريق" title="فريق SYNEXIS">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        كل منا يشتغل على أداة عامة هدفها مساعدة المخططين والمهندسين والطلاب وأي شخص مهتم بفكرة
        الهبوط على القطب الجنوبي للقمر. الموقع مفتوح للجميع، ومبني بالكامل على بيانات ناسا الحقيقية
        — JPL Horizons للشمس والأرض، وLOLA للتضاريس — وليس على أرقام مخترعة.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM_MEMBERS.map((member) => {
          const hasLinks = member.github || member.linkedin || member.website;
          return (
            <article
              key={member.id}
              className="group flex flex-col items-center border border-border bg-card p-6 text-center transition-colors hover:border-primary/60"
            >
              <img
                src={member.image ?? `/team/${member.id}.svg`}
                width="128"
                height="128"
                alt={`صورة ${member.nameAr}`}
                className="h-32 w-32 rounded-full border border-border object-cover"
                loading="lazy"
              />
              <h2 className="mt-4 font-soft text-xl font-bold">{member.nameAr}</h2>
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                {member.name}
              </p>
              {member.roleAr ? (
                <p className="mt-3 text-xs font-bold text-foreground">{member.roleAr}</p>
              ) : null}
              {hasLinks ? (
                <div className="mt-4 flex items-center gap-2">
                  {member.github ? (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`جيتهاب ${member.nameAr}`}
                      className="rounded-md border border-border p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Github className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {member.linkedin ? (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`لينكدإن ${member.nameAr}`}
                      className="rounded-md border border-border p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Linkedin className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {member.website ? (
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`موقع ${member.nameAr}`}
                      className="rounded-md border border-border p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Globe className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-[10px] text-muted-foreground">الروابط قيد الإضافة</p>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-[11px] text-muted-foreground">{TEAM_NOTE}</p>
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <a
          href="https://github.com/MoiEgy/SYNEXIS"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          المستودع على جيتهاب — MoiEgy/SYNEXIS
        </a>
        <Link
          to="/learn"
          className="text-xs font-bold text-foreground underline underline-offset-4 hover:text-primary"
        >
          منهجية ومصادر وقيود الموقع ←
        </Link>
      </div>
    </PlanningPage>
  );
}
