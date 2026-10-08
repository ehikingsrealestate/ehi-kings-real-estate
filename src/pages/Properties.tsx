import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Filter, Search } from 'lucide-react';
import { COMPANY } from '../data/site';
import { useEstates } from '../data/useEstates';
import EstateGrid from '../components/EstateGrid';
import PropertyMatchmaker from '../components/PropertyMatchmaker';
import CurrentOffers from '../components/CurrentOffers';
import { Reveal } from '../components/MotionPrimitives';
import Seo from '../components/Seo';

type KindFilter = 'all' | 'land' | 'home';

const PAGE_SIZE = 9;

export default function Properties() {
  const estates = useEstates();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const kind = (params.get('kind') || 'all') as KindFilter;
  const region = params.get('region') || 'all';

  const regions = useMemo(() => ['all', ...Array.from(new Set(estates.map((estate) => estate.region)))], [estates]);

  const counts = useMemo(
    () => ({
      all: estates.length,
      land: estates.filter((estate) => estate.kind === 'land').length,
      home: estates.filter((estate) => estate.kind === 'home').length,
    }),
    [estates],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return estates.filter((estate) => {
      const matchesKind = kind === 'all' || estate.kind === kind;
      const matchesRegion = region === 'all' || estate.region === region;
      const matchesSearch =
        !query ||
        [estate.name, estate.location, estate.region, estate.title, estate.price]
          .join(' ')
          .toLowerCase()
          .includes(query);
      return matchesKind && matchesRegion && matchesSearch;
    });
  }, [estates, kind, region, search]);

  const pagedEstates = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMore = visibleCount < filtered.length;

  const setFilter = (next: { kind?: KindFilter; region?: string }) => {
    setVisibleCount(PAGE_SIZE);
    const nextParams = new URLSearchParams(params);
    const nextKind = next.kind ?? kind;
    const nextRegion = next.region ?? region;
    if (nextKind === 'all') nextParams.delete('kind');
    else nextParams.set('kind', nextKind);
    if (nextRegion === 'all') nextParams.delete('region');
    else nextParams.set('region', nextRegion);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:px-10 md:pb-24 md:pt-40 lg:px-14">
      <Seo
        title="Properties — Land & Homes for Sale in Lagos"
        description="Browse available land, homes, and developments from Ehi-Kings in one place. Filter by property type, region, title, location, or price."
        path="/properties"
      />
      <div className="mx-auto max-w-[1520px] space-y-5 sm:space-y-6">
        <Reveal blur>
          <header className="rounded-[1.5rem] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
              <div>
                <p className="text-sm font-medium text-accent-2">Properties</p>
                <h1 className="mt-5 max-w-3xl text-balance font-heading text-[2.5rem] font-light leading-[1.02] tracking-normal sm:text-5xl md:text-6xl">
                  One portfolio for land and homes.
                </h1>
              </div>
              <p className="max-w-prose text-lg leading-8 text-muted">
                Browse available land, homes, and developments in one place. Filter by property type, region, title, location, or price.
              </p>
            </div>
          </header>
        </Reveal>

        <Reveal>
          <PropertyMatchmaker />
        </Reveal>

        <Reveal>
          <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-8 md:p-10">
            <div className="grid gap-4 border-b border-rule pb-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex min-h-[48px] min-w-0 items-center gap-3 rounded-[1.25rem] border border-accent-2/20 bg-surface px-4 py-3 sm:rounded-full sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-accent-2" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  placeholder="Search by estate, location, title, or price"
                  className="min-w-0 flex-1 bg-transparent text-base text-primary outline-none placeholder:text-muted"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all', 'land', 'home'] as KindFilter[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter({ kind: item })}
                    className={`min-h-[48px] min-w-[48px] rounded-full px-5 py-3 text-sm font-medium transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                      kind === item
                        ? item === 'land' ? 'bg-accent-2 text-accent-2-ink shadow-[0_14px_30px_rgba(110,140,20,0.18)]' : 'bg-accent text-accent-ink shadow-[0_14px_30px_rgba(0,99,222,0.16)]'
                        : 'bg-surface text-primary hover:bg-accent-2 hover:text-accent-2-ink'
                    }`}
                  >
                    {item === 'all' ? `All ${counts.all}` : item === 'land' ? `Land ${counts.land}` : `Homes ${counts.home}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Filter className="h-4 w-4 text-accent" />
                Region
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
                {regions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter({ region: item })}
                    className={`min-h-[48px] min-w-[48px] shrink-0 rounded-full px-5 py-3 text-sm font-medium transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                      region === item
                        ? item === 'all' ? 'bg-accent text-accent-ink shadow-[0_14px_30px_rgba(0,99,222,0.16)]' : 'bg-accent-2 text-accent-2-ink shadow-[0_14px_30px_rgba(110,140,20,0.18)]'
                        : 'bg-surface text-primary hover:bg-accent-2 hover:text-accent-2-ink'
                    }`}
                  >
                    {item === 'all' ? 'All areas' : item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              {pagedEstates.length > 0 ? (
                <>
                  <EstateGrid estates={pagedEstates} />
                  {hasMore && (
                    <div className="mt-10 flex justify-center border-t border-rule/60 pt-8">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-primary/25 bg-white px-8 py-3.5 text-sm font-medium text-primary shadow-sm transition hover:border-primary hover:bg-primary hover:text-white active:scale-95"
                      >
                        Load more properties ({filtered.length - visibleCount} remaining)
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-rule bg-surface p-8 text-center sm:p-10">
                  <h2 className="font-heading text-3xl font-light tracking-normal">No matching public listing.</h2>
                  <p className="mx-auto mt-4 max-w-prose text-muted">
                    Try another region or contact the team for developments that are not yet listed publicly.
                  </p>
                  <Link
                    to="/contact"
                    className="mt-6 inline-flex min-h-[48px] items-center gap-3 rounded-full bg-accent-2 px-6 py-3 text-sm font-medium text-accent-2-ink transition-colors hover:bg-accent hover:text-accent-ink"
                  >
                    Contact {COMPANY.short}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <CurrentOffers />
        </Reveal>
      </div>
    </div>
  );
}
