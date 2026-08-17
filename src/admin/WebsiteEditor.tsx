import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Check, Clock3, Code2, ExternalLink, Eye, Image, Layers3, Loader2, PanelsTopLeft, Rocket, Sparkles, Type, WandSparkles } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { DEFAULT_SITE_BLOCKS, type SiteBlock } from '../data/siteBlocks';
import { COMPANY } from '../data/site';
import { useAdmin } from './store';

type EditPlan = {
  summary?: string;
  updates?: { key: string; value: string; reason?: string }[];
  error?: string;
};

type WorkflowMode = 'draft' | 'review' | 'publish';

function effectiveValue(block: SiteBlock, drafts: Record<string, string>) {
  return drafts[block.key] ?? block.reviewValue ?? block.draftValue ?? block.value;
}

function statusLabel(block: SiteBlock) {
  if (block.reviewValue || block.status === 'review') return 'In review';
  if (block.draftValue || block.status === 'draft') return 'Draft';
  return 'Published';
}

export default function WebsiteEditor() {
  const { token, me } = useAdmin();
  const remote = useQuery(api.site.listBlocksForAdmin, token ? { token } : 'skip') as SiteBlock[] | undefined;
  const saveDraft = useMutation(api.site.saveDraft);
  const submitReview = useMutation(api.site.submitReview);
  const publishBlock = useMutation(api.site.publishBlock);
  const suggest = useAction(api.assistant.suggestSiteEdits);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [plan, setPlan] = useState<EditPlan | null>(null);

  const blocks = useMemo<SiteBlock[]>(() => {
    const map = new Map(DEFAULT_SITE_BLOCKS.map((b) => [b.key, b]));
    for (const block of remote ?? []) {
      const existing = map.get(block.key);
      if (existing) map.set(block.key, { ...existing, ...block });
    }
    return Array.from(map.values()).map((block) => ({ ...block, value: effectiveValue(block, drafts) }));
  }, [remote, drafts]);

  if (me?.role !== 'Admin') return <Navigate to="/admin" replace />;

  const setDraft = (key: string, value: string) => setDrafts((d) => ({ ...d, [key]: value }));

  const persist = async (block: SiteBlock, mode: WorkflowMode) => {
    if (!token) return;
    setSaving(`${mode}:${block.key}`);
    try {
      const payload = { token, key: block.key, label: block.label, type: block.type, value: block.value, area: block.area };
      if (mode === 'draft') await saveDraft(payload);
      if (mode === 'review') await submitReview(payload);
      if (mode === 'publish') await publishBlock(payload);
      setDrafts((d) => {
        const next = { ...d };
        delete next[block.key];
        return next;
      });
    } finally {
      setSaving(null);
    }
  };

  const runForChanged = async (mode: WorkflowMode) => {
    for (const block of blocks.filter((b) => drafts[b.key] !== undefined)) await persist(block, mode);
  };

  const askAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !prompt.trim()) return;
    setBusy(true);
    setPlan(null);
    try {
      const res = await suggest({ token, prompt, blocks }) as ({ configured: false } | ({ configured: true } & EditPlan));
      if (!res.configured) {
        setPlan({ error: 'Gemini is not configured on the Convex backend yet. Set AI_API_KEY or GEMINI_API_KEY in Convex env.' });
      } else {
        setPlan(res as EditPlan);
      }
    } catch (err) {
      setPlan({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const applyPlan = () => {
    if (!plan?.updates) return;
    setDrafts((d) => {
      const next = { ...d };
      for (const update of plan.updates ?? []) {
        if (blocks.some((b) => b.key === update.key)) next[update.key] = update.value;
      }
      return next;
    });
  };

  const grouped = blocks.reduce<Record<string, SiteBlock[]>>((acc, block) => {
    acc[block.area] = [...(acc[block.area] ?? []), block];
    return acc;
  }, {});
  const groupedEntries: [string, SiteBlock[]][] = Object.keys(grouped).map((area) => [area, grouped[area] ?? []]);
  const byKey = new Map<string, string>(blocks.map((b) => [b.key, b.value]));
  const valueFor = (key: string) => byKey.get(key) ?? '';
  const dirtyCount = Object.keys(drafts).length;
  const reviewCount = blocks.filter((b) => b.reviewValue || b.status === 'review').length;
  const draftCount = blocks.filter((b) => b.draftValue || b.status === 'draft' || drafts[b.key] !== undefined).length;

  const previewHtml = `
    <html>
      <head>
        <style>
          body { margin: 0; background: #144687; color: #f5f8ff; font-family: Poppins, system-ui, sans-serif; }
          .hero { min-height: ${valueFor('home.hero.layout') === 'compact' ? '280px' : '360px'}; padding: 42px 34px; display: flex; flex-direction: column; justify-content: end; background: linear-gradient(0deg, rgba(17,17,15,.72), rgba(17,17,15,.2)), url('${valueFor('home.hero.image')}') center/cover; }
          .eyebrow { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; opacity: .75; margin-bottom: 90px; }
          h1 { font-size: 42px; line-height: 1.04; font-weight: 300; margin: 0; max-width: 700px; }
          .accent { color: #FFFFFF; }
          .body { padding: 32px 34px; color: rgba(245,241,232,.72); line-height: 1.65; }
          .cta { display: inline-flex; margin-top: 22px; border: 1px solid rgba(255,255,255,.2); color: #FFFFFF; background: #0063DE; border-radius: 999px; padding: 12px 18px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
          .pill { display: inline-block; border: 1px solid rgba(110,140,20,.45); color: #6E8C14; border-radius: 999px; padding: 8px 12px; margin: 4px 5px 0 0; font-size: 11px; }
        </style>
      </head>
      <body>
        <section class="hero">
          <div class="eyebrow">${valueFor('home.hero.eyebrow')}</div>
          <h1>${valueFor('home.lede.title').replace('finished homes into family legacies.', '<span class="accent">finished homes into family legacies.</span>')}</h1>
          <span class="cta">${valueFor('home.hero.cta')}</span>
        </section>
        <section class="body">
          <p>${valueFor('home.lede.body')}</p>
          <h2>${valueFor('home.matchmaker.title')}</h2>
          <p>${valueFor('home.matchmaker.body')}</p>
          <h2>${valueFor('home.services.heading')}</h2>
          <p>Section order</p>
          ${valueFor('home.sections.order').split(',').map((s) => `<span class="pill">${s.trim()}</span>`).join('')}
          <h2>${valueFor('footer.cta.title').replace(/\n/g, '<br/>')}</h2>
          <span class="cta">${valueFor('footer.cta.button')}</span>
        </section>
      </body>
    </html>
  `;

  return (
    <div className="admin-page-shell flex h-[100dvh] min-h-0 flex-col text-primary">
      <header className="admin-hero-panel min-h-0 shrink-0">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="admin-kicker">Official site studio</div>
          <h1 className="admin-theme-title mt-2 text-3xl font-light">Website editor</h1>
          <p className="admin-theme-copy mt-2 max-w-2xl text-sm leading-6">Published blocks now feed the live website. Drafts stay private until reviewed and published.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/" target="_blank" className="inline-flex items-center justify-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-4 py-2.5 text-xs tracking-[0.14em] uppercase text-primary hover:border-accent-2 hover:text-accent-2">
            <ExternalLink className="h-4 w-4" /> Live site
          </Link>
          <WorkflowButton icon={Clock3} label={`Save draft${dirtyCount ? ` (${dirtyCount})` : ''}`} disabled={dirtyCount === 0} onClick={() => runForChanged('draft')} />
          <WorkflowButton icon={Eye} label="Send review" disabled={dirtyCount === 0} onClick={() => runForChanged('review')} />
          <WorkflowButton primary icon={Rocket} label={reviewCount ? `Publish review (${reviewCount})` : 'Publish changes'} disabled={blocks.length === 0} onClick={() => Promise.all(blocks.filter((b) => b.reviewValue || b.draftValue || drafts[b.key] !== undefined).map((b) => persist(b, 'publish')))} />
        </div>
      </div>
      </header>

      <div className="grid border-b border-rule sm:grid-cols-3">
        <Metric label="Draft items" value={draftCount} icon={Clock3} />
        <Metric label="In review" value={reviewCount} icon={Eye} />
        <Metric label="Published blocks" value={blocks.length - reviewCount} icon={Check} />
      </div>

      <div className="grid min-h-0 flex-1 xl:grid-cols-[14rem_minmax(0,1fr)_24rem]">
        <aside className="hidden min-h-0 overflow-y-auto border-r border-rule p-4 xl:block">
          <div className="mb-3 text-[0.65rem] tracking-[0.2em] uppercase text-muted">Editable areas</div>
          <div className="space-y-1">
            {groupedEntries.map(([area, list]) => (
              <a key={area} href={`#${area.replace(/\s+/g, '-')}`} className="flex items-center justify-between rounded-[var(--admin-radius-control)] px-3 py-3 text-sm text-primary/80 hover:bg-accent/10 hover:text-accent">
                <span>{area}</span>
                <span className="text-xs text-muted tnum">{list.length}</span>
              </a>
            ))}
          </div>
          <div className="mt-5 border-t border-rule pt-4 text-xs leading-relaxed text-muted">
            Admin-only. Current brand: {COMPANY.short}. Public pages read published values only.
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto p-4 md:p-6">
          <form onSubmit={askAI} className="border-b border-rule pb-5">
            <label className="admin-theme-title mb-3 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-accent" /> AI change request
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Move matchmaker before featured estates, make the hero more premium, and show 4 featured listings."
              className="admin-theme-soft min-h-24 w-full resize-none rounded-[var(--admin-radius-control)] px-4 py-3 text-sm focus:border-accent-2 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted">AI creates a proposal first. Apply it to drafts, then review and publish.</span>
              <button disabled={busy || !prompt.trim()} className="inline-flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-rule px-4 py-2 text-xs text-primary hover:border-accent-2 hover:text-accent-2 disabled:opacity-45">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />} Generate
              </button>
            </div>
            {plan && (
              <div className="admin-theme-soft mt-4 rounded-[var(--admin-radius-card)] p-4">
                {plan.error ? (
                  <p className="text-sm text-accent-2">{plan.error}</p>
                ) : (
                  <>
                    <div className="text-sm text-primary">{plan.summary ?? 'Suggested website edits'}</div>
                    <div className="mt-3 space-y-2">
                      {(plan.updates ?? []).map((u) => (
                        <div key={u.key} className="text-xs text-muted border-t border-rule pt-2">
                          <span className="text-accent">{u.key}</span> - {u.reason ?? 'Update suggested'}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={applyPlan} className="mt-4 rounded-[var(--admin-radius-control)] bg-accent px-4 py-2 text-xs tracking-[0.14em] uppercase text-accent-ink">
                      Apply to draft
                    </button>
                  </>
                )}
              </div>
            )}
          </form>

          {groupedEntries.map(([area, list]) => (
            <div key={area} id={area.replace(/\s+/g, '-')} className="border-b border-rule py-5">
              <div className="flex items-center justify-between pb-4">
                <h2 className="admin-theme-title text-sm font-medium">{area}</h2>
                {area === 'Layout & sections' && <span className="text-[0.62rem] uppercase tracking-[0.16em] text-accent">layout controls</span>}
              </div>
              <div className="divide-y divide-[var(--color-rule)] border-t border-rule">
                {list.map((block) => {
                  const dirty = drafts[block.key] !== undefined;
                  const savingThis = (mode: WorkflowMode) => saving === `${mode}:${block.key}`;
                  const Icon = block.type === 'image' ? Image : block.type === 'textarea' ? Code2 : block.type === 'layout' ? PanelsTopLeft : Type;
                  return (
                    <div key={block.key} className="py-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <label className="flex items-center gap-2 text-sm text-primary">
                            <Icon className="w-4 h-4 text-accent" /> {block.label}
                          </label>
                          <div className="mt-1 text-xs text-muted">
                            {block.key} · {statusLabel(block)}
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <MiniAction label={savingThis('draft') ? 'Saving' : 'Draft'} disabled={!dirty} onClick={() => persist(block, 'draft')} />
                          <MiniAction label={savingThis('review') ? 'Sending' : 'Review'} disabled={!dirty && !block.draftValue} onClick={() => persist(block, 'review')} />
                          <MiniAction label={savingThis('publish') ? 'Publishing' : 'Publish'} disabled={!dirty && !block.draftValue && !block.reviewValue} onClick={() => persist(block, 'publish')} />
                        </div>
                      </div>
                      <EditorField block={block} onChange={(value) => setDraft(block.key, value)} />
                      {(block.draftValue || block.reviewValue) && (
                        <div className="mt-3 rounded-[var(--admin-radius-control)] border border-rule px-3 py-2 text-xs text-muted">
                          Published value is preserved until Publish is clicked.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <aside className="hidden min-h-0 overflow-hidden border-l border-rule xl:flex xl:flex-col">
          <div className="admin-theme-title flex items-center gap-2 border-b border-rule px-4 py-3 text-sm">
            <Layers3 className="w-4 h-4 text-accent" /> Draft preview
          </div>
          <iframe title="Website content preview" srcDoc={previewHtml} className="min-h-0 flex-1 bg-bg" />
        </aside>
      </div>
    </div>
  );
}

function EditorField({ block, onChange }: { block: SiteBlock; onChange: (value: string) => void }) {
  if (block.key === 'home.hero.layout') {
    return (
      <select value={block.value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-primary focus:border-accent focus:outline-none">
        <option value="cinematic">Cinematic hero</option>
        <option value="editorial">Editorial hero</option>
        <option value="compact">Compact hero</option>
      </select>
    );
  }
  if (block.key === 'home.featured.count') {
    return <input type="number" min={1} max={6} value={block.value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-primary focus:border-accent focus:outline-none" />;
  }
  if (block.key === 'home.sections.order') {
    return (
      <div>
        <input value={block.value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-primary focus:border-accent focus:outline-none" />
        <div className="mt-2 text-xs text-muted">Use comma-separated section keys: promo, lede, featured, matchmaker, services. Remove a key to hide that section.</div>
      </div>
    );
  }
  if (block.type === 'textarea') {
    return <textarea value={block.value} onChange={(e) => onChange(e.target.value)} className="min-h-28 w-full resize-y rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-primary focus:border-accent focus:outline-none" />;
  }
  return <input value={block.value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-4 py-3 text-sm text-primary focus:border-accent focus:outline-none" />;
}

function WorkflowButton({ label, icon: Icon, onClick, disabled, primary }: { label: string; icon: typeof Check; onClick: () => void; disabled: boolean; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--admin-radius-control)] px-4 py-2.5 text-xs tracking-[0.14em] uppercase disabled:opacity-45 ${
        primary ? 'bg-accent text-accent-ink' : 'border border-rule text-primary hover:border-accent hover:text-accent'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function MiniAction({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--admin-radius-compact)] border border-rule px-3 py-1.5 text-[0.62rem] tracking-[0.14em] uppercase text-muted hover:border-accent hover:text-accent disabled:opacity-35"
    >
      {label}
    </button>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Check }) {
  return (
    <div className="border-r border-rule px-4 py-3 md:px-7">
      <Icon className="mb-2 h-4 w-4 text-accent" />
      <div className="admin-theme-title tnum text-2xl">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
