import { useEffect, useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  Cake,
  CalendarHeart,
  Check,
  Gift,
  Loader2,
  Mail,
  Phone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAdmin } from './store';
import { useEstates } from '../data/useEstates';

type LeadEvent = { kind: string; date: string; note?: string };
export type PanelLead = {
  _id: Id<'leads'>;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  service: string;
  interest?: string;
  propertyName?: string;
  propertySlug?: string;
  marketer?: string;
  budget?: string;
  message?: string;
  bookingType: string;
  preferredDate?: string;
  preferredTime?: string;
  consentMarketing: boolean;
  contactPrefs?: { email: boolean; sms: boolean; whatsapp: boolean };
  recordType?: 'lead' | 'client';
  stage: string;
  priority: 'low' | 'normal' | 'high';
  nextActionAt?: string;
  notes?: string;
  events?: LeadEvent[];
  tags?: string[];
  createdAt: number;
  lastContactedAt?: number;
};

const STAGES = ['new', 'contacted', 'inspection_booked', 'negotiation', 'closed', 'lost'] as const;
const STAGE_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', inspection_booked: 'Inspection booked',
  negotiation: 'Negotiation', closed: 'Closed', lost: 'Lost',
};
const PRIORITIES = ['low', 'normal', 'high'] as const;
const EVENT_KINDS = ['Birthday', 'Anniversary', 'Move-in', 'Follow-up', 'Custom'];
const EVENT_ICON: Record<string, typeof Cake> = { Birthday: Cake, Anniversary: CalendarHeart, 'Move-in': Building2 };

const fmt = (ms: number) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(ms);
const fmtDay = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long' }).format(d);
};

export default function LeadPanel({ lead, onClose }: { lead: PanelLead | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {lead && <LeadPanelInner key={lead._id} lead={lead} onClose={onClose} />}
    </AnimatePresence>
  );
}

