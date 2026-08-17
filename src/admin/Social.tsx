import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import {
  Plus, Loader2, Send, CalendarClock, PenLine, CheckCircle2, XCircle, Pencil,
  Image as ImageIcon, AlertTriangle, Instagram, Facebook, Twitter, Linkedin,
  Share2, MessageCircle, Zap, Link2, Unlink, X as XIcon, Copy, Check,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAdmin } from './store';
import AddMenu from './AddMenu';

// Native social-media planner — compose, schedule and track posts across
// channels on our own Convex tables. No external scheduler (what Postiz
// offered, minus the extra login).

type PostStatus = 'draft' | 'scheduled' | 'published' | 'cancelled';

type Post = {
  id: Id<'socialPosts'>;
  content: string;
  platforms: string[];
  mediaUrl?: string;
  scheduledAt: number;
  status: PostStatus;
  publishedAt?: number;
  createdById: string;
};

const PLATFORMS = ['Instagram', 'Facebook', 'X', 'LinkedIn', 'TikTok', 'WhatsApp'];

// Display name → lowercase platform key (as stored by the backend) + lucide icon.
// X uses the Twitter glyph; TikTok/WhatsApp fall back to generic icons.
const CHANNELS: { name: string; key: string; icon: typeof Instagram }[] = [
  { name: 'Instagram', key: 'instagram', icon: Instagram },
  { name: 'Facebook', key: 'facebook', icon: Facebook },
  { name: 'X', key: 'x', icon: Twitter },
  { name: 'LinkedIn', key: 'linkedin', icon: Linkedin },
  { name: 'TikTok', key: 'tiktok', icon: Share2 },
  { name: 'WhatsApp', key: 'whatsapp', icon: MessageCircle },
];

// Display name → platform key, for marking connected chips in the composer.
const KEY_BY_NAME: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.name, c.key]),
);

type Connection = {
  id: Id<'socialConnections'>;
  platform: string; // lowercase key
  handle: string;
  connected: boolean;
  autoPost: boolean;
  updatedAt: number;
};

// Mirrors STATUS_STYLE in Marketing.tsx
const STATUS_STYLE: Record<PostStatus, string> = {
  draft: 'bg-white/10 text-white/70',
  scheduled: 'bg-accent/15 text-accent',
  published: 'bg-accent-2/20 text-accent-2',
  cancelled: 'bg-white/10 text-white/35',
};

const CHAR_LIMIT = 280;

function pad(n: number): string { return String(n).padStart(2, '0'); }

