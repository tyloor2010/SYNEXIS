import { createFileRoute } from '@tanstack/react-router';
import { TerrainMeasure } from '@/components/TerrainMeasure';
import { canonicalLink } from '@/lib/seo-meta';
export const Route = createFileRoute('/measure')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'قياسات تضاريس LOLA — SYNEXIS' },
      {
        name: 'description',
        content:
          'قِس مسافات التضاريس القمرية وفرق الارتفاع ومتوسط الميل وخط الرؤية بالعينات، باستخدام ارتفاعات NASA LOLA الحقيقية.',
      },
      { property: 'og:title', content: 'قياسات تضاريس LOLA — SYNEXIS' },
      {
        property: 'og:description',
        content: 'قياسات تضاريس قطب-جنوبي قابلة لتتبع المصدر مع حدود صريحة للشبكة والعينات.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/measure')],
  }),
  component: TerrainMeasure,
});
