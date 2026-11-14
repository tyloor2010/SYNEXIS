import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/sites')({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: 'Landing-site Library — SYNEXIS' }, { name: 'description', content: 'Explore existing and independently sourced lunar site references with terrain, illumination and documented mission equations.' }, { property: 'og:title', content: 'Landing-site Library — SYNEXIS' }, { property: 'og:description', content: 'Authentic lunar site references and transparent planning limits.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: () => <Outlet />,
});