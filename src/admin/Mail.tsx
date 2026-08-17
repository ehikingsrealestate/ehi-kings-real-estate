import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useAction } from 'convex/react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, CornerUpLeft, ExternalLink, Inbox, Loader2, Mail as MailIcon, PenSquare, Plug, RefreshCw, Send, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';

type Email = { id: string; folderId: string; from: string; subject: string; summary: string; receivedTime: string };

type FullBody = { loading: boolean; content?: string; isHtml?: boolean; error?: string };

const IFRAME_STYLE =
  '<style>html,body{margin:0;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#111;background:#fff;word-break:break-word} img{max-width:100%;height:auto} a{color:#0b57d0} blockquote{margin:0 0 0 12px;padding-left:12px;border-left:3px solid #ddd;color:#555}</style>';

const senderName = (from: string) => from.replace(/<.*>/, '').replace(/"/g, '').trim() || from;
const senderEmail = (from: string) => from.match(/<([^>]+)>/)?.[1] ?? from;
const initials = (from: string) => senderName(from).split(/[\s.@]+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export default function Mail() {
  const { token } = useAdmin();
  const status = useAction(api.zoho.status);
  const connectUrl = useAction(api.zoho.connectUrl);
  const listInbox = useAction(api.zoho.listInbox);
  const disconnect = useAction(api.zoho.disconnect);
  const getMessage = useAction(api.zoho.getMessage);
  const [params, setParams] = useSearchParams();

  const [conn, setConn] = useState<{ loading: boolean; connected: boolean; email?: string; oauthReady: boolean }>({ loading: true, connected: false, oauthReady: false });
  const [inbox, setInbox] = useState<{ loading: boolean; messages: Email[]; error?: string }>({ loading: false, messages: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullBody, setFullBody] = useState<FullBody>({ loading: false });
  const [compose, setCompose] = useState<{ to: string; subject: string } | null>(null);
  const callout = params.get('zoho');

  const selected = inbox.messages.find((m) => m.id === selectedId) ?? null;

  const refresh = async () => {
    if (!token) return;
    const s = await status({ token });
    setConn({ loading: false, ...s });
    if (s.connected) {
      setInbox((x) => ({ ...x, loading: true }));
      const res = await listInbox({ token });
      setInbox({ loading: false, messages: res.messages ?? [], error: res.error });
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!callout) return;
    const t = setTimeout(() => {
      params.delete('zoho');
      params.delete('msg');
      setParams(params, { replace: true });
    }, 6000);
    return () => clearTimeout(t);
  }, [callout, params, setParams]);

  useEffect(() => {
    if (!token || !selected) {
      setFullBody({ loading: false });
      return;
    }
    let cancelled = false;
    const messageId = selected.id;
    const folderId = selected.folderId;
    setFullBody({ loading: true });
    getMessage({ token, messageId, folderId })
      .then((res) => {
        if (cancelled) return;
        setFullBody({ loading: false, content: res.content, isHtml: res.isHtml, error: res.ok ? undefined : (res.error ?? 'Could not load message.') });
      })
      .catch(() => {
        if (cancelled) return;
        setFullBody({ loading: false, error: 'Could not load message.' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedId]);

  const connect = async () => {
    if (!token) return;
    const { url } = await connectUrl({ token });
    window.location.href = url;
  };

  const disconnectMail = async () => {
    if (!token) return;
    await disconnect({ token });
    setSelectedId(null);
    setInbox({ loading: false, messages: [] });
    await refresh();
  };

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-bg text-primary">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-rule px-4 md:px-7">
        <div className="min-w-0">
          <h1 className="text-base font-medium text-white">Mail</h1>
          <p className="truncate text-xs text-muted">{conn.connected ? conn.email : 'Zoho inbox and sending'}</p>
        </div>
        {conn.connected && (
          <div className="flex gap-2">
            <button onClick={() => setCompose({ to: '', subject: '' })} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent bg-accent px-3 py-2 text-xs text-accent-ink">
              <PenSquare className="h-4 w-4" /> Compose
            </button>
            <button onClick={refresh} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-3 py-2 text-xs text-muted hover:border-accent hover:text-accent">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={disconnectMail} className="inline-flex rounded-[var(--admin-radius-control)] border border-rule px-3 py-2 text-xs text-muted hover:border-accent-2 hover:text-accent-2">
              Disconnect
            </button>
          </div>
        )}
      </header>

      {callout === 'connected' && <Banner ok>Zoho Mail connected.</Banner>}
      {callout === 'error' && <Banner>{params.get('msg') ?? 'Could not connect Zoho Mail.'}</Banner>}

      {conn.loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : !conn.oauthReady ? (
        <EmptyState title="Zoho is not set up yet">
          An admin still needs to register the Zoho OAuth client on the backend. See ZOHO_MAIL_SETUP.md. Once that is done, each staff member can connect their own mailbox here.
        </EmptyState>
      ) : !conn.connected ? (
        <EmptyState title="Connect your Zoho Mail">
          <p>Link your own Ehi-Kings mailbox to read and send email here. Only you can see your inbox.</p>
          <button onClick={connect} className="mt-6 inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent bg-accent px-4 py-2.5 text-xs font-medium text-accent-ink">
            <Plug className="h-4 w-4" /> Connect my Zoho Mail
          </button>
        </EmptyState>
      ) : (
        <div className="grid min-h-0 flex-1 md:grid-cols-[360px_1fr]">
          <aside className={`min-h-0 flex-col border-r border-rule ${selected ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex min-h-12 items-center gap-2 border-b border-rule px-4 text-xs text-muted">
              <Inbox className="h-4 w-4" />
              Inbox
              {inbox.messages.length > 0 && <span className="text-muted/70">{inbox.messages.length}</span>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {inbox.loading && <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>}
              {inbox.error && <div className="p-5 text-sm text-accent-2">{inbox.error}</div>}
              {!inbox.loading && !inbox.error && inbox.messages.length === 0 && <div className="p-6 text-center text-sm text-muted">Inbox is empty.</div>}
              {inbox.messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex w-full gap-3 rounded-[var(--admin-radius-card)] px-4 py-3 text-left transition-colors ${selectedId === m.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[0.62rem] font-medium text-white/70">{initials(m.from)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-white">{senderName(m.from)}</span>
                      <span className="shrink-0 text-[0.6rem] text-white/35">{m.receivedTime}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[0.82rem] text-white/85">{m.subject}</span>
                    {m.summary && <span className="mt-0.5 block truncate text-xs text-white/40">{m.summary}</span>}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className={`min-h-0 flex-col ${selected ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <>
                <div className="border-b border-rule px-5 py-4">
                  <button onClick={() => setSelectedId(null)} className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-accent md:hidden">
                    <ArrowLeft className="h-4 w-4" /> Inbox
                  </button>
                  <h2 className="text-lg leading-snug text-white">{selected.subject}</h2>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[0.6rem] font-medium text-white/70">{initials(selected.from)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white">{senderName(selected.from)}</div>
                      <div className="text-xs text-white/40">{selected.from} · {selected.receivedTime}</div>
                    </div>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {fullBody.loading ? (
                    <div className="flex flex-1 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  ) : fullBody.content && !fullBody.error ? (
                    fullBody.isHtml ? (
                      <iframe
                        sandbox=""
                        title="message"
                        className="h-full min-h-[60vh] w-full flex-1 border-0 bg-white"
                        srcDoc={IFRAME_STYLE + fullBody.content}
                      />
                    ) : (
                      <div className="flex-1 overflow-y-auto whitespace-pre-wrap px-5 py-5 text-sm leading-relaxed text-white/80">
                        {fullBody.content}
                      </div>
                    )
                  ) : (
                    <div className="flex-1 overflow-y-auto px-5 py-5 text-sm leading-relaxed text-muted">
                      <p>{fullBody.error ?? 'No preview available for this message.'}</p>
                      {selected.summary && <p className="mt-3 whitespace-pre-wrap text-white/70">{selected.summary}</p>}
                      <a
                        href="https://mail.zoho.com"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-accent hover:underline"
                      >
                        Open in Zoho <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-rule px-5 py-3">
                  <button onClick={() => setCompose({ to: senderEmail(selected.from), subject: `Re: ${selected.subject}` })} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent bg-accent px-4 py-2 text-xs font-medium text-accent-ink">
                    <CornerUpLeft className="h-4 w-4" /> Reply
                  </button>
                  <a href="https://mail.zoho.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-4 py-2 text-xs text-muted hover:border-accent hover:text-accent">
                    Open in Zoho <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </>
            ) : (
              <div className="hidden flex-1 flex-col items-center justify-center text-white/30 md:flex">
                <MailIcon className="mb-3 h-10 w-10" />
                <div className="text-sm">Select a message to read</div>
              </div>
            )}
          </section>
        </div>
      )}

      {compose && <Composer token={token!} initial={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}

function Banner({ children, ok }: { children: ReactNode; ok?: boolean }) {
  return (
    <div className={`mx-4 mt-3 flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-4 py-3 text-sm ${ok ? 'text-accent' : 'text-accent-2'}`}>
      {ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {children}
    </div>
  );
}

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center px-6">
      <div className="max-w-xl">
        <MailIcon className="mb-7 h-8 w-8 text-accent" />
        <h2 className="text-3xl font-light tracking-[-0.03em] text-white">{title}</h2>
        <div className="mt-4 text-sm leading-7 text-muted">{children}</div>
      </div>
    </div>
  );
}

function Composer({ token, initial, onClose }: { token: string; initial: { to: string; subject: string }; onClose: () => void }) {
  const sendMail = useAction(api.zoho.sendMail);
  const [form, setForm] = useState({ to: initial.to, subject: initial.subject, body: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await sendMail({ token, ...form });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setTimeout(onClose, 1100);
    } else {
      setError(res.error ?? 'Send failed.');
    }
  };

  return (
    <aside className="fixed inset-y-3 right-3 z-50 flex w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-[var(--admin-radius-panel)] border border-rule bg-bg shadow-[0_0_60px_rgba(0,0,0,0.28)] md:w-[480px]">
      <div className="flex min-h-14 items-center justify-between border-b border-rule px-4">
        <span className="text-sm font-medium text-white">New message</span>
        <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Close composer">
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
      {done ? (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-accent"><Check className="h-5 w-5" /> Sent.</div>
      ) : (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <input type="email" required value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="To"
            className="mx-3 mt-3 rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none" />
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject"
            className="mx-3 mt-2 rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none" />
          <textarea required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message..."
            className="mx-3 mt-2 min-h-0 flex-1 resize-none rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none" />
          {error && <p className="px-4 text-sm text-accent-2">{error}</p>}
          <div className="flex justify-end border-t border-rule px-3 py-3">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent bg-accent px-5 py-2.5 text-xs font-medium text-accent-ink disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
