import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAction } from 'convex/react';
import { Megaphone, Loader2, RefreshCw, Send, Users2, MailPlus, ListChecks, CheckCircle2, AlertTriangle, MailWarning, Workflow, ArrowRight } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';

// Native email-marketing tab — listmonk runs headless underneath; staff never
// see or log into it.

type Lists = { id: number; name: string; type: string; optin: string; subscribers: number }[];
type Campaigns = { id: number; name: string; subject: string; status: string; sent: number; toSend: number; views: number; clicks: number; createdAt: string }[];

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-white/10 text-white/70',
  running: 'bg-accent/20 text-accent',
  scheduled: 'bg-accent/15 text-accent',
  paused: 'bg-white/10 text-white/60',
  finished: 'bg-accent-2/20 text-accent-2',
  cancelled: 'bg-white/10 text-white/45',
};

export default function Marketing() {
  const { token } = useAdmin();
  const overview = useAction(api.marketing.overview);
  const ensureDefaultList = useAction(api.marketing.ensureDefaultList);
  const syncOptIns = useAction(api.marketing.syncOptIns);
  const createCampaign = useAction(api.marketing.createCampaign);
  const sendCampaign = useAction(api.marketing.sendCampaign);
  const setSmtp = useAction(api.marketing.setSmtp);

  const [state, setState] = useState<{ loading: boolean; configured: boolean; sendingReady: boolean; sendingHost?: string; lists: Lists; campaigns: Campaigns; error?: string }>({ loading: true, configured: true, sendingReady: false, lists: [], campaigns: [] });
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', body: '', listId: 0, sendNow: false });
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'warning' } | null>(null);
  const [showSending, setShowSending] = useState(false);
  const [smtp, setSmtpForm] = useState({ host: '', port: '465', username: '', password: '', fromEmail: 'info@ehikings.com' });

  const load = async () => {
    if (!token) return;
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await overview({ token });
      if (!res.configured) setState({ loading: false, configured: false, sendingReady: false, lists: [], campaigns: [] });
      else setState({ loading: false, configured: true, sendingReady: res.sendingReady, sendingHost: res.sendingHost, lists: res.lists, campaigns: res.campaigns });
    } catch (e) {
      setState({ loading: false, configured: true, sendingReady: false, lists: [], campaigns: [], error: e instanceof Error ? e.message : String(e) });
    }
  };
  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [token]);

  const submitSmtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setBusy('smtp'); setNotice(null);
    try {
      const res = await setSmtp({ token, host: smtp.host, port: Number(smtp.port), username: smtp.username, password: smtp.password, fromEmail: smtp.fromEmail });
      if (res.ok) {
        setNotice({ text: 'Email sending is set up — campaigns will now deliver.', kind: 'success' });
        setShowSending(false);
        setSmtpForm((f) => ({ ...f, password: '' }));
        await load();
      } else {
        setNotice({ text: res.error || "Couldn't save sending settings.", kind: 'warning' });
      }
    } catch (e) { setNotice({ text: e instanceof Error ? e.message : String(e), kind: 'warning' }); }
    finally { setBusy(''); }
  };

  const doSync = async () => {
    if (!token) return;
    setBusy('sync'); setNotice(null);
    try {
      const list = await ensureDefaultList({ token });
      const res = await syncOptIns({ token, listId: list.id });
      setNotice({ text: `Synced CRM opt-ins into "${list.name}": ${res.added} added, ${res.skipped} already subscribed.`, kind: 'success' });
      await load();
    } catch (e) { setNotice({ text: e instanceof Error ? e.message : String(e), kind: 'warning' }); }
    finally { setBusy(''); }
  };

  const submitCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.listId) { setNotice({ text: 'Choose a list to send to.', kind: 'warning' }); return; }
    setBusy('campaign'); setNotice(null);
    try {
      const res = await createCampaign({ token, name: form.name, subject: form.subject, body: form.body, listId: form.listId, sendNow: form.sendNow });
      if (res.warning) setNotice({ text: res.warning, kind: 'warning' });
      else setNotice({ text: form.sendNow ? `Campaign #${res.id} is sending.` : `Campaign #${res.id} saved as draft.`, kind: 'success' });
      setCompose(false); setForm({ name: '', subject: '', body: '', listId: 0, sendNow: false });
      await load();
    } catch (e) { setNotice({ text: e instanceof Error ? e.message : String(e), kind: 'warning' }); }
    finally { setBusy(''); }
  };

  const totalSubs = state.lists.reduce((n, l) => n + (l.subscribers || 0), 0);
  const totalSent = state.campaigns.reduce((n, c) => n + (c.sent || 0), 0);
  const noticeIsWarning = notice?.kind === 'warning';

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Marketing</h1>
          <p className="admin-page-copy">Newsletters and campaigns — built into the workspace, synced with the CRM.</p>
        </div>
        {state.configured && (
          <div className="flex gap-2 shrink-0">
            <button onClick={doSync} disabled={busy !== ''} className="admin-secondary-button">
              {busy === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users2 className="w-4 h-4" />} Sync CRM opt-ins
            </button>
            <button onClick={() => setCompose((v) => !v)} className="admin-primary-button">
              <MailPlus className="w-4 h-4" /> New campaign
            </button>
            <button onClick={load} className="admin-secondary-button px-3" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {notice && (
        <div className={`mt-4 flex items-center gap-2 rounded-[var(--admin-radius-control)] border px-4 py-3 text-sm text-white/85 ${noticeIsWarning ? 'border-amber-400/30 bg-amber-400/10' : 'border-accent/30 bg-accent/10'}`}>
          {noticeIsWarning
            ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />} {notice.text}
        </div>
      )}

      {!state.loading && state.configured && !state.error && !state.sendingReady && (
        <div className="mt-4 rounded-[var(--admin-radius-control)] border border-amber-400/30 bg-amber-400/10 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2.5">
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <div className="text-sm font-medium text-white">Email sending isn't set up yet</div>
                <p className="mt-1 text-sm text-white/60">Campaigns save as drafts but won't deliver. Add your SMTP details to start sending.</p>
              </div>
            </div>
            <button onClick={() => setShowSending((v) => !v)} className="admin-primary-button shrink-0">
              <MailPlus className="h-4 w-4" /> Sending settings
            </button>
          </div>
        </div>
      )}

      {!state.loading && state.configured && !state.error && state.sendingReady && (
        <div className="mt-4 flex items-center gap-2 text-xs text-white/45">
          <CheckCircle2 className="h-3.5 w-3.5 text-accent-2 shrink-0" />
          <span>Sending ready via {state.sendingHost}</span>
          <button onClick={() => setShowSending((v) => !v)} className="text-white/38 underline decoration-white/20 underline-offset-2 hover:text-white/60">Edit</button>
        </div>
      )}

      {!state.loading && state.configured && !state.error && showSending && (
        <form onSubmit={submitSmtp} className="admin-panel mt-4 space-y-3 p-4 md:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <MailWarning className="h-4 w-4 text-amber-400" /> Sending settings
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={smtp.host} onChange={(e) => setSmtpForm({ ...smtp, host: e.target.value })} placeholder="smtp.zoho.com" required className="admin-input" />
            <input type="number" value={smtp.port} onChange={(e) => setSmtpForm({ ...smtp, port: e.target.value })} placeholder="465" required className="admin-input" />
          </div>
          <input value={smtp.username} onChange={(e) => setSmtpForm({ ...smtp, username: e.target.value })} placeholder="Username (your full email)" required className="admin-input" />
          <div>
            <label className="mb-1 block text-xs text-white/50">SMTP / app-specific password</label>
            <input type="password" value={smtp.password} onChange={(e) => setSmtpForm({ ...smtp, password: e.target.value })} placeholder="••••••••••••" required className="admin-input" />
          </div>
          <input value={smtp.fromEmail} onChange={(e) => setSmtpForm({ ...smtp, fromEmail: e.target.value })} placeholder="info@ehikings.com" required className="admin-input" />
          <p className="text-xs text-white/38">Zoho Mail: host smtp.zoho.com, port 465, your mailbox + an app-specific password (Zoho → Security → App Passwords).</p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy === 'smtp'} className="admin-primary-button">
              {busy === 'smtp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save sending settings
            </button>
            <button type="button" onClick={() => setShowSending(false)} className="admin-secondary-button">Cancel</button>
          </div>
        </form>
      )}

      {state.loading ? (
        <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : !state.configured ? (
        <div className="admin-panel mt-6 max-w-xl p-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Workflow className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-lg text-white">Email campaigns run through Automations now</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Newsletters and drip sequences are handled by the n8n email workflows in Automations. Build the audience, template, and send steps once and they run on their own — no separate marketing engine to keep online.
          </p>
          <Link to="/admin/automations" className="admin-primary-button mt-5 inline-flex items-center gap-2">
            Open Automations <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-white/38">
            CRM opt-ins and contact data stay in the workspace and feed the workflows directly.
          </p>
        </div>
      ) : state.error ? (
        <div className="admin-panel mt-6 max-w-xl p-6 text-sm text-accent-2">{state.error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat icon={ListChecks} value={state.lists.length} label="Lists" />
            <Stat icon={Users2} value={totalSubs} label="Subscribers" />
            <Stat icon={Megaphone} value={state.campaigns.length} label="Campaigns" />
            <Stat icon={Send} value={totalSent} label="Emails sent" />
          </div>

          {compose && (
            <form onSubmit={submitCampaign} className="admin-panel mt-5 space-y-3 p-4 md:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name (internal)" required className="admin-input" />
                <select value={form.listId} onChange={(e) => setForm({ ...form, listId: Number(e.target.value) })} required className="admin-input">
                  <option value={0}>Send to list…</option>
                  {state.lists.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.subscribers})</option>)}
                </select>
              </div>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject" required className="admin-input" />
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the email… (line breaks become paragraphs)" rows={6} required className="admin-input resize-none" />
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={form.sendNow} onChange={(e) => setForm({ ...form, sendNow: e.target.checked })} /> Send immediately (otherwise saves as draft)
              </label>
              <button type="submit" disabled={busy === 'campaign'} className="admin-primary-button">
                {busy === 'campaign' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {form.sendNow ? 'Create & send' : 'Save draft'}
              </button>
            </form>
          )}

          <h2 className="mt-8 text-sm font-medium text-white/70">Campaigns</h2>
          <div className="mt-3 space-y-2">
            {state.campaigns.length === 0 && <div className="admin-card p-5 text-sm text-white/45">No campaigns yet — create the first one.</div>}
            {state.campaigns.map((c) => (
              <div key={c.id} className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white truncate">{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${STATUS_STYLE[c.status] ?? 'bg-white/10 text-white/60'}`}>{c.status}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-white/45 truncate">{c.subject}</div>
                  <div className="mt-1 text-xs text-white/32 tnum">sent {c.sent ?? 0} · views {c.views ?? 0} · clicks {c.clicks ?? 0}</div>
                </div>
                {c.status === 'draft' && (
                  <button
                    onClick={async () => { if (!token) return; setBusy(`send-${c.id}`); setNotice(null); try { const r = await sendCampaign({ token, campaignId: c.id }); if (r.warning) setNotice({ text: r.warning, kind: 'warning' }); await load(); } catch (err) { setNotice({ text: err instanceof Error ? err.message : String(err), kind: 'warning' }); } finally { setBusy(''); } }}
                    disabled={busy !== ''}
                    className="admin-primary-button shrink-0"
                  >
                    {busy === `send-${c.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send now
                  </button>
                )}
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-sm font-medium text-white/70">Lists</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {state.lists.map((l) => (
              <div key={l.id} className="admin-card p-4">
                <div className="text-white">{l.name}</div>
                <div className="mt-1 text-xs text-white/45 tnum">{l.subscribers} subscribers · {l.type} · {l.optin} opt-in</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Megaphone; value: number; label: string }) {
  return (
    <div className="admin-card p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-4 w-4" /></div>
      <div className="font-heading text-2xl font-light tnum text-white">{value}</div>
      <div className="mt-0.5 text-[0.7rem] text-white/45">{label}</div>
    </div>
  );
}
