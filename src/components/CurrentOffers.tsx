import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { OFFERS } from '../data/media';

// Branded promotional flyers shown as a "current offers" strip — the promo look
// is intentional here (unlike the clean estate cards). Each links to its estate.
export default function CurrentOffers() {
  return (
    <section className="rounded-[1.5rem] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-8 md:p-10">
      <div className="flex flex-col gap-3 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-2">Current offers</p>
          <h2 className="mt-4 font-heading text-3xl font-light leading-[1.05] text-primary sm:text-4xl">
            Live promotions & pricing.
          </h2>
          <p className="mt-3 max-w-prose text-sm leading-7 text-muted">
            The latest plots, homes, and payment plans across our estates. Tap any offer to view the estate.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((offer) => (
          <Link
            key={offer.slug}
            to={`/estates/${offer.slug}`}
            className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-rule bg-surface transition-colors duration-500 hover:border-accent/40"
          >
            <div className="aspect-square w-full overflow-hidden bg-primary">
              <img
                src={offer.flyer}
                alt={`${offer.name} — current offer`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-heading text-lg font-normal leading-snug text-primary">{offer.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-muted">{offer.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
                View estate <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
