import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  MapPin,
  Ruler,
  ScrollText,
  Home,
  Map,
  CalendarCheck,
  Maximize2,
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Share2,
} from 'lucide-react';
import { useEstate, useEstates } from '../data/useEstates';
import { estateMedia } from '../data/propertyMedia';
import { brochureFor } from '../data/media';
import Seo from '../components/Seo';
import ResponsiveImage from '../components/ResponsiveImage';
import NotFound from './NotFound';

export default function EstateDetail() {
  const { slug } = useParams();
  const estate = useEstate(slug);
  const allEstates = useEstates();
  const [expandedHero, setExpandedHero] = useState(false);
  const [expandedFlyer, setExpandedFlyer] = useState(false);
  const [copied, setCopied] = useState(false);

  const brochure = estate ? brochureFor(estate.slug) : undefined;

  if (!estate) return <NotFound />;

  const facts = [
    { icon: Ruler, label: 'Size', value: estate.size },
    { icon: ScrollText, label: 'Title', value: estate.title },
    { icon: estate.kind === 'land' ? Map : Home, label: 'Type', value: estate.kind === 'land' ? 'Land / plot' : 'Home / building' },
    { icon: MapPin, label: 'Region', value: estate.region },
  ];
  const backTo = `/properties${estate.kind === 'land' ? '?kind=land' : '?kind=home'}`;
  const media = estateMedia(estate, 1800);

  const kindLabel = estate.kind === 'land' ? 'Land / plot' : 'Home / building';
  const seoDescription =
    estate.overview[0] ??
    `${estate.name} — ${kindLabel} in ${estate.location}. ${estate.size}, ${estate.title} title, from ${estate.price}. Book an inspection with Ehi-Kings.`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: estate.name,
        text: `${estate.name} — ${estate.price} with Ehi-Kings Real Estate`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const alternatives = allEstates
    .filter((item) => item.slug !== estate.slug && !item.soldOut && (item.region === estate.region || item.kind === estate.kind))
    .slice(0, 2);

  return (
    <div className="pb-16 sm:pb-20 md:pb-24">
      <Seo
        title={`${estate.name} — ${estate.kind === 'land' ? 'Land' : 'Home'} in ${estate.location}`}
        description={seoDescription}
        image={media}
        path={`/estates/${estate.slug}`}
      />

      {/* Landscape hero with prioritized image and skeleton shimmer */}
      <section className="relative h-[52vh] w-full overflow-hidden bg-surface md:h-[62vh]">
        <ResponsiveImage
          src={media}
          alt={estate.name}
          aspectRatio="auto"
          priority
          sizes="100vw"
          containerClassName="absolute inset-0 h-full w-full"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

        <div className="absolute left-4 top-28 sm:left-6 md:left-10 lg:left-14">
          <Link
            to={backTo}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-xs uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
        </div>

        <div className="absolute right-4 top-28 flex items-center gap-2 sm:right-6 md:right-10 lg:right-14">
          <button
            onClick={handleShare}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/90 px-4 py-2.5 text-xs text-primary shadow-md backdrop-blur-md transition-colors hover:bg-white active:scale-95"
            title="Share estate"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Copied URL!' : 'Share'}
          </button>
          <button
            onClick={() => setExpandedHero(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs text-primary shadow-md transition-colors hover:bg-primary hover:text-white active:scale-95"
          >
            <Maximize2 className="h-4 w-4" />
            Expand Photo
          </button>
        </div>

        <div className="absolute inset-x-4 bottom-8 sm:inset-x-6 md:inset-x-10 lg:inset-x-14">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${
                estate.kind === 'land' ? 'bg-accent text-accent-ink' : 'bg-accent-2 text-accent-2-ink'
              }`}
            >
              {estate.kind === 'land' ? 'Land' : 'Home'}
            </span>
            {estate.soldOut && (
              <span className="rounded-full bg-red-600 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-md">
                Sold Out
              </span>
            )}
            {!estate.soldOut && estate.almostSoldOut && (
              <span className="rounded-full bg-amber-500 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-md">
                Almost Sold Out
              </span>
            )}
          </div>
          <h1 className="font-heading text-4xl font-light leading-[0.95] tracking-tight md:text-6xl">
            {estate.name}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted">
            <MapPin className="h-4 w-4 text-accent" /> {estate.location}
          </div>
        </div>
      </section>

      {/* Body — overview + sticky facts/CTA */}
      <div className="mt-12 px-4 sm:px-6 md:mt-16 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          {/* Main column */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Sold Out Notice Banner if applicable */}
            {estate.soldOut && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-900">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div className="text-sm">
                  <p className="font-semibold text-red-700">This Estate is Currently Sold Out</p>
                  <p className="mt-1 text-red-600/90">
                    All allocated plots/units in this estate have been completed. Check out our other available listings or contact us for upcoming pre-launch phases.
                  </p>
                </div>
              </div>
            )}

            {/* Quick facts strip */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-rule bg-rule sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label} className="bg-bg p-5">
                  <f.icon className="mb-3 h-5 w-5 text-accent" />
                  <div className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted">{f.label}</div>
                  <div className="text-sm leading-snug text-primary">{f.value}</div>
                </div>
              ))}
            </div>

            <h2 className="mb-5 mt-12 font-heading text-3xl font-light tracking-tight">
              Overview
            </h2>
            <div className="max-w-prose space-y-5 leading-relaxed text-muted">
              {estate.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Brand Ambassadors if present */}
            {estate.ambassadors && estate.ambassadors.length > 0 && (
              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                <Users className="h-5 w-5 text-accent" />
                <div className="text-xs sm:text-sm">
                  <span className="font-medium text-primary">Official Brand Ambassadors: </span>
                  <span className="text-muted">{estate.ambassadors.join(', ')}</span>
                </div>
              </div>
            )}

            <h2 className="mb-5 mt-12 font-heading text-3xl font-light tracking-tight">
              Highlights & Features
            </h2>
            <ul className="grid max-w-prose gap-x-10 gap-y-4 sm:grid-cols-2">
              {estate.features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {feat}
                </li>
              ))}
            </ul>

            {estate.priceTiers && (
              <>
                <h2 className="mb-5 mt-12 font-heading text-3xl font-light tracking-tight">
                  Pricing & Payment Options
                </h2>
                <div className="max-w-prose border-t border-rule">
                  {estate.priceTiers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-6 border-b border-rule py-4">
                      <div>
                        <div className="text-primary font-medium">{t.label}</div>
                        {t.note && <div className="mt-0.5 text-xs text-muted">{t.note}</div>}
                      </div>
                      <div className="tnum whitespace-nowrap text-xl font-light text-accent-2">{t.price}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 2026 Official Flyer & Brochure Section */}
            {brochure && (
              <>
                <div className="mt-14 flex items-center justify-between">
                  <h2 className="font-heading text-3xl font-light tracking-tight">
                    Official 2026 Flyer
                  </h2>
                  <a
                    href={brochure}
                    download={`${estate.name}-2026-Flyer`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-xs font-medium text-primary transition hover:border-accent hover:text-accent"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Flyer
                  </a>
                </div>

                <div
                  onClick={() => setExpandedFlyer(true)}
                  className="group relative mt-6 block max-w-md cursor-pointer overflow-hidden rounded-[1.25rem] border border-rule bg-surface shadow-md transition duration-500 hover:border-accent/50 hover:shadow-xl"
                >
                  <img
                    src={brochure}
                    alt={`${estate.name} — official 2026 flyer`}
                    loading="lazy"
                    className="w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
                  />
                  <div className="flex items-center justify-between border-t border-rule bg-white p-4">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent transition-colors">
                      <Maximize2 className="h-3.5 w-3.5" /> Tap to expand flyer
                    </span>
                    <span className="text-xs text-muted">2026 Release</span>
                  </div>
                </div>
              </>
            )}

            {/* Alternative listings if sold out */}
            {estate.soldOut && alternatives.length > 0 && (
              <div className="mt-14 border-t border-rule pt-8">
                <h3 className="font-heading text-xl font-light text-primary">Available Alternatives in {estate.region}</h3>
                <p className="mt-1 text-xs text-muted">Explore these currently active properties with title documentation:</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {alternatives.map((alt) => (
                    <Link
                      key={alt.slug}
                      to={`/estates/${alt.slug}`}
                      className="group rounded-xl border border-rule bg-surface p-4 transition hover:border-accent/40 hover:shadow-md"
                    >
                      <p className="font-heading text-base font-normal text-primary group-hover:text-accent">{alt.name}</p>
                      <p className="mt-1 text-xs text-muted">{alt.location}</p>
                      <p className="mt-2 text-sm font-semibold text-accent-2">{alt.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sticky sidebar */}
          <aside className="h-max lg:sticky lg:top-28">
            <div className="rounded-[1.5rem] border border-rule bg-surface p-8 shadow-sm">
              <div className="mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                {estate.priceTiers ? 'Starting from' : 'Price'}
              </div>
              <div className="tnum font-heading text-4xl font-light text-primary">
                {estate.priceTiers ? estate.price.replace(/^From\s+/i, '') : estate.price}
              </div>
              {estate.note && <div className="mt-1 text-sm text-muted">{estate.note}</div>}

              <div className="my-6 h-px bg-rule" />

              {!estate.soldOut ? (
                <>
                  <Link
                    to={`/book?type=inspection&property=${estate.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-xs uppercase tracking-[0.2em] text-accent-ink transition-opacity hover:opacity-90 active:scale-[0.98]"
                  >
                    <CalendarCheck className="w-4 h-4" /> Book an inspection
                  </Link>
                  <Link
                    to={`/book?type=${estate.kind === 'land' ? 'payment_interest' : 'consultation'}&property=${estate.slug}`}
                    className="mt-3 block w-full rounded-full border border-rule py-4 text-center text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent hover:text-accent active:scale-[0.98]"
                  >
                    {estate.kind === 'land' ? 'Pay / reserve interest' : 'Request details'}
                  </Link>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-red-500/10 p-4 text-center text-xs font-semibold uppercase tracking-wider text-red-700">
                    Listing Sold Out
                  </div>
                  <Link
                    to="/properties"
                    className="mt-3 block w-full rounded-full bg-primary py-4 text-center text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90"
                  >
                    View Available Properties
                  </Link>
                </>
              )}

              <p className="text-xs text-muted leading-relaxed mt-6">
                Title, allocation, and site-inspection dates confirmed on request.
                A senior agent responds within 2 business days.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Hero Expand Lightbox */}
      <AnimatePresence>
        {expandedHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-2xl md:p-8"
            onClick={() => setExpandedHero(false)}
          >
            <button
              onClick={() => setExpandedHero(false)}
              className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-accent hover:text-white"
              aria-label="Close photo"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              src={media}
              alt={estate.img ? estate.name : `Expanded photo for ${estate.name}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-h-[90vh] w-auto max-w-full rounded-[1.8rem] object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flyer Expand Lightbox */}
      <AnimatePresence>
        {expandedFlyer && brochure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-2xl md:p-8"
            onClick={() => setExpandedFlyer(false)}
          >
            <div
              className="relative flex max-h-[95vh] w-full max-w-3xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex w-full items-center justify-between text-white">
                <div>
                  <h4 className="font-heading text-lg font-light">{estate.name}</h4>
                  <p className="text-xs text-white/70">Official 2026 Flyer</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={brochure}
                    download={`${estate.name}-2026-Flyer`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    onClick={() => setExpandedFlyer(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white hover:text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative max-h-[82vh] w-full overflow-hidden rounded-2xl bg-black/40 shadow-2xl">
                <img
                  src={brochure}
                  alt={`${estate.name} flyer`}
                  className="max-h-[82vh] w-full object-contain"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
