import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Ruler, ScrollText, Home, Map, CalendarCheck, Maximize2, X } from 'lucide-react';
import { useEstate } from '../data/useEstates';
import { estateMedia } from '../data/propertyMedia';
import { brochureFor } from '../data/media';
import Seo from '../components/Seo';
import NotFound from './NotFound';

export default function EstateDetail() {
  const { slug } = useParams();
  const estate = useEstate(slug);
  const [expanded, setExpanded] = useState(false);
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

  return (
    <div className="pb-16 sm:pb-20 md:pb-24">
      <Seo
        title={`${estate.name} — ${estate.kind === 'land' ? 'Land' : 'Home'} in ${estate.location}`}
        description={seoDescription}
        image={media}
        path={`/estates/${estate.slug}`}
      />
      {/* Landscape hero - images fill the overview space and can expand. */}
      <section className="relative h-[52vh] w-full overflow-hidden bg-surface md:h-[62vh]">
        <img
          src={media}
          alt={estate.img ? estate.name : `Representative ${estate.kind === 'land' ? 'land' : 'home'} photography for ${estate.name}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

        <div className="absolute left-4 top-28 sm:left-6 md:left-10 lg:left-14">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
        </div>

        <button
          onClick={() => setExpanded(true)}
          className="absolute right-4 top-28 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm text-primary shadow-[0_18px_60px_rgba(0,0,0,0.14)] transition-colors hover:bg-primary hover:text-white sm:right-6 md:right-10 lg:right-14"
        >
          <Maximize2 className="h-4 w-4" />
          Expand
        </button>

        <div className="absolute inset-x-4 bottom-8 sm:inset-x-6 md:inset-x-10 lg:inset-x-14">
          <span
            className={`mb-4 inline-block rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${
              estate.kind === 'land' ? 'bg-accent text-accent-ink' : 'bg-accent-2 text-accent-2-ink'
            }`}
          >
            {estate.kind === 'land' ? 'Land' : 'Home'}
          </span>
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
            {/* quick facts strip */}
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

            <h2 className="mb-5 mt-12 font-heading text-3xl font-light tracking-tight">
              Highlights
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
                  Pricing options
                </h2>
                <div className="max-w-prose border-t border-rule">
                  {estate.priceTiers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-6 border-b border-rule py-4">
                      <div>
                        <div className="text-primary">{t.label}</div>
                        {t.note && <div className="mt-0.5 text-xs text-muted">{t.note}</div>}
                      </div>
                      <div className="tnum whitespace-nowrap text-xl text-accent-2">{t.price}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {brochure && (
              <>
                <h2 className="mb-5 mt-12 font-heading text-3xl font-light tracking-tight">
                  Current offer
                </h2>
                <a
                  href={brochure}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block max-w-md overflow-hidden rounded-[1.25rem] border border-rule bg-surface"
                >
                  <img
                    src={brochure}
                    alt={`${estate.name} — current offer flyer`}
                    loading="lazy"
                    className="w-full transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
                  />
                  <span className="flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-accent">
                    <Maximize2 className="h-3.5 w-3.5" /> View full flyer
                  </span>
                </a>
              </>
            )}
          </motion.div>

          {/* Sticky sidebar */}
          <aside className="h-max lg:sticky lg:top-28">
            <div className="rounded-[1.5rem] border border-rule bg-surface p-8">
              <div className="mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                {estate.priceTiers ? 'Starting from' : 'Price'}
              </div>
              <div className="tnum font-heading text-4xl font-light text-primary">
                {estate.priceTiers ? estate.price.replace(/^From\s+/i, '') : estate.price}
              </div>
              {estate.note && <div className="mt-1 text-sm text-muted">{estate.note}</div>}

              <div className="my-6 h-px bg-rule" />

              <Link
                to={`/book?type=inspection&property=${estate.slug}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-xs uppercase tracking-[0.2em] text-accent-ink transition-opacity hover:opacity-90"
              >
                <CalendarCheck className="w-4 h-4" /> Book an inspection
              </Link>
              <Link
                to={`/book?type=${estate.kind === 'land' ? 'payment_interest' : 'consultation'}&property=${estate.slug}`}
                className="mt-3 block w-full rounded-full border border-rule py-4 text-center text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent hover:text-accent"
              >
                {estate.kind === 'land' ? 'Pay / reserve interest' : 'Request details'}
              </Link>

              <p className="text-xs text-muted leading-relaxed mt-6">
                Title, allocation, and site-inspection dates confirmed on request.
                A senior agent responds within 2 days.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-primary/92 p-4 backdrop-blur-xl md:p-8"
          >
            <button
              onClick={() => setExpanded(false)}
              className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-accent hover:text-white"
              aria-label="Close expanded image"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              src={media}
              alt={estate.img ? estate.name : `Expanded representative media for ${estate.name}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full rounded-[1.8rem] object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
