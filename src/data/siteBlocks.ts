import { COMPANY } from './site';

export type SiteBlockType = 'text' | 'textarea' | 'image' | 'layout';

export type SiteBlock = {
  key: string;
  label: string;
  type: SiteBlockType;
  value: string;
  draftValue?: string;
  reviewValue?: string;
  status?: 'published' | 'draft' | 'review';
  area: string;
};

export const DEFAULT_SITE_BLOCKS: SiteBlock[] = [
  {
    key: 'home.hero.eyebrow',
    label: 'Hero eyebrow',
    type: 'text',
    value: 'Lagos-based real estate and construction company.',
    area: 'Home hero',
  },
  {
    key: 'home.hero.image',
    label: 'Hero background image',
    type: 'image',
    value: '/hero/building-poster.jpg',
    area: 'Home hero',
  },
  {
    key: 'home.hero.cta',
    label: 'Hero contact button',
    type: 'text',
    value: 'Contact',
    area: 'Home hero',
  },
  {
    key: 'home.hero.layout',
    label: 'Hero layout',
    type: 'layout',
    value: 'cinematic',
    area: 'Layout & sections',
  },
  {
    key: 'home.sections.order',
    label: 'Homepage section order',
    type: 'layout',
    value: 'lede,featured,services',
    area: 'Layout & sections',
  },
  {
    key: 'home.featured.count',
    label: 'Featured estate count',
    type: 'layout',
    value: '3',
    area: 'Layout & sections',
  },
  {
    key: 'home.lede.title',
    label: 'Home lead statement',
    type: 'textarea',
    value: 'Property guidance with accountability.',
    area: 'Home content',
  },
  {
    key: 'home.lede.body',
    label: 'Home lead body',
    type: 'textarea',
    value: `${COMPANY.experience} We help clients buy land, secure homes, and manage construction with clear documentation.`,
    area: 'Home content',
  },
  {
    key: 'home.matchmaker.title',
    label: 'Matchmaker title',
    type: 'text',
    value: 'Find your fit, faster.',
    area: 'Home content',
  },
  {
    key: 'home.matchmaker.body',
    label: 'Matchmaker body',
    type: 'textarea',
    value: 'Listings, filters, journal notes, and contact details are kept easy to find.',
    area: 'Home content',
  },
  {
    key: 'home.services.heading',
    label: 'Services section heading',
    type: 'text',
    value: 'What we do.',
    area: 'Home content',
  },
  {
    key: 'footer.cta.title',
    label: 'Footer call-to-action',
    type: 'textarea',
    value: 'Ready to find ground\nyou can build a legacy on?',
    area: 'Footer',
  },
  {
    key: 'footer.cta.button',
    label: 'Footer button',
    type: 'text',
    value: 'Book a consultation',
    area: 'Footer',
  },
];

export const WEEKLY_SPOTLIGHT_SITE_BLOCKS: SiteBlock[] = [
  {
    key: 'home.weekly.badge',
    label: 'Weekly spotlight badge',
    type: 'text',
    value: 'Weekly Spotlight · Q4 Edition',
    area: 'Weekly spotlight',
  },
  {
    key: 'home.weekly.title',
    label: 'Weekly spotlight headline',
    type: 'textarea',
    value: "Q4 Is Closing, But Your Real Estate Portfolio Shouldn't Sleep.",
    area: 'Weekly spotlight',
  },
  {
    key: 'home.weekly.subtitle',
    label: 'Weekly spotlight sub-headline',
    type: 'text',
    value: 'Secure Your Future. Verify Your Land. Build Your Legacy.',
    area: 'Weekly spotlight',
  },
  {
    key: 'home.weekly.body',
    label: 'Weekly spotlight description',
    type: 'textarea',
    value: 'Lock down your site inspection schedule for this week. Whether you are securing titled land or a luxury finished home across Lagos, Epe, Abuja, or Benin City, our senior advisors are ready to walk you through verified documentation and allocation.',
    area: 'Weekly spotlight',
  },
  {
    key: 'home.weekly.media',
    label: 'Weekly spotlight media path',
    type: 'image',
    value: '/2026 flyers & designs/Q 4 animated.mp4',
    area: 'Weekly spotlight',
  },
];

DEFAULT_SITE_BLOCKS.push(...WEEKLY_SPOTLIGHT_SITE_BLOCKS);

export function defaultBlockMap() {
  return new Map(DEFAULT_SITE_BLOCKS.map((block) => [block.key, block]));
}
