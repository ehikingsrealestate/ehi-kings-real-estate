import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAction, useMutation } from 'convex/react';
import {
  Check,
  Loader2,
  LogOut,
  Mail as MailIcon,
  Moon,
  Palette,
  Plug,
  ShieldCheck,
  Sun,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin, roleBadgeClass } from './store';

type ZohoConn = { loading: boolean; connected: boolean; email?: string; oauthReady: boolean; error?: string };

function readTheme(): 'dark' | 'light' {
  try { return localStorage.getItem('ek_admin_theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}

export default function Settings() {
  const { token, me, logout } = useAdmin();
  const navigate = useNavigate();

  const updateProfile = useMutation(api.users.updateProfile);
  const zohoStatus = useAction(api.zoho.status);
  const zohoConnectUrl = useAction(api.zoho.connectUrl);
  const zohoDisconnect = useAction(api.zoho.disconnect);

  // Profile form — seeded from `me` once it loads (and re-seeded if the account changes).
  const [form, setForm] = useState({ name: '', title: '', phone: '' });
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'busy' | 'saved'>('idle');
  const [saveError, setSaveError] = useState('');

  // Mailbox connection.
  const [conn, setConn] = useState<ZohoConn>({ loading: true, connected: false, oauthReady: false });
  const [mailBusy, setMailBusy] = useState(false);

  // Appearance.
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme);

  useEffect(() => {
    if (me && me.id !== seededFor) {
      setForm({ name: me.name, title: me.title, phone: me.phone ?? '' });
      setSeededFor(me.id);
    }
  }, [me, seededFor]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    zohoStatus({ token })
      .then((s) => { if (!cancelled) setConn({ loading: false, ...s }); })
      .catch((e) => {
        if (!cancelled) setConn({ loading: false, connected: false, oauthReady: false, error: (e as Error).message });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const t = setTimeout(() => setSaveState('idle'), 2200);
    return () => clearTimeout(t);
  }, [saveState]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveError('');
    setSaveState('busy');
    try {
      await updateProfile({
        token,
        name: form.name.trim(),
        title: form.title.trim(),
        phone: form.phone.trim() || undefined,
      });
      setSaveState('saved');
    } catch (err) {
      setSaveState('idle');
      setSaveError((err as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, ''));
    }
  };

  const connectZoho = async () => {
    if (!token) return;
    setMailBusy(true);
    try {
      const { url } = await zohoConnectUrl({ token });
      window.location.href = url;
    } catch (e) {
      setConn((c) => ({ ...c, error: (e as Error).message }));
      setMailBusy(false);
    }
  };

  const disconnectZoho = async () => {
    if (!token) return;
    setMailBusy(true);
    try {
      await zohoDisconnect({ token });
      const s = await zohoStatus({ token });
      setConn({ loading: false, ...s });
    } catch (e) {
      setConn((c) => ({ ...c, error: (e as Error).message }));
    } finally {
      setMailBusy(false);
    }
  };

  const setThemeEverywhere = (next: 'dark' | 'light') => {
    setTheme(next);
    try { localStorage.setItem('ek_admin_theme', next); } catch { /* ignore */ }
    document.querySelector('.admin-os')?.setAttribute('data-theme', next);
  };

  const signOut = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (!me) {
    return (
      <div className="font-sans flex min-h-[40vh] items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const initials = me.name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const memberSince = me.createdAt
    ? new Date(me.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Settings</h1>
          <p className="admin-page-copy">Your profile, mailbox, appearance and account security.</p>
        </div>
      </div>

      <div className="mt-6 space-y-5 max-w-3xl">
        {/* Profile */}
        <Section icon={UserRound} title="Profile" note="How you appear to the rest of the team.">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/20 text-accent flex items-center justify-center text-lg font-medium shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-primary truncate">{me.name}</div>
              <div className="text-xs text-muted mt-0.5 truncate">{me.title}</div>
            </div>
          </div>
          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-muted">Full name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="Full name" className="admin-input mt-1 w-full" />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Job title</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                  placeholder="Job title" className="admin-input mt-1 w-full" />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-muted">Phone (optional)</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel"
                placeholder="+234 ..." className="admin-input mt-1 w-full" />
            </label>
            {saveError && <p className="text-sm text-accent-2">{saveError}</p>}
            <button type="submit" disabled={saveState === 'busy'} className="admin-primary-button">
              {saveState === 'busy' && <Loader2 className="w-4 h-4 animate-spin" />}
              {saveState === 'saved' && <Check className="w-4 h-4" />}
              {saveState === 'saved' ? 'Saved' : 'Save changes'}
            </button>
          </form>
        </Section>

        {/* Account */}
        <Section icon={ShieldCheck} title="Account" note="Managed by your administrator.">
          <div className="space-y-3 text-sm">
            <Row label="Email">
              <span className="text-primary break-all">{me.email}</span>
            </Row>
            <Row label="Role">
              <span className={`text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1 rounded-full ${roleBadgeClass(me.role)}`}>{me.role}</span>
            </Row>
            {memberSince && (
              <Row label="Member since">
                <span className="text-primary">{memberSince}</span>
              </Row>
            )}
          </div>
        </Section>

        {/* Mailbox */}
        <Section icon={MailIcon} title="Mailbox" note="Your personal Zoho Mail connection — only you can see your inbox.">
          {conn.loading ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-accent" /> Checking connection…
            </div>
          ) : conn.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Check className="w-4 h-4 text-accent" />
                Connected as <span className="text-accent">{conn.email}</span>
              </div>
              <button onClick={disconnectZoho} disabled={mailBusy} className="admin-secondary-button">
                {mailBusy && <Loader2 className="w-4 h-4 animate-spin" />} Disconnect
              </button>
            </div>
          ) : conn.oauthReady ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">No mailbox linked yet. Connect your Ehi-Kings Zoho inbox to read and send mail here.</p>
              <button onClick={connectZoho} disabled={mailBusy} className="admin-primary-button shrink-0">
                {mailBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />} Connect Zoho Mail
              </button>
            </div>
          ) : (
            <p className="text-sm text-muted">Zoho OAuth is not configured yet — an admin needs to set it up on the backend first.</p>
          )}
          {conn.error && <p className="mt-3 text-sm text-accent-2">{conn.error}</p>}
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance" note="Choose how the admin looks on this device.">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setThemeEverywhere('light')}
              aria-pressed={theme === 'light'}
              className={theme === 'light' ? 'admin-primary-button' : 'admin-secondary-button'}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => setThemeEverywhere('dark')}
              aria-pressed={theme === 'dark'}
              className={theme === 'dark' ? 'admin-primary-button' : 'admin-secondary-button'}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
          </div>
        </Section>

        {/* Security */}
        <Section icon={LogOut} title="Security" note="Session and sign-in.">
          <p className="text-sm text-muted">
            Staff sign-in is handled through the company Zoho account. Signing out ends your session on this device only.
          </p>
          <button onClick={signOut} className="admin-secondary-button mt-4">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, note, children }: { icon: LucideIcon; title: string; note: string; children: ReactNode }) {
  return (
    <section className="admin-panel p-4 md:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-primary">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{note}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="w-28 shrink-0 text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}
