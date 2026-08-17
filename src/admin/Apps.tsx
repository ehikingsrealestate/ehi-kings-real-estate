import { useState } from 'react';
import { useAction } from 'convex/react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Sparkles, CircleCheck, CircleDashed, type LucideIcon, Workflow, Share2, Handshake, MessagesSquare, Loader2, LogIn, Users2, UserRound, Bot } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';

// The Ehi-Kings Suite — every module is a self-hosted engine running on the
// company VPS, white-labelled and embedded here so it reads as one product.
// "Open signed-in" hands the staff session straight into the module (via the
// ek-sso gateway, or Chatwoot's own platform SSO) — no second login screen.

type AppDef = {
  key: string;
  name: string;
  purpose: string;
  icon: LucideIcon;
  url?: string;
  gw?: string;        // ek-sso gateway slug (suite.ticket app)
  shared?: boolean;   // single shared account (everyone lands together)
  note?: string;
  setup?: string;     // first-run step needed before one-click sign-in works
  native?: string;    // rebuilt from scratch inside the admin — route to it
  adminOnly?: boolean; // hidden from non-admins (e.g. agent tools that run shell)
};

const env = import.meta.env as Record<string, string | undefined>;

const APPS: AppDef[] = [
  {
    key: 'automations',
    name: 'Automation Studio',
    purpose: 'Visual workflows connecting the CRM, mail, payments and the website — no code needed. See the Automations tab for the ready-made playbooks.',
    icon: Workflow,
    url: env.VITE_APP_N8N_URL,
    gw: 'automations',
    shared: true,
  },
  {
    key: 'social',
    name: 'Social Studio',
    purpose: 'Plan, schedule and track posts across every social channel — rebuilt natively.',
    icon: Share2,
    url: env.VITE_APP_POSTIZ_URL,
    native: '/admin/social',
  },
  {
    key: 'crm-pro',
    name: 'Sales Pipeline',
    purpose: 'Companies, deals and stage pipeline — rebuilt natively inside the CRM tab.',
    icon: Handshake,
    url: env.VITE_APP_TWENTY_URL,
    native: '/admin/crm',
  },
  {
    key: 'support',
    name: 'Support Desk',
    purpose: 'Customer conversations and website live chat — rebuilt natively inside Team Chat.',
    icon: MessagesSquare,
    url: env.VITE_APP_CHATWOOT_URL,
    native: '/admin/team-chat',
  },
  {
    key: 'assistant',
    name: 'AI Assistant',
    purpose: 'Self-hosted AI assistant (PicoClaw) — connect an LLM to WhatsApp/Telegram for auto-replies.',
    icon: Bot,
    url: env.VITE_APP_ASSISTANT_URL,
    note: 'Admins only — runs shell/agent tools. First open: enter the dashboard token, add your LLM key, connect a channel.',
    adminOnly: true,
  },
];