// ms → value for <input type="datetime-local"> in local time
function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Default schedule slot: now + 1h, rounded up to the next quarter hour.
function defaultSlot(): string {
  const d = new Date(Date.now() + 3_600_000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  return toLocalInput(d.getTime());
}

function dayLabel(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

type FormState = {
  postId: Id<'socialPosts'> | null;
  content: string;
  platforms: string[];
  mediaUrl: string;
  when: string; // datetime-local value
};

const emptyForm = (): FormState => ({ postId: null, content: '', platforms: [], mediaUrl: '', when: defaultSlot() });

export default function Social() {
  const { token, me } = useAdmin();
  const postsRaw = useQuery(api.social.listPosts, token ? { token } : 'skip');
  const connectionsRaw = useQuery(api.social.listConnections, token ? { token } : 'skip');
  const upsertPost = useMutation(api.social.upsertPost);
  const setPostStatus = useMutation(api.social.setPostStatus);
  const connectChannel = useMutation(api.social.connectChannel);
  const disconnectChannel = useMutation(api.social.disconnectChannel);

  // Instagram is a REAL connection via the Meta Graph API (not just a handle).
  const igStatus = useQuery(api.instagram.setupStatus, token ? { token } : 'skip');
  const saveMetaApp = useMutation(api.instagram.saveMetaApp);
  const igConnectUrl = useAction(api.instagram.connectUrl);
  const igPublishNow = useAction(api.instagram.publishNow);
  const igDisconnect = useMutation(api.instagram.disconnect);

  const canSetupIg = me?.role === 'Admin' || me?.role === 'Manager';

  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Inline connect form: which platform key is open, plus its field values.
  const [connectKey, setConnectKey] = useState<string | null>(null);
  const [connectHandle, setConnectHandle] = useState('');
  const [connectWebhook, setConnectWebhook] = useState('');

  // Instagram Meta-app setup panel state (only used by the Instagram card).
  const [metaAppId, setMetaAppId] = useState('');
  const [metaAppSecret, setMetaAppSecret] = useState('');
  const [copied, setCopied] = useState(false);

  // OAuth return banner (?ig=connected | ?ig=error&msg=…), then clear the param.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const ig = searchParams.get('ig');
    if (!ig) return;
    if (ig === 'connected') {
      setNotice('Instagram connected — ready to publish.');
      setError('');
    } else if (ig === 'error') {
      setError(`Instagram: ${searchParams.get('msg') || 'connection failed.'}`);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('ig');
    next.delete('msg');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = token != null && postsRaw === undefined;
  const posts: Post[] = useMemo(() => postsRaw ?? [], [postsRaw]);

  const connections: Connection[] = useMemo(() => connectionsRaw ?? [], [connectionsRaw]);
  const connByKey = useMemo(() => {
    const m: Record<string, Connection> = {};
    for (const c of connections) m[c.platform] = c;
    return m;
  }, [connections]);

  const counts = useMemo(() => {
    const c: Record<PostStatus, number> = { draft: 0, scheduled: 0, published: 0, cancelled: 0 };
    for (const p of posts) c[p.status] += 1;
    return c;
  }, [posts]);

  // Timeline grouped by calendar day (already sorted by scheduledAt server-side).
  const days = useMemo(() => {
    const groups: { key: string; label: string; posts: Post[] }[] = [];
    for (const p of posts) {
      const key = new Date(p.scheduledAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.posts.push(p);
      else groups.push({ key, label: dayLabel(p.scheduledAt), posts: [p] });
    }
    return groups;
  }, [posts]);

  const toggleCompose = () => {
    if (!composing) setForm(emptyForm());
    setError('');
    setComposing(!composing);
  };

  const togglePlatform = (name: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(name) ? f.platforms.filter((p) => p !== name) : [...f.platforms, name],
    }));
  };

  const submit = async (status: 'scheduled' | 'draft') => {
    if (!token) return;
    const scheduledAt = Date.parse(form.when);
    if (Number.isNaN(scheduledAt)) { setError('Pick a valid date and time.'); return; }
    setBusy(status); setError('');
    try {
      await upsertPost({
        token,
        postId: form.postId ?? undefined,
        content: form.content,
        platforms: form.platforms,
        mediaUrl: form.mediaUrl.trim() || undefined,
        scheduledAt,
        status,
      });
      setComposing(false);
      setForm(emptyForm());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const changeStatus = async (postId: Id<'socialPosts'>, status: PostStatus) => {
    if (!token) return;
    setBusy(`${status}-${postId}`); setError('');
    try {
      await setPostStatus({ token, postId, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const openConnect = (key: string) => {
    setConnectKey(key);
    setConnectHandle('');
    setConnectWebhook('');
    setError('');
  };

  const closeConnect = () => {
    setConnectKey(null);
    setConnectHandle('');
    setConnectWebhook('');
  };

  const submitConnect = async (key: string) => {
    if (!token) return;
    if (!connectHandle.trim()) { setError('Enter the account handle.'); return; }
    setBusy(`connect-${key}`); setError('');
    try {
      await connectChannel({
        token,
        platform: key,
        handle: connectHandle,
        webhookUrl: connectWebhook.trim() || undefined,
      });
      closeConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const disconnect = async (key: string) => {
    if (!token) return;
    setBusy(`disconnect-${key}`); setError('');
    try {
      await disconnectChannel({ token, platform: key });
      if (connectKey === key) closeConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  // ── Instagram (Meta Graph API) handlers ──────────────────────────────────
  const copyRedirect = async () => {
    if (!igStatus?.redirectUri) return;
    try {
      await navigator.clipboard.writeText(igStatus.redirectUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const saveIgApp = async () => {
    if (!token) return;
    if (!metaAppId.trim() || !metaAppSecret.trim()) { setError('Enter the Meta App ID and Secret.'); return; }
    setBusy('ig-save'); setError('');
    try {
      await saveMetaApp({ token, appId: metaAppId.trim(), appSecret: metaAppSecret.trim() });
      setMetaAppSecret('');
      closeConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const connectInstagram = async () => {
    if (!token) return;
    setBusy('ig-connect'); setError('');
    try {
      const res = await igConnectUrl({ token });
      if (res.url) { window.location.href = res.url; return; }
      setError(res.error || 'Could not start Instagram authorization.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const disconnectInstagram = async () => {
    if (!token) return;
    setBusy('ig-disconnect'); setError('');
    try {
      await igDisconnect({ token });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const publishToInstagram = async (postId: Id<'socialPosts'>) => {
    if (!token) return;
    setBusy(`ig-publish-${postId}`); setError(''); setNotice('');
    try {
      const res = await igPublishNow({ token, postId });
      if (res.ok) {
        setNotice(res.permalink ? `Published to Instagram — ${res.permalink}` : 'Published to Instagram.');
      } else {
        setError(res.error || 'Instagram publish failed.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy('');
    }
  };

  const startEdit = (p: Post) => {
    setForm({
      postId: p.id,
      content: p.content,
      platforms: [...p.platforms],
      mediaUrl: p.mediaUrl ?? '',
      when: toLocalInput(p.scheduledAt),
    });
    setError('');
    setComposing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const overLimit = form.content.length > CHAR_LIMIT;

  // Progressive disclosure: only show connected channels (plus the one being
  // connected right now); everything else lives behind "Add connector".
  const isChannelConnected = (key: string) =>
    key === 'instagram' ? Boolean(igStatus?.connected) : Boolean(connByKey[key]?.connected);
  const visibleChannels = CHANNELS.filter((c) => isChannelConnected(c.key) || connectKey === c.key);
  const addableChannels = CHANNELS.filter((c) => !isChannelConnected(c.key) && connectKey !== c.key);
  const openChannel = (key: string) => {
    if (key === 'instagram') { openConnect('instagram'); setMetaAppId(''); setMetaAppSecret(''); }
    else openConnect(key);
  };

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Social</h1>
          <p className="admin-page-copy">Plan, schedule and track posts across every channel — native to the workspace.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={toggleCompose} className="admin-primary-button">
            <Plus className="w-4 h-4" /> New post
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent-2/30 bg-accent-2/10 px-4 py-3 text-sm text-white/85">
          <AlertTriangle className="w-4 h-4 text-accent-2 shrink-0" /> {error}
        </div>
      )}

      {notice && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-white/85">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" /> {notice}
        </div>
      )}

      <div className="admin-panel mt-6 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-white/70">Connected channels</h2>
            <p className="mt-1 text-xs text-white/38">
              Instagram publishes through the Meta Graph API; other channels auto-post via an n8n webhook.
            </p>
          </div>
          <AddMenu
            label="Add connector"
            variant="secondary"
            align="left"
            options={addableChannels.map((c) => ({ key: c.key, label: c.name, icon: c.icon }))}
            onPick={openChannel}
            emptyText="All channels added."
          />
        </div>

        {visibleChannels.length === 0 ? (
          <div className="mt-4 rounded-[var(--admin-radius-card)] border border-dashed border-white/12 px-4 py-8 text-center">
            <p className="text-sm text-white/55">No channels connected yet.</p>
            <p className="mt-1 text-xs text-white/38">Use “Add connector” to link Instagram, Facebook, X and more.</p>
          </div>
        ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleChannels.map(({ name, key, icon: Icon }) => {
            // Instagram is a real Meta Graph API connection — its own card.
            if (key === 'instagram') {
              return (
                <InstagramCard
                  key={key}
                  Icon={Icon}
                  status={igStatus}
                  canSetup={canSetupIg}
                  open={connectKey === 'instagram'}
                  onOpen={() => { openConnect('instagram'); setMetaAppId(''); setMetaAppSecret(''); }}
                  onClose={closeConnect}
                  busy={busy}
                  metaAppId={metaAppId}
                  metaAppSecret={metaAppSecret}
                  setMetaAppId={setMetaAppId}
                  setMetaAppSecret={setMetaAppSecret}
                  copied={copied}
                  onCopyRedirect={() => void copyRedirect()}
                  onSaveApp={() => void saveIgApp()}
                  onConnect={() => void connectInstagram()}
                  onDisconnect={() => void disconnectInstagram()}
                />
              );
            }
            const conn = connByKey[key];
            const isConnected = Boolean(conn?.connected);
            const formOpen = connectKey === key;
            return (
              <div key={key} className="admin-card flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-white/85">{name}</span>
                      {isConnected && conn?.autoPost && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-2/20 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-accent-2">
                          <Zap className="h-2.5 w-2.5" /> auto-post on
                        </span>
                      )}
                    </div>
                    {isConnected ? (
                      <p className="mt-0.5 truncate text-xs text-accent">Connected @{conn?.handle}</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-white/38">Not connected</p>
                    )}
                  </div>
                  {isConnected ? (
                    <button
                      onClick={() => void disconnect(key)}
                      disabled={busy !== ''}
                      className="admin-secondary-button shrink-0"
                    >
                      {busy === `disconnect-${key}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />} Disconnect
                    </button>
                  ) : !formOpen ? (
                    <button
                      onClick={() => openConnect(key)}
                      disabled={busy !== ''}
                      className="admin-secondary-button shrink-0"
                    >
                      <Link2 className="w-4 h-4" /> Connect
                    </button>
                  ) : (
                    <button
                      onClick={closeConnect}
                      disabled={busy !== ''}
                      className="admin-secondary-button shrink-0"
                      aria-label="Cancel"
                    >
                      <XIcon className="w-4 h-4" /> Cancel
                    </button>
                  )}
                </div>
                {formOpen && !isConnected && (
                  <div className="space-y-2 border-t border-white/8 pt-3">
                    <input
                      value={connectHandle}
                      onChange={(e) => setConnectHandle(e.target.value)}
                      placeholder="Handle (e.g. ehikings)"
                      className="admin-input"
                    />
                    <input
                      value={connectWebhook}
                      onChange={(e) => setConnectWebhook(e.target.value)}
                      placeholder="Auto-post webhook (n8n) — optional"
                      className="admin-input"
                    />
                    <button
                      onClick={() => void submitConnect(key)}
                      disabled={busy !== ''}
                      className="admin-primary-button w-full"
                    >
                      {busy === `connect-${key}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Save channel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat icon={CalendarClock} value={counts.scheduled} label="Scheduled" />
        <Stat icon={PenLine} value={counts.draft} label="Drafts" />
        <Stat icon={CheckCircle2} value={counts.published} label="Published" />
        <Stat icon={XCircle} value={counts.cancelled} label="Cancelled" />
      </div>

      {composing && (
        <div className="admin-panel mt-5 space-y-3 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">{form.postId ? 'Edit post' : 'Compose post'}</h2>
            <span className={`text-xs tnum ${overLimit ? 'text-accent-2' : 'text-white/38'}`}>
              {form.content.length}/{CHAR_LIMIT}
            </span>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="What's going out?"
            rows={4}
            className="admin-input resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((name) => {
              const on = form.platforms.includes(name);
              const isConnected = isChannelConnected(KEY_BY_NAME[name]);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => togglePlatform(name)}
                  title={isConnected ? 'Channel connected' : 'Channel not connected'}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    on ? 'border-accent bg-accent/10 text-accent' : 'border-white/15 text-white/55 hover:border-white/30 hover:text-white/75'
                  }`}
                >
                  {isConnected && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden="true" />
                  )}
                  {name}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="Media URL (optional)"
              className="admin-input"
            />
            <input
              type="datetime-local"
              value={form.when}
              onChange={(e) => setForm({ ...form, when: e.target.value })}
              className="admin-input"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void submit('scheduled')} disabled={busy !== ''} className="admin-primary-button">
              {busy === 'scheduled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Schedule
            </button>
            <button onClick={() => void submit('draft')} disabled={busy !== ''} className="admin-secondary-button">
              {busy === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />} Save draft
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="admin-card mt-8 p-5 text-sm text-white/45">
          Nothing planned yet — compose the first post and schedule it.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {days.map((day) => (
            <div key={day.key}>
              <h2 className="text-sm font-medium text-white/70">{day.label}</h2>
              <div className="mt-3 space-y-2">
                {day.posts.map((p) => (
                  <div key={p.id} className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="w-14 shrink-0 pt-0.5 text-sm text-white/70 tnum">{timeLabel(p.scheduledAt)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.platforms.map((name) => (
                          <span key={name} className="rounded-full border border-white/12 px-2 py-0.5 text-[0.65rem] text-white/55">
                            {name}
                          </span>
                        ))}
                        <span className={`rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${STATUS_STYLE[p.status]}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-white/85 line-clamp-3 whitespace-pre-line">{p.content}</p>
                      {p.mediaUrl && (
                        <a
                          href={p.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-accent/80 hover:text-accent"
                        >
                          <ImageIcon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.mediaUrl}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      {p.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => void changeStatus(p.id, 'published')}
                            disabled={busy !== ''}
                            className="admin-primary-button"
                          >
                            {busy === `published-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Mark published
                          </button>
                          <button
                            onClick={() => void changeStatus(p.id, 'cancelled')}
                            disabled={busy !== ''}
                            className="admin-secondary-button"
                          >
                            {busy === `cancelled-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel
                          </button>
                        </>
                      )}
                      {p.status === 'draft' && (
                        <button
                          onClick={() => void changeStatus(p.id, 'scheduled')}
                          disabled={busy !== ''}
                          className="admin-primary-button"
                        >
                          {busy === `scheduled-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />} Schedule now
                        </button>
                      )}
                      {p.platforms.includes('Instagram') && igStatus?.connected && p.status !== 'published' && (
                        <button
                          onClick={() => void publishToInstagram(p.id)}
                          disabled={busy !== '' || !p.mediaUrl}
                          title={p.mediaUrl ? 'Publish this post to Instagram now' : 'Add an image URL to publish to Instagram'}
                          className="admin-primary-button"
                        >
                          {busy === `ig-publish-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />} Publish to Instagram
                        </button>
                      )}
                      {p.status !== 'published' && (
                        <button onClick={() => startEdit(p)} disabled={busy !== ''} className="admin-secondary-button">
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Instagram (Meta Graph API) card — real OAuth connection, not a handle field.
type IgStatus = {
  configured: boolean;
  appIdSet: boolean;
  redirectUri: string;
  connected: boolean;
  igHandle?: string;
};

function InstagramCard({
  Icon, status, canSetup, open, onOpen, onClose, busy,
  metaAppId, metaAppSecret, setMetaAppId, setMetaAppSecret,
  copied, onCopyRedirect, onSaveApp, onConnect, onDisconnect,
}: {
  Icon: typeof Instagram;
  status: IgStatus | undefined;
  canSetup: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  busy: string;
  metaAppId: string;
  metaAppSecret: string;
  setMetaAppId: (v: string) => void;
  setMetaAppSecret: (v: string) => void;
  copied: boolean;
  onCopyRedirect: () => void;
  onSaveApp: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const configured = Boolean(status?.configured);
  const connected = Boolean(status?.connected);
  const showSetupPanel = open && !configured;

  return (
    <div className="admin-card flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium text-white/85">Instagram</span>
            {connected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-2/20 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-accent-2">
                <Zap className="h-2.5 w-2.5" /> graph api
              </span>
            )}
          </div>
          {connected ? (
            <p className="mt-0.5 truncate text-xs text-accent">Connected @{status?.igHandle}</p>
          ) : configured ? (
            <p className="mt-0.5 text-xs text-white/38">Authorized app — not connected</p>
          ) : (
            <p className="mt-0.5 text-xs text-white/38">Not connected</p>
          )}
        </div>
        {status === undefined ? (
          <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-white/40" />
        ) : connected ? (
          <button onClick={onDisconnect} disabled={busy !== ''} className="admin-secondary-button shrink-0">
            {busy === 'ig-disconnect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />} Disconnect
          </button>
        ) : configured ? (
          <button onClick={onConnect} disabled={busy !== ''} className="admin-primary-button shrink-0">
            {busy === 'ig-connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Connect Instagram
          </button>
        ) : !open ? (
          canSetup ? (
            <button onClick={onOpen} disabled={busy !== ''} className="admin-secondary-button shrink-0">
              <Link2 className="w-4 h-4" /> Set up
            </button>
          ) : null
        ) : (
          <button onClick={onClose} disabled={busy !== ''} className="admin-secondary-button shrink-0" aria-label="Cancel">
            <XIcon className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {connected && <p className="text-xs text-white/45">Ready to publish.</p>}

      {showSetupPanel && canSetup && (
        <div className="admin-panel space-y-3 p-3">
          <h3 className="text-sm font-medium text-white/70">Set up Instagram publishing</h3>
          <p className="text-xs text-white/50">
            Instagram (like every scheduler) needs a one-time Meta app authorization. Create a free app at
            {' '}developers.facebook.com → add the &lsquo;Instagram Graph API&rsquo; product → paste its App ID &amp;
            Secret below. Add this redirect URL to the app&rsquo;s Valid OAuth Redirect URIs:
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-[var(--admin-radius-control)] border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white/70">
              {status?.redirectUri}
            </code>
            <button onClick={onCopyRedirect} className="admin-secondary-button shrink-0" aria-label="Copy redirect URL">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input
            value={metaAppId}
            onChange={(e) => setMetaAppId(e.target.value)}
            placeholder="App ID"
            className="admin-input"
          />
          <input
            type="password"
            value={metaAppSecret}
            onChange={(e) => setMetaAppSecret(e.target.value)}
            placeholder="App Secret"
            className="admin-input"
          />
          <button onClick={onSaveApp} disabled={busy !== ''} className="admin-primary-button w-full">
            {busy === 'ig-save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Save &amp; continue
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof CalendarClock; value: number; label: string }) {
  return (
    <div className="admin-card p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-4 w-4" /></div>
      <div className="font-heading text-2xl font-light tnum text-white">{value}</div>
      <div className="mt-0.5 text-[0.7rem] text-white/45">{label}</div>
    </div>
  );
}
