import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { COMPANY } from '../data/site';

type Msg = { role: 'user' | 'model'; text: string };

const starters = [
  'Available properties',
  'Book inspection',
  'Office address',
];

const fallbackReply = `You can reach Ehi-Kings directly via WhatsApp at ${COMPANY.whatsapp}, Customer Care at ${COMPANY.customerCare}, or Marketing & Sales at ${COMPANY.marketingSales} (Email: ${COMPANY.email}).`;

export default function PublicChatbot() {
  const ask = useAction(api.assistant.publicAsk);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'model',
      text: 'Hi. Ask about Ehi-Kings properties, inspections, construction services, or office details.',
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy, open]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const next = [...messages, { role: 'user' as const, text: clean }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await ask({ history: next.slice(-10) });
      if (!res.configured) {
        setMessages((m) => [...m, { role: 'model', text: fallbackReply }]);
      } else if (res.error) {
        setMessages((m) => [...m, { role: 'model', text: 'I could not answer that yet. Please call or message the team for the fastest help.' }]);
      } else {
        setMessages((m) => [...m, { role: 'model', text: res.reply ?? 'I could not produce a response.' }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'model', text: err instanceof Error ? fallbackReply : 'The assistant could not respond.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[70] sm:inset-x-auto sm:bottom-5 sm:right-5">
      {open && (
        <section className="mb-3 flex max-h-[min(620px,calc(100dvh-5.5rem))] min-h-[360px] flex-col overflow-hidden rounded-[1.25rem] border border-primary/10 bg-white text-primary shadow-[0_30px_90px_rgba(4,10,20,0.22)] sm:w-[390px]">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-rule bg-surface/70 px-4">
            <div className="min-w-0">
              <div className="text-sm font-medium text-primary">Ehi-Kings assistant</div>
              <div className="truncate text-xs leading-5 text-muted">Properties, inspections, and contact</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-white text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[86%] whitespace-pre-wrap rounded-[1.1rem] px-4 py-2.5 text-sm leading-6 ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-accent text-accent-ink'
                        : 'rounded-bl-md bg-surface text-primary'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 rounded-[1rem] bg-surface px-3 py-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  Checking public details...
                </div>
              )}
              <div ref={endRef} />
            </div>
          </main>

          <div className="border-t border-rule bg-white px-3 py-3 sm:px-4">
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => send(starter)}
                  disabled={busy}
                  className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-45"
                >
                  {starter}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                placeholder="Ask about properties..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-[1rem] border border-rule bg-surface px-4 py-3 text-sm text-primary outline-none placeholder:text-muted/70 focus:border-accent"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={!input.trim() || busy}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                aria-label="Send message"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_18px_40px_rgba(0,99,222,0.35)] transition-transform hover:-translate-y-0.5 active:scale-95"
        aria-label="Open Ehi-Kings chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
