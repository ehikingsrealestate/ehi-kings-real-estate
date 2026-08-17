import { useState } from 'react';
import { Play } from 'lucide-react';
import { TESTIMONIALS, ALLOCATIONS, type Testimonial } from '../data/media';
import { Reveal } from './MotionPrimitives';
import BlurText from './reactbits/BlurText';
import GrowRule from './fx/GrowRule';

function VideoCard({ testimonial }: { testimonial: Testimonial }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="group overflow-hidden rounded-[1.25rem] border border-rule bg-white">
      <div className="relative aspect-video w-full overflow-hidden bg-primary">
        {playing ? (
          <video
            src={testimonial.video}
            poster={testimonial.poster}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${testimonial.name}'s testimonial`}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={testimonial.poster}
              alt={`${testimonial.name} — ${testimonial.role}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 group-hover:scale-110">
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-5">
        <p className="text-sm font-medium text-primary">{testimonial.name}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{testimonial.role}</p>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14">
      <Reveal>
        <div className="mx-auto max-w-[1520px]">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Testimonials</p>
          <GrowRule className="mt-3 w-16" />
          <BlurText
            as="h2"
            text="Real clients. Real allocations."
            animateBy="words"
            delay={90}
            className="mt-8 max-w-3xl font-heading text-[clamp(2rem,3.6vw,3.6rem)] font-light leading-[1.08] text-primary"
          />
          <p className="mt-4 max-w-prose leading-7 text-muted">
            Hear from people who bought land and homes with Ehi-Kings — and see the physical land-allocation
            days where our clients become proud landowners.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {TESTIMONIALS.map((testimonial) => (
              <VideoCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>

          <div className="mt-14 border-t border-rule pt-10">
            <p className="text-sm font-medium text-primary">Physical allocation days</p>
            <p className="mt-2 max-w-prose text-sm leading-7 text-muted">
              Documented handovers on site at Perfect Garden Estate, Epe.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ALLOCATIONS.map((photo) => (
                <figure key={photo.src} className="group overflow-hidden rounded-[1.25rem] border border-rule bg-white">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-surface">
                    <img
                      src={photo.src}
                      alt={photo.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                    />
                  </div>
                  <figcaption className="px-4 py-3 text-xs leading-5 text-muted">{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
