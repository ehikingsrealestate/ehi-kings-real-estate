import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Phone, User } from 'lucide-react';
import { COMPANY } from '../data/site';
import { useCustomer } from '../customer/useCustomer';
import { Reveal } from '../components/MotionPrimitives';

type Mode = 'signin' | 'signup';

export default function Account() {
  const { token, me, loading, signIn, signUp } = useCustomer();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in → straight to the portal.
  useEffect(() => {
    if (token && me) navigate('/dashboard', { replace: true });
  }, [token, me, navigate]);

  if (token && me) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const res =
      mode === 'signup'
        ? await signUp({ email, name, phone: phone.trim() || undefined, password })
        : await signIn(email, password);
    setBusy(false);
    if (res.ok) navigate('/dashboard', { replace: true });
    else setError(res.error ?? 'Something went wrong. Please try again.');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  return (
    <div className="min-h-screen bg-primary px-3 pb-20 pt-28 text-white sm:px-5 sm:pt-32 md:px-8">
      <div className="mx-auto grid max-w-[1160px] gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        {/* Brand / value panel */}
        <Reveal blur>
          <aside className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.9rem] border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-7 sm:p-10 md:rounded-[2.5rem]">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
              <img
                src="/ehi-kings-logo.png"
                alt={COMPANY.short}
                className="h-12 w-auto drop-shadow-[0_4px_18px_rgba(255,255,255,0.22)]"
              />
              <p className="mt-10 text-sm font-medium uppercase tracking-[0.2em] text-accent-2">
                Client Portal
              </p>
              <h1 className="mt-5 max-w-md text-balance font-heading text-4xl font-light leading-[1.02] tracking-normal sm:text-5xl">
                Your properties, in one private place.
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-white/70">
                {COMPANY.tagline} Create an account to reserve land and homes, and track everything you hold with {COMPANY.short}.
              </p>
            </div>
            <ul className="relative mt-10 grid gap-3 text-sm text-white/75">
              {[
                'Reserve available land & homes instantly',
                'Track reserved and owned properties',
                'Pick up right where you left off',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-2/20 text-accent-2">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </Reveal>

        {/* Auth card */}
        <Reveal>
          <div className="flex h-full flex-col rounded-[1.9rem] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-9 md:rounded-[2.5rem]">
            <div className="mb-7 grid grid-cols-2 gap-1 rounded-full border border-white/12 bg-white/5 p-1">
              {(['signin', 'signup'] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => switchMode(item)}
                  className={`rounded-full py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
                    mode === item
                      ? 'bg-accent-2 text-accent-2-ink'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {item === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <h2 className="font-heading text-2xl font-light tracking-normal sm:text-3xl">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {mode === 'signin'
                ? 'Sign in to view and manage your properties.'
                : 'It only takes a moment to start reserving properties.'}
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              {mode === 'signup' && (
                <Field
                  id="name"
                  label="Full name"
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
              )}

              <Field
                id="email"
                label="Email"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                required
                value={email}
                onChange={setEmail}
                placeholder="you@email.com"
                autoComplete="email"
              />

              {mode === 'signup' && (
                <Field
                  id="phone"
                  label="Phone (optional)"
                  icon={<Phone className="h-4 w-4" />}
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+234 ..."
                  autoComplete="tel"
                />
              )}

              <Field
                id="password"
                label="Password"
                icon={<Lock className="h-4 w-4" />}
                type="password"
                required
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-accent-2/30 bg-accent-2/10 px-4 py-3 text-sm text-accent-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent-2 py-3.5 text-xs uppercase tracking-[0.2em] text-accent-2-ink transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/60">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-medium text-accent-2 hover:underline"
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>

            <Link
              to="/properties"
              className="mt-8 text-center text-xs uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-accent-2"
            >
              Browse properties instead →
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  type,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[0.7rem] uppercase tracking-[0.2em] text-white/55">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-white/12 bg-white/5 py-3 pl-11 pr-4 text-white placeholder:text-white/35 transition-colors focus:border-accent-2 focus:outline-none"
        />
      </div>
    </div>
  );
}
