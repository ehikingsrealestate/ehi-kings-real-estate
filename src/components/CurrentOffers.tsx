import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Maximize2, Download, X, FileText, CheckCircle2, Sparkles, Filter } from 'lucide-react';
import { OFFERS, MARKETING_COMPILATION_FLIER, type Offer } from '../data/media';
import ResponsiveImage from './ResponsiveImage';

export default function CurrentOffers() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'sold-out' | 'Lagos' | 'Epe' | 'Benin' | 'Abuja'>('all');
  const [selectedFlyer, setSelectedFlyer] = useState<Offer | null>(null);

  const filteredOffers = OFFERS.filter((offer) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'available') return offer.status !== 'sold-out';
    if (activeFilter === 'sold-out') return offer.status === 'sold-out';
    return offer.region === activeFilter;
  });

  return (
    <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-8 md:p-10">
      {/* Header & Promo Compilation Download */}
      <div className="flex flex-col gap-6 border-b border-rule pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5" /> 2026 Official Releases
            </span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-light leading-[1.05] text-primary sm:text-4xl md:text-5xl">
            Live estate offers & flyers.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            Official promotional flyers and pricing across Lagos, Epe, Benin, and Abuja. Tap any flyer to expand, download, or view the complete estate breakdown.
          </p>
        </div>

        {/* Complete Marketing Portfolio Flyer Banner */}
        <a
          href={MARKETING_COMPILATION_FLIER}
          target="_blank"
          rel="noopener noreferrer"
          download="Ehi-Kings-2026-Marketing-Portfolio.png"
          className="group flex min-h-[48px] items-center gap-4 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-accent-2/5 p-4 transition duration-300 hover:border-accent hover:shadow-lg lg:max-w-sm"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink shadow-md transition-transform group-hover:scale-105">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Download All-In-One</p>
            <p className="truncate text-sm font-medium text-primary">2026 Marketing Portfolio</p>
            <p className="text-xs text-muted">Complete overview of all estates</p>
          </div>
          <Download className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent" />
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-rule/60 pb-6">
        <div className="mr-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
          <Filter className="h-3.5 w-3.5 text-accent" /> Filter:
        </div>
        {[
          { id: 'all', label: `All Offers (${OFFERS.length})` },
          { id: 'available', label: 'Now Selling' },
          { id: 'sold-out', label: 'Sold Out' },
          { id: 'Lagos', label: 'Lagos' },
          { id: 'Epe', label: 'Epe' },
          { id: 'Benin', label: 'Benin' },
          { id: 'Abuja', label: 'Abuja' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`min-h-[44px] rounded-full px-4 py-2.5 text-xs font-medium transition duration-300 active:scale-95 ${
              activeFilter === tab.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-muted hover:bg-rule hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOffers.map((offer) => (
          <div
            key={offer.slug}
            className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-rule bg-surface transition duration-500 hover:border-accent/40 hover:shadow-xl"
          >
            {/* Flyer Image Container with Lightbox Trigger */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-primary">
              <ResponsiveImage
                src={offer.flyer}
                alt={`${offer.name} — 2026 offer flyer`}
                aspectRatio="auto"
                containerClassName="h-full w-full"
                className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-60" />

              {/* Status & Title Badges */}
              <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[0.7rem] font-medium text-white backdrop-blur-md">
                  {offer.region}
                </span>
                {offer.status === 'sold-out' ? (
                  <span className="rounded-full bg-red-600 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-md">
                    Sold Out
                  </span>
                ) : offer.status === 'almost-sold-out' ? (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-md">
                    Almost Sold Out
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-md">
                    Now Selling
                  </span>
                )}
              </div>

              {/* Quick View Button */}
              <button
                onClick={() => setSelectedFlyer(offer)}
                className="absolute right-3 top-3 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-white"
                title="Expand Flyer"
                aria-label={`Expand flyer for ${offer.name}`}
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Bottom Overlaid Details */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-xs uppercase tracking-wider text-white/80">{offer.titleType}</p>
                <h3 className="mt-1 font-heading text-xl font-normal leading-snug text-white">
                  {offer.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-heading text-lg font-light text-accent-2-ink drop-shadow-sm sm:text-xl">
                    {offer.price}
                  </span>
                  {offer.size && (
                    <span className="text-xs text-white/70">{offer.size}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Action Links */}
            <div className="flex flex-1 flex-col p-5">
              <p className="flex-1 text-sm leading-6 text-muted">{offer.blurb}</p>

              {offer.deposit && (
                <p className="mt-2 text-xs font-medium text-accent">
                  <CheckCircle2 className="mr-1 inline-block h-3.5 w-3.5" />
                  {offer.deposit}
                </p>
              )}

              {offer.ambassadors && offer.ambassadors.length > 0 && (
                <p className="mt-2 text-[0.75rem] text-muted">
                  Ambassadors: <span className="text-primary">{offer.ambassadors.join(', ')}</span>
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
                <button
                  onClick={() => setSelectedFlyer(offer)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted transition-colors hover:text-accent"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Preview
                </button>

                <Link
                  to={`/estates/${offer.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent transition-transform hover:translate-x-0.5"
                >
                  Estate details <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* High-Resolution Flyer Lightbox Modal */}
      <AnimatePresence>
        {selectedFlyer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-2xl md:p-8"
            onClick={() => setSelectedFlyer(null)}
          >
            <div
              className="relative flex max-h-[95vh] w-full max-w-4xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Controls */}
              <div className="mb-3 flex w-full items-center justify-between text-white">
                <div>
                  <h4 className="font-heading text-lg font-light sm:text-xl">{selectedFlyer.name}</h4>
                  <p className="text-xs text-white/70">Official 2026 Flyer & Promotional Terms</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedFlyer.flyer}
                    download={`${selectedFlyer.name}-2026-Flyer`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    onClick={() => setSelectedFlyer(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white hover:text-primary"
                    aria-label="Close flyer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Flyer High-Res Render */}
              <div className="relative max-h-[82vh] w-full overflow-hidden rounded-2xl bg-black/40 shadow-2xl">
                <img
                  src={selectedFlyer.flyer}
                  alt={selectedFlyer.name}
                  className="max-h-[82vh] w-full object-contain"
                />
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-3 flex w-full items-center justify-between">
                <Link
                  to={`/estates/${selectedFlyer.slug}`}
                  className="text-xs text-white/80 underline-offset-4 hover:underline"
                >
                  Go to {selectedFlyer.name} listing →
                </Link>
                <Link
                  to={`/book?type=inspection&property=${selectedFlyer.slug}`}
                  className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wider text-accent-ink transition hover:opacity-90"
                >
                  Book Inspection for this Offer
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
