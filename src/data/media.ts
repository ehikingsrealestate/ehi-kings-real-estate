// Real company media supplied by Ehi-Kings: client testimonial
// videos, physical-allocation photos, and the official 2026 estate offer flyers.
// Assets live in public/testimonials, public/allocations, and public/2026 flyers & designs.

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

// Special marketing documents
export const MARKETING_COMPILATION_FLIER = '/2026 flyers & designs/Complete Marketing, 2026 Flier.png';
export const REALTOR_INCENTIVE_FLIER = '/2026 flyers & designs/Realtor Incentive, 2026  flier.png';

// Structured Realtor Incentive Package dataset
export type RealtorIncentive = {
  salesTarget: string;
  amount: string;
  reward: string;
  highlight?: boolean;
};

export const REALTOR_INCENTIVES: RealtorIncentive[] = [
  { salesTarget: 'Sell 1 Plot @ Charis Garden', amount: '₦3,000,000', reward: 'Oraimo Watch 5 Lite + Oraimo SpaceBuds' },
  { salesTarget: 'Sell 1 Plot @ Shalom Garden City', amount: '₦3,500,000', reward: 'Oraimo Watch 5 Lite + Oraimo SpaceBuds' },
  { salesTarget: 'Sell 3 Plots @ Charis Garden', amount: '₦9,000,000', reward: 'Hisense 20L Microwave + Oraimo Watch 5 Lite' },
  { salesTarget: 'Sell 3 Plots @ Shalom Garden City', amount: '₦10,500,000', reward: 'HP EliteBook 840 G6 Laptop' },
  { salesTarget: 'Sell 1 Plot @ Grace Court', amount: '₦15,000,000', reward: 'HP EliteBook 840 G6 Laptop' },
  { salesTarget: 'Sell 1 Acre @ Charis Garden', amount: '₦18,000,000', reward: 'HP EliteBook 840 G6 Laptop' },
  { salesTarget: 'Sell 1 Acre @ Shalom Garden City', amount: '₦21,000,000', reward: 'HP EliteBook 645 G9 Ryzen 5 Pro' },
  { salesTarget: 'Sell 1 Plot @ Grace Life', amount: '₦30,000,000', reward: 'Nexus 160L Chest Freezer' },
  { salesTarget: 'Sell 1 Plot @ Perfect Garden Benin', amount: '₦35,000,000', reward: 'Hisense 20L Microwave + Oraimo Watch 5 Lite' },
  { salesTarget: 'Sell 3 Plots @ Grace Court', amount: '₦45,000,000', reward: 'HP EliteBook 645 G9 Ryzen 5 Pro' },
  { salesTarget: 'Sell 1 Unit @ Grace Apartments', amount: '₦55,000,000+', reward: '₦5,000,000 Cash Commission!', highlight: true },
  { salesTarget: 'Sell 3 Plots @ Grace Life', amount: '₦90,000,000', reward: 'HP EliteBook 645 G9 Ryzen 5 Pro' },
  { salesTarget: 'Sell 3 Plots @ Perfect Garden Benin', amount: '₦105,000,000', reward: 'Nexus 160L Chest Freezer' },
];

// Branded current-offer flyers keyed to estate slug
export type Offer = {
  slug: string;
  name: string;
  flyer: string;
  blurb: string;
  region: 'Lagos' | 'Epe' | 'Benin' | 'Abuja';
  kind: 'land' | 'home';
  price: string;
  titleType: string;
  size?: string;
  deposit?: string;
  status?: 'available' | 'almost-sold-out' | 'sold-out';
  ambassadors?: string[];
};

