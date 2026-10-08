import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { COMPANY, SERVICES } from '../data/site';
import { useEstates } from '../data/useEstates';
import { useSiteBlocks } from '../data/useSiteBlocks';
import EstateGrid from '../components/EstateGrid';
import Testimonials from '../components/Testimonials';
import Audacious3DScroll from '../components/hero3d/Audacious3DScroll';
import MdBirthdayPromo from '../components/MdBirthdayPromo';
import { Reveal, smoothEase } from '../components/MotionPrimitives';
import Seo from '../components/Seo';
import BlurText from '../components/reactbits/BlurText';
import ShinyText from '../components/reactbits/ShinyText';
import CountUp from '../components/reactbits/CountUp';
import Magnet from '../components/reactbits/Magnet';
import SpotlightCard from '../components/reactbits/SpotlightCard';
import StarBorder from '../components/reactbits/StarBorder';
import Marquee from '../components/reactbits/Marquee';
import GrowRule from '../components/fx/GrowRule';
import VelocitySkew from '../components/fx/VelocitySkew';

const process = [
  ['Brief', 'Budget, purpose, and preferred location.'],
  ['Inspect', 'Site visit and neighbourhood context.'],
  ['Document', 'Title, payment, and allocation steps.'],
  ['Build', 'Construction or renovation support.'],
];

const officeLabel = 'Ehi-Kings Real Estate Close, Lekki-Epe Expressway, Lagos.';

const eyebrowClass = 'text-xs font-medium uppercase tracking-[0.2em] text-muted';

