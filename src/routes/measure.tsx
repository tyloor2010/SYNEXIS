import { createFileRoute } from '@tanstack/react-router';
import { TerrainMeasure } from '@/components/TerrainMeasure';
export const Route = createFileRoute('/measure')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'LOLA Terrain Measurements — SYNEXIS' }, { name: 'description', content: 'Measure lunar terrain distance, height difference, average slope and sampled line of sight using authentic NASA LOLA elevations.' }, { property: 'og:title', content: 'LOLA Terrain Measurements — SYNEXIS' }, { property: 'og:description', content: 'Source-traceable south-polar terrain measurements with explicit grid and sampling limitations.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: TerrainMeasure,
});