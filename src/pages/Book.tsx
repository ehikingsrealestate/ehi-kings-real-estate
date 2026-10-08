import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from 'convex/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY } from '../data/site';
import { useEstates } from '../data/useEstates';
import { openPaystack } from '../lib/paystack';
import { useCustomer } from '../customer/useCustomer';
import BlurText from '../components/reactbits/BlurText';
import GrowRule from '../components/fx/GrowRule';

type BookingMode = 'consultation' | 'inspection' | 'payment_interest';

const modes: Array<{ value: BookingMode; label: string; icon: typeof CalendarCheck }> = [
  { value: 'consultation', label: 'Consultation', icon: CalendarCheck },
  { value: 'inspection', label: 'Inspection', icon: ShieldCheck },
  { value: 'payment_interest', label: 'Land payment', icon: CreditCard },
];

const MODE_COPY: Record<BookingMode, { title: string; copy: string }> = {
  consultation: {
    title: 'Book a consultation.',
    copy: 'Sit with a senior agent about budget, location, documents, and next steps. A team member responds within 2 days.',
  },
  inspection: {
    title: 'Book a site inspection.',
    copy: 'Inspections run Tuesday, Thursday, and Saturday at 10:00 AM and must be booked at least 2 days ahead. Every request lands in the Ehi-Kings CRM.',
  },
  payment_interest: {
    title: 'Pay for land online.',
    copy: 'Reserve or pay for your plot securely by card or bank transfer via Paystack. Sign in first so the payment is linked to your account.',
  },
};

const twoDaysAhead = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toInputDate = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

function isInspectionDay(value: string) {
  if (!value) return false;
  const day = new Date(`${value}T10:00:00`).getDay();
  return day === 2 || day === 4 || day === 6;
}

function dateIsAllowed(value: string) {
  if (!value) return false;
  const selected = new Date(`${value}T10:00:00`);
  return selected >= twoDaysAhead();
}

export default function Book() {
  const [params] = useSearchParams();
  const estates = useEstates();
  const submitLead = useMutation(api.crm.submitLead);
  const initialMode = (params.get('type') as BookingMode | null) ?? 'consultation';
  const [mode, setMode] = useState<BookingMode>(modes.some((m) => m.value === initialMode) ? initialMode : 'consultation');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const minDate = useMemo(() => toInputDate(twoDaysAhead()), []);
  const propertySlug = params.get('property') ?? '';
  const selectedEstate = estates.find((estate) => estate.slug === propertySlug);
  const calendlyUrl = (import.meta.env.VITE_CALENDLY_INSPECTION_URL || import.meta.env.VITE_APP_CAL_URL) as string | undefined;
  const { me: customer } = useCustomer();
  const paystackReady = Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const preferredDate = String(form.get('preferredDate') ?? '');

    if (mode === 'inspection' && (!dateIsAllowed(preferredDate) || !isInspectionDay(preferredDate))) {
      setError('Inspection bookings must be Tuesday, Thursday, or Saturday at 10:00 AM, at least 2 days ahead.');
      return;
    }

    // Live Paystack checkout — runs when the public key is configured and the
    // buyer entered an amount. Falls back to a payment-interest lead otherwise.
    const amountNaira = Number(form.get('amount') ?? 0);
    let paymentNote = '';
    if (mode === 'payment_interest' && paystackReady && amountNaira > 0) {
      if (amountNaira < 1000) { setError('Minimum payment amount is ₦1,000.'); return; }
      setBusy(true);
      try {
        const paid = await openPaystack({
          email: String(form.get('email') ?? ''),
          amountNaira,
          metadata: { property: selectedEstate?.name ?? 'unspecified', phone: String(form.get('phone') ?? '') },
        });
        if (!paid) {
          setBusy(false);
          setError('Payment window closed — nothing was charged. Try again, or clear the amount to submit as payment interest.');
          return;
        }
        paymentNote = `[PAID ₦${amountNaira.toLocaleString()} via Paystack · ref ${paid.reference}] `;
      } catch (e) {
        setBusy(false);
        setError(e instanceof Error ? e.message : 'Payment failed to start.');
        return;
      }
      setBusy(false);
    }

    setBusy(true);
    try {
      await submitLead({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? ''),
        phone: String(form.get('phone') ?? ''),
        budget: String(form.get('budget') ?? ''),
        message: paymentNote + String(form.get('message') ?? ''),
        bookingType: mode,
        service: modes.find((item) => item.value === mode)?.label ?? 'Booking',
        source: 'website booking page',
        propertySlug: selectedEstate?.slug,
        propertyName: selectedEstate?.name,
        preferredDate: preferredDate || undefined,
        preferredTime: mode === 'inspection' ? '10:00' : undefined,
        consentMarketing: form.get('consentMarketing') === 'on',
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 md:px-12 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-accent-2">Bookings</div>
            <GrowRule className="mt-3 w-16" />
            <BlurText
              key={mode}
              as="h1"
              text={MODE_COPY[mode].title}
              animateBy="words"
              delay={80}
              className="mt-6 max-w-xl font-heading text-[3rem] font-light leading-[1.02] tracking-normal sm:text-6xl md:text-7xl"
            />
            <p className="mt-7 max-w-md text-base leading-7 text-muted">{MODE_COPY[mode].copy}</p>

            <div className="mt-10 grid gap-3">
              {modes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={`flex items-center justify-between rounded-[1.1rem] border px-5 py-4 text-left transition-colors ${
                    mode === item.value
                      ? 'border-accent bg-accent text-accent-ink'
                      : 'border-rule bg-surface text-primary hover:border-accent-2'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}
            </div>

            {mode === 'payment_interest' && (
              <div className="mt-8 rounded-[1.25rem] border border-accent/25 bg-accent/5 p-5 text-sm leading-7 text-muted">
                <div className="font-medium text-primary">Your account</div>
                {customer ? (
                  <p>Signed in as {customer.name} — this payment will be recorded against your account and email receipts go to {customer.email}.</p>
                ) : (
                  <p>
                    You can pay as a guest, but{' '}
                    <Link to="/account?next=/book?type=payment_interest" className="text-accent underline-offset-4 hover:underline">sign in or create an account</Link>{' '}
                    so your payment and property are tracked in your dashboard.
                  </p>
                )}
              </div>
            )}

            {mode === 'inspection' && <div className="mt-8 rounded-[1.25rem] border border-rule bg-surface p-5 text-sm leading-7 text-muted">
              <div className="font-medium text-primary">Inspection rule</div>
              <p>Tuesday, Thursday, and Saturday only, fixed at 10:00 AM, with at least 2 days advance booking.</p>
              {calendlyUrl ? (
                <a href={calendlyUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-accent">
                  Open Calendly schedule
                </a>
              ) : (
                <p className="mt-3 text-accent-2">Calendly link is ready for setup: add VITE_CALENDLY_INSPECTION_URL.</p>
              )}
            </div>}

            {/* Inline Calendly/Cal.com embed — appears automatically once the URL is configured */}
            {calendlyUrl && mode === 'inspection' && (
              <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-rule bg-surface">
                <iframe
                  src={`${calendlyUrl}${calendlyUrl.includes('?') ? '&' : '?'}hide_gdpr_banner=1&primary_color=0063DE`}
                  title="Book an inspection on Calendly"
                  className="h-[620px] w-full"
                  loading="lazy"
                />
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-rule bg-surface p-5 shadow-[0_28px_80px_rgba(0,0,0,0.06)] sm:p-8">
            {sent ? (
              <div className="py-10">
                <CheckCircle2 className="h-12 w-12 text-accent-2" />
                <h2 className="mt-6 font-heading text-4xl font-light">Request received.</h2>
                <p className="mt-4 max-w-md text-muted">
                  Your request is now in the Ehi-Kings CRM. The team will respond within 2 days.
                </p>
                <Link to="/properties" className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm text-accent-ink">
                  View properties <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <div className="text-[0.68rem] uppercase tracking-[0.22em] text-accent-2">{modes.find((item) => item.value === mode)?.label}</div>
                  <h2 className="mt-2 font-heading text-3xl font-light text-primary">Send your request</h2>
                  {selectedEstate && <p className="mt-2 text-sm text-muted">Selected property: {selectedEstate.name}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="name" label="Full name" required defaultValue={customer?.name} />
                  <Field name="email" label="Email" type="email" required defaultValue={customer?.email} />
                  <Field name="phone" label="Phone" type="tel" required defaultValue={customer?.phone} />
                  <Field name="budget" label="Budget" />
                </div>

                {mode === 'inspection' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Field name="preferredDate" label="Inspection date" type="date" min={minDate} required />
                      <p className="mt-2 text-xs leading-5 text-muted">Tuesdays, Thursdays & Saturdays only — at least 2 days ahead.</p>
                    </div>
                    <div>
                      <label className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">Time</label>
                      <input value="10:00 AM" readOnly className="mt-2 w-full rounded-[1rem] border border-rule bg-bg px-4 py-3 text-primary outline-none" />
                    </div>
                  </div>
                )}

                {mode === 'payment_interest' && (
                  <>
                    <div className="rounded-[1rem] border border-accent-2/30 bg-accent-2/10 p-4 text-sm leading-6 text-primary">
                      {paystackReady
                        ? 'Secure card & bank payment via Paystack. Enter an amount to pay now, or leave it empty to have the team contact you first.'
                        : 'Paystack is not taking money yet. This saves the buyer as a payment-interest lead while the Paystack keys are being prepared.'}
                    </div>
                    {paystackReady && (
                      <Field name="amount" label="Amount to pay now (₦, optional)" type="number" min="1000" />
                    )}
                  </>
                )}

                <div>
                  <label className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">Message</label>
                  <textarea name="message" rows={5} className="mt-2 w-full resize-none rounded-[1rem] border border-rule bg-bg px-4 py-3 text-base text-primary outline-none focus:border-accent" placeholder="Location, plot size, preferred estate, timing, or any question..." />
                </div>

                <label className="flex items-start gap-3 text-sm text-muted">
                  <input name="consentMarketing" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-accent-2)]" />
                  I agree to receive follow-up property updates and email marketing from {COMPANY.short}.
                </label>

                {error && <div className="rounded-[1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-500">{error}</div>}

                <button disabled={busy} type="submit" className="inline-flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full bg-accent py-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-55">
                  {busy ? 'Saving request...' : 'Submit request'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ name, label, type = 'text', required, min, defaultValue }: { name: string; label: string; type?: string; required?: boolean; min?: string; defaultValue?: string }) {
  return (
    <div>
      <label className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">{label}</label>
      <input
        name={name}
        type={type}
        min={min}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 min-h-[48px] w-full rounded-[1rem] border border-rule bg-bg px-4 py-3 text-base text-primary outline-none focus:border-accent"
      />
    </div>
  );
}