export const OFFERS: Offer[] = [
  {
    slug: 'grace-apartments-lekki',
    name: 'Grace Apartments, Lekki',
    flyer: '/2026 flyers & designs/Grace Apartments 2026 Flier.jpeg',
    blurb: 'One-bed luxury apartments in Oko-Ado Sangotedo with 24/7 power, high ROI.',
    region: 'Lagos',
    kind: 'home',
    price: '₦65M',
    titleType: "Governor's Consent",
    deposit: '₦20M initial deposit',
    status: 'almost-sold-out',
  },
  {
    slug: 'grace-villa-estate',
    name: 'Grace Villa Garden Estate',
    flyer: '/2026 flyers & designs/Grace Villa Garden Estate, Awoyaya 2026 Flier.png',
    blurb: '450 SQM plots behind Greenspring School, Awoyaya on a full Certificate of Occupancy.',
    region: 'Lagos',
    kind: 'land',
    price: '₦55M',
    titleType: 'Certificate of Occupancy (C of O)',
    size: '450 SQM',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella'],
  },
  {
    slug: 'grace-life-garden-estate',
    name: 'Grace Life Garden Estate',
    flyer: '/2026 flyers & designs/Grace Life Garden Estate 2026 flier.png',
    blurb: '500 SQM plots in prime Awoyaya, close to Greenspring & Novare Mall.',
    region: 'Lagos',
    kind: 'land',
    price: '₦30M',
    titleType: 'Registered Court Judgement',
    size: '500 SQM',
    deposit: '₦30.5M on 6-month plan',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella Njubigbo'],
  },
  {
    slug: 'grace-court-estate-epe',
    name: 'Grace Court Estate, Epe',
    flyer: '/2026 flyers & designs/Grace Court Estate Epe 2026 Flier.jpg',
    blurb: '600 SQM plots in Ilara, Epe, directly opposite Saint Augustine University.',
    region: 'Epe',
    kind: 'land',
    price: '₦15M',
    titleType: 'Registered Survey',
    size: '600 SQM',
    deposit: '₦15.5M on 6-month plan',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella'],
  },
  {
    slug: 'perfect-garden-estate-epe',
    name: 'Perfect Garden Estate, Epe',
    flyer: '/2026 flyers & designs/Perfect Garden Estate Epe 2026 Flier.jpg',
    blurb: '600 SQM registered survey plots in Epe growth district from ₦4.5M.',
    region: 'Epe',
    kind: 'land',
    price: '₦4.5M',
    titleType: 'Registered Survey',
    size: '600 SQM',
    deposit: '30% initial deposit',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella'],
  },
  {
    slug: 'charis-garden-estate',
    name: 'Charis Garden Estate',
    flyer: '/2026 flyers & designs/Charis garden Flier 2026 flier.jpg',
    blurb: 'Imagbon, Epe-Ijebu Ode registered survey land from ₦1.7M with installment options.',
    region: 'Epe',
    kind: 'land',
    price: 'From ₦1.7M',
    titleType: 'Registered Survey',
    size: '300 & 550 SQM',
    deposit: '₦500k deposit on 6-month plan',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella Njubigbo'],
  },
  {
    slug: 'perfect-garden-homes-abuja',
    name: 'Perfect Garden Homes, Abuja',
    flyer: '/2026 flyers & designs/Perfect Garden Homes Abuja 2026 Flier.PNG',
    blurb: '5-bed detached duplex (with Penthouse) ₦160M or 500 SQM land ₦25M on Airport Road.',
    region: 'Abuja',
    kind: 'home',
    price: 'From ₦25M',
    titleType: 'Right of Occupancy (R of O)',
    size: '500 SQM & 5-Bed Duplex',
    deposit: '₦10M initial deposit',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella'],
  },
  {
    slug: 'perfect-garden-estate-benin',
    name: 'Perfect Garden Estate, Benin',
    flyer: '/2026 flyers & designs/Perfect Garden Homes Benin 2026 Flier.PNG',
    blurb: 'Dry land in prestigious GRA Benin on Governor’s Consent from ₦35M per plot.',
    region: 'Benin',
    kind: 'land',
    price: '₦35M',
    titleType: "Governor's Consent",
    size: '440 SQM',
    deposit: '₦5M initial deposit',
    status: 'available',
    ambassadors: ['Nosa Rex', 'Nuella'],
  },
  {
    slug: 'shalom-garden-city-benin',
    name: 'Shalom Garden City, Benin',
    flyer: '/2026 flyers & designs/Shallom Garden City Epe 2026 Flier.jpg',
    blurb: 'Pre-launch plots on Upper Ekehuan & Airport Road corridor from ₦1.8M.',
    region: 'Benin',
    kind: 'land',
    price: 'From ₦1.8M',
    titleType: 'Registered Survey',
    size: '50×100 ft & 100×100 ft',
    status: 'available',
    ambassadors: ['MC Allamano', 'Nosa Rex'],
  },
  {
    slug: 'grace-luxury-homes-phase-2',
    name: 'Grace Luxury Homes Phase 2',
    flyer: '/2026 flyers & designs/Grace Luxury Homes Phase 2 2026 Flier.png',
    blurb: '5-Bedroom luxury duplexes with BQ in Oko Ado, Sangotedo Lekki.',
    region: 'Lagos',
    kind: 'home',
    price: '₦160M - ₦170M',
    titleType: 'Certificate of Occupancy',
    size: '5-Bedroom Duplex + BQ',
    status: 'sold-out',
    ambassadors: ['Nosa Rex'],
  },
  {
    slug: 'open-gate-royal-garden-phase-1',
    name: 'Open Gate Royal Garden Phase 1',
    flyer: '/2026 flyers & designs/open Gate Royal Garden Phase 1 2026 Flier.jpeg',
    blurb: '600 SQM plots in Otorlu-Ilagbo, Ibeju-Lekki corridor.',
    region: 'Lagos',
    kind: 'land',
    price: '₦4.5M',
    titleType: 'Survey Plan',
    size: '600 SQM',
    status: 'sold-out',
    ambassadors: ['Nosa Rex', 'Nuella Njubigbo'],
  },
  {
    slug: 'gold-silver-garden',
    name: 'Gold & Silver Gardens Phase 1',
    flyer: '/2026 flyers & designs/Gold & Silver phase 1 2026 Flier.png',
    blurb: '600 SQM registered survey plots in Akpakin, Ibeju Lekki.',
    region: 'Lagos',
    kind: 'land',
    price: '₦4M',
    titleType: 'Registered Survey',
    size: '600 SQM',
    status: 'sold-out',
  },
  {
    slug: 'gold-silver-garden-phase-2',
    name: 'Gold & Silver Gardens Phase 2',
    flyer: '/2026 flyers & designs/Gold & Silver phase 2 2026 Flier.png',
    blurb: '600 SQM plots in Akpakin, Ibeju Lekki within Free Trade Zone catchment.',
    region: 'Lagos',
    kind: 'land',
    price: '₦4M',
    titleType: 'Registered Survey (Excision in Process)',
    size: '600 SQM',
    status: 'sold-out',
  },
];

export const brochureFor = (slug: string): string | undefined =>
  OFFERS.find((offer) => offer.slug === slug)?.flyer;
