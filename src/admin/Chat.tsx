import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { motion } from 'motion/react';
import { ArrowUp, CheckSquare, Database, Loader2, Mail, WalletCards, Sparkles, Paperclip, ChevronDown, Search, Wrench, Eye, Lock, X, Plus, FileText, Bot, Terminal, Trash2, MessageSquare, type LucideIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { COMPANY } from '../data/site';
import { useEstates } from '../data/useEstates';
import { DEFAULT_SITE_BLOCKS } from '../data/siteBlocks';
import { useAdmin } from './store';
import { Markdown } from './chat/Markdown';
import PicoClawConsole from './PicoClawConsole';

type ChatView = 'assistant' | 'picoclaw';

type Msg = { role: 'user' | 'model'; text: string };
type Attachment = { name: string; mime: string; dataUrl?: string; text?: string };
type ModelOpt = { provider: string; label: string; model: string; group: string; vision?: boolean; tools?: boolean };

// Selectable models, grouped like the Vercel chatbot picker. Only providers
// that actually have a key on the backend (providerStatus) are enabled.
const MODEL_CATALOG: ModelOpt[] = [
  { provider: 'gemini', group: 'Google', label: 'Gemini 2.0 Flash', model: 'gemini-2.0-flash', vision: true, tools: true },
  { provider: 'gemini', group: 'Google', label: 'Gemini 2.5 Flash', model: 'gemini-2.5-flash', vision: true, tools: true },
  { provider: 'gemini', group: 'Google', label: 'Gemini 1.5 Pro', model: 'gemini-1.5-pro', vision: true, tools: true },
  { provider: 'groq', group: 'Groq', label: 'Llama 3.3 70B', model: 'llama-3.3-70b-versatile', tools: true },
  { provider: 'groq', group: 'Groq', label: 'Llama 3.1 8B (instant)', model: 'llama-3.1-8b-instant', tools: true },
  { provider: 'deepseek', group: 'DeepSeek', label: 'DeepSeek V3.2', model: 'deepseek-chat', tools: true },
  { provider: 'deepseek', group: 'DeepSeek', label: 'DeepSeek Reasoner', model: 'deepseek-reasoner', tools: true },
  { provider: 'nvidia', group: 'NVIDIA', label: 'Llama 3.3 70B (NIM)', model: 'meta/llama-3.3-70b-instruct', tools: true },
  { provider: 'nvidia', group: 'NVIDIA', label: 'Nemotron 70B', model: 'nvidia/llama-3.1-nemotron-70b-instruct', tools: true },
  { provider: 'nvidia', group: 'NVIDIA', label: 'DeepSeek R1 (NIM)', model: 'deepseek-ai/deepseek-r1' },
  { provider: 'custom', group: 'Custom', label: 'Custom endpoint', model: '', tools: true },
];

const PROVIDERS = [
  ['Gemini Flash', 'Free tier and low paid cost. Good default for this app.'],
  ['Groq Llama', 'Often free or low-cost. Very fast for chat and routing.'],
  ['OpenRouter', 'Lets you test free and cents-level models behind one API.'],
  ['DeepSeek', 'Low-cost paid API, useful for reasoning and code-heavy tasks.'],
  ['Ollama', 'Free after hardware cost. Best for private local experiments.'],
  ['Mistral Small / Codestral', 'Low-cost options with solid agent and coding fit.'],
];

const ACTIONS = [
  { label: 'Company data', icon: Database, kind: 'company' },
  { label: 'Tools', icon: CheckSquare, kind: 'tools' },
  { label: 'Zoho', icon: Mail, kind: 'zoho' },
];

const SUGGESTIONS: { title: string; label: string; prompt: string }[] = [
  { title: "Today's priorities", label: 'open tasks & what needs attention', prompt: "Summarise today's open tasks and what needs attention." },
  { title: 'My inbox', label: 'summarise my latest Zoho emails', prompt: 'Summarise my latest Zoho emails.' },
  { title: 'Match a buyer', label: 'best listings for a Lekki buyer', prompt: 'Which listings should I recommend to a buyer focused on Lekki?' },
  { title: 'Grace Apartments', label: 'draft a follow-up plan for leads', prompt: 'Draft a follow-up plan for Grace Apartments leads.' },
];

const readFile = (file: File) =>
  new Promise<Attachment>((resolve) => {
    const isImage = file.type.startsWith('image/');
    const isText = file.type.startsWith('text/') || /\.(md|csv|json|txt|ts|tsx|js|html|css)$/i.test(file.name) || file.type === 'application/json';
    const r = new FileReader();
    r.onload = () => resolve(isImage ? { name: file.name, mime: file.type, dataUrl: String(r.result) } : { name: file.name, mime: file.type || 'text/plain', text: String(r.result) });
    r.onerror = () => resolve({ name: file.name, mime: file.type });
    if (isImage) r.readAsDataURL(file);
    else if (isText) r.readAsText(file);
    else resolve({ name: file.name, mime: file.type || 'application/octet-stream' });
  });

export default function Chat() {
  const { token, me } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const ask = useAction(api.assistant.ask);
  const providerStatus = useAction(api.assistant.providerStatus);
  const zohoStatus = useAction(api.zoho.status);
  const listInbox = useAction(api.zoho.listInbox);
  const [view, setView] = useState<ChatView>('assistant');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [configured, setConfigured] = useState<Set<string>>(new Set());
  const [model, setModel] = useState<ModelOpt | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [activeConversationId, setActiveConversationId] = useState<Id<'conversations'> | null>(null);
  const [loadConvoId, setLoadConvoId] = useState<Id<'conversations'> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bootAskRef = useRef(false);
  const activeIdRef = useRef<Id<'conversations'> | null>(null);
  activeIdRef.current = activeConversationId;

  const isAdmin = me?.role === 'Admin';

  // Persisted assistant chat history (kind 'assistant').
  const recent = useQuery(api.conversations.list, token ? { token, kind: 'assistant' } : 'skip');
  const loadedMessages = useQuery(api.conversations.messages, token && loadConvoId ? { token, conversationId: loadConvoId } : 'skip');
  const start = useMutation(api.conversations.start);
  const append = useMutation(api.conversations.append);
  const removeConvo = useMutation(api.conversations.remove);

  const estates = useEstates();
  const land = estates.filter((e) => e.kind === 'land').length;
  const homes = estates.filter((e) => e.kind === 'home').length;
  const portfolio = `${estates.length} listings (${land} land, ${homes} homes) across Lagos, Epe, Benin City and Abuja`;
  const catalog = estates.map((e) => ({ name: e.name, location: e.location, price: e.price, kind: e.kind, size: e.size }));
  const empty = messages.length === 0;

  // Discover which providers have keys → enable them in the picker.
  useEffect(() => {
    if (!token) return;
    providerStatus({ token }).then((list) => {
      const ids = new Set<string>(list.map((p) => String(p.id)));
      setConfigured(ids);
      const saved = (() => { try { return JSON.parse(localStorage.getItem('ek_chat_model') || 'null'); } catch { return null; } })();
      const def = (saved && ids.has(saved.provider) && MODEL_CATALOG.find((m) => m.provider === saved.provider && m.model === saved.model))
        || MODEL_CATALOG.find((m) => ids.has(m.provider))
        || null;
      if (def) {
        const custom = def.provider === 'custom' ? { ...def, model: list.find((p) => p.id === 'custom')?.model ?? '', label: list.find((p) => p.id === 'custom')?.label ?? 'Custom' } : def;
        setModel(custom);
      }
    }).catch(() => {
      // providerStatus unavailable — assume the default provider so the picker stays usable.
      setConfigured(new Set(['gemini', 'custom']));
      setModel((m) => m ?? MODEL_CATALOG.find((x) => x.provider === 'gemini') ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  // Only admins may use PicoClaw — if a non-admin lands on it, force back to the assistant.
  useEffect(() => { if (!isAdmin && view === 'picoclaw') setView('assistant'); }, [isAdmin, view]);

  // Populate the visible thread when a past conversation's messages arrive.
  useEffect(() => {
    if (!loadConvoId || loadedMessages === undefined) return;
    setMessages(loadedMessages.map((m) => ({ role: m.role, text: m.text })));
    setActiveConversationId(loadConvoId);
  }, [loadConvoId, loadedMessages]);

  const autosize = () => { const ta = taRef.current; if (!ta) return; ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; };

  const pickModel = (m: ModelOpt) => {
    setModel(m); setPickerOpen(false); setModelSearch('');
    try { localStorage.setItem('ek_chat_model', JSON.stringify({ provider: m.provider, model: m.model })); } catch { /* ignore */ }
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const read = await Promise.all(Array.from(files).slice(0, 6).map(readFile));
    setAttachments((a) => [...a, ...read].slice(0, 8));
  };

  const send = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || busy || !token) return;
    const atts = attachments;
    const shown = text.trim() + (atts.length ? `\n\n${atts.map((a) => `File: ${a.name}`).join('  ')}` : '');
    const userText = text.trim() || '(see attachments)';
    const next = [...messages, { role: 'user' as const, text: userText }];
    setMessages([...messages, { role: 'user', text: shown || '(attachments)' }]);
    setInput(''); setAttachments([]);
    requestAnimationFrame(autosize);
    setBusy(true);
    // Persist the user turn — starting a fresh conversation on the first send.
    let convoId = activeIdRef.current;
    try {
      if (!convoId) { convoId = await start({ token, kind: 'assistant' }); setActiveConversationId(convoId); }
      await append({ token, conversationId: convoId, role: 'user', text: shown || userText });
    } catch { convoId = activeIdRef.current; }
    const persistModel = async (reply: string) => { if (convoId) { try { await append({ token, conversationId: convoId, role: 'model', text: reply }); } catch { /* ignore */ } } };
    try {
      const res = await ask({
        token,
        history: next.slice(-16),
        portfolio: `${portfolio}. Company: ${COMPANY.name}. Mission: ${COMPANY.mission}. Vision: ${COMPANY.vision}. Editable website blocks: ${DEFAULT_SITE_BLOCKS.map((b) => `${b.label} (${b.area})`).join(', ')}.`,
        catalog,
        provider: model?.provider,
        model: model?.model || undefined,
        attachments: atts.length ? atts : undefined,
      });
      let reply: string;
      if (!res.configured) {
        reply = 'The company chat needs an AI key on the Convex backend. Set `AI_API_KEY` or `GEMINI_API_KEY` in Convex env, then reload this page.';
      } else if (res.error) {
        reply = `I hit an error: ${res.error}`;
      } else {
        const note = res.usedTools?.length ? `\n\n_Ran: ${res.usedTools.join(', ')}_` : '';
        reply = `${res.reply ?? ''}${note}`;
      }
      setMessages((m) => [...m, { role: 'model', text: reply }]);
      await persistModel(reply);
    } catch (err) {
      const reply = `Something went wrong: ${err instanceof Error ? err.message : String(err)}`;
      setMessages((m) => [...m, { role: 'model', text: reply }]);
      await persistModel(reply);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    const askText = searchParams.get('ask');
    if (!askText || !token || busy || bootAskRef.current) return;
    bootAskRef.current = true;
    setSearchParams({}, { replace: true });
    void send(askText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, searchParams, setSearchParams, token]);

  const appendExchange = (userText: string, modelText: string) => setMessages((m) => [...m, { role: 'user', text: userText }, { role: 'model', text: modelText }]);
  const showCompanyData = () => appendExchange('Show me what company data you can answer from.', ['Current company data available:', `- **Portfolio:** ${portfolio}.`, `- **Company profile:** ${COMPANY.name}, mission, vision, contacts, website copy.`, '- **Listings, tasks, team** visible to your role.', '- **Zoho Mail:** only after *you* connect your own mailbox.'].join('\n'));
  const showTools = () => appendExchange('What admin actions can you take?', ['**Working actions:** create/assign tasks, update task status, search the portfolio, summarise your Zoho inbox, propose website edits.', '', '**Boundaries:** workers see only permitted data; mail never reads another inbox; site changes go through draft → review → publish.'].join('\n'));
  const showZoho = async () => {
    if (!token || busy) return;
    setMessages((m) => [...m, { role: 'user', text: 'Check my Zoho Mail connection and latest messages.' }]);
    setBusy(true);
    try {
      const status = await zohoStatus({ token });
      if (!status.oauthReady) { setMessages((m) => [...m, { role: 'model', text: 'Zoho OAuth is not configured on the backend yet.' }]); return; }
      if (!status.connected) { setMessages((m) => [...m, { role: 'model', text: 'Your Zoho Mail is not connected. Open **Mail → Connect my Zoho Mail**.' }]); return; }
      const inbox = await listInbox({ token, limit: 8 });
      if (inbox.error) { setMessages((m) => [...m, { role: 'model', text: `Zoho Mail returned an error: ${inbox.error}` }]); return; }
      const rows = inbox.messages ?? [];
      setMessages((m) => [...m, { role: 'model', text: rows.length ? rows.map((mail) => `- **${mail.subject || '(no subject)'}** — ${mail.from}${mail.summary ? `\n  ${mail.summary}` : ''}`).join('\n') : 'No recent messages.' }]);
    } catch (err) { setMessages((m) => [...m, { role: 'model', text: `Zoho check failed: ${err instanceof Error ? err.message : String(err)}` }]); }
    finally { setBusy(false); }
  };
  const runAction = (kind: string) => { if (kind === 'company') showCompanyData(); if (kind === 'tools') showTools(); if (kind === 'zoho') void showZoho(); };
  const showProviderOptions = () => setMessages((m) => [...m, { role: 'user', text: 'Show cost-effective LLM options.' }, { role: 'model', text: ['Cost-effective models you can plug in (set the key in Convex env):', ...PROVIDERS.map(([n, d]) => `- **${n}** — ${d}`)].join('\n') }]);
  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(input); };
  const newChat = () => { setMessages([]); setInput(''); setAttachments([]); setActiveConversationId(null); setLoadConvoId(null); };

  // Open a stored conversation into the visible thread.
  const loadConversation = (id: Id<'conversations'>) => {
    if (busy) return;
    setView('assistant');
    setInput(''); setAttachments([]);
    if (id === loadConvoId) { setActiveConversationId(id); if (loadedMessages) setMessages(loadedMessages.map((m) => ({ role: m.role, text: m.text }))); }
    else { setLoadConvoId(id); }
  };

  const deleteConversation = async (id: Id<'conversations'>) => {
    if (!token) return;
    try { await removeConvo({ token, conversationId: id }); } catch { /* ignore */ }
    if (id === activeConversationId) newChat();
    else if (id === loadConvoId) setLoadConvoId(null);
  };

  const filteredModels = MODEL_CATALOG.filter((m) => `${m.group} ${m.label}`.toLowerCase().includes(modelSearch.toLowerCase()));
  const groups = [...new Set(filteredModels.map((m) => m.group))];
  const firstName = me?.name?.split(' ')[0];

  return (
    <div className="flex h-full min-h-0">
      {/* Left rail — desktop only */}
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-rule bg-surface/35 md:flex">
        <div className="px-3 py-3">
          <div className="px-2 pb-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-white/38">Assistants</div>
          <button
            type="button"
            onClick={() => setView('assistant')}
            className={`flex w-full items-center gap-2.5 rounded-[var(--admin-radius-compact)] px-2.5 py-2 text-left text-sm transition-colors ${view === 'assistant' ? 'bg-white/[0.06] text-white' : 'text-white/60 hover:bg-white/[0.03] hover:text-white/85'}`}
          >
            <Bot className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate">Company Assistant</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setView('picoclaw')}
              className={`mt-0.5 flex w-full items-center gap-2.5 rounded-[var(--admin-radius-compact)] px-2.5 py-2 text-left text-sm transition-colors ${view === 'picoclaw' ? 'bg-red-500/10 text-red-400' : 'text-white/60 hover:bg-white/[0.03] hover:text-white/85'}`}
            >
              <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <Terminal className={`h-4 w-4 ${view === 'picoclaw' ? 'text-red-400' : 'text-white/50'}`} />
                <span className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${view === 'picoclaw' ? 'bg-red-500' : 'bg-red-500/70'}`} />
              </span>
              <span className="truncate">PicoClaw</span>
            </button>
          )}
        </div>

        <div className="mt-1 flex min-h-0 flex-1 flex-col border-t border-rule px-3 py-3">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-white/38">Recent</span>
            <button
              type="button"
              onClick={() => { setView('assistant'); newChat(); }}
              className="inline-flex items-center gap-1 rounded-[var(--admin-radius-compact)] px-1.5 py-1 text-[0.7rem] text-accent/80 transition-colors hover:bg-white/[0.04] hover:text-accent"
            >
              <Plus className="h-3 w-3" /> New chat
            </button>
          </div>
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {recent === undefined ? (
              <div className="px-2 py-2 text-xs text-white/35">Loading…</div>
            ) : recent.length === 0 ? (
              <div className="px-2 py-2 text-xs text-white/35">No conversations yet.</div>
            ) : (
              recent.map((c) => {
                const active = view === 'assistant' && c.id === activeConversationId;
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-1 rounded-[var(--admin-radius-compact)] pr-1 transition-colors ${active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                  >
                    <button
                      type="button"
                      onClick={() => loadConversation(c.id)}
                      className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--admin-radius-compact)] px-2.5 py-2 text-left text-sm transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white/85'}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="truncate">{c.title || 'New chat'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteConversation(c.id)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--admin-radius-compact)] text-white/35 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 group-hover:opacity-100"
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {view === 'picoclaw' ? (
          <PicoClawConsole token={token} />
        ) : (
          <div className="admin-chat-shell flex h-full min-h-0 flex-col">
      <header className="admin-chat-header flex min-h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-xl md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[var(--admin-radius-compact)] border border-accent/30 bg-accent/12">
              <Sparkles className="h-4 w-4 text-accent" />
            </span>
            <h1 className="admin-chat-title truncate text-sm font-medium">AI Chat</h1>
          </div>
          <p className="admin-chat-muted mt-1 hidden truncate text-xs sm:block">
            Role-aware workspace for listings, tasks, company data, Zoho mail, and website copy.
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <ModelPicker
            model={model}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            modelSearch={modelSearch}
            setModelSearch={setModelSearch}
            groups={groups}
            filteredModels={filteredModels}
            configured={configured}
            pickModel={pickModel}
          />
          <button
            type="button"
            onClick={newChat}
            className="admin-chat-button inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--admin-radius-control)] px-3 text-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="admin-chat-toolbar flex gap-2 overflow-x-auto border-b px-4 py-2 md:px-6">
          {ACTIONS.map((a) => <Chip key={a.label} icon={a.icon} label={a.label} disabled={busy} onClick={() => runAction(a.kind)} />)}
          <Chip icon={WalletCards} label="LLM costs" disabled={busy} onClick={showProviderOptions} />
          <span className="admin-chat-subtle ml-auto hidden shrink-0 items-center gap-2 text-xs lg:flex">
            <span>{me?.role ?? 'Worker'}</span>
            <span className="h-1 w-1 rounded-full bg-current opacity-40" />
            <span>{portfolio}</span>
          </span>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-4 py-10 md:px-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl">
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-accent/80">Ehi-Kings assistant</p>
              <h2 className="admin-chat-heading font-heading text-3xl font-light tracking-tight md:text-5xl">How can I help{firstName ? `, ${firstName}` : ''}?</h2>
              <p className="admin-chat-muted mt-4 max-w-xl text-sm leading-6">
                Ask about listings, tasks, team context, site content, or your connected Zoho mail. Responses stay bounded by your admin role.
              </p>
            </motion.div>
            <div className="mt-10 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.06, duration: 0.4 }}
                  onClick={() => send(s.prompt)}
                  className="admin-chat-suggestion group rounded-[var(--admin-radius-card)] px-4 py-3 text-left transition-colors"
                >
                  <div className="admin-chat-title text-sm font-medium">{s.title}</div>
                  <div className="admin-chat-muted mt-1 text-xs leading-5">{s.label}</div>
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-6">
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'model' && (
                  <span className="admin-chat-avatar mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius-compact)]">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                  </span>
                )}
                {m.role === 'user' ? (
                  <div className="max-w-[82%] whitespace-pre-wrap rounded-[var(--admin-radius-card)] bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-ink shadow-[0_12px_36px_rgba(0,99,222,0.18)]">{m.text}</div>
                ) : (
                  <div className="admin-chat-answer min-w-0 flex-1 pt-0.5 text-sm"><Markdown>{m.text}</Markdown></div>
                )}
              </motion.div>
            ))}
            {busy && (
              <div className="flex gap-3">
                <span className="admin-chat-avatar mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius-compact)]"><Sparkles className="h-3.5 w-3.5 text-accent" /></span>
                <div className="admin-chat-muted flex items-center gap-2 pt-1.5 text-sm"><Loader2 className="h-4 w-4 animate-spin text-accent" /> Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
        </main>

        <div className="admin-chat-composer-wrap border-t px-4 pb-4 pt-3 backdrop-blur-xl md:px-6">
        <form onSubmit={onSubmit} className="mx-auto max-w-4xl">
          <div className="admin-chat-composer relative rounded-[var(--admin-radius-panel)] transition-colors focus-within:border-accent/60">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {attachments.map((a, i) => (
                  <span key={i} className="admin-attachment-pill admin-chat-title inline-flex items-center gap-1.5 rounded-[var(--admin-radius-compact)] py-1 pl-2 pr-1 text-xs">
                    {a.dataUrl ? <img src={a.dataUrl} alt="" className="h-5 w-5 rounded object-cover" /> : <FileText className="h-3.5 w-3.5 text-accent" />}
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    <button type="button" onClick={() => setAttachments((x) => x.filter((_, j) => j !== i))} className="admin-chat-icon-button rounded p-0.5"><X className="h-3.5 w-3.5" /></button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); autosize(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about listings, leads, tasks, Zoho mail, or site copy..."
              rows={1}
              className="admin-chat-textarea max-h-[200px] min-h-[56px] w-full resize-none bg-transparent px-4 pb-[3.25rem] pt-4 text-sm leading-6 focus:outline-none"
            />
            <div className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-2">
              <input ref={fileRef} type="file" multiple accept="image/*,text/*,.md,.csv,.json,.txt" className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current?.click()} className="admin-chat-icon-button flex h-8 w-8 items-center justify-center rounded-[var(--admin-radius-compact)] transition-colors" title="Attach files" aria-label="Attach files"><Paperclip className="h-4 w-4" /></button>
              <span className="admin-chat-subtle hidden text-xs sm:inline">Shift + Enter for a new line</span>

              <button type="submit" disabled={(!input.trim() && attachments.length === 0) || busy} className="ml-auto flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-compact)] bg-accent text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-40" aria-label="Send message">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="admin-chat-subtle mt-2 text-center text-[0.65rem]">AI Chat only acts within your role permissions. Files stay in this session.</p>
        </form>
      </div>
      </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label, onClick, disabled }: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="admin-chat-chip inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--admin-radius-control)] px-3 text-xs transition-colors disabled:opacity-45">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function ModelPicker({
  model,
  pickerOpen,
  setPickerOpen,
  modelSearch,
  setModelSearch,
  groups,
  filteredModels,
  configured,
  pickModel,
}: {
  model: ModelOpt | null;
  pickerOpen: boolean;
  setPickerOpen: (value: boolean | ((value: boolean) => boolean)) => void;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  groups: string[];
  filteredModels: ModelOpt[];
  configured: Set<string>;
  pickModel: (model: ModelOpt) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className="admin-model-button inline-flex h-9 max-w-[13rem] items-center gap-1.5 rounded-[var(--admin-radius-control)] px-3 text-xs transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <span className="truncate">{model ? model.label : 'No model'}</span>
        <ChevronDown className="admin-chat-subtle h-3.5 w-3.5 shrink-0" />
      </button>
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
          <div className="admin-model-menu absolute right-0 top-11 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--admin-radius-card)] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-rule px-3 py-2">
              <Search className="admin-chat-subtle h-3.5 w-3.5" />
              <input autoFocus value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="Search models..." className="admin-chat-textarea w-full bg-transparent text-sm focus:outline-none" />
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {groups.map((g) => (
                <div key={g}>
                  <div className="admin-chat-subtle px-3 pb-1 pt-2 text-[0.6rem] uppercase tracking-[0.12em]">{g}</div>
                  {filteredModels.filter((m) => m.group === g).map((m) => {
                    const enabled = configured.has(m.provider);
                    const active = model?.provider === m.provider && model?.model === m.model;
                    return (
                      <button key={`${m.provider}-${m.model}`} type="button" disabled={!enabled} onClick={() => enabled && pickModel(m)} className={`admin-model-option flex w-full items-center gap-2 rounded-[var(--admin-radius-compact)] px-3 py-2 text-left text-sm transition-colors ${active ? 'is-active' : ''} ${enabled ? '' : 'is-disabled'}`}>
                        <span className="flex-1 truncate">{m.label}</span>
                        {m.tools && <Wrench className="admin-chat-subtle h-3 w-3" />}
                        {m.vision && <Eye className="admin-chat-subtle h-3 w-3" />}
                        {!enabled && <Lock className="admin-chat-subtle h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              ))}
              {groups.length === 0 && <div className="admin-chat-muted px-3 py-3 text-sm">No models.</div>}
              {configured.size === 0 && <div className="admin-chat-muted border-t border-rule px-3 py-2 text-[0.7rem]">No provider key set. Add one in Convex env, for example GEMINI_API_KEY, to enable models.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
