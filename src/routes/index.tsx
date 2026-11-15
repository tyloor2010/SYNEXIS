import { createFileRoute } from '@tanstack/react-router';
import { SynexisHome } from '@/components/SynexisHome';
import { canonicalLink } from '@/lib/seo-meta';

export const Route = createFileRoute('/')({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: 'SYNEXIS — ملاح مواقع الهبوط على القمر' },
      {
        name: 'description',
        content:
          'SYNEXIS يقارن بين مواقع الهبوط على القمر والتواريخ باستخدام بيانات NASA/JPL Horizons الحقيقية لتقييم الإضاءة ومدى ظهور الأرض فوق الأفق.',
      },
      { property: 'og:title', content: 'SYNEXIS — ملاح مواقع الهبوط على القمر' },
      {
        property: 'og:description',
        content:
          'SYNEXIS يقارن بين مواقع الهبوط على القمر والتواريخ باستخدام بيانات NASA/JPL Horizons الحقيقية لتقييم الإضاءة ومدى ظهور الأرض فوق الأفق.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:description',
        content:
          'SYNEXIS يقارن بين مواقع الهبوط على القمر والتواريخ باستخدام بيانات NASA/JPL Horizons الحقيقية لتقييم الإضاءة ومدى ظهور الأرض فوق الأفق.',
      },
    ],
    links: [canonicalLink('/')],
  }),
  component: SynexisHome,
});