export default function Apps() {
  const [active, setActive] = useState<AppDef | null>(null);
  const { token, me } = useAdmin();
  const visibleApps = APPS.filter((a) => !a.adminOnly || me?.role === 'Admin');
  const suiteTicket = useAction(api.suite.ticket);
  const [busy, setBusy] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [frameError, setFrameError] = useState(false);

  const openPreview = (app: AppDef) => {
    setFrameError(false);
    setActive(app);
  };

  const openModule = async (app: AppDef) => {
    if (!token || busy) return;
    // Modules without an ek-sso gateway (e.g. the AI Assistant, which has its
    // own dashboard token) open directly — no ticket to mint.
    if (!app.gw) {
      if (app.url) window.open(app.url, '_blank', 'noopener');
      return;
    }
    setBusy(app.key);
    setErrors((e) => ({ ...e, [app.key]: '' }));
    try {
      const res = await suiteTicket({ token, app: app.gw });
      if (!res.configured) setErrors((e) => ({ ...e, [app.key]: 'Sign-in is not configured on the backend yet.' }));
      else if (res.error) setErrors((e) => ({ ...e, [app.key]: res.error! }));
      else if (res.url) window.open(res.url, '_blank', 'noopener');
    } catch (e) {
      setErrors((er) => ({ ...er, [app.key]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy('');
    }
  };

  if (active?.url) {
    return (
      <div className="font-sans flex h-[calc(100dvh-9rem)] min-h-[480px] flex-col">
        <div className="flex items-center justify-between gap-3 pb-3">
          <button onClick={() => setActive(null)} className="admin-secondary-button inline-flex items-center gap-2 px-3 py-2">
            <ArrowLeft className="h-4 w-4" /> All modules
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <span className="truncate text-sm text-white/70">{active.name}</span>
            <button onClick={() => openModule(active)} disabled={busy === active.key} className="admin-secondary-button inline-flex items-center gap-2 px-3 py-2">
              {busy === active.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />} {active.gw ? 'Open signed-in' : 'Open'}
            </button>
          </div>
        </div>
        <div className="admin-panel relative flex-1 overflow-hidden p-0">
          <iframe
            src={active.url}
            title={active.name}
            className="h-full w-full border-0 bg-white"
            onError={() => setFrameError(true)}
          />
          {frameError && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-center text-xs text-white/70 backdrop-blur-sm">
              If this stays blank, the module blocks embedding — use “Open signed-in”.
            </div>
          )}
        </div>
        <p className="pt-2 text-xs text-white/38">
          Embedded here for a quick look. If this stays blank, the module blocks embedding — use “Open signed-in”.
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Suite</h1>
          <p className="admin-page-copy">The full Ehi-Kings toolkit — one login opens every module.</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-white/45"><Sparkles className="h-4 w-4" /> Ehi-Kings Suite</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleApps.map((app) => {
          const hosted = Boolean(app.url);
          const err = errors[app.key];
          return (
            <div key={app.key} className="admin-card flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent"><app.icon className="h-4.5 w-4.5" /></span>
                {app.native ? (
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-accent"><CircleCheck className="h-3.5 w-3.5" /> Native</span>
                ) : !hosted ? (
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-white/35"><CircleDashed className="h-3.5 w-3.5" /> Offline</span>
                ) : app.setup ? (
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-amber-400/80"><CircleDashed className="h-3.5 w-3.5" /> Setup</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-accent-2"><CircleCheck className="h-3.5 w-3.5" /> Live</span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-base font-medium text-white">
                {app.name}
                {!app.native && (
                  <span
                    title={app.shared ? 'One shared team workspace' : 'Your own account inside this module'}
                    className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-white/40"
                  >
                    {app.shared ? <Users2 className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                    {app.shared ? 'Shared' : 'Personal'}
                  </span>
                )}
              </div>
              <p className="mt-1 flex-1 text-sm leading-6 text-white/50">{app.purpose}</p>
              {app.note && <p className="mt-2 text-xs text-white/38">{app.note}</p>}
              {app.setup && <p className="mt-2 text-xs text-amber-400/70">{app.setup}</p>}
              <div className="mt-4 flex flex-col gap-1.5">
                {app.native ? (
                  <NavLink to={app.native} className="admin-primary-button inline-flex w-full items-center justify-center gap-2">
                    Open <ArrowLeft className="h-4 w-4 rotate-180" />
                  </NavLink>
                ) : hosted ? (
                  <>
                    <div className="flex gap-2">
                      <button onClick={() => openModule(app)} disabled={busy === app.key} className="admin-primary-button inline-flex flex-1 items-center justify-center gap-2">
                        {busy === app.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} {app.gw ? 'Open signed-in' : 'Open'}
                      </button>
                      <button onClick={() => openPreview(app)} className="admin-secondary-button inline-flex items-center gap-2 px-3" title="Preview embedded">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                    {err && <span className="text-xs text-accent-2">{err}</span>}
                  </>
                ) : (
                  <span className="text-xs text-white/38">Module offline — contact the administrator.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
