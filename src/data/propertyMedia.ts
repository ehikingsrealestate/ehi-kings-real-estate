import type { Estate } from './site';

const representativeMedia = {
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=82&sat=-28',
  ],
  home: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=82',
  ],
};

const legacyFlyerImages = new Set([
  '/estates/grace-apartments-lekki.jpg',
  '/estates/grace-life-garden-estate.jpg',
  '/estates/perfect-garden-estate-epe.jpg',
  '/estates/shalom-garden-city-benin.jpg',
  '/estates/charis-garden-estate.jpg',
]);

function slugIndex(slug: string, length: number) {
  const total = slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % length;
}

export function estateMedia(estate: Estate, width = 1400) {
  if (estate.img && !legacyFlyerImages.has(estate.img)) return estate.img;
  const choices = representativeMedia[estate.kind];
  const url = choices[slugIndex(estate.slug, choices.length)];
  return url.replace(/w=\d+/, `w=${width}`);
}
