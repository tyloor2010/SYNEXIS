export const SITE_URL = 'https://synexiss.site';

export function canonicalLink(path: string) {
  return { rel: 'canonical', href: `${SITE_URL}${path}` };
}

export const shareImage = {
  property: 'og:image',
  content: `${SITE_URL}/synexis-share-icon.png`,
};

export const twitterImage = {
  name: 'twitter:image',
  content: `${SITE_URL}/synexis-share-icon.png`,
};