function LeadPanelInner({ lead, onClose }: { lead: PanelLead; onClose: () => void }) {
  const { token } = useAdmin();
  const estates = useEstates();
  const users = useQuery(api.users.list, token ? { token } : 'skip') as Array<{ id: Id<'users'>; name: string }> | undefined;
  const updateLead = useMutation(api.crm.updateLead);
  const sendMail = useAction(api.zoho.sendMail);
  const dealFromLead = useMutation(api.sales.dealFromLead);

  const [draft, setDraft] = useState<PanelLead>(lead);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => setDraft(lead), [lead]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const estate = useMemo(
    () => estates.find((e) => (draft.propertySlug && e.slug === draft.propertySlug) || (draft.propertyName && e.name === draft.propertyName)),
    [estates, draft.propertySlug, draft.propertyName],
  );

  const save = async (patch: Record<string, unknown>, field: string) => {
    if (!token) return;
    setSavingField(field);
    try {
      await updateLead({ token, leadId: lead._id, ...patch });
    } finally {
      setSavingField((f) => (f === field ? null : f));
    }
  };

  const setEvents = (events: LeadEvent[]) => {
    setDraft((d) => ({ ...d, events }));
    void save({ events }, 'events');
  };

  const sendQuickMail = async () => {
    if (!token || !draft.email) { setNotice('This lead has no email address.'); return; }
    setBusy('email');
    const subject = `Ehi-Kings — following up${estate ? ` on ${estate.name}` : ''}`;
    const body = `Hi ${draft.name.split(' ')[0]},\n\nThank you for your interest in Ehi-Kings Real Estate. I wanted to follow up personally${estate ? ` regarding ${estate.name}` : ''} and answer any questions.\n\nWhen suits you for a quick call or site inspection?\n\nWarm regards,\nEhi-Kings Real Estate`;
    const res = await sendMail({ token, to: draft.email, subject, body });
    if (res.ok) {
      if (draft.stage === 'new') await updateLead({ token, leadId: lead._id, stage: 'contacted', lastContactedAt: Date.now() });
      else await updateLead({ token, leadId: lead._id, lastContactedAt: Date.now() });
      setNotice(`Email sent to ${draft.name}.`);
    } else setNotice(res.error ?? 'Could not send — connect Zoho Mail in the Mail tab.');
    setBusy('');
  };

  const promote = async () => {
    if (!token) return;
    setBusy('promote');
    try {
      await dealFromLead({ token, leadId: lead._id });
      setNotice(`"${draft.name}" added to the sales pipeline.`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally { setBusy(''); }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="admin-panel fixed inset-y-0 right-0 z-[71] flex w-full max-w-[640px] flex-col overflow-hidden rounded-l-2xl border-l"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/8 p-5">
          <div className="min-w-0 flex-1">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onBlur={() => draft.name !== lead.name && save({ name: draft.name }, 'name')}
              className="w-full bg-transparent font-heading text-2xl text-primary outline-none"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-accent/12 px-2.5 py-0.5 uppercase tracking-[0.12em] text-accent">{draft.bookingType.replace('_', ' ')}</span>
              <span>Added {fmt(draft.createdAt)}</span>
              {draft.lastContactedAt && <span>· Contacted {fmt(draft.lastContactedAt)}</span>}
              {savingField && <span className="inline-flex items-center gap-1 text-accent-2"><Loader2 className="h-3 w-3 animate-spin" /> saving</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="admin-icon-button rounded-full" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {notice && (
            <div className="admin-card flex items-center gap-2 px-3 py-2 text-sm text-primary">
              <Check className="h-4 w-4 shrink-0 text-accent-2" /> {notice}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={sendQuickMail} disabled={busy === 'email'} className="admin-primary-button">
              {busy === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Email
            </button>
            {draft.phone && (
              <a href={`tel:${draft.phone}`} className="admin-secondary-button"><Phone className="h-4 w-4" /> Call</a>
            )}
            {draft.phone && (
              <a href={`https://wa.me/${draft.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="admin-secondary-button">WhatsApp</a>
            )}
            <button type="button" onClick={promote} disabled={busy === 'promote'} className="admin-secondary-button">
              {busy === 'promote' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} To pipeline
            </button>
          </div>

          {/* Status row */}
          <Section title="Status">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Stage">
                <select
                  value={draft.stage}
                  onChange={(e) => { setDraft({ ...draft, stage: e.target.value }); save({ stage: e.target.value }, 'stage'); }}
                  className="admin-filter-select w-full"
                >
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={draft.priority}
                  onChange={(e) => { setDraft({ ...draft, priority: e.target.value as PanelLead['priority'] }); save({ priority: e.target.value }, 'priority'); }}
                  className="admin-filter-select w-full"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <select
                  value={(draft as { assignedToId?: string }).assignedToId ?? ''}
                  onChange={(e) => save({ assignedToId: e.target.value ? (e.target.value as Id<'users'>) : undefined }, 'owner')}
                  className="admin-filter-select w-full"
                >
                  <option value="">Unassigned</option>
                  {(users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Record type">
                <select
                  value={draft.recordType ?? 'lead'}
                  onChange={(e) => { setDraft({ ...draft, recordType: e.target.value as 'lead' | 'client' }); save({ recordType: e.target.value }, 'recordType'); }}
                  className="admin-filter-select w-full"
                >
                  <option value="lead">Lead (prospect)</option>
                  <option value="client">Client (existing)</option>
                </select>
              </Field>
              <Field label="OK to contact via">
                <div className="flex flex-wrap gap-1.5">
                  {(['email', 'sms', 'whatsapp'] as const).map((ch) => {
                    const prefs = draft.contactPrefs ?? { email: draft.consentMarketing, sms: false, whatsapp: false };
                    const on = prefs[ch];
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => {
                          const nextPrefs = { ...prefs, [ch]: !on };
                          setDraft({ ...draft, contactPrefs: nextPrefs, consentMarketing: nextPrefs.email });
                          save({ contactPrefs: nextPrefs }, 'prefs');
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs capitalize transition-colors ${on ? 'bg-accent-2/15 text-accent-2 ring-1 ring-accent-2/40' : 'admin-theme-soft text-muted'}`}
                      >
                        {ch === 'whatsapp' ? 'WhatsApp' : ch.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email">
                <InlineInput icon={Mail} value={draft.email ?? ''} placeholder="email@…" onChange={(v) => setDraft({ ...draft, email: v })} onSave={() => save({ email: draft.email }, 'email')} />
              </Field>
              <Field label="Phone">
                <InlineInput icon={Phone} value={draft.phone ?? ''} placeholder="+234…" onChange={(v) => setDraft({ ...draft, phone: v })} onSave={() => save({ phone: draft.phone }, 'phone')} />
              </Field>
              <Field label="Budget">
                <InlineInput value={draft.budget ?? ''} placeholder="₦…" onChange={(v) => setDraft({ ...draft, budget: v })} onSave={() => save({ budget: draft.budget }, 'budget')} />
              </Field>
              <Field label="Marketer / agent">
                <InlineInput value={draft.marketer ?? ''} placeholder="who brought them" onChange={(v) => setDraft({ ...draft, marketer: v })} onSave={() => save({ marketer: draft.marketer }, 'marketer')} />
              </Field>
              <Field label="Service / interest">
                <InlineInput value={draft.service ?? ''} onChange={(v) => setDraft({ ...draft, service: v })} onSave={() => save({ service: draft.service }, 'service')} />
              </Field>
            </div>
          </Section>

          {/* Estate */}
          <Section title="Estate of interest">
            <Field label="Property">
              <select
                value={draft.propertySlug ?? ''}
                onChange={(e) => {
                  const est = estates.find((x) => x.slug === e.target.value);
                  setDraft({ ...draft, propertySlug: e.target.value || undefined, propertyName: est?.name });
                  save({ propertySlug: e.target.value || undefined, propertyName: est?.name }, 'property');
                }}
                className="admin-filter-select w-full"
              >
                <option value="">{draft.propertyName ? `${draft.propertyName} (unlinked)` : 'No property linked'}</option>
                {estates.map((e) => <option key={e.slug} value={e.slug}>{e.name} — {e.location}</option>)}
              </select>
            </Field>
            {estate && (
              <a href={`/estates/${estate.slug}`} target="_blank" rel="noreferrer" className="admin-card mt-3 block overflow-hidden">
                {estate.img && <img src={estate.img} alt={estate.name} className="h-32 w-full object-cover" />}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-primary">{estate.name}</p>
                    <span className="text-sm text-accent-2">{estate.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{estate.location} · {estate.size} · {estate.title}</p>
                  {(estate.features ?? []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {estate.features.slice(0, 6).map((f) => (
                        <span key={f} className="rounded-full bg-white/5 px-2.5 py-1 text-[0.7rem] text-muted">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            )}
          </Section>

          {/* Celebrations / events */}
          <Section title="Celebrations & key dates" hint="Birthdays, anniversaries, move-in dates — never miss a reason to reach out.">
            <div className="space-y-2">
              {(draft.events ?? []).map((ev, i) => {
                const Icon = EVENT_ICON[ev.kind] ?? Gift;
                return (
                  <div key={i} className="admin-card flex flex-wrap items-center gap-2 p-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-accent-2" />
                    <select
                      value={EVENT_KINDS.includes(ev.kind) ? ev.kind : 'Custom'}
                      onChange={(e) => {
                        const kind = e.target.value === 'Custom' ? (ev.kind || 'Custom') : e.target.value;
                        setEvents((draft.events ?? []).map((x, j) => (j === i ? { ...x, kind } : x)));
                      }}
                      className="admin-filter-select"
                    >
                      {EVENT_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input
                      type="date"
                      value={ev.date}
                      onChange={(e) => setEvents((draft.events ?? []).map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                      className="admin-input flex-1"
                    />
                    <input
                      value={ev.note ?? ''}
                      placeholder="note"
                      onChange={(e) => setEvents((draft.events ?? []).map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                      className="admin-input flex-1"
                    />
                    <button type="button" onClick={() => setEvents((draft.events ?? []).filter((_, j) => j !== i))} className="admin-icon-button rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setEvents([...(draft.events ?? []), { kind: 'Birthday', date: '' }])}
                className="admin-secondary-button"
              >
                <Plus className="h-4 w-4" /> Add a date
              </button>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <textarea
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              onBlur={() => save({ notes: draft.notes }, 'notes')}
              rows={4}
              placeholder="Call summaries, preferences, next steps…"
              className="admin-input w-full resize-y"
            />
          </Section>

          {draft.message && (
            <Section title="Original message">
              <p className="text-sm leading-6 text-muted">{draft.message}</p>
            </Section>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="admin-field-label !text-[0.7rem] uppercase tracking-[0.14em]">{title}</p>
      {hint && <p className="mb-2 mt-0.5 text-xs text-muted">{hint}</p>}
      <div className={hint ? '' : 'mt-2'}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.68rem] uppercase tracking-[0.1em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function InlineInput({ icon: Icon, value, placeholder, onChange, onSave }: { icon?: typeof Mail; value: string; placeholder?: string; onChange: (v: string) => void; onSave: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" />}
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onSave} className="admin-input w-full" />
    </div>
  );
}
