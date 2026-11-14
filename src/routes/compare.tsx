import { createFileRoute } from '@tanstack/react-router';
import { MissionCompare } from '@/components/MissionCompare';
export const Route = createFileRoute('/compare')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'Mission Comparison & Power — SYNEXIS' }, { name: 'description', content: 'Compare up to four lunar landing scenarios, user-specified power and battery requirements, and export source-traceable reports.' }, { property: 'og:title', content: 'Mission Comparison & Power — SYNEXIS' }, { property: 'og:description', content: 'Compare terrain-aware sunlight and Earth visibility with transparent modeled energy requirements.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: MissionCompare,
});