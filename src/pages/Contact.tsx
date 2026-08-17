import { FormEvent, useState } from 'react';
import { useMutation } from 'convex/react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, CalendarCheck, Check, CreditCard, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY } from '../data/site';
import Seo from '../components/Seo';
import { Reveal } from '../components/MotionPrimitives';
import BlurText from '../components/reactbits/BlurText';
import GrowRule from '../components/fx/GrowRule';
import Magnet from '../components/reactbits/Magnet';
import SpotlightCard from '../components/reactbits/SpotlightCard';

const calUrl = (import.meta.env.VITE_CALENDLY_INSPECTION_URL || import.meta.env.VITE_APP_CAL_URL) as string | undefined;

const bookingRoutes = [
  {
    to: '/book?type=consultation',
    icon: CalendarCheck,
    title: 'Book a consultation',
    copy: 'Talk budget, location, documents, and next steps with a senior agent.',
  },
  {
    to: '/book?type=inspection',
    icon: ShieldCheck,
    title: 'Book a site inspection',
    copy: 'Tuesdays, Thursdays & Saturdays at 10:00 AM — booked at least 2 days ahead.',
  },
  {
    to: '/book?type=payment_interest',
    icon: CreditCard,
    title: 'Pay for land online',
    copy: 'Reserve or pay for your plot securely by card or bank transfer.',
  },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitLead = useMutation(api.crm.submitLead);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await submitLead({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
        message: String(form.get('message') ?? ''),
        bookingType: 'contact',
        service: 'General website enquiry',
        source: 'website contact page',
        consentMarketing: form.get('consentMarketing') === 'on',
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this message.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:px-10 md:pb-24 md:pt-40">
      <Seo
        title="Contact Ehi-Kings — Talk to a Senior Property Agent"
        description="Tell Ehi-Kings what you're looking for. A senior agent replies within 2 days with availability, pricing, and the next inspection date in Lagos."
        path="/contact"
      />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left — the invitation + details */}
          <div>
            <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Contact</div>
            <GrowRule className="mb-6 w-16" />
            <BlurText
              as="h1"
              text="Tell us what you're looking for."
              animateBy="words"
              delay={70}
              className="max-w-lg font-heading text-[2.5rem] font-light leading-[1.05] tracking-normal sm:text-5xl md:text-6xl"
            />
            <p className="mt-6 max-w-md leading-relaxed text-muted">
              A senior agent will get back to you with availability, pricing, and the
              next inspection date within 2 days.
            </p>

            <div className="mt-10 space-y-5 text-primary/90">
              <a href={`mailto:${COMPANY.email}`} className="flex min-h-11 items-center gap-4 transition-colors hover:text-accent-2">
                <Mail className="h-5 w-5 text-accent-2" /> {COMPANY.email}
              </a>
              {COMPANY.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/\s/g, '')}`} className="flex min-h-11 items-center gap-4 tnum transition-colors hover:text-accent">
                  <Phone className="h-5 w-5 text-accent" /> {p}
                </a>
              ))}
              <p className="flex max-w-sm items-start gap-4 leading-relaxed">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent-2" /> {COMPANY.address}
              </p>
            </div>
          </div>

          {/* Right — the form */}
          <div>
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="flex flex-col items-start gap-4 rounded-[1.5rem] border border-accent-2/25 p-8 sm:p-10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-2 text-accent-2-ink">
                  <Check className="h-6 w-6" />
                </span>
                <h2 className="font-heading text-3xl font-light tracking-tight">Message received.</h2>
                <p className="leading-relaxed text-muted">
                  Thank you, we have your message and a member of the team will reach
                  out within 2 days.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {[
                  { id: 'name', label: 'Full name', type: 'text', ph: 'Full name' },
                  { id: 'email', label: 'Email', type: 'email', ph: 'you@email.com' },
                  { id: 'phone', label: 'Phone', type: 'tel', ph: '+234 800 000 0000' },
                ].map((f) => (
                  <div key={f.id} className="flex flex-col gap-2">
                    <label htmlFor={f.id} className="text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                      {f.label}
                    </label>
                    <input
                      id={f.id}
                      name={f.id}
                      type={f.type}
                      required
                      placeholder={f.ph}
                      className="rounded-[0.9rem] border border-rule bg-surface px-4 py-3 text-primary transition-colors placeholder:text-muted/60 focus:border-accent-2 focus:outline-none"
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                    What are you looking for?
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Budget, preferred location, land or finished home…"
                    className="resize-none rounded-[0.9rem] border border-rule bg-surface px-4 py-3 text-primary transition-colors placeholder:text-muted/60 focus:border-accent-2 focus:outline-none"
                  />
                </div>
                <label className="flex items-start gap-3 text-sm leading-6 text-muted">
                  <input name="consentMarketing" type="checkbox" className="mt-1 h-4 w-4 accent-[var(--color-accent-2)]" />
                  Send me helpful Ehi-Kings property updates by email.
                </label>
                {error && <div className="rounded-[0.9rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-500">{error}</div>}
                <Magnet padding={60} magnetStrength={4} wrapperClassName="block">
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-accent-2 py-4 text-xs font-medium uppercase tracking-[0.2em] text-accent-2-ink transition-colors hover:bg-accent hover:text-accent-ink"
                  >
                    {busy ? 'Sending...' : 'Send message'}
                  </button>
                </Magnet>
              </form>
            )}
          </div>
        </div>

        {/* Scheduling — book anything, plus the live inspection calendar */}
        <section className="mt-20 border-t border-rule pt-14 sm:mt-24 sm:pt-16">
          <div className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Schedule</div>
          <GrowRule className="mb-6 w-16" />
          <BlurText
            as="h2"
            text="Skip the wait — book us directly."
            animateBy="words"
            delay={70}
            className="max-w-2xl font-heading text-[2rem] font-light leading-[1.08] tracking-normal sm:text-4xl md:text-5xl"
          />
          <p className="mt-5 max-w-xl leading-relaxed text-muted">
            Pick a consultation, a site inspection, or pay for land online. Inspections run
            Tuesdays, Thursdays, and Saturdays at 10:00 AM and must be booked at least 2 days ahead.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {bookingRoutes.map((route, index) => (
              <Reveal key={route.to} delay={index * 0.06}>
                <Link to={route.to} className="group block h-full">
                  <SpotlightCard
                    className="flex h-full flex-col rounded-[1.25rem] border border-rule bg-white p-6 transition-colors duration-500 hover:border-accent/30"
                    spotlightColor="rgba(0, 99, 222, 0.09)"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-2/12 text-accent-2 transition-colors group-hover:bg-accent-2 group-hover:text-accent-2-ink">
                      <route.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-heading text-xl font-normal leading-snug text-primary">{route.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted">{route.copy}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                      Continue
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </SpotlightCard>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Live inspection calendar — appears once the scheduler URL is configured */}
          {calUrl ? (
            <Reveal>
              <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-rule bg-surface">
                <div className="flex items-center gap-2 border-b border-rule px-5 py-4 text-sm text-muted">
                  <CalendarCheck className="h-4 w-4 text-accent-2" />
                  Live inspection calendar — choose a Tue / Thu / Sat 10:00 AM slot.
                </div>
                <iframe
                  src={`${calUrl}${calUrl.includes('?') ? '&' : '?'}hide_gdpr_banner=1&primary_color=0063DE`}
                  title="Book an inspection"
                  className="h-[640px] w-full"
                  loading="lazy"
                />
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <div className="mt-10 rounded-[1.5rem] border border-accent-2/25 bg-accent-2/5 p-6 text-sm leading-6 text-muted">
                The live booking calendar turns on once the scheduling link is configured
                (<span className="text-accent-2">VITE_APP_CAL_URL</span>). Until then, use the booking buttons above —
                every request lands in the Ehi-Kings team inbox.
              </div>
            </Reveal>
          )}
        </section>
      </div>
    </div>
  );
}
