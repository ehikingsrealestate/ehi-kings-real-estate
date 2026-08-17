import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Hash, LifeBuoy, Link2, Loader2, Lock, Mail, MessagesSquare, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Phone, Plus, Search, Send, UserPlus } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { ESTATES } from '../data/site';
import { estateMedia } from '../data/propertyMedia';
import { useAdmin, roleBadgeClass, type Role } from './store';

type InboxStatus = 'open' | 'pending' | 'resolved';

const INBOX_STATUSES: InboxStatus[] = ['open', 'pending', 'resolved'];

function statusPillClass(status: InboxStatus) {
  if (status === 'open') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300';
  if (status === 'pending') return 'border-amber-400/40 bg-amber-400/10 text-amber-300';
  return 'border-white/20 bg-white/[0.04] text-white/50';
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString();
}

const readFlag = (key: string, fallback: boolean) => {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'open'; } catch { return fallback; }
};

export default function TeamChat() {
  const { token, me, can } = useAdmin();
  const [mode, setMode] = useState<'team' | 'customers'>('team');

  // Collapsible sidebars (desktop) — persisted, same idea as the main sidebar.
  const [listOpen, setListOpen] = useState(() => readFlag('ek_tc_list', true));
  const [contextOpen, setContextOpen] = useState(() => readFlag('ek_tc_context', true));
  const toggleList = () => setListOpen((v) => { const n = !v; try { localStorage.setItem('ek_tc_list', n ? 'open' : 'closed'); } catch { /* ignore */ } return n; });
  const toggleContext = () => setContextOpen((v) => { const n = !v; try { localStorage.setItem('ek_tc_context', n ? 'open' : 'closed'); } catch { /* ignore */ } return n; });

  // ── Team chat state (unchanged) ─────────────────────────────────────────
  const channels = useQuery(api.chat.listChannels, token ? { token } : 'skip') ?? [];
  const users = useQuery(api.users.list, token ? { token } : 'skip') ?? [];
  const createChannel = useMutation(api.chat.createChannel);
  const sendMessage = useMutation(api.chat.sendMessage);
  const [activeId, setActiveId] = useState<Id<'channels'> | null>(null);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', project: '' });
  const [busy, setBusy] = useState(false);

  // ── Customer inbox state ────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<InboxStatus | null>('open');
  const [selectedConvoId, setSelectedConvoId] = useState<Id<'supportConversations'> | null>(null);
  const [replyText, setReplyText] = useState('');
  const [notePrivate, setNotePrivate] = useState(false);
  const [replyBusy, setReplyBusy] = useState(false);
  const [crmBusy, setCrmBusy] = useState(false);
  const [crmNotice, setCrmNotice] = useState<string | null>(null);

  const inboxCounts = useQuery(api.inbox.counts, token ? { token } : 'skip');
  const conversations =
    useQuery(
      api.inbox.listConversations,
      token && mode === 'customers' ? (statusFilter ? { token, status: statusFilter } : { token }) : 'skip',
    ) ?? [];
  const customerThread = useQuery(
    api.inbox.getThread,
    token && mode === 'customers' && selectedConvoId ? { token, conversationId: selectedConvoId } : 'skip',
  );
  const markRead = useMutation(api.inbox.markRead);
  const sendReply = useMutation(api.inbox.sendReply);
  const updateConversation = useMutation(api.inbox.updateConversation);
  const toLead = useMutation(api.inbox.toLead);

  // Auto-select the first channel only once on load; do not re-select after the
  // mobile back button deselects (which would trap the user in the detail pane).
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current) return;
    if (!activeId && channels.length) {
      setActiveId(channels[0]._id);
      didAutoSelect.current = true;
    }
  }, [channels, activeId]);

  useEffect(() => {
    if (!crmNotice) return;
    const t = setTimeout(() => setCrmNotice(null), 3000);
    return () => clearTimeout(t);
  }, [crmNotice]);

  const active = channels.find((c) => c._id === activeId) ?? null;
  const messages = useQuery(api.chat.listMessages, token && active ? { token, channelId: active._id } : 'skip') ?? [];
  const userById = new Map(users.map((u) => [u.id, u]));
  const filteredChannels = channels.filter((c) => `${c.name} ${c.project}`.toLowerCase().includes(query.toLowerCase()));
  const visibleUsers = users.filter((u) => u.active && u.id !== me?.id).slice(0, 8);
  const sharedEstates = useMemo(() => ESTATES.slice(0, 4), []);
  const conversation = customerThread?.conversation ?? null;
  // Mobile master/detail: is a detail pane selected for the current mode?
  const detailActive = mode === 'team' ? Boolean(active) : Boolean(selectedConvoId);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!token || !active || !text.trim()) return;
    setBusy(true);
    try {
      await sendMessage({ token, channelId: active._id, text: text.trim() });
      setText('');
    } finally {
      setBusy(false);
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !newGroup.name.trim()) return;
    const id = await createChannel({ token, name: newGroup.name.trim(), project: newGroup.project.trim() || 'Project' });
    setNewGroup({ name: '', project: '' });
    setCreating(false);
    setActiveId(id);
  };

  const startDirect = async (userId: Id<'users'>, name: string) => {
    if (!token || !me || !can('create_channels')) return;
    const existing = channels.find((c) => c.memberIds.includes(userId) && c.memberIds.includes(me.id as Id<'users'>) && c.name.startsWith('DM:'));
    if (existing) {
      setActiveId(existing._id);
      return;
    }
    const id = await createChannel({ token, name: `DM: ${name}`, project: 'Personal message', memberIds: [userId, me.id as Id<'users'>] });
    setActiveId(id);
  };

  const openConversation = (id: Id<'supportConversations'>) => {
    setSelectedConvoId(id);
    setCrmNotice(null);
    if (token) void markRead({ token, conversationId: id });
  };

  // Mobile master/detail: deselect the current detail to return to the list.
  const backToList = () => {
    if (mode === 'team') setActiveId(null);
    else setSelectedConvoId(null);
  };

  const sendCustomerReply = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!token || !selectedConvoId || !replyText.trim()) return;
    setReplyBusy(true);
    try {
      await sendReply({ token, conversationId: selectedConvoId, body: replyText.trim(), private: notePrivate });
      setReplyText('');
    } finally {
      setReplyBusy(false);
    }
  };

  const setConvoStatus = async (status: InboxStatus) => {
    if (!token || !selectedConvoId) return;
    await updateConversation({ token, conversationId: selectedConvoId, status });
  };

  const assignConvo = async (value: string) => {
    if (!token || !selectedConvoId) return;
    await updateConversation({ token, conversationId: selectedConvoId, assignedToId: value ? (value as Id<'users'>) : null });
  };

  const addToCrm = async () => {
    if (!token || !selectedConvoId || crmBusy) return;
    setCrmBusy(true);
    try {
      await toLead({ token, conversationId: selectedConvoId });
      setCrmNotice('Added to CRM');
    } finally {
      setCrmBusy(false);
    }
  };

  const assignedAgent = conversation?.assignedToId ? userById.get(conversation.assignedToId) : undefined;

  return (
    <div className="grid h-[100dvh] min-h-0 bg-bg text-white md:grid-cols-[auto_minmax(0,1fr)] xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <aside className={`${detailActive ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-rule bg-surface/35 transition-[width] duration-200 ${listOpen ? 'md:w-80' : 'md:w-14'}`}>
        {!listOpen && (
          <div className="hidden md:flex flex-col items-center gap-3 py-4">
            <button onClick={toggleList} className="admin-icon-button" aria-label="Expand channel list" title="Expand">
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <MessagesSquare className="h-4 w-4 text-white/25" />
          </div>
        )}
        <div className={`flex min-h-0 flex-1 flex-col ${listOpen ? '' : 'md:hidden'}`}>
        <header className="border-b border-rule px-4 py-3">
          <div className="mb-3 flex rounded-full border border-rule bg-white/[0.03] p-0.5 text-xs">
            <button
              onClick={() => setMode('team')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${mode === 'team' ? 'bg-accent text-accent-ink' : 'text-white/60 hover:text-white'}`}
            >
              <MessagesSquare className="h-3.5 w-3.5" /> Team
            </button>
            <button
              onClick={() => setMode('customers')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${mode === 'customers' ? 'bg-accent text-accent-ink' : 'text-white/60 hover:text-white'}`}
            >
              <LifeBuoy className="h-3.5 w-3.5" /> Customers
              {mode !== 'customers' && (inboxCounts?.unread ?? 0) > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.55rem] font-medium text-accent-ink">{inboxCounts?.unread}</span>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-base font-medium">{mode === 'team' ? 'Team chat' : 'Customer inbox'}</h1>
              <p className="truncate text-xs text-muted">
                {mode === 'team'
                  ? `${channels.length} rooms`
                  : inboxCounts
                    ? `${inboxCounts.open} open · ${inboxCounts.pending} pending · ${inboxCounts.resolved} resolved`
                    : 'Loading conversations'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mode === 'team' && can('create_channels') && (
                <button onClick={() => setCreating((v) => !v)} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-accent px-3 py-2 text-xs text-accent">
                  <Plus className="h-4 w-4" /> New
                </button>
              )}
              <button onClick={toggleList} className="admin-icon-button hidden md:inline-flex" aria-label="Collapse channel list" title="Collapse">
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {mode === 'team' ? (
          <>
            <div className="border-b border-rule p-3">
              <label className="flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-3 py-2 text-muted">
                <Search className="h-4 w-4" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rooms" className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none" />
              </label>
            </div>

            {creating && (
              <form onSubmit={create} className="border-b border-rule p-3">
                <input value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Channel name" className="mb-2 w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none" />
                <input value={newGroup.project} onChange={(e) => setNewGroup({ ...newGroup, project: e.target.value })} placeholder="Project or estate" className="mb-2 w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none" />
                <button className="w-full rounded-[var(--admin-radius-control)] border border-accent bg-accent px-3 py-2 text-xs font-medium text-accent-ink">Create channel</button>
              </form>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
              <ChannelGroup title="Channels">
                {filteredChannels.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => setActiveId(g._id)}
                    className={`w-full rounded-[var(--admin-radius-control)] px-3 py-3 text-left transition-colors ${g._id === active?._id ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2 text-sm"><Hash className="h-3.5 w-3.5" /> {g.name}</span>
                    <span className="mt-0.5 block truncate pl-5 text-[0.65rem] text-white/35">{g.project}</span>
                  </button>
                ))}
              </ChannelGroup>

              <ChannelGroup title="Direct messages">
                {visibleUsers.map((u) => (
                  <button
                    key={u.id}
                    disabled={!can('create_channels')}
                    onClick={() => startDirect(u.id as Id<'users'>, u.name)}
                    className="w-full rounded-[var(--admin-radius-control)] px-3 py-3 text-left text-white/60 transition-colors hover:bg-white/[0.03] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="flex items-center gap-2">
                      <Avatar name={u.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{u.name}</span>
                        <span className="text-[0.65rem] text-white/35">{u.role}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </ChannelGroup>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-rule p-3">
              <div className="flex gap-1.5">
                {INBOX_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter((cur) => (cur === s ? null : s))}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-2 py-1.5 text-[0.68rem] capitalize transition-colors ${statusFilter === s ? 'border-accent bg-accent/10 text-accent' : 'border-rule text-white/55 hover:text-white'}`}
                  >
                    {s}
                    <span className={statusFilter === s ? 'text-accent/70' : 'text-white/35'}>{inboxCounts ? inboxCounts[s] : '—'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              {conversations.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted">No {statusFilter ?? ''} conversations yet.</p>
              )}
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  className={`w-full rounded-[var(--admin-radius-control)] px-3 py-3 text-left transition-colors ${c.id === selectedConvoId ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.03] hover:text-white'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm text-white/85">{c.contactName}</span>
                    <span className="shrink-0 text-[0.62rem] text-white/35">{timeAgo(c.lastMessageAt)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[0.68rem] text-white/45">{c.lastMessagePreview}</span>
                    {c.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[0.6rem] font-medium text-accent-ink">{c.unread}</span>
                    )}
                  </span>
                  <span className="mt-1.5 inline-block rounded-full border border-rule px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-white/35">{c.channel}</span>
                </button>
              ))}
            </div>
          </>
        )}
        </div>
      </aside>

      <main className={`${detailActive ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-col`}>
        {mode === 'team' ? (
          <>
            <header className="flex min-h-16 items-center justify-between gap-3 border-b border-rule px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={backToList}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--admin-radius-control)] border border-rule text-white/70 transition-colors hover:text-white md:hidden"
                  aria-label="Back to channels"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Hash className="h-4 w-4 text-accent" />
                    <span className="truncate">{active?.name ?? 'Select a channel'}</span>
                  </div>
                  <p className="truncate text-xs text-muted">{active?.project ?? 'Choose a room to start chatting'}</p>
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-5">
                {messages.length === 0 && <div className="text-sm text-muted">No messages yet. Start the conversation.</div>}
                {messages.map((m) => {
                  const author = userById.get(m.userId);
                  const mine = m.userId === me?.id;
                  return (
                    <div key={m._id} className={`flex gap-3 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && <Avatar name={author?.name ?? 'Unknown'} />}
                      <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs text-white/75">{author?.name ?? 'Unknown'}</span>
                          {author && <span className={`text-[0.52rem] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full ${roleBadgeClass(author.role as Role)}`}>{author.role}</span>}
                        </div>
                        <div className={`rounded-[var(--admin-radius-card)] border px-4 py-3 text-sm leading-relaxed ${mine ? 'border-accent bg-accent text-accent-ink' : 'border-rule bg-transparent text-white/85'}`}>
                          {m.text}
                        </div>
                      </div>
                      {mine && <Avatar name={me?.name ?? 'Me'} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={send} className="border-t border-rule p-3 md:p-4">
              <div className="mx-auto flex max-w-4xl items-center gap-3">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder={active ? `Write in #${active.name}` : 'Select a channel'} className="min-w-0 flex-1 rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none" />
                <button disabled={!text.trim() || !active || busy} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--admin-radius-control)] border border-accent bg-accent text-accent-ink disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <header className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-3 md:px-6">
              <button
                type="button"
                onClick={backToList}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--admin-radius-control)] border border-rule text-white/70 transition-colors hover:text-white md:hidden"
                aria-label="Back to inbox"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {conversation ? (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{conversation.contactName}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] ${statusPillClass(conversation.status)}`}>{conversation.status}</span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {[conversation.contactEmail, conversation.contactPhone].filter(Boolean).join(' · ') || `${conversation.channel} conversation`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {INBOX_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => void setConvoStatus(s)}
                        className={`rounded-full border px-2.5 py-1 text-[0.62rem] capitalize transition-colors ${conversation.status === s ? statusPillClass(s) : 'border-rule text-white/50 hover:text-white'}`}
                      >
                        {s}
                      </button>
                    ))}
                    <select
                      value={conversation.assignedToId ?? ''}
                      onChange={(e) => void assignConvo(e.target.value)}
                      className="rounded-[var(--admin-radius-control)] border border-rule bg-bg px-2 py-1.5 text-[0.68rem] text-white/75 focus:border-accent focus:outline-none"
                      aria-label="Assign conversation"
                    >
                      <option value="">Unassigned</option>
                      {users.filter((u) => u.active).map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => void addToCrm()}
                      disabled={crmBusy}
                      className="inline-flex items-center gap-1.5 rounded-[var(--admin-radius-control)] border border-accent px-2.5 py-1.5 text-[0.68rem] text-accent transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {crmBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                      Add to CRM
                    </button>
                    {crmNotice && (
                      <span className="inline-flex items-center gap-1 text-[0.68rem] text-emerald-300">
                        <Check className="h-3.5 w-3.5" /> {crmNotice}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LifeBuoy className="h-4 w-4 text-accent" />
                    <span>Select a conversation</span>
                  </div>
                  <p className="truncate text-xs text-muted">Pick a customer thread from the inbox to read and reply</p>
                </div>
              )}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
              <div className="mx-auto flex max-w-4xl flex-col gap-5">
                {!selectedConvoId && <div className="text-sm text-muted">No conversation selected. Choose one from the list on the left.</div>}
                {selectedConvoId && !customerThread && (
                  <div className="flex items-center gap-2 text-sm text-muted"><Loader2 className="w-4 h-4 animate-spin" /> Loading thread</div>
                )}
                {customerThread?.messages.length === 0 && <div className="text-sm text-muted">No messages in this conversation yet.</div>}
                {customerThread?.messages.map((m) => {
                  const incoming = m.direction === 'incoming';
                  return (
                    <div key={m.id} className={`flex gap-3 ${incoming ? 'justify-start' : 'justify-end'}`}>
                      {incoming && <Avatar name={m.author} />}
                      <div className={`flex max-w-[78%] flex-col ${incoming ? 'items-start' : 'items-end'}`}>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-xs text-white/75">{m.author}</span>
                          {m.private && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 px-1.5 py-0.5 text-[0.52rem] uppercase tracking-[0.1em] text-amber-300">
                              <Lock className="h-2.5 w-2.5" /> Private note
                            </span>
                          )}
                          <span className="text-[0.6rem] text-white/35">{timeAgo(m.at)}</span>
                        </div>
                        <div
                          className={`rounded-[var(--admin-radius-card)] border px-4 py-3 text-sm leading-relaxed ${
                            m.private
                              ? 'border-amber-400/60 bg-amber-400/[0.08] text-amber-100'
                              : incoming
                                ? 'border-rule bg-transparent text-white/85'
                                : 'border-accent bg-accent text-accent-ink'
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                      {!incoming && <Avatar name={m.author} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={sendCustomerReply} className="border-t border-rule p-3 md:p-4">
              <div className="mx-auto max-w-4xl">
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNotePrivate(false)}
                    className={`rounded-full border px-3 py-1 text-[0.68rem] transition-colors ${!notePrivate ? 'border-accent bg-accent text-accent-ink' : 'border-rule text-white/55 hover:text-white'}`}
                  >
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotePrivate(true)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[0.68rem] transition-colors ${notePrivate ? 'border-amber-400/70 bg-amber-400/15 text-amber-200' : 'border-rule text-white/55 hover:text-white'}`}
                  >
                    <Lock className="h-3 w-3" /> Private note
                  </button>
                  {notePrivate && <span className="text-[0.62rem] text-amber-300/70">Only visible to the team</span>}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      !conversation
                        ? 'Select a conversation'
                        : notePrivate
                          ? 'Write a private note for the team'
                          : `Reply to ${conversation.contactName}`
                    }
                    className={`min-w-0 flex-1 rounded-[var(--admin-radius-control)] border bg-transparent px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none ${notePrivate ? 'border-amber-400/60 focus:border-amber-300' : 'border-rule focus:border-accent'}`}
                  />
                  <button
                    disabled={!replyText.trim() || !selectedConvoId || replyBusy}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--admin-radius-control)] border border-accent bg-accent text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={notePrivate ? 'Save private note' : 'Send reply'}
                  >
                    {replyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </main>

      <aside className={`hidden min-h-0 flex-col border-l border-rule bg-surface/35 transition-[width] duration-200 xl:flex ${contextOpen ? 'xl:w-72' : 'xl:w-12'}`}>
        {!contextOpen ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <button onClick={toggleContext} className="admin-icon-button" aria-label="Show shared context" title="Show context">
              <PanelRightOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
        <>
        <header className="flex min-h-16 items-center justify-between border-b border-rule px-5 text-sm">
          Shared context
          <button onClick={toggleContext} className="admin-icon-button" aria-label="Collapse shared context" title="Collapse">
            <PanelRightClose className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {mode === 'customers' ? (
            <Panel title="Contact details">
              {conversation ? (
                <div className="rounded-[var(--admin-radius-card)] border border-rule p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Avatar name={conversation.contactName} />
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-white/85">{conversation.contactName}</span>
                      <span className="text-[0.62rem] uppercase tracking-[0.12em] text-white/38">{conversation.channel} channel</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-xs text-white/60">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-white/38" />
                      <span className="min-w-0 truncate">{conversation.contactEmail ?? 'No email provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-white/38" />
                      <span className="min-w-0 truncate">{conversation.contactPhone ?? 'No phone provided'}</span>
                    </div>
                    {conversation.subject && (
                      <div className="text-white/50">Subject: <span className="text-white/70">{conversation.subject}</span></div>
                    )}
                    <div className="text-white/50">Started {new Date(conversation.createdAt).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">Status</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] ${statusPillClass(conversation.status)}`}>{conversation.status}</span>
                    </div>
                    <div className="text-white/50">Assigned to <span className="text-white/70">{assignedAgent?.name ?? 'Unassigned'}</span></div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">Select a conversation to see contact details.</p>
              )}
            </Panel>
          ) : (
            <Panel title="Properties">
              <div className="grid grid-cols-2 gap-2">
                {sharedEstates.map((estate) => (
                  <Link key={estate.slug} to={`/estates/${estate.slug}`} className="group">
                    <img src={estateMedia(estate)} alt={estate.name} className="aspect-square rounded-[var(--admin-radius-control)] object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                    <span className="mt-2 block truncate text-[0.68rem] text-white/55">{estate.name}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}
          <Panel title="Links">
            {[
              ['Ehi-Kings website', '/'],
              ['Zoho Mail', '/admin/mail'],
              ['Property catalog', '/admin/listings'],
            ].map(([label, to]) => (
              <Link key={label} to={to} className="flex items-center gap-3 rounded-[var(--admin-radius-control)] px-3 py-3 text-xs text-white/75 transition-colors hover:bg-white/[0.04] hover:text-accent">
                <Link2 className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </Panel>
        </div>
        </>
        )}
      </aside>
    </div>
  );
}

function ChannelGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-2 flex items-center justify-between px-3 text-[0.65rem] uppercase tracking-[0.16em] text-white/35">
        {title}
        <ChevronDown className="h-3.5 w-3.5" />
      </div>
      <div>{children}</div>
    </section>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[0.62rem] font-medium text-white/70">
      {name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
    </span>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs text-white/70">{title}</h2>
      {children}
    </section>
  );
}
