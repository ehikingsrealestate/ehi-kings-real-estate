import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  Terminal,
  Send,
  Loader2,
  Bot,
  ExternalLink,
  Plus,
  Lock,
  History,
  Trash2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { ADMIN_AGENTS } from '../data/adminAgents';
import { useAdmin } from './store';

type Msg = { role: 'user' | 'model'; text: string };
type LineKind = 'cmd' | 'info' | 'ok' | 'err' | 'tool';
type Line = { kind: LineKind; text: string; at: number };
type ConvoId = Id<'conversations'>;

const env = import.meta.env as Record<string, string | undefined>;

const NVIDIA_PROVIDER = 'nvidia';
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';
const PORTFOLIO = 'Ehi-Kings Real Estate — Nigerian real estate & construction (Lagos, Epe, Benin City, Abuja).';
const KIND = 'picoclaw' as const;

const EXAMPLES = [
  'Draft a WhatsApp reply for a land enquiry',
  "Summarise today's priorities",
  'Write a listing caption for an Epe plot',
];

const stamp = (at: number) => {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const lineClass: Record<LineKind, string> = {
  cmd: 'text-white/90',
  info: 'text-white/45',
  ok: 'text-emerald-400',
  err: 'text-red-400',
  tool: 'text-amber-300',
};

export default function PicoClawConsole({ token }: { token: string | null }) {
  const { me } = useAdmin();
  const ask = useAction(api.assistant.ask);
  const start = useMutation(api.conversations.start);
  const append = useMutation(api.conversations.append);
  const removeConvo = useMutation(api.conversations.remove);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<ConvoId | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [showSkills, setShowSkills] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const termEndRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const sessions = useQuery(api.conversations.list, token ? { token, kind: KIND } : 'skip');
  const activeMessages = useQuery(
    api.conversations.messages,
    token && activeConversationId ? { token, conversationId: activeConversationId } : 'skip',
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);
  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines, busy]);

  const pushLines = (add: Line[]) => setLines((prev) => [...prev, ...add]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy || !token) return;
    const now = Date.now();
    const nextMessages: Msg[] = [...messages, { role: 'user', text }];
    setMessages(nextMessages);
    setInput('');
    const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    pushLines([
      { kind: 'cmd', text: `$ picoclaw agent -m "${truncated}"`, at: now },
      { kind: 'info', text: `→ routing to NVIDIA NIM · ${NVIDIA_MODEL}`, at: now },
      { kind: 'info', text: '→ tools: create_task, update_task_status, find_estate', at: now },
    ]);
    setBusy(true);

    // Ensure a persisted conversation exists, then store the user message.
    let convoId = activeConversationId;
    try {
      if (!convoId) {
        convoId = await start({ token, kind: KIND });
        setActiveConversationId(convoId);
      }
      await append({ token, conversationId: convoId, role: 'user', text });
    } catch {
      /* persistence is best-effort; keep the UI responsive */
    }

    try {
      const res = await ask({
        token,
        history: nextMessages.slice(-16),
        provider: NVIDIA_PROVIDER,
        model: NVIDIA_MODEL,
        portfolio: PORTFOLIO,
      });
      const at = Date.now();
      let reply: string;
      if (!res.configured) {
        reply = 'PicoClaw needs the NVIDIA key on the backend.';
        setMessages((m) => [...m, { role: 'model', text: reply }]);
        pushLines([{ kind: 'err', text: '✗ NVIDIA provider not configured on the backend', at }]);
      } else if (res.error) {
        reply = `I hit an error: ${res.error}`;
        setMessages((m) => [...m, { role: 'model', text: reply }]);
        pushLines([{ kind: 'err', text: `✗ ${res.error}`, at }]);
      } else {
        reply = res.reply ?? '';
        setMessages((m) => [...m, { role: 'model', text: reply }]);
        const toolLines: Line[] = (res.usedTools ?? []).map((t) => ({ kind: 'tool' as const, text: `⚙ ran ${t}`, at }));
        pushLines([{ kind: 'ok', text: '✓ response received', at }, ...toolLines]);
      }
      if (convoId) {
        try {
          await append({ token, conversationId: convoId, role: 'model', text: reply });
        } catch {
          /* ignore persistence failure */
        }
      }
    } catch (err) {
      const at = Date.now();
      const msg = err instanceof Error ? err.message : String(err);
      const reply = `Something went wrong: ${msg}`;
      setMessages((m) => [...m, { role: 'model', text: reply }]);
      pushLines([{ kind: 'err', text: `✗ ${msg}`, at }]);
      if (convoId) {
        try {
          await append({ token, conversationId: convoId, role: 'model', text: reply });
        } catch {
          /* ignore persistence failure */
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  // Loads a skill's prompt into the composer so the user can add specifics before sending.
  const useSkill = (agent: (typeof ADMIN_AGENTS)[number]) => {
    setShowSkills(false);
    const composed = `Use the "${agent.name}" skill.\n\n${agent.prompt}\n\nApply it to: `;
    setInput(composed);
    pushLines([{ kind: 'info', text: `→ loaded skill "${agent.name}" into composer`, at: Date.now() }]);
    requestAnimationFrame(() => {
      taRef.current?.focus();
      const ta = taRef.current;
      if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  };

  const newSession = () => {
    setActiveConversationId(null);
    setMessages([]);
    setLines([]);
    setInput('');
    setShowSessions(false);
  };

  const openSession = (id: ConvoId) => {
    if (busy || id === activeConversationId) {
      setShowSessions(false);
      return;
    }
    setActiveConversationId(id);
    setMessages([]);
    setLines([{ kind: 'info', text: 'loaded session', at: Date.now() }]);
    setInput('');
    setShowSessions(false);
  };

  const deleteSession = async (id: ConvoId) => {
    if (!token) return;
    try {
      await removeConvo({ token, conversationId: id });
    } catch {
      /* ignore */
    }
    if (id === activeConversationId) newSession();
  };

  // Hydrate the visible chat from stored history when a past session loads.
  useEffect(() => {
    if (!activeConversationId || !activeMessages) return;
    setMessages(activeMessages.map((m) => ({ role: m.role, text: m.text })));
  }, [activeConversationId, activeMessages]);

  const fullConsoleUrl = env.VITE_APP_ASSISTANT_URL;

  // Admin guard — PicoClaw can run shell and agent tools.
  if (me?.role !== 'Admin') {
    return (
      <div className="flex h-[calc(100dvh-4rem)] min-h-0 items-center justify-center bg-black px-6 text-white/85">
        <div className="max-w-sm rounded-2xl border border-red-500/30 bg-red-950/20 px-6 py-8 text-center shadow-[0_20px_60px_-24px_rgba(239,68,68,0.55)]">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/15 text-red-400 shadow-[0_0_28px_-6px_rgba(239,68,68,0.7)]">
            <Lock className="h-6 w-6" />
          </span>
          <h2 className="text-sm font-semibold text-white">Admins only</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            PicoClaw can run shell and agent tools, so it is restricted to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col bg-black text-white/85">
      {/* Header */}
      <header className="relative flex shrink-0 items-center justify-between gap-3 border-b border-red-500/30 bg-red-950/20 px-4 py-3 shadow-[0_8px_30px_-12px_rgba(239,68,68,0.45)]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-600 shadow-[0_0_18px_-2px_rgba(239,68,68,0.7)]">
            <Terminal className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">PicoClaw</h2>
            <p className="truncate text-xs text-white/45">AI assistant · NVIDIA Llama 3.3 70B</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.7rem] text-white/55 sm:inline-flex">
            <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'}`} />
            connected
          </span>

          {/* Skills dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSkills((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                showSkills
                  ? 'border-red-500/60 bg-red-500/10 text-red-200'
                  : 'border-red-500/30 text-red-300 hover:bg-red-500/10'
              }`}
              aria-haspopup="menu"
              aria-expanded={showSkills}
            >
              <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Skills</span>
              <span className="rounded-full bg-red-500/20 px-1.5 text-[0.65rem] text-red-200">{ADMIN_AGENTS.length}</span>
            </button>
            {showSkills && (
              <>
                <button
                  type="button"
                  aria-label="Close skills"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowSkills(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-red-500/30 bg-zinc-950 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                  <div className="border-b border-white/[0.06] px-3 py-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.18em] text-red-400">Skills</span>
                    <p className="mt-0.5 text-[0.65rem] text-white/40">
                      PicoClaw has these skills available — pick one to load its prompt into the composer.
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {ADMIN_AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => useSkill(agent)}
                        className="flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <agent.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/70" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs text-white/85">{agent.name}</span>
                          <span className="block truncate text-[0.65rem] text-white/35">{agent.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sessions dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSessions((s) => !s)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                showSessions
                  ? 'border-red-500/60 bg-red-500/10 text-red-200'
                  : 'border-red-500/30 text-red-300 hover:bg-red-500/10'
              }`}
              aria-haspopup="menu"
              aria-expanded={showSessions}
            >
              <History className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sessions</span>
              {sessions && sessions.length > 0 && (
                <span className="rounded-full bg-red-500/20 px-1.5 text-[0.65rem] text-red-200">{sessions.length}</span>
              )}
            </button>
            {showSessions && (
              <>
                <button
                  type="button"
                  aria-label="Close sessions"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowSessions(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-red-500/30 bg-zinc-950 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                    <span className="text-[0.65rem] uppercase tracking-[0.18em] text-red-400">Sessions</span>
                    <button
                      type="button"
                      onClick={newSession}
                      className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-[0.7rem] font-medium text-white transition-colors hover:bg-red-500"
                    >
                      <Plus className="h-3 w-3" /> New
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {!sessions ? (
                      <div className="px-3 py-3 text-xs text-white/40">Loading…</div>
                    ) : sessions.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-white/40">No past sessions yet.</div>
                    ) : (
                      sessions.map((s) => (
                        <div
                          key={s.id}
                          className={`group flex items-center gap-2 px-2 ${
                            s.id === activeConversationId ? 'bg-red-500/10' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => openSession(s.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-red-400/70" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs text-white/85">{s.title}</span>
                              {s.preview && <span className="block truncate text-[0.65rem] text-white/35">{s.preview}</span>}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSession(s.id)}
                            className="shrink-0 rounded-md p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-300"
                            aria-label="Delete session"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {fullConsoleUrl && (
            <a
              href={fullConsoleUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-md border border-red-500/30 px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 md:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open full console
            </a>
          )}
          <button
            type="button"
            onClick={newSession}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-500"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New session</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="min-h-0 flex-1 md:grid md:grid-cols-[1.4fr_1fr]">
        {/* CHAT pane */}
        <section className="flex min-h-0 flex-col border-b border-white/10 md:border-b-0 md:border-r md:border-red-500/20">
          <div className="shrink-0 border-b border-white/[0.06] px-4 py-2 text-[0.65rem] uppercase tracking-[0.18em] text-red-400">
            Chat
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {!token ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-white/45">
                Sign in to use PicoClaw
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-red-400 shadow-[0_0_28px_-6px_rgba(239,68,68,0.7)]">
                  <Bot className="h-7 w-7" />
                </span>
                <p className="max-w-xs text-sm text-white/60">
                  Ask PicoClaw anything — it runs on the NVIDIA model.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setInput(ex);
                        taRef.current?.focus();
                      }}
                      className="rounded-full border border-red-500/30 bg-red-500/[0.06] px-3 py-1.5 text-xs text-red-200 transition-colors hover:bg-red-500/15"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.role === 'user' ? (
                      <div className="max-w-[85%] whitespace-pre-line rounded-lg bg-red-600 px-3.5 py-2 text-sm leading-relaxed text-white">
                        {m.text}
                      </div>
                    ) : (
                      <div className="max-w-[85%] whitespace-pre-line rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm leading-relaxed text-white/85">
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-white/55">
                      <Loader2 className="h-4 w-4 animate-spin text-red-400" /> PicoClaw is thinking…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={onSubmit} className="shrink-0 border-t border-white/[0.06] p-3">
            <div className="relative flex items-end gap-2 rounded-xl border border-red-500/30 bg-white/[0.02] p-2 transition-colors focus-within:border-red-500/60">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={token ? 'Ask PicoClaw…' : 'Sign in to use PicoClaw'}
                rows={1}
                disabled={busy || !token}
                className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-1.5 font-sans text-sm leading-6 text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy || !token}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-opacity hover:bg-red-500 disabled:opacity-40"
                aria-label="Send message"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </section>

        {/* TERMINAL pane */}
        <section className="flex h-64 min-h-0 flex-col md:h-auto">
          <div className="flex shrink-0 items-center justify-between border-t border-red-500/40 bg-zinc-950 px-4 py-2 md:border-t-0">
            <span className="text-[0.65rem] uppercase tracking-[0.18em] text-red-400">Terminal</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-950 px-4 py-3 font-mono text-[0.75rem] leading-relaxed">
            {lines.length === 0 && !busy ? (
              <div className="text-white/30">
                <span className="text-red-400">$</span> picoclaw ready — waiting for input
                <span className="ml-1 animate-pulse">▍</span>
              </div>
            ) : (
              <>
                {lines.map((l, i) => (
                  <div key={i} className={`whitespace-pre-wrap break-words ${lineClass[l.kind]}`}>
                    <span className="text-white/30">[{stamp(l.at)}]</span>{' '}
                    {l.kind === 'cmd' ? (
                      <>
                        <span className="text-red-400">$</span>
                        {l.text.replace(/^\$/, '')}
                      </>
                    ) : (
                      l.text
                    )}
                  </div>
                ))}
                {busy && (
                  <div className="text-white/50">
                    <span className="animate-pulse">▍</span>
                  </div>
                )}
              </>
            )}
            <div ref={termEndRef} />
          </div>
        </section>
      </div>
    </div>
  );
}
