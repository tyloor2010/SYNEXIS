import { createFileRoute } from '@tanstack/react-router';
import { MissionCompare } from '@/components/MissionCompare';
import { canonicalLink } from '@/lib/seo-meta';
export const Route = createFileRoute('/compare')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'مقارنة المهمة والطاقة — SYNEXIS' },
      {
        name: 'description',
        content:
          'قارن حتى أربع سيناريوهات للهبوط على القمر، ومتطلبات القدرة والبطارية من إدخال المستخدم، وصدّر تقارير قابلة لتتبع المصدر.',
      },
      { property: 'og:title', content: 'مقارنة المهمة والطاقة — SYNEXIS' },
      {
        property: 'og:description',
        content: 'قارن الإضاءة ومدى ظهور الأرض في ضوء التضاريس، مع متطلبات طاقة شفافة ومنمذجة.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/compare')],
  }),
  component: MissionCompare,
});
