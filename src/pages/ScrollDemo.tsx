import ScrollVideoHero from '../components/hero3d/ScrollVideoHero';
import { COMPANY } from '../data/site';

// Isolated playground for the 3D scroll hero — iterate here, then graft the
// <ScrollVideoHero> block into Home once the feel is approved.
export default function ScrollDemo() {
  return (
    <>
      <ScrollVideoHero>
        <div className="max-w-4xl">
          <p className="text-sm font-medium text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
            Audacious Hotel Apartments · Lekki-Epe Expressway
          </p>
          <h1 className="mt-4 font-heading text-5xl font-light leading-[0.92] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-7xl md:text-8xl">
            {COMPANY.short}
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)] md:text-lg">
            {COMPANY.philosophy}
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/70">Scroll ↓</p>
        </div>
      </ScrollVideoHero>

      {/* The all-white page the clouds hand off into */}
      <section className="bg-white px-6 py-28 md:px-14">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-accent">The white page begins here</p>
          <h2 className="mt-4 font-heading text-4xl font-light text-primary md:text-6xl">
            Clean handoff from the clouds.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            The hero pins while you scroll: the camera pushes into the building, clouds
            rise to fill the frame, and the frame resolves to pure white — landing you
            here. Replace this block with the real homepage content when we graft it in.
          </p>
        </div>
      </section>
    </>
  );
}
