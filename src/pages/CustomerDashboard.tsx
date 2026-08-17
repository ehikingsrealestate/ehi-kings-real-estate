import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY, type Estate } from '../data/site';
import { estateMedia } from '../data/propertyMedia';
import { useEstates } from '../data/useEstates';
import { useCustomer } from '../customer/useCustomer';
import { Reveal } from '../components/MotionPrimitives';

type Tab = 'mine' | 'available';

// Row shape from api.customer.myProperties.
type MyProperty = {
  id: string;
  slug: string;
  status: 'reserved' | 'owned';
  note?: string;
  name: string;
  location?: string;
  price?: string;
  kind?: 'land' | 'home';
  img?: string;
};

export default function CustomerDashboard() {
  const { token, me, loading, signOut } = useCustomer();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('mine');

  const estates = useEstates();
  const mine = useQuery(api.customer.myProperties, token ? { token } : 'skip') as
    | MyProperty[]
    | undefined;
  const reservedSlugs = useQuery(
    api.customer.myReservedSlugs,
    token ? { token } : 'skip',
  ) as string[] | undefined;

  const reserve = useMutation(api.customer.reserve);
  const unreserve = useMutation(api.customer.unreserve);
  const [pending, setPending] = useState<string | null>(null);

  const reservedSet = useMemo(() => new Set(reservedSlugs ?? []), [reservedSlugs]);
  const mineCount = mine?.length ?? 0;

  // Not signed in → to the account page. Wait for the profile query first so a
  // valid token isn't bounced on a hard refresh.
  if (!token || (!loading && !me)) return <Navigate to="/account" replace />;
  if (loading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary text-white">
        <Loader2 className="h-6 w-6 animate-spin text-accent-2" />
      </div>
    );
  }

  const handleReserve = async (slug: string) => {
    if (!token) return;
    setPending(slug);
    try {
      await reserve({ token, propertySlug: slug });
    } finally {
      setPending(null);
    }
  };

  const handleUnreserve = async (slug: string) => {
    if (!token) return;
    setPending(slug);
    try {
      await unreserve({ token, propertySlug: slug });
    } finally {
      setPending(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const firstName = me.name.split(' ')[0] || me.name;

  return (
    <div className="min-h-screen bg-primary px-3 pb-24 pt-28 text-white sm:px-5 sm:pt-32 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <Reveal blur>
          <header className="flex flex-col gap-6 rounded-[1.9rem] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 md:flex-row md:items-center md:justify-between md:rounded-[2.5rem] md:p-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-2">
                Client Portal
              </p>
              <h1 className="mt-4 font-heading text-3xl font-light leading-[1.05] tracking-normal sm:text-4xl md:text-5xl">
                Welcome back, {firstName}.
              </h1>
              <p className="mt-3 text-sm text-white/60">
                {me.email}
                {mineCount > 0 && ` · ${mineCount} propert${mineCount === 1 ? 'y' : 'ies'}`}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/75 transition-colors hover:border-accent-2 hover:text-accent-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </header>
        </Reveal>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
            Your Properties
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">
              {mineCount}
            </span>
          </TabButton>
          <TabButton active={tab === 'available'} onClick={() => setTab('available')}>
            Available Properties
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums">
              {estates.length}
            </span>
          </TabButton>
        </div>

        <div className="mt-6">
          {tab === 'mine' ? (
            <MyPropertiesSection
              mine={mine}
              pending={pending}
              onRemove={handleUnreserve}
              onBrowse={() => setTab('available')}
            />
          ) : (
            <AvailableSection
              estates={estates}
              reservedSet={reservedSet}
              pending={pending}
              onReserve={handleReserve}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-5 py-3 text-xs uppercase tracking-[0.18em] transition-colors ${
        active
          ? 'bg-accent-2 text-accent-2-ink'
          : 'border border-white/12 bg-white/5 text-white/65 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function priceLabel(price?: string) {
  return price && price.trim() ? price : 'Price on request';
}

// ── Your Properties ──────────────────────────────────────────────────────────
function MyPropertiesSection({
  mine,
  pending,
  onRemove,
  onBrowse,
}: {
  mine: MyProperty[] | undefined;
  pending: string | null;
  onRemove: (slug: string) => void;
  onBrowse: () => void;
}) {
  if (mine === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center rounded-[1.7rem] border border-white/10 bg-white/[0.03]">
        <Loader2 className="h-6 w-6 animate-spin text-accent-2" />
      </div>
    );
  }

  if (mine.length === 0) {
    return (
      <div className="rounded-[1.7rem] border border-white/12 bg-white/[0.04] p-10 text-center sm:rounded-[2.2rem] sm:p-14">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-2/15 text-accent-2">
          <Building2 className="h-6 w-6" />
        </span>
        <h2 className="mt-6 font-heading text-2xl font-light tracking-normal sm:text-3xl">
          No properties yet
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
          Reserve land or homes from our available portfolio and they'll appear here for you to track.
        </p>
        <button
          onClick={onBrowse}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent-2 px-6 py-3 text-xs uppercase tracking-[0.18em] text-accent-2-ink transition-opacity hover:opacity-90"
        >
          Browse available properties
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {mine.map((property) => {
        const isBusy = pending === property.slug;
        const owned = property.status === 'owned';
        return (
          <article
            key={property.id}
            className="group flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] transition duration-500 hover:-translate-y-1 hover:border-white/20 sm:rounded-[1.7rem]"
          >
            <Link to={`/estates/${property.slug}`} className="block">
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                <img
                  src={mediaFor(property)}
                  alt={property.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span
                  className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl sm:left-4 sm:top-4 ${
                    owned
                      ? 'border border-accent/40 bg-accent text-accent-ink'
                      : 'border border-accent-2/40 bg-accent-2 text-accent-2-ink'
                  }`}
                >
                  {owned ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                  {owned ? 'Owned' : 'Reserved'}
                </span>
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-4 p-5">
              <div>
                <Link to={`/estates/${property.slug}`}>
                  <h3 className="text-balance font-heading text-xl font-light leading-tight tracking-normal transition-colors group-hover:text-accent-2">
                    {property.name}
                  </h3>
                </Link>
                {property.location && (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/60">
                    <MapPin className="h-4 w-4 text-accent-2" />
                    {property.location}
                  </p>
                )}
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-lg font-light tabular-nums text-accent-2">
                  {priceLabel(property.price)}
                </p>
                {property.status === 'reserved' ? (
                  <button
                    onClick={() => onRemove(property.slug)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-accent-2 hover:text-accent-2 disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </button>
                ) : (
                  <span className="text-xs uppercase tracking-[0.14em] text-white/45">
                    Held by you
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── Available Properties ─────────────────────────────────────────────────────
function AvailableSection({
  estates,
  reservedSet,
  pending,
  onReserve,
}: {
  estates: Estate[];
  reservedSet: Set<string>;
  pending: string | null;
  onReserve: (slug: string) => void;
}) {
  if (estates.length === 0) {
    return (
      <div className="rounded-[1.7rem] border border-white/12 bg-white/[0.04] p-12 text-center">
        <p className="text-white/60">No properties are listed right now. Please check back soon.</p>
        <Link
          to="/contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-2 px-6 py-3 text-xs uppercase tracking-[0.18em] text-accent-2-ink transition-opacity hover:opacity-90"
        >
          Contact {COMPANY.short}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {estates.map((estate) => {
        const isReserved = reservedSet.has(estate.slug);
        const isBusy = pending === estate.slug;
        return (
          <article
            key={estate.slug}
            className="group flex min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.04] transition duration-500 hover:-translate-y-1 hover:border-white/20 sm:rounded-[1.7rem]"
          >
            <Link to={`/estates/${estate.slug}`} className="block">
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                <img
                  src={estateMedia(estate)}
                  alt={estate.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl sm:left-4 sm:top-4 ${
                    estate.kind === 'land'
                      ? 'border border-accent-2/40 bg-accent-2 text-accent-2-ink'
                      : 'border border-white/24 bg-accent text-accent-ink'
                  }`}
                >
                  {estate.kind === 'land' ? 'Land' : 'Home'}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent-2/35 bg-primary/45 px-3 py-1.5 text-sm font-medium text-accent-2 backdrop-blur-xl">
                    <MapPin className="h-3.5 w-3.5" />
                    {estate.region}
                  </span>
                </div>
              </div>
            </Link>

            <div className="flex flex-1 flex-col gap-4 p-5">
              <div>
                <Link to={`/estates/${estate.slug}`}>
                  <h3 className="text-balance font-heading text-xl font-light leading-tight tracking-normal transition-colors group-hover:text-accent-2">
                    {estate.name}
                  </h3>
                </Link>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4 text-accent-2" />
                  {estate.location}
                </p>
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-lg font-light tabular-nums text-accent-2">
                  {priceLabel(estate.price)}
                </p>
                {isReserved ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-2/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-accent-2">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Reserved
                  </span>
                ) : (
                  <button
                    onClick={() => onReserve(estate.slug)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-2 px-4 py-2 text-xs uppercase tracking-[0.14em] text-accent-2-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Reserve
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// Reserved/owned rows may carry a direct image; otherwise reuse the shared
// media fallback keyed by slug/kind (same logic the public grid uses).
function mediaFor(property: MyProperty): string {
  const pseudo = {
    slug: property.slug,
    kind: property.kind ?? 'land',
    img: property.img,
  } as Estate;
  return estateMedia(pseudo);
}
