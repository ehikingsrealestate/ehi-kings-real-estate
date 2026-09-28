import { COMPANY, VALUES } from '../data/site';
import Seo from '../components/Seo';
import { Reveal } from '../components/MotionPrimitives';
import BlurText from '../components/reactbits/BlurText';
import GrowRule from '../components/fx/GrowRule';
import LeadershipCarousel from '../components/fx/LeadershipCarousel';
import FaqAccordion from '../components/fx/FaqAccordion';
import RiveSlot from '../components/fx/RiveSlot';
import RealtorIncentives from '../components/RealtorIncentives';

const FAQ_ITEMS = [
  {
    q: 'Do you sell verified land?',
    a: 'Yes. Every listing states its title documentation — Certificate of Occupancy, Governor’s Consent, registered survey, or court judgement — and we arrange physical site inspections before any commitment.',
  },
  {
    q: 'Can you build on land I already own?',
    a: 'Yes. Our construction team handles architectural design and planning, new builds, remodelling, and renovation — one accountable team from drawings to handover.',
  },
  {
    q: 'Do you offer payment plans?',
    a: 'Many listings offer instalment plans alongside outright purchase. Each property page shows its plan — for example an initial deposit with the balance spread over months.',
  },
  {
    q: 'Where do you operate?',
    a: 'We are based on the Lekki-Epe Expressway in Lagos, with projects and land across Nigeria and a vision to build across Africa.',
  },
];

export default function About() {
  return (
    <div className="pt-28 sm:pt-32 md:pt-40">
      <Seo
        title="About Ehi-Kings — Two Decades of Real Estate & Construction"
        description="Ehi-Kings is a premium Lagos real estate and construction house with over 20 years in property development, management, valuation, and consultancy across Nigeria."
        path="/about"
      />

      {/* Intro */}
      <header className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <RiveSlot src="/rive/about.riv" className="pointer-events-none absolute right-4 top-8 hidden h-28 w-28 md:block" />
        <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Who we are</div>
        <GrowRule className="mb-6 w-16" />
        <BlurText
          as="h1"
          text="A Lagos house, building across Nigeria for over two decades."
          animateBy="words"
          delay={70}
          className="max-w-3xl font-heading text-[2.5rem] font-light leading-[1.05] tracking-normal sm:text-5xl md:text-6xl"
        />
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
          {COMPANY.name} is a premium real estate and construction company based in
          Lagos. We specialise in property development, management, valuation, and
          consultancy — and we go beyond selling property to build trust, value, and
          lasting relationships.
        </p>
      </header>

      {/* Mission / Vision — paired prose, not cards */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <Reveal>
          <div className="grid gap-x-16 gap-y-10 border-t border-rule pt-12 md:grid-cols-2">
            <div>
              <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent-2">Mission</div>
              <p className="font-heading text-2xl font-light leading-snug tracking-tight md:text-3xl">
                {COMPANY.mission}
              </p>
            </div>
            <div>
              <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">Vision</div>
              <p className="font-heading text-2xl font-light leading-snug tracking-tight md:text-3xl">
                {COMPANY.vision}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Philosophy — pull statement */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <blockquote className="border-t border-rule pt-12">
          <BlurText
            as="p"
            text={`“${COMPANY.philosophy}”`}
            animateBy="words"
            delay={80}
            className="max-w-3xl font-heading text-[2.25rem] font-light leading-[1.1] tracking-normal text-primary sm:text-5xl"
          />
          <cite className="mt-5 block text-sm not-italic uppercase tracking-[0.2em] text-accent-2">
            Our guiding principle
          </cite>
        </blockquote>
      </section>

      {/* Why choose us — numbered prose */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <div className="border-t border-rule pt-12">
          <h2 className="mb-10 font-heading text-3xl font-light tracking-tight md:text-4xl">
            Why clients stay with us
          </h2>
          <div className="space-y-8 sm:space-y-10">
            {VALUES.map((v, index) => (
              <Reveal key={v.n} delay={index * 0.06}>
                <div className="grid gap-3 md:grid-cols-[5rem_1fr] md:gap-10">
                  <span className="font-heading text-4xl text-accent-2">{v.n}</span>
                  <div>
                    <h3 className="mb-2 text-xl text-primary">{v.title}</h3>
                    <p className="max-w-2xl leading-relaxed text-muted">{v.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership — floating triangle carousel */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <div className="border-t border-rule pt-12">
          <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Leadership</div>
          <GrowRule className="mb-10 w-16" />
          <BlurText
            as="h2"
            text="The people accountable to you."
            animateBy="words"
            delay={80}
            className="mb-12 font-heading text-3xl font-light tracking-tight md:text-4xl"
          />
          <LeadershipCarousel />
        </div>
      </section>

      {/* Realtor Partner Program & 2026 Incentive Package */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10">
        <Reveal>
          <RealtorIncentives />
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24">
        <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Questions</div>
        <GrowRule className="mb-6 w-16" />
        <BlurText
          as="h2"
          text="Answers before you ask."
          animateBy="words"
          delay={80}
          className="mb-10 font-heading text-3xl font-light tracking-tight md:text-4xl"
        />
        <FaqAccordion items={FAQ_ITEMS} />
      </section>
    </div>
  );
}
