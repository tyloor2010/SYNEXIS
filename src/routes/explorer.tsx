import { createFileRoute } from '@tanstack/react-router';
import { LunarNavigator } from '@/components/LunarNavigator';
import { decodeScenario } from '@/lib/scenario-link';

export const Route = createFileRoute('/explorer')({
  staticData: { sitemap: true },
  validateSearch: (search: Record<string, unknown>): { scenario?: string } => typeof search['scenario'] === 'string' && decodeScenario(search['scenario']) ? { scenario: search['scenario'] } : {},
  head: () => ({ meta: [
    { title: 'Lunar Landing Explorer — SYNEXIS' },
    { name: 'description', content: 'Explore lunar locations and dates using real JPL Horizons data, translucent sunlight and Earth-visibility layers, and documented site calculations.' },
    { property: 'og:title', content: 'Lunar Landing Explorer — SYNEXIS' },
    { property: 'og:description', content: 'Compare lunar landing locations and dates with authentic Sun and Earth ephemerides and a 3D lunar map.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: LunarNavigator,
});