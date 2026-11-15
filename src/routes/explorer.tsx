import { createFileRoute } from '@tanstack/react-router';
import { LunarNavigator } from '@/components/LunarNavigator';
import { decodeScenario } from '@/lib/scenario-link';
import { canonicalLink } from '@/lib/seo-meta';

export const Route = createFileRoute('/explorer')({
  staticData: { sitemap: true },
  validateSearch: (search: Record<string, unknown>): { scenario?: string } =>
    typeof search['scenario'] === 'string' && decodeScenario(search['scenario'])
      ? { scenario: search['scenario'] }
      : {},
  head: () => ({
    meta: [
      { title: 'مستكشف مواقع الهبوط — SYNEXIS' },
      {
        name: 'description',
        content:
          'استكشف مواقع وتواريخ الهبوط على القمر باستخدام بيانات NASA/JPL Horizons الحقيقية، وطبقات الإضاءة ومدى ظهور الأرض، وكل الحسابات موثقة.',
      },
      { property: 'og:title', content: 'مستكشف مواقع الهبوط — SYNEXIS' },
      {
        property: 'og:description',
        content:
          'قارن مواقع وتواريخ الهبوط على القمر بإفيميريدات الشمس والأرض الحقيقية وخريطة قمرية ثلاثية الأبعاد.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [canonicalLink('/explorer')],
  }),
  component: LunarNavigator,
});
