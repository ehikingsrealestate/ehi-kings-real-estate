import { useMemo, useState } from 'react';
import { useAction } from 'convex/react';
import {
  Workflow, Zap, Loader2, ExternalLink, ArrowRight, ChevronRight, X as XIcon,
  Sparkles, Radio, GitBranch, Send, Cog, Link2, AlertTriangle,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';
import { AUTOMATIONS, AUTOMATION_CATEGORIES, type Automation, type AutomationStep } from '../data/automations';

// Admin "Automations" — showcases the company's n8n workflows and launches them
// signed-in via the same HMAC ticket the Suite uses (suite.ticket, app "automations").

type Filter = 'All' | (typeof AUTOMATION_CATEGORIES)[number];
const FILTERS: Filter[] = ['All', ...AUTOMATION_CATEGORIES];

// Colour-coding + iconography for the left-to-right flow diagram, keyed by step kind.
const KIND_META: Record<AutomationStep['kind'], { label: string; box: string; icon: typeof Radio }> = {
  trigger: { label: 'Trigger', box: 'border-accent/40 bg-accent/10 text-accent', icon: Radio },
  decision: { label: 'Decision', box: 'border-amber-400/40 bg-amber-400/10 text-amber-300', icon: GitBranch },
  output: { label: 'Output', box: 'border-accent-2/40 bg-accent-2/10 text-accent-2', icon: Send },
  action: { label: 'Action', box: 'border-white/15 bg-white/[0.04] text-white/70', icon: Cog },
};

// Small dot summarising a card's flow at a glance (matches the diagram colours).
const DOT_CLASS: Record<AutomationStep['kind'], string> = {
  trigger: 'bg-accent',
  decision: 'bg-amber-400',
  output: 'bg-accent-2',
  action: 'bg-white/40',
};

function FlowDiagram({ steps }: { steps: AutomationStep[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-stretch gap-1">
        {steps.map((step, i) => {
          const meta = KIND_META[step.kind];
          const Icon = meta.icon;
          return (
            <li key={i} className="flex items-stretch gap-1">
              <div className={`flex w-44 flex-col rounded-xl border p-3 ${meta.box}`}>
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[0.6rem] uppercase tracking-[0.14em] opacity-80">{meta.label}</span>
                </div>
                <div className="mt-1.5 text-sm font-medium text-primary">{step.label}</div>
                <div className="mt-1 text-xs leading-snug text-white/50">{step.detail}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex items-center px-0.5 text-white/30" aria-hidden>
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AutomationDetail({
  automation,
  onLaunch,
  launching,
  error,
}: {
  automation: Automation;
  onLaunch: () => void;
  launching: boolean;
  error: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-white/70">{automation.tagline}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/25 bg-accent/[0.06] p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm leading-relaxed text-primary">{automation.impact}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-[0.6rem] uppercase tracking-[0.15em] text-white/38">Triggers when</h4>
          <div className="mt-2 flex items-start gap-2 text-sm text-primary">
            <Radio className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{automation.trigger}</span>
          </div>
        </div>
        <div>
          <h4 className="text-[0.6rem] uppercase tracking-[0.15em] text-white/38">Connects</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {automation.connects.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">
                <Link2 className="h-3 w-3 text-white/40" /> {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-[0.6rem] uppercase tracking-[0.15em] text-white/38">How it flows</h4>
        <div className="mt-2 rounded-2xl border border-white/8 bg-black/20 p-3">
          <FlowDiagram steps={automation.steps} />
        </div>
      </div>

      <div>
        <h4 className="text-[0.6rem] uppercase tracking-[0.15em] text-white/38">Set it up</h4>
        <ol className="mt-2 space-y-2">
          {automation.howTo.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/70">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[0.7rem] font-medium text-accent">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {automation.source && (
        <p className="text-xs text-white/38">Template reference: {automation.source}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-white/8 pt-5">
        <button
          type="button"
          onClick={onLaunch}
          disabled={launching}
          className="admin-primary-button inline-flex items-center gap-2 px-4 py-2.5"
        >
          {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Launch in n8n
        </button>
        <button
          type="button"
          onClick={onLaunch}
          disabled={launching}
          className="admin-secondary-button inline-flex items-center gap-2 px-4 py-2.5"
        >
          <ExternalLink className="h-4 w-4" /> Open n8n
        </button>
        {error && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Automations() {
  const { token } = useAdmin();
  const suiteTicket = useAction(api.suite.ticket);

  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');

  const visible = useMemo(
    () => (filter === 'All' ? AUTOMATIONS : AUTOMATIONS.filter((a) => a.category === filter)),
    [filter],
  );
  const selected = useMemo(() => AUTOMATIONS.find((a) => a.id === openId) ?? null, [openId]);

  const launch = async () => {
    if (!token || launching) return;
    setLaunching(true);
    setError('');
    try {
      const res = await suiteTicket({ token, app: 'automations' });
      if (!res.configured) setError('Sign-in to n8n is not configured on the backend yet.');
      else if (res.error) setError(res.error);
      else if (res.url) window.open(res.url, '_blank', 'noopener');
      else setError('Could not open n8n. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLaunching(false);
    }
  };

  const closeDrawer = () => {
    setOpenId(null);
    setError('');
  };

  const openDrawer = (id: string) => {
    setOpenId(id);
    setError('');
  };

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Automations</h1>
          <p className="admin-page-copy">Connect the whole company — n8n runs these for you.</p>
        </div>
        <button
          type="button"
          onClick={launch}
          disabled={launching}
          className="admin-secondary-button inline-flex items-center gap-2 px-3 py-2"
        >
          {launching && !selected ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Open n8n
        </button>
      </div>

      {/* Category filter chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors ${
                active
                  ? 'border-accent/50 bg-accent/15 text-accent'
                  : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white/90'
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Automation cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => openDrawer(a.id)}
            className="admin-card group flex flex-col p-5 text-left transition-colors hover:border-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                {a.recommended && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-accent-2">
                    <Sparkles className="h-3 w-3" /> Recommended
                  </span>
                )}
                <span className="text-[0.58rem] uppercase tracking-[0.12em] text-white/38">{a.category}</span>
              </div>
            </div>

            <h3 className="mt-4 text-base font-medium text-primary">{a.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/55">{a.tagline}</p>

            {/* Flow-at-a-glance dots */}
            <div className="mt-4 flex items-center gap-1.5">
              {a.steps.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[s.kind]}`} />
                  {i < a.steps.length - 1 && <span className="h-px w-3 bg-white/12" />}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              View flow <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-sm text-white/38">No automations in this category yet.</p>
      )}

      {/* Detail side drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={selected.name}>
          <button
            type="button"
            aria-label="Close"
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="admin-panel relative flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-none border-l">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-primary">{selected.name}</h2>
                    {selected.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent-2/30 bg-accent-2/10 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-accent-2">
                        <Sparkles className="h-3 w-3" /> Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-[0.6rem] uppercase tracking-[0.14em] text-white/38">{selected.category}</span>
                </div>
              </div>
              <button type="button" onClick={closeDrawer} className="admin-icon-button" aria-label="Close details">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <AutomationDetail automation={selected} onLaunch={launch} launching={launching} error={error} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
