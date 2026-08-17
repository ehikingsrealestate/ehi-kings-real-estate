import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAction } from 'convex/react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';

export default function Login() {
  const { token, me, login } = useAdmin();
  const navigate = useNavigate();
  const loginUrl = useAction(api.zoho.loginUrl);
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('zoho') === 'error' ? (params.get('msg') ?? '') : '');
  const [busy, setBusy] = useState(false);
  const [zohoHref, setZohoHref] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch the Zoho consent URL up front so the button is a real link — clicking
  // it is a direct user-gesture navigation (no post-await redirect to get blocked).
  useEffect(() => {
    let live = true;
    loginUrl({})
      .then(({ url }) => { if (live) setZohoHref(url); })
      .catch((e) => { if (live) setError((e as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, '')); });
    return () => { live = false; };
  }, [loginUrl]);

  if (token && me) return <Navigate to="/admin" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) navigate('/admin');
    else setError(res.error ?? 'Could not sign in.');
  };

  return (
    <div className="min-h-screen bg-bg text-primary font-sans flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="inline-flex mb-10">
          <img src="/brand/ehi-kings-logo-color.png" alt="Ehi-Kings" className="h-12 w-auto" />
        </div>

        <h1 className="font-heading text-3xl font-light tracking-tight">Staff sign in</h1>
        <p className="text-muted text-sm mt-2 mb-8">Sign in with your Ehi-Kings Zoho account to access the workspace — your inbox connects automatically.</p>

        {/* Primary: Sign in with Zoho — a real link (direct-gesture navigation) */}
        <a
          href={zohoHref ?? '#'}
          aria-disabled={!zohoHref}
          onClick={(e) => { if (!zohoHref) e.preventDefault(); }}
          className={`w-full rounded-full bg-accent text-accent-ink py-3.5 text-xs tracking-[0.2em] uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${zohoHref ? '' : 'opacity-60 cursor-wait'}`}
        >
          {zohoHref ? <Mail className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />} Sign in with Zoho
        </a>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-accent-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          onClick={() => setShowPassword((v) => !v)}
          className="mt-6 text-xs tracking-[0.18em] uppercase text-muted hover:text-accent transition-colors"
        >
          {showPassword ? '← Back' : 'Or sign in with email & password'}
        </button>

        <form onSubmit={submit} className={`space-y-4 mt-6 ${showPassword ? '' : 'hidden'}`}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[0.7rem] tracking-[0.2em] uppercase text-muted">Company email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ehikings.com"
                className="w-full bg-surface border border-rule rounded-xl pl-11 pr-4 py-3 text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[0.7rem] tracking-[0.2em] uppercase text-muted">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-rule rounded-xl pl-11 pr-4 py-3 text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full border border-rule py-3.5 text-xs tracking-[0.2em] uppercase text-primary hover:border-accent hover:text-accent transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in with email
          </button>
        </form>

        <div className="mt-8 text-xs text-muted leading-relaxed border-t border-rule pt-6">
          <div className="tracking-[0.18em] uppercase text-[0.65rem] mb-2">Production access</div>
          <p>Use your Ehi-Kings Zoho mailbox. Password sign-in is only for staff accounts that an admin explicitly creates with a temporary password.</p>
        </div>

        <Link to="/" className="inline-block mt-8 text-xs tracking-[0.18em] uppercase text-muted hover:text-accent transition-colors">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
