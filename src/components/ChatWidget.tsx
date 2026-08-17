import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { CONVEX_ENABLED } from '../admin/convexClient';

const TOKEN_KEY = 'ek_chat_token';

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(value: string) {
  try {
    localStorage.setItem(TOKEN_KEY, value);
  } catch {
    // Storage unavailable (private mode, etc.) — chat still works for this page view.
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore.
  }
}

function formatTime(at: number) {
  try {
    return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// Outer shell: bail out before any convex hooks mount when no backend is
// configured (there is no ConvexProvider in that case). The inner component
// below calls all hooks unconditionally.
export default function ChatWidget() {
  if (!CONVEX_ENABLED) return null;
  return <ChatWidgetInner />;
}

function ChatWidgetInner() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() => readToken());

  // Start form state.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [firstMessage, setFirstMessage] = useState('');

  // Thread composer state.
  const [draft, setDraft] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startConversation = useMutation(api.inbox.startConversation);
  const postVisitorMessage = useMutation(api.inbox.postVisitorMessage);
  const postAssistantMessage = useMutation(api.inbox.postAssistantMessage);
  const submitLead = useMutation(api.crm.submitLead);
  const publicAsk = useAction(api.assistant.publicAsk);
  const [botTyping, setBotTyping] = useState(false);
  const thread = useQuery(api.inbox.visitorThread, open && token ? { visitorToken: token } : 'skip');

  // Ask the grounded website AI and post its reply into the thread so staff
  // see the whole conversation in the admin inbox (and can take over).
  const askAI = async (
    visitorToken: string,
    history: Array<{ role: 'user' | 'model'; text: string }>,
  ) => {
    setBotTyping(true);
    try {
      const res = await publicAsk({ history });
      if (res && 'reply' in res && res.reply) {
        await postAssistantMessage({ visitorToken, message: res.reply });
      }
    } catch {
      // AI unavailable — staff reply from the admin inbox instead.
    } finally {
      setBotTyping(false);
    }
  };

  const endRef = useRef<HTMLDivElement>(null);
  const messageCount = thread?.messages.length ?? 0;

  useEffect(() => {
    if (open && messageCount > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [open, messageCount]);

  const start = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = firstMessage.trim();
    if (!name.trim() || !email.trim() || !message || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await startConversation({
        name: name.trim(),
        email: email.trim(),
        message,
      });
      writeToken(res.visitorToken);
      setToken(res.visitorToken);
      setFirstMessage('');
      // Every chatbot conversation is captured as a lead in the admin CRM.
      void submitLead({
        name: name.trim(),
        email: email.trim(),
        message,
        bookingType: 'contact',
        service: 'AI Chatbot',
        source: 'website chatbot',
        consentMarketing: false,
      }).catch(() => undefined);
      void askAI(res.visitorToken, [{ role: 'user', text: message }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the chat. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || !token || busy) return;
    setBusy(true);
    setError('');
    try {
      await postVisitorMessage({ visitorToken: token, message });
      setDraft('');
      const history = [
        ...(thread?.messages ?? []).map((m) => ({
          role: m.mine ? ('user' as const) : ('model' as const),
          text: m.body,
        })),
        { role: 'user' as const, text: message },
      ];
      void askAI(token, history);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send that message.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    clearToken();
    setToken(null);
    setDraft('');
    setError('');
  };

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-rule bg-surface text-primary shadow-[0_30px_90px_rgba(4,10,20,0.28)]"
          aria-label="Live chat with Ehi-Kings"
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-heading text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Ehi-Kings AI assistant
              </div>
              <div className="truncate text-xs leading-5 text-muted">Instant answers — a human can join anytime</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {!token ? (
            /* ── Start form ─────────────────────────────────────────── */
            <form onSubmit={start} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              <p className="text-xs leading-5 text-muted">
                Hi! I'm the Ehi-Kings AI assistant. Tell me your name, email, and how we can help — I'll answer
                right away, and the team follows up personally.
              </p>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Your name"
                className="rounded-xl border border-rule bg-bg px-3.5 py-2.5 text-sm text-primary transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                required
                className="rounded-xl border border-rule bg-bg px-3.5 py-2.5 text-sm text-primary transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
              <textarea
                value={firstMessage}
                onChange={(event) => setFirstMessage(event.target.value)}
                required
                rows={3}
                placeholder="How can we help?"
                className="flex-1 resize-none rounded-xl border border-rule bg-bg px-3.5 py-2.5 text-sm text-primary transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
              {error && <div className="text-xs leading-5 text-red-500">{error}</div>}
              <button
                type="submit"
                disabled={busy || !name.trim() || !email.trim() || !firstMessage.trim()}
                className="flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-xs font-medium uppercase tracking-[0.2em] text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-45"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start chat'}
              </button>
            </form>
          ) : (
            /* ── Live thread ────────────────────────────────────────── */
            <>
              <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {thread === undefined ? (
                  <div className="flex h-full items-center justify-center text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {thread.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] ${message.mine ? 'text-right' : 'text-left'}`}>
                          {!message.mine && (
                            <div className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted">
                              {message.author}
                            </div>
                          )}
                          <div
                            className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-left text-sm leading-6 ${
                              message.mine
                                ? 'rounded-br-md bg-accent text-accent-ink'
                                : 'rounded-bl-md border border-rule bg-bg text-primary'
                            }`}
                          >
                            {message.body}
                          </div>
                          <div className="mt-1 text-[0.65rem] text-muted/70 tnum">{formatTime(message.at)}</div>
                        </div>
                      </div>
                    ))}
                    {botTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-rule bg-bg px-3.5 py-2.5 text-xs text-muted">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> Ehi-Kings AI is typing…
                        </div>
                      </div>
                    )}
                    {thread.status === 'resolved' && (
                      <p className="pt-1 text-center text-xs leading-5 text-muted/80">
                        Conversation resolved — send a message to reopen.
                      </p>
                    )}
                    <div ref={endRef} />
                  </div>
                )}
              </main>

              <div className="shrink-0 border-t border-rule px-3 py-3">
                {error && <div className="mb-2 px-1 text-xs leading-5 text-red-500">{error}</div>}
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-rule bg-bg px-3.5 py-2.5 text-sm text-primary transition-colors placeholder:text-muted/60 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!draft.trim() || busy}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 text-[0.68rem] text-muted/80 underline-offset-2 transition-colors hover:text-accent hover:underline"
                >
                  Start a new conversation
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_18px_40px_rgba(0,99,222,0.35)] transition-transform hover:-translate-y-0.5 active:scale-95"
        aria-label={open ? 'Close live chat' : 'Open live chat'}
        aria-expanded={open}
      >
        {!open && <span aria-hidden className="chat-pulse absolute inset-0 rounded-full bg-accent/60" />}
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
