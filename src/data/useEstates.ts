import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ESTATES, type Estate } from './site';

// Convex row → the Estate shape the public components already expect.
type Row = {
  slug: string; name: string; location: string; region: string;
  kind: 'land' | 'home'; title: string; size: string; price: string;
  note?: string; overview: string[]; features: string[]; img?: string;
  priceTiers?: { label: string; price: string; note?: string }[];
  featured?: boolean; order: number;
};

const toEstate = (r: Row): Estate => ({
  slug: r.slug, name: r.name, location: r.location, region: r.region,
  kind: r.kind, title: r.title, size: r.size, price: r.price,
  note: r.note, overview: r.overview, features: r.features, img: r.img,
  priceTiers: r.priceTiers,
});

// Live listings from Convex (what admins edit). Falls back to the static
// portfolio while loading or if the table is empty / not yet imported.
export function useEstates(): Estate[] {
  const rows = useQuery(api.properties.list, {}) as Row[] | undefined;
  if (!rows || rows.length === 0) return ESTATES;
  return rows.map(toEstate);
}

export function useEstate(slug: string | undefined): Estate | undefined {
  const all = useEstates();
  const directRow = useQuery(api.properties.getBySlug, slug ? { slug } : 'skip') as Row | null | undefined;
  if (directRow) return toEstate(directRow);
  return slug ? all.find((e) => e.slug === slug) : undefined;
}
