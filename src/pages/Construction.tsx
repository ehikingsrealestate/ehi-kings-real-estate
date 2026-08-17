import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { SERVICES } from '../data/site';
import Seo from '../components/Seo';

const PROCESS = [
  {
    n: '1.0',
    title: 'Land & feasibility',
    desc: 'We secure and verify the title, study the terrain, and confirm what the site can carry.',
  },
  {
    n: '2.0',
    title: 'Design & planning',
    desc: 'Architectural design and planning matched to how you will live or earn from the building.',
  },
  {
    n: '3.0',
    title: 'Build',
    desc: 'Ground-up development with our own accountable team — quality controlled, on schedule.',
  },
  {
    n: '4.0',
    title: 'Handover & management',
    desc: 'Finishing, handover, and optional ongoing property management once the keys change hands.',
  },
];

export default function Construction() {
  return (
    <div className="pb-20 pt-28 sm:pb-28 sm:pt-36 md:pt-48">
      <Seo
        title="Construction — From Virgin Land to a Building That Lasts"
        description="Ehi-Kings handles every stage of building in Nigeria: land and feasibility, design and planning, ground-up construction, handover, and property management."
        path="/construction"
      />
      <header className="mx-auto max-w-4xl px-4 sm:px-6 md:px-12">
        <div className="mb-8 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Construction</div>
        <h1 className="font-heading text-[2.75rem] font-light leading-[1.04] tracking-normal sm:text-5xl md:text-6xl lg:text-7xl">
          From virgin land to a building that lasts.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-primary/90 leading-relaxed">
          Two decades of development, management, valuation, and consultancy in
          Nigeria — handling every form of building work, from ground-up
          development to remodelling and renovation.
        </p>
      </header>

      {/* Process — narrative workflow */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6 md:px-12">
        <div className="border-t border-rule">
          {PROCESS.map((p, index) => (
            <motion.div
              key={p.n}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-4 border-b border-rule py-10 sm:py-12 md:grid-cols-[7rem_1fr] md:gap-12"
            >
              <span className={`font-heading text-4xl tnum md:text-5xl ${index % 2 === 0 ? 'text-accent-2' : 'text-accent'}`}>{p.n}</span>
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-light tracking-tight mb-3">
                  {p.title}
                </h2>
                <p className="text-muted leading-relaxed max-w-2xl">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6 md:px-12">
        <h2 className="font-heading text-3xl md:text-4xl font-light tracking-tight mb-12">
          Capabilities
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
          {SERVICES.map((s, index) => (
            <div key={s.title} className={`border-t pt-6 ${index % 2 === 0 ? 'border-accent-2/35' : 'border-accent/25'}`}>
              <h3 className="text-lg text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip — single action */}
      <section className="mt-24 px-4 sm:px-6 md:mt-28 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 border-t border-accent-2/35 pt-12 sm:pt-16 md:flex-row md:items-center">
          <p className="font-heading text-3xl md:text-5xl font-light tracking-tight max-w-2xl">
            Have a plot, or a plan? Let’s build it.
          </p>
          <Link
            to="/contact"
            className="shrink-0 rounded-full bg-accent-2 px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-accent-2-ink transition-opacity hover:bg-accent hover:text-accent-ink"
          >
            Contact
          </Link>
        </div>
      </section>
    </div>
  );
}
