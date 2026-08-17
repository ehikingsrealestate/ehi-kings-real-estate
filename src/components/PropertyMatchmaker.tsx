import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAction } from 'convex/react';
import { ArrowUpRight, Loader2, MapPin, Sparkles } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { estateMedia } from '../data/propertyMedia';
import type { Estate } from '../data/site';

type Match = {
  slug: string;
  name: string;
  location: string;
  price: string;
  kind: string;
  img?: string;
  why: string;
  score: number;
};

// Matches come back from the AI action without the full Estate shape —
// build just enough of one so we can reuse the shared media fallback.
function matchMedia(match: Match) {
  const estateLike: Estate = {
    slug: match.slug,
    name: match.name,
    location: match.location,
    region: match.location,
    title: '',
    size: '',
    price: match.price,
    kind: match.kind === 'land' ? 'land' : 'home',
    overview: [],
    features: [],
    img: match.img,
  };
  return estateMedia(estateLike);
}

export default function PropertyMatchmaker() {
  const suggest = useAction(api.match.suggest);
  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<Match[] | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = brief.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await suggest({ brief: trimmed, budget: budget.trim() || undefined });
      setMatches(result.matches);
    } catch (e) {
      setMatches(null);
      setError(e instanceof Error ? e.message : 'Could not find matches just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[1.5rem] bg-primary p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.18)] sm:p-8 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-accent-2">
            <Sparkles className="h-4 w-4" />
            AI Property Matchmaker
          </p>
          <h2 className="mt-5 max-w-md text-balance font-heading text-[2rem] font-light leading-[1.08] tracking-normal sm:text-4xl">
            Tell us what you’re looking for.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/60">
            Describe the home or land you want in your own words. Our AI ranks our
            live listings for you and explains why each one fits.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="matchmaker-brief" className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">
              What are you looking for?
            </label>
            <textarea
              id="matchmaker-brief"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              rows={3}
              required
              placeholder="3-bedroom home in Lekki under ₦80M, gated estate for my family"
              className="resize-none rounded-[0.9rem] border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/38 focus:border-accent-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="matchmaker-budget" className="text-[0.7rem] uppercase tracking-[0.2em] text-white/50">
              Budget (optional)
            </label>
            <input
              id="matchmaker-budget"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              type="text"
              placeholder="e.g. ₦80,000,000"
              className="rounded-[0.9rem] border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/38 focus:border-accent-2"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !brief.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-2 py-4 text-xs font-medium uppercase tracking-[0.2em] text-accent-2-ink transition-colors hover:bg-accent hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding your match...
              </>
            ) : (
              'Find my match'
            )}
          </button>

          {error && (
            <div className="rounded-[0.9rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </form>
      </div>

      {matches && (
        <div className="mt-10 border-t border-white/10 pt-8">
          {matches.length === 0 ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-6 text-center sm:p-8">
              <p className="font-heading text-xl font-light tracking-normal">
                No close match in our current listings yet.
              </p>
              <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-white/60">
                Try describing your budget or preferred area differently, or{' '}
                <Link to="/contact" className="text-accent-2 underline underline-offset-4 hover:text-accent">
                  speak with our team
                </Link>{' '}
                — new developments are added often.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-white/50">
                {matches.length} match{matches.length === 1 ? '' : 'es'} picked for you
              </p>
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                {matches.map((match) => (
                  <Link
                    key={match.slug}
                    to={`/estates/${match.slug}`}
                    className="group flex gap-4 overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/5 p-3 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-accent-2/40 hover:bg-white/10 sm:p-4"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[0.9rem] bg-white/10 sm:h-28 sm:w-28">
                      <img
                        src={matchMedia(match)}
                        alt={match.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-balance font-heading text-lg font-light leading-[1.15] tracking-normal">
                            {match.name}
                          </h3>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-accent-2" />
                        </div>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/50">
                          <MapPin className="h-3 w-3" />
                          {match.location}
                        </p>
                        <p className="mt-2 text-sm italic leading-5 text-white/70">“{match.why}”</p>
                      </div>
                      <p className="mt-3 text-sm font-medium tabular-nums text-accent-2">{match.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
