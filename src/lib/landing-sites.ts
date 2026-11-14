import { LUNAR_SITES } from './lunar-data';

// Region coordinates are not certified landing points or crater-rim positions.
export const LANDING_SITES = [
  ...LUNAR_SITES.map(site => ({ ...site, sources: [] as string[], expanded: false })),
  { id: 'malapert', name: 'Malapert Massif · regional reference', latitude: -85.99, longitude: -2.93, expanded: true,
    note: 'Regional reference, not a selected landing point. NASA LOLA region and LPI LEAG landing-target coordinates agree; 357.07°E normalized to −2.93°E.',
    sources: ['https://science.nasa.gov/image-detail/20100618/', 'https://www.lpi.usra.edu/leag/reports/LEAG_LT_delivered.pdf'] },
] as const;
export function findLandingSite(id: string) { return LANDING_SITES.find(site => site.id === id); }