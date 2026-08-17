import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useAction } from 'convex/react';
import { Sparkles, X, ArrowUp, Loader2 } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';
import { useEstates } from '../data/useEstates';

type Msg = { role: 'user' | 'model'; text: string };

const ACCENT = '0,99,222'; // Ehi-Kings blue

const SUGGESTIONS = [
  'What should I focus on today?',
  'Summarise my open tasks',
  'Who has the most on their plate?',
];

export default function AssistantDock() {
  const { token, me } = useAdmin();
  const ask = useAction(api.assistant.ask);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'model', text: `Hi${me?.name ? ' ' + me.name.split(' ')[0] : ''} — I'm your Ehi-Kings copilot. Ask me about your tasks, the team, or the portfolio.` },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const estates = useEstates();
  const land = estates.filter((e) => e.kind === 'land').length;
  const homes = estates.filter((e) => e.kind === 'home').length;
  const portfolio = `${estates.length} listings (${land} land, ${homes} homes) across Lagos, Epe, Benin City and Abuja`;
  const catalog = estates.map((e) => ({ name: e.name, location: e.location, price: e.price, kind: e.kind, size: e.size }));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy, open]);

  const send = async (text: string) => {
    if (!text.trim() || busy || !token) return;
    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await ask({ token, history: next.slice(-12), portfolio, catalog });
      if (!res.configured) {
        setMessages((m) => [...m, { role: 'model', text: 'The copilot isn’t switched on yet — an admin needs to set an AI key on the backend (`npx convex env set AI_API_KEY …`).' }]);
      } else if (res.error) {
        setMessages((m) => [...m, { role: 'model', text: `I hit an error: ${res.error}` }]);
      } else {
        const note = res.usedTools?.length ? `\n\nRan: ${res.usedTools.join(', ')}` : '';
        const provider = res.provider ? `\n\nProvider: ${res.provider}` : '';
        setMessages((m) => [...m, { role: 'model', text: (res.reply ?? '') + note + provider }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'model', text: `Something went wrong: ${(e as Error).message}` }]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-50 inline-flex items-center gap-2 rounded-full px-4 py-3 text-xs font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10 backdrop-blur-xl transition-transform hover:scale-[1.03]"
          style={{ background: `linear-gradient(180deg, rgba(${ACCENT},0.22), rgba(${ACCENT},0.10))` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: `rgb(${ACCENT})` }} /> Copilot
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed z-50 inset-x-3 bottom-3 flex h-[72vh] max-h-[80vh] flex-col overflow-hidden rounded-[var(--admin-radius-panel)] border border-white/[0.08] bg-bg/95 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:inset-auto md:bottom-8 md:right-8 md:h-[600px] md:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `rgba(${ACCENT},0.16)` }}>
                <Sparkles className="w-4 h-4" style={{ color: `rgb(${ACCENT})` }} />
              </span>
              <div>
                <div className="text-sm font-medium text-white leading-none">Copilot</div>
                <div className="text-[0.65rem] text-white/40 mt-1">Sees only what you can</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-[var(--admin-radius-card)] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-white text-black'
                      : 'border border-white/[0.06] bg-white/[0.05] text-white/90'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-[var(--admin-radius-card)] border border-white/[0.06] bg-white/[0.05] px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: `rgb(${ACCENT})` }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions (only before the user has asked anything) */}
          {messages.length <= 1 && !busy && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[0.7rem] text-white/70 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={onSubmit} className="p-3 border-t border-white/[0.06] flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your copilot…"
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/25"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 text-black transition-transform hover:scale-105"
              style={{ background: `rgb(${ACCENT})` }}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
