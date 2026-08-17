// Real company media supplied by Ehi-Kings (2026-07-09): client testimonial
// videos, physical-allocation photos, and the branded estate offer flyers.
// Assets live in public/testimonials, public/allocations, public/brochures.

export type Testimonial = {
  id: string;
  name: string;
  role: string; // short context, e.g. "Proud landlady, Perfect Garden Epe"
  video: string;
  poster: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'gift-ayingor',
    name: 'Gift Ayingor',
    role: 'Proud landowner — Perfect Garden Epe',
    video: '/testimonials/gift-ayingor.mp4',
    poster: '/testimonials/gift-ayingor.jpg',
  },
  {
    id: 'precious-corper',
    name: 'Precious',
    role: 'Corps member, now a landowner',
    video: '/testimonials/precious-corper.mp4',
    poster: '/testimonials/precious-corper.jpg',
  },
  {
    id: 'precious-investor',
    name: 'Precious',
    role: 'First-time real-estate investor',
    video: '/testimonials/precious-investor.mp4',
    poster: '/testimonials/precious-investor.jpg',
  },
  {
    id: 'happy-client',
    name: 'Verified client',
    role: 'Physical land allocation, Epe',
    video: '/testimonials/happy-client.mp4',
    poster: '/testimonials/happy-client.jpg',
  },
];

export type Allocation = { src: string; caption: string };

// Real photos from a physical land-allocation day at Perfect Garden Estate, Epe.
export const ALLOCATIONS: Allocation[] = [
  { src: '/allocations/pg-epe-landlady-1.jpg', caption: '“I am a proud landlady” — allocation day, Perfect Garden Epe' },
  { src: '/allocations/pg-epe-landlady-2.jpg', caption: 'Documents handed over on site' },
  { src: '/allocations/pg-epe-landlord.jpg', caption: 'A new landlord receives his plot' },
  { src: '/allocations/pg-epe-layout.jpg', caption: 'The registered estate layout, presented on site' },
];

// Branded current-offer flyers, keyed to the estate slug they belong to.
export type Offer = { slug: string; name: string; flyer: string; blurb: string };

export const OFFERS: Offer[] = [
  { slug: 'grace-apartments-lekki', name: 'Grace Apartments, Lekki', flyer: '/brochures/grace-apartments-lekki.jpg', blurb: 'One-bed apartments — Oko-Ado, Sangotedo.' },
  { slug: 'perfect-garden-estate-epe', name: 'Perfect Garden Estate, Epe', flyer: '/brochures/perfect-garden-estate-epe.jpg', blurb: 'Registered survey plots from ₦4.5M.' },
  { slug: 'perfect-garden-homes-abuja', name: 'Perfect Garden Homes, Abuja', flyer: '/brochures/perfect-garden-homes-abuja.jpg', blurb: '5-bedroom detached duplex, Airport Road.' },
  { slug: 'grace-villa-estate', name: 'Grace Villa Garden Estate', flyer: '/brochures/grace-villa-estate.jpg', blurb: 'C of O land behind Greenspring, Sangotedo.' },
  { slug: 'charis-garden-estate', name: 'Charis Garden Estate', flyer: '/brochures/charis-garden-estate.jpg', blurb: 'Registered survey land from ₦1.7M, Epe.' },
  { slug: 'grace-life-garden-estate', name: 'Grace Life Garden Estate', flyer: '/brochures/grace-life-garden-estate.jpg', blurb: '500 SQM plots, Awoyaya, Ibeju-Lekki.' },
  { slug: 'perfect-garden-estate-benin', name: 'Perfect Garden Estate, Benin', flyer: '/brochures/perfect-garden-estate-benin.jpg', blurb: 'Gated land & buildings, GRA Benin.' },
  { slug: 'shalom-garden-city-benin', name: 'Shalom Garden City, Benin', flyer: '/brochures/shalom-garden-city-benin.jpg', blurb: 'Pre-launch plots, Upper Ekewan Road.' },
  { slug: 'open-gate-royal-garden-phase-1', name: 'Open Gate Royal Garden Estate', flyer: '/brochures/open-gate-royal-garden-phase-1.jpg', blurb: 'Physical allocation — Ibeju-Lekki (Ortolu-Ilagbo).' },
];

export const brochureFor = (slug: string): string | undefined =>
  OFFERS.find((offer) => offer.slug === slug)?.flyer;