export default function Home() {
  const estates = useEstates();
  const site = useSiteBlocks();
  const featuredCount = Math.max(1, Math.min(6, Number(site.get('home.featured.count', '4')) || 4));
  const sectionOrder = site.get('home.sections.order', 'promo,lede,featured,matchmaker,services')
    .split(',')
    .map((section) => section.trim())
    .filter(Boolean);
  const showSection = (name: string) => sectionOrder.includes(name);
  const featured = estates.filter((estate) => !estate.soldOut && estate.img).slice(0, featuredCount || 6);
  const fallbackFeatured = featured.length >= 3 ? featured : estates.slice(0, 6);
  const ledeTitle = site.get('home.lede.title', 'Real estate, construction, and accountable guidance.');
  const ledeBody = site.get('home.lede.body', COMPANY.philosophy);
  const missionSummary = 'We turn land and housing goals into documented next steps.';
  const visionSummary = 'A trusted African real estate and construction company.';

  return (
    <>
      <Seo
        title="Ehi-Kings Real Estate & Construction — Land, Homes & Building in Lagos"
        description="Ehi-Kings is a Lagos-based real estate and construction company. Buy verified land and homes, and build ground-up with one accountable team across Nigeria."
        path="/"
      />
      <Audacious3DScroll>
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: smoothEase }}
          className="mx-auto flex w-full max-w-[1520px] flex-col items-center text-center lg:items-start lg:text-left"
        >
          <ShinyText
            text={site.get('home.hero.eyebrow', 'Lagos-based real estate and construction company')}
            className="text-xs font-medium uppercase tracking-[0.22em]"
            color="#8fa3bd"
            shineColor="#ffffff"
            speed={2.6}
            delay={1}
          />
          <h1 className="mt-6 max-w-[11ch] text-balance font-heading text-[clamp(2.6rem,6.9vw,6.15rem)] font-light leading-[0.95] tracking-normal text-white drop-shadow-[0_18px_70px_rgba(0,0,0,0.55)] sm:max-w-[13ch]">
            {COMPANY.philosophy}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/78 drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)] sm:text-lg sm:leading-8">
            Land, homes, and construction across Lagos — handled by one accountable team.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <Magnet padding={70} magnetStrength={3.2}>
              <Link
                to="/properties"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0a121f] transition duration-300 hover:bg-white/85 active:scale-[0.98]"
              >
                View properties
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Magnet>
            <Magnet padding={70} magnetStrength={3.2}>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition duration-300 hover:border-white/60 active:scale-[0.98]"
              >
                {site.get('home.hero.cta', 'Contact')}
              </Link>
            </Magnet>
          </div>
        </motion.div>
      </Audacious3DScroll>

      {/* MD's Birthday Special Promo Campaign */}
      <MdBirthdayPromo />

      {showSection('lede') && <section className="px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14">
        <Reveal>
          <div className="mx-auto max-w-[1520px]">
            <p className={eyebrowClass}>Company</p>
            <GrowRule className="mt-3 w-16" />
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <BlurText
                as="h2"
                text={ledeTitle}
                animateBy="words"
                delay={70}
                className="max-w-[18ch] font-heading text-[clamp(2rem,3.6vw,3.6rem)] font-light leading-[1.08] text-primary"
              />
              <div>
                <p className="max-w-2xl text-lg leading-8 text-muted">{ledeBody}</p>
                <div className="mt-12 grid gap-8 sm:grid-cols-2">
                  <div className="border-t border-rule pt-5">
                    <p className="text-sm font-medium text-primary">Mission</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{missionSummary}</p>
                  </div>
                  <div className="border-t border-rule pt-5">
                    <p className="text-sm font-medium text-primary">Vision</p>
                    <p className="mt-3 text-sm leading-7 text-muted">{visionSummary}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 grid gap-10 border-t border-rule pt-10 sm:grid-cols-3">
              {[
                { value: 20, suffix: '+', label: 'Years of practice across Nigeria' },
                { value: Math.max(estates.length, 6), suffix: '', label: 'Active land & home listings' },
                { value: 6, suffix: '', label: 'Services under one accountable team' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-5xl font-light tabular-nums text-primary sm:text-6xl">
                    <CountUp to={stat.value} duration={1.8} />
                    {stat.suffix}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>}

      {showSection('featured') && <section className="px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14">
        <Reveal>
          <div className="mx-auto max-w-[1520px]">
            <div className="flex flex-col gap-6 border-b border-rule pb-10 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={eyebrowClass}>Portfolio</p>
                <GrowRule className="mt-3 w-16" />
                <BlurText
                  as="h2"
                  text="Current portfolio."
                  animateBy="words"
                  delay={90}
                  className="mt-8 max-w-3xl font-heading text-[clamp(2rem,3.6vw,3.6rem)] font-light leading-[1.08] text-primary"
                />
                <p className="mt-4 max-w-prose leading-7 text-muted">
                  Available land, homes, and developments. Filter the full list on the Properties page.
                </p>
              </div>
              <Magnet padding={60} magnetStrength={3.5}>
                <Link
                  to="/properties"
                  className="group inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 px-6 py-3 text-sm font-medium text-primary transition duration-300 hover:border-primary hover:bg-primary hover:text-white active:scale-[0.98]"
                >
                  All properties
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Magnet>
            </div>
            <div className="mt-10">
              {fallbackFeatured.length === 0 ? (
                <p className="text-sm leading-7 text-muted">Listings loading…</p>
              ) : (
                <EstateGrid estates={fallbackFeatured} />
              )}
            </div>
          </div>
        </Reveal>
      </section>}

      {showSection('services') && <section className="px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14">
        <div className="mx-auto max-w-[1520px]">
          <Reveal>
            <div className="max-w-2xl">
              <p className={eyebrowClass}>Services</p>
              <GrowRule className="mt-3 w-16" />
              <BlurText
                as="h2"
                text={site.get('home.services.heading', 'What the company does.')}
                animateBy="words"
                delay={90}
                className="mt-8 font-heading text-[clamp(2rem,3.6vw,3.6rem)] font-light leading-[1.08] text-primary"
              />
              <p className="mt-5 max-w-prose text-base leading-7 text-muted">
                Land, property sales, construction, and management support handled with clear documents and practical guidance.
              </p>
              <Magnet padding={60} magnetStrength={3.5} wrapperClassName="mt-8">
                <StarBorder as={Link} to="/book?type=consultation" color="#9cc2f7" speed="4.5s">
                  Book a consultation
                  <ArrowUpRight className="h-4 w-4" />
                </StarBorder>
              </Magnet>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service, index) => (
              <Reveal key={service.title} delay={index * 0.03}>
                <SpotlightCard
                  className="h-full rounded-[1.25rem] border border-rule bg-white p-6 transition-colors duration-500 hover:border-accent/30"
                  spotlightColor="rgba(0, 99, 222, 0.09)"
                >
                  <p className="text-sm tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-5 text-pretty font-heading text-xl font-normal leading-snug text-primary sm:text-2xl">
                    {service.title}
                  </h3>
                  <p className="mt-3 max-w-prose text-sm leading-7 text-muted">{service.desc}</p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>}

      <Testimonials />

      <section className="px-4 py-20 sm:px-6 sm:py-24 md:px-10 md:py-28 lg:px-14">
        <Reveal>
          <SpotlightCard
            className="process-breathe mx-auto max-w-[1520px] rounded-[1.5rem] bg-primary px-6 py-14 text-white sm:px-10 md:px-14 md:py-20"
            spotlightColor="rgba(255, 255, 255, 0.10)"
          >
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <ShinyText
                  text="Process"
                  className="text-xs font-medium uppercase tracking-[0.2em]"
                  color="#7d8ba1"
                  shineColor="#ffffff"
                  speed={2.6}
                  delay={1.4}
                />
                <BlurText
                  as="h2"
                  text="From interest to ownership."
                  animateBy="words"
                  delay={90}
                  className="mt-8 max-w-[15ch] font-heading text-[clamp(2rem,3.6vw,3.6rem)] font-light leading-[1.08]"
                />
              </div>
              <p className="max-w-xs text-sm leading-7 text-white/60">{officeLabel}</p>
            </div>
            <div className="relative mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {process.map(([title, body], index) => (
                <div key={title} className="border-t border-white/15 pt-5">
                  <p className="text-sm tabular-nums text-white/50">{String(index + 1).padStart(2, '0')}</p>
                  <p className="mt-4 text-base font-medium">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">{body}</p>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>
      </section>

      <section className="border-y border-rule py-8 sm:py-10">
        <VelocitySkew max={5}>
          <Marquee
            items={['Land', 'Homes', 'Construction', 'Lekki, Lagos', 'Ehi-Kings']}
            itemClassName="font-heading text-4xl font-light text-primary/25 sm:text-6xl"
            speed={26}
          />
        </VelocitySkew>
      </section>
    </>
  );
}
