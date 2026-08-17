import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import readXlsxFile from 'read-excel-file/browser';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Cake,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Handshake,
  Loader2,
  Mail,
  MailPlus,
  Plus,
  Search,
  SquareKanban,
  Upload,
  UsersRound,
  X,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import AddMenu from './AddMenu';
import { useAdmin } from './store';
import { useEstates } from '../data/useEstates';
import LeadPanel, { type PanelLead } from './LeadPanel';

type Stage = 'new' | 'contacted' | 'inspection_booked' | 'negotiation' | 'closed' | 'lost';
type BookingType = 'contact' | 'consultation' | 'inspection' | 'payment_interest' | 'newsletter' | 'import';
type Lead = {
  _id: Id<'leads'>;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  service: string;
  interest?: string;
  propertyName?: string;
  marketer?: string;
  budget?: string;
  message?: string;
  bookingType: BookingType;
  preferredDate?: string;
  preferredTime?: string;
  consentMarketing: boolean;
  contactPrefs?: { email: boolean; sms: boolean; whatsapp: boolean };
  recordType?: 'lead' | 'client';
  stage: Stage;
  priority: 'low' | 'normal' | 'high';
  nextActionAt?: string;
  notes?: string;
  events?: Array<{ kind: string; date: string; note?: string }>;
  tags?: string[];
  propertySlug?: string;
  lastContactedAt?: number;
  createdAt: number;
};

type SortKey =
  | 'created_desc' | 'created_asc' | 'name' | 'stage' | 'priority'
  | 'contacted' | 'budget' | 'property' | 'marketer' | 'booking' | 'celebration' | 'optin' | 'source';

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'created_desc', label: 'Date added (newest)' },
  { value: 'created_asc', label: 'Date added (oldest)' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'stage', label: 'Stage' },
  { value: 'priority', label: 'Priority (high first)' },
  { value: 'contacted', label: 'Last contacted' },
  { value: 'budget', label: 'Budget (high first)' },
  { value: 'property', label: 'Estate / property' },
  { value: 'marketer', label: 'Marketer / agent' },
  { value: 'booking', label: 'Booking type' },
  { value: 'celebration', label: 'Upcoming celebration' },
  { value: 'optin', label: 'Marketing opt-in' },
  { value: 'source', label: 'Source' },
];

const PRIORITY_RANK: Record<string, number> = { high: 0, normal: 1, low: 2 };
const nextCelebrationDays = (lead: Lead): number => {
  if (!lead.events?.length) return 9999;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let best = 9999;
  for (const ev of lead.events) {
    const d = new Date(ev.date);
    if (Number.isNaN(d.getTime())) continue;
    let next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    if (next.getTime() < t0) next = new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
    best = Math.min(best, Math.round((next.getTime() - t0) / 86400000));
  }
  return best;
};

type View = 'leads' | 'estates' | 'celebrations' | 'pipeline' | 'companies' | 'bookings';

type DealStage = 'new' | 'qualified' | 'site_visit' | 'negotiation' | 'won' | 'lost';

type Deal = {
  id: Id<'deals'>;
  name: string;
  stage: DealStage;
  value: number;
  company?: string;
  companyId?: Id<'companies'>;
  contactName?: string;
  ownerId?: Id<'users'>;
  expectedClose?: string;
  notes?: string;
  leadId?: Id<'leads'>;
};

type Company = {
  id: Id<'companies'>;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  location?: string;
  notes?: string;
  ownerId?: Id<'users'>;
  dealCount: number;
  pipelineValue: number;
};

const stages: Array<{ value: Stage | 'all' | 'open'; label: string }> = [
  { value: 'all', label: 'All leads' },
  { value: 'open', label: 'Open (not closed)' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'inspection_booked', label: 'Inspection' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

const stageLabels: Record<Stage, string> = {
  new: 'New',
  contacted: 'Contacted',
  inspection_booked: 'Inspection booked',
  negotiation: 'Negotiation',
  closed: 'Closed',
  lost: 'Lost',
};

const bookingLabels: Record<BookingType, string> = {
  contact: 'Website enquiry',
  consultation: 'Consultation',
  inspection: 'Inspection',
  payment_interest: 'Land payment interest',
  newsletter: 'Newsletter',
  import: 'Imported',
};

const VIEWS: Array<{ value: View; label: string; icon: typeof UsersRound }> = [
  { value: 'leads', label: 'Leads', icon: UsersRound },
  { value: 'estates', label: 'By estate', icon: Building2 },
  { value: 'celebrations', label: 'Celebrations', icon: Cake },
  { value: 'pipeline', label: 'Pipeline', icon: SquareKanban },
  { value: 'companies', label: 'Companies', icon: Building2 },
  { value: 'bookings', label: 'Bookings', icon: CalendarDays },
];

const DEAL_STAGES: DealStage[] = ['new', 'qualified', 'site_visit', 'negotiation', 'won', 'lost'];

const dealStageLabels: Record<DealStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  site_visit: 'Site visit',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const naira = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });
const fmtNaira = (value: number) => `₦${naira.format(value)}`;

const emptyDealForm = {
  name: '',
  value: '',
  stage: 'new' as DealStage,
  companyId: '',
  contactName: '',
  expectedClose: '',
  notes: '',
};

const emptyCompanyForm = { name: '', domain: '', email: '', phone: '', location: '', notes: '' };

const templateFor = (lead: Lead) => ({
  subject: `Ehi-Kings: ${lead.service || 'your enquiry'}`,
  body: [
    `Hello ${lead.name},`,
    '',
    'Thank you for reaching out to Ehi-Kings Real Estate & Construction.',
    lead.bookingType === 'inspection'
      ? 'We received your inspection request. Our inspection slots are Tuesdays, Thursdays, and Saturdays at 10:00 AM, with at least 2 days advance notice.'
      : 'We received your enquiry and will respond with the next clear steps within 2 days.',
    lead.propertyName ? `Property: ${lead.propertyName}` : '',
    '',
    'Kind regards,',
    'Ehi-Kings Real Estate & Construction',
  ].filter(Boolean).join('\n'),
});

function cell(row: Record<string, unknown>, names: string[]) {
  const found = Object.entries(row).find(([key]) => names.some((name) => key.trim().toLowerCase() === name));
  const value = found?.[1];
  const s = value == null ? '' : String(value).trim();
  // Spreadsheets commonly use "NIL" for empty cells.
  return s.toUpperCase() === 'NIL' ? '' : s;
}

// Clean a phone cell: drop leading punctuation, take the first of multiple.
function cleanPhoneCell(value: string): string {
  return value.replace(/^[.,\s]+/, '').split('/')[0].trim();
}

function parseConsent(value: string) {
  return ['yes', 'true', '1', 'opt in', 'opt-in', 'subscribed'].includes(value.trim().toLowerCase());
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function leadFromRow(row: Record<string, unknown>) {
  const name = cell(row, ['name', 'full name', 'client', 'client name', 'customer', 'customer name']);
  const email = cell(row, ['email', 'e-mail', 'email address', 'email-address', 'mail']).split('/')[0].trim().toLowerCase();
  const phone = cleanPhoneCell(cell(row, ['phone', 'phone number', 'mobile', 'telephone', 'whatsapp', 'whatsapp no.', 'whatsapp no']));
  const marketer = cell(row, ['marketer', 'agent', 'realtor', 'referred by', 'referral', 'sales rep']);
  const service = cell(row, ['service', 'interest', 'requirement', 'looking for']) || 'Imported lead';
  const events: Array<{ kind: string; date: string }> = [];
  const bday = toIsoDate(cell(row, ['birthday', 'birth date', 'date of birth', 'dob']));
  if (bday) events.push({ kind: 'Birthday', date: bday });
  const anniv = toIsoDate(cell(row, ['anniversary', 'wedding anniversary']));
  if (anniv) events.push({ kind: 'Anniversary', date: anniv });
  const moveIn = toIsoDate(cell(row, ['move-in', 'move in', 'movein', 'closing date', 'purchase date']));
  if (moveIn) events.push({ kind: 'Move-in', date: moveIn });

  // Per-channel consent: explicit columns, else the generic opt-in maps to email.
  const generic = parseConsent(cell(row, ['marketing consent', 'newsletter', 'opt in', 'consent', 'subscribed']));
  const contactPrefs = {
    email: parseConsent(cell(row, ['email opt in', 'email consent', 'email marketing'])) || generic,
    sms: parseConsent(cell(row, ['sms opt in', 'sms consent', 'text consent'])),
    whatsapp: parseConsent(cell(row, ['whatsapp opt in', 'whatsapp consent', 'whatsapp'])),
  };

  const tagsRaw = cell(row, ['tags', 'labels', 'segment', 'category']);
  const tags = tagsRaw ? tagsRaw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean) : undefined;

  return {
    name: name || email || phone || 'Imported record',
    email: email || undefined,
    phone: phone || undefined,
    source: cell(row, ['source', 'lead source', 'referral', 'channel']) || 'spreadsheet import',
    service,
    interest: cell(row, ['interest', 'requirement', 'looking for']) || undefined,
    propertyName: cell(row, ['property', 'listing', 'estate', 'unit', 'plot']) || undefined,
    marketer: marketer || undefined,
    budget: cell(row, ['budget', 'price range', 'value', 'amount']) || undefined,
    message: cell(row, ['message', 'notes', 'comment', 'remarks', 'note']) || undefined,
    notes: cell(row, ['internal notes', 'agent notes', 'crm notes']) || undefined,
    bookingType: 'import' as const,
    consentMarketing: contactPrefs.email,
    contactPrefs,
    tags,
    events: events.length ? events : undefined,
  };
}

// Header keywords used to locate the real header row in a messy sheet (blank
// title rows, header not on row 1, etc.).
const HEADER_HINTS = ['name', 'email', 'phone', 'mobile', 'whatsapp', 'full name', 'e-mail', 'contact'];

function rowsToObjects(rows: unknown[][]) {
  // Drop fully-empty rows (leading spacer rows are common in exported sheets).
  const nonEmpty = rows.filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmpty.length === 0) return [];
  // Find the header row: the first row containing a recognisable column name,
  // else the row with the most non-empty text cells.
  let headerIdx = nonEmpty.findIndex((r) =>
    r.some((c) => HEADER_HINTS.includes(String(c ?? '').trim().toLowerCase())),
  );
  if (headerIdx === -1) {
    let best = 0, bestCount = -1;
    nonEmpty.slice(0, 5).forEach((r, i) => {
      const count = r.filter((c) => String(c ?? '').trim() !== '' && Number.isNaN(Number(c))).length;
      if (count > bestCount) { bestCount = count; best = i; }
    });
    headerIdx = best;
  }
  const headings = nonEmpty[headerIdx] ?? [];
  const body = nonEmpty.slice(headerIdx + 1);
  const keys = headings.map((heading) => String(heading ?? '').trim());
  return body.map((row) => Object.fromEntries(keys.map((key, index) => [key || `Column ${index + 1}`, row[index] ?? ''])));
}

// RFC-4180-aware CSV parser: handles quoted fields, commas and newlines inside
// quotes, and escaped "" quotes — so names like "Smith, John" stay one field.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // ignore; handled by \n
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.map((r) => r.map((cell) => cell.trim())).filter((r) => r.some(Boolean));
}

function csvToObjects(text: string) {
  return rowsToObjects(parseCsv(text));
}

function fmtDate(value: number) {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(value);
}

function fmtBookingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function CRM() {
  const { token, can } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('leads');
  const [stage, setStage] = useState<Stage | 'all' | 'open'>('all');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<Record<string, boolean>>({});
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [dealForm, setDealForm] = useState(emptyDealForm);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [openLead, setOpenLead] = useState<PanelLead | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkBody, setBulkBody] = useState('Hi {{name}},\n\n');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [recordType, setRecordType] = useState<'lead' | 'client'>('lead');
  const [selectedEstate, setSelectedEstate] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('created_desc');
  const [optinFilter, setOptinFilter] = useState<'all' | 'email' | 'sms' | 'whatsapp'>('all');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [bcChannel, setBcChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [bcSubject, setBcSubject] = useState('');
  const [bcBody, setBcBody] = useState('Hi {{name}},\n\n');
  const [bcOnlyOptedIn, setBcOnlyOptedIn] = useState(true);
  const [bcBusy, setBcBusy] = useState(false);
  const [sheetPicker, setSheetPicker] = useState<Array<{ name: string; rows: unknown[][] }> | null>(null);
  const [importTarget, setImportTarget] = useState<'lead' | 'client'>('lead');
  const [importBusy, setImportBusy] = useState(false);

  const estates = useEstates();
  const rows = useQuery(api.crm.listLeads, token ? { token, recordType } : 'skip') as Lead[] | undefined;
  const celebrations = useQuery(
    api.crm.upcomingCelebrations,
    token && view === 'celebrations' ? { token, days: 60 } : 'skip',
  ) as Array<{ leadId: string; name: string; email?: string; phone?: string; kind: string; note?: string; nextDate: string; daysAway: number }> | undefined;
  const bulkEmail = useAction(api.crm.bulkEmail);
  const broadcast = useAction(api.crm.broadcast);
  const setRecordTypeBulk = useMutation(api.crm.setRecordTypeBulk);

  const convertSelected = async () => {
    if (!token || selected.size === 0) return;
    const target = recordType === 'lead' ? 'client' : 'lead';
    const res = await setRecordTypeBulk({ token, recordType: target, leadIds: [...selected] as Id<'leads'>[] });
    setNotice(`Moved ${res.updated} record${res.updated === 1 ? '' : 's'} to ${target === 'client' ? 'Clients' : 'Leads'}.`);
    setSelected(new Set());
  };

  const sendBroadcast = async () => {
    if (!token || !bcBody.trim()) return;
    setBcBusy(true);
    try {
      const res = await broadcast({
        token,
        channel: bcChannel,
        recordType,
        stage: stage === 'all' || stage === 'open' ? undefined : stage,
        onlyOptedIn: bcOnlyOptedIn,
        subject: bcChannel === 'email' ? (bcSubject.trim() || 'Ehi-Kings Real Estate') : undefined,
        body: bcBody,
      });
      if (!res.configured) setNotice(res.note ?? `${bcChannel} channel is not connected yet.`);
      else setNotice(`Broadcast: ${res.sent} sent via ${bcChannel}${res.failed ? `, ${res.failed} failed` : ''}${res.skipped ? `, ${res.skipped} over the send cap` : ''}.`);
      setBroadcastOpen(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBcBusy(false);
    }
  };
  const pipelineData = useQuery(api.sales.pipeline, token && view === 'pipeline' ? { token } : 'skip') as
    | { deals: Deal[]; totals: { open: number; won: number; count: number } }
    | undefined;
  const companies = useQuery(
    api.sales.listCompanies,
    token && (view === 'pipeline' || view === 'companies') ? { token } : 'skip',
  ) as Company[] | undefined;

  const importLeads = useMutation(api.crm.importLeads);
  const updateLead = useMutation(api.crm.updateLead);
  const sendMail = useAction(api.zoho.sendMail);
  const moveDeal = useMutation(api.sales.moveDeal);
  const upsertDeal = useMutation(api.sales.upsertDeal);
  const upsertCompany = useMutation(api.sales.upsertCompany);
  const dealFromLead = useMutation(api.sales.dealFromLead);

  const prefsOf = (lead: Lead) => lead.contactPrefs ?? { email: lead.consentMarketing, sms: false, whatsapp: false };

  const leads = useMemo(() => {
    let staged =
      stage === 'all'
        ? (rows ?? [])
        : stage === 'open'
          ? (rows ?? []).filter((lead) => !['closed', 'lost'].includes(lead.stage))
          : (rows ?? []).filter((lead) => lead.stage === stage);
    if (optinFilter !== 'all') staged = staged.filter((lead) => prefsOf(lead)[optinFilter]);
    const q = search.trim().toLowerCase();
    const searched = !q
      ? staged
      : staged.filter((lead) => [lead.name, lead.email, lead.phone, lead.service, lead.propertyName, lead.message]
          .filter(Boolean).join(' ').toLowerCase().includes(q));
    const sorted = [...searched];
    const budget = (l: Lead) => Number((l.budget ?? '').replace(/[^0-9.]/g, '')) || 0;
    sorted.sort((a, b) => {
      switch (sort) {
        case 'created_asc': return a.createdAt - b.createdAt;
        case 'name': return a.name.localeCompare(b.name);
        case 'stage': return a.stage.localeCompare(b.stage);
        case 'priority': return (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
        case 'contacted': return (b.lastContactedAt ?? 0) - (a.lastContactedAt ?? 0);
        case 'budget': return budget(b) - budget(a);
        case 'property': return (a.propertyName ?? '~').localeCompare(b.propertyName ?? '~');
        case 'marketer': return (a.marketer ?? '~').localeCompare(b.marketer ?? '~');
        case 'booking': return a.bookingType.localeCompare(b.bookingType);
        case 'celebration': return nextCelebrationDays(a) - nextCelebrationDays(b);
        case 'optin': return Number(prefsOf(b).email) - Number(prefsOf(a).email);
        case 'source': return a.source.localeCompare(b.source);
        default: return b.createdAt - a.createdAt;
      }
    });
    return sorted;
  }, [rows, search, stage, sort, optinFilter]);

  const stats = useMemo(() => {
    const all = rows ?? [];
    const p = (l: Lead) => l.contactPrefs ?? { email: l.consentMarketing, sms: false, whatsapp: false };
    return {
      total: all.length,
      open: all.filter((lead) => !['closed', 'lost'].includes(lead.stage)).length,
      reachable: all.filter((lead) => { const x = p(lead); return x.email || x.sms || x.whatsapp; }).length,
      email: all.filter((lead) => p(lead).email).length,
      whatsapp: all.filter((lead) => p(lead).whatsapp).length,
      inspections: all.filter((lead) => lead.bookingType === 'inspection' || lead.stage === 'inspection_booked').length,
      closed: all.filter((lead) => lead.stage === 'closed').length,
    };
  }, [rows]);

  const bookingGroups = useMemo(() => {
    const items = (rows ?? []).filter((lead) => lead.bookingType === 'inspection' || lead.bookingType === 'consultation');
    const byDate = new Map<string, Lead[]>();
    for (const lead of items) {
      const key = lead.preferredDate ?? '';
      byDate.set(key, [...(byDate.get(key) ?? []), lead]);
    }
    const sortByTime = (group: Lead[]) =>
      [...group].sort((a, b) => (a.preferredTime ?? '\uffff').localeCompare(b.preferredTime ?? '\uffff'));
    const dated = [...byDate.entries()]
      .filter(([key]) => key !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, group]) => ({ date, leads: sortByTime(group) }));
    const unscheduled = byDate.get('');
    return unscheduled ? [...dated, { date: '', leads: sortByTime(unscheduled) }] : dated;
  }, [rows]);

  // Group leads by their estate of interest, joined to the live estate record.
  const estateGroups = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const lead of rows ?? []) {
      const key = lead.propertySlug || lead.propertyName || '';
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), lead]);
    }
    return [...map.entries()]
      .map(([key, group]) => ({
        key,
        estate: estates.find((e) => e.slug === key || e.name === key),
        name: group[0].propertyName || key,
        leads: group,
      }))
      .sort((a, b) => b.leads.length - a.leads.length);
  }, [rows, estates]);

  const noEstateCount = useMemo(
    () => (rows ?? []).filter((l) => !l.propertySlug && !l.propertyName).length,
    [rows],
  );

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedWithEmail = useMemo(
    () => (rows ?? []).filter((l) => selected.has(l._id) && l.email).length,
    [rows, selected],
  );

  const sendBulk = async () => {
    if (!token || selected.size === 0 || !bulkSubject.trim()) return;
    setBulkBusy(true);
    try {
      const res = await bulkEmail({
        token,
        leadIds: [...selected] as Id<'leads'>[],
        subject: bulkSubject.trim(),
        body: bulkBody,
      });
      setNotice(`Sent ${res.sent} email${res.sent === 1 ? '' : 's'}${res.failed ? `, ${res.failed} skipped (no email/failed)` : ''}.${res.errors.length ? ` ${res.errors[0]}` : ''}`);
      setBulkOpen(false);
      setSelected(new Set());
      setBulkSubject('');
      setBulkBody('Hi {{name}},\n\n');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  };

  // Import parsed row-objects into the CRM as leads or clients. `estate`
  // (the sheet name) tags every record with its property when not already set,
  // so each estate sheet groups under that estate in the By-estate view.
  const importObjects = async (objects: Record<string, unknown>[], target: 'lead' | 'client', estate?: string) => {
    if (!token) return 0;
    const parsed = objects
      .map(leadFromRow)
      .filter((lead) => lead.email || lead.phone || lead.name)
      .map((lead) => (estate && !lead.propertyName ? { ...lead, propertyName: estate } : lead));
    if (parsed.length === 0) return 0;
    const result = await importLeads({ token, leads: parsed, recordType: target });
    return (result.imported ?? 0) + (result.updated ?? 0);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || !token) return;
    setImportTarget(recordType);
    const noun = recordType === 'client' ? 'client' : 'lead';
    if (file.name.toLowerCase().endsWith('.csv')) {
      setNotice('Reading spreadsheet…');
      const n = await importObjects(csvToObjects(await file.text()), recordType);
      setNotice(n ? `Imported ${n} ${noun}${n === 1 ? '' : 's'}.` : 'No importable rows (need email or phone).');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    // Excel — the default export returns every sheet: [{ sheet, data }, …]
    setNotice('Reading workbook…');
    const sheets = (await readXlsxFile(file, { getSheets: true } as never)) as unknown as Array<{ sheet: string; data: unknown[][] }>;
    const usable = (Array.isArray(sheets) ? sheets : []).map((s) => ({ name: s.sheet, rows: s.data })).filter((s) => (s.rows?.length ?? 0) > 1);
    if (fileRef.current) fileRef.current.value = '';
    if (usable.length === 0) { setNotice('No data rows found in this workbook.'); return; }
    if (usable.length === 1) {
      const n = await importObjects(rowsToObjects(usable[0].rows), recordType, usable[0].name);
      setNotice(n ? `Imported ${n} ${noun}${n === 1 ? '' : 's'} from “${usable[0].name}”.` : 'No importable rows (need email or phone).');
      return;
    }
    // Multiple sheets → let the user choose which sheet(s) + target.
    setNotice('');
    setSheetPicker(usable);
  };

  const importSheet = async (sheet: { name: string; rows: unknown[][] }) => {
    setImportBusy(true);
    try {
      const n = await importObjects(rowsToObjects(sheet.rows), importTarget, sheet.name);
      setNotice(n ? `Imported ${n} ${importTarget === 'client' ? 'client' : 'lead'}${n === 1 ? '' : 's'} from “${sheet.name}”.` : `No importable rows in “${sheet.name}” (need email or phone).`);
      setSheetPicker((prev) => (prev ? prev.filter((s) => s.name !== sheet.name) : prev));
    } finally {
      setImportBusy(false);
    }
  };

  const quickEmail = async (lead: Lead) => {
    if (!token || !lead.email) return;
    setSendingId(lead._id);
    const template = templateFor(lead);
    const result = await sendMail({ token, to: lead.email, subject: template.subject, body: template.body });
    if (result.ok) {
      await updateLead({ token, leadId: lead._id, stage: 'contacted', lastContactedAt: Date.now() });
      setNotice(`Email sent to ${lead.name}.`);
    } else {
      setNotice(result.error ?? 'Could not send email. Connect Zoho Mail first.');
    }
    setSendingId(null);
  };

  const promoteLead = async (lead: Lead) => {
    if (!token || promoted[lead._id]) return;
    setPromotingId(lead._id);
    try {
      await dealFromLead({ token, leadId: lead._id });
      setPromoted((prev) => ({ ...prev, [lead._id]: true }));
      setNotice(`"${lead.name}" added to the sales pipeline.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setPromotingId(null);
    }
  };

  const shiftDeal = async (deal: Deal, direction: -1 | 1) => {
    if (!token) return;
    const index = DEAL_STAGES.indexOf(deal.stage);
    const next = DEAL_STAGES[index + direction];
    if (!next) return;
    await moveDeal({ token, dealId: deal.id, stage: next });
  };

  const setDealStage = async (deal: Deal, next: DealStage) => {
    if (!token || next === deal.stage) return;
    await moveDeal({ token, dealId: deal.id, stage: next });
  };

  const submitDeal = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setBusy('deal');
    try {
      await upsertDeal({
        token,
        name: dealForm.name.trim(),
        value: Number(dealForm.value) || 0,
        stage: dealForm.stage,
        companyId: dealForm.companyId ? (dealForm.companyId as Id<'companies'>) : undefined,
        contactName: dealForm.contactName.trim() || undefined,
        expectedClose: dealForm.expectedClose || undefined,
        notes: dealForm.notes.trim() || undefined,
      });
      setNotice(`Deal "${dealForm.name.trim()}" saved to the pipeline.`);
      setDealForm(emptyDealForm);
      setDealFormOpen(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy('');
    }
  };

  const submitCompany = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setBusy('company');
    try {
      await upsertCompany({
        token,
        name: companyForm.name.trim(),
        domain: companyForm.domain.trim() || undefined,
        email: companyForm.email.trim() || undefined,
        phone: companyForm.phone.trim() || undefined,
        location: companyForm.location.trim() || undefined,
        notes: companyForm.notes.trim() || undefined,
      });
      setNotice(`Company "${companyForm.name.trim()}" saved.`);
      setCompanyForm(emptyCompanyForm);
      setCompanyFormOpen(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">CRM</h1>
          <p className="admin-page-copy">
            {recordType === 'client'
              ? 'Your existing client database — everyone you have done business with. Same tools as leads: profiles, celebrations, broadcasts.'
              : 'Website enquiries, inspections, opt-ins, and imported sheets — plus the deal pipeline.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <a href="/book" target="_blank" rel="noreferrer" className="admin-secondary-button">
            Booking page
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <AddMenu
            label="New"
            options={[
              { key: 'deal', label: 'New deal', icon: Handshake, hint: 'Add to the sales pipeline' },
              { key: 'company', label: 'New company', icon: Building2, hint: 'Add an account' },
              ...(can('view_reports') ? [{ key: 'import', label: `Import ${recordType === 'client' ? 'clients' : 'leads'}`, icon: Upload, hint: 'Excel or CSV, multi-sheet' }] : []),
            ]}
            onPick={(key) => {
              if (key === 'deal') { setView('pipeline'); setStage('all'); setDealForm(emptyDealForm); setDealFormOpen(true); }
              else if (key === 'company') { setView('companies'); setStage('all'); setCompanyForm(emptyCompanyForm); setCompanyFormOpen(true); }
              else if (key === 'import') fileRef.current?.click();
            }}
          />
        </div>
      </div>

      {/* Leads vs existing-clients database */}
      <div className="admin-segmented mt-5 w-fit">
        {(['lead', 'client'] as const).map((rt) => (
          <button
            key={rt}
            type="button"
            onClick={() => { setRecordType(rt); setSelected(new Set()); setView('leads'); setStage('all'); }}
            className={`admin-segmented-button ${recordType === rt ? 'is-active' : ''}`}
          >
            {rt === 'lead' ? <UsersRound className="h-4 w-4" /> : <Handshake className="h-4 w-4" />}
            {rt === 'lead' ? 'Leads' : 'Clients'}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => { setView(item.value); setStage('all'); setSelectedEstate(null); }}
            className={`admin-secondary-button shrink-0 ${view === item.value ? 'border-accent text-accent' : ''}`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="admin-card mt-5 flex items-center gap-2 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-2" />
          {notice}
        </div>
      )}

      {view === 'leads' && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={UsersRound} label={recordType === 'client' ? 'Total clients' : 'Open leads'} value={recordType === 'client' ? stats.total : stats.open} />
            <Stat icon={Clock} label="Inspections" value={stats.inspections} />
            <Stat icon={Mail} label="Reachable (any channel)" value={stats.reachable} />
            <Stat icon={CheckCircle2} label={recordType === 'client' ? 'WhatsApp opt-ins' : 'Closed'} value={recordType === 'client' ? stats.whatsapp : stats.closed} />
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-72 lg:shrink-0">
              <Search className="pointer-events-none absolute left-[0.95rem] top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${recordType === 'client' ? 'clients' : 'leads'}…`}
                className="admin-search"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="admin-filter-select" aria-label="Sort by">
                {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
              </select>
              <select value={optinFilter} onChange={(e) => setOptinFilter(e.target.value as typeof optinFilter)} className="admin-filter-select" aria-label="Contactable via">
                <option value="all">Any channel</option>
                <option value="email">Email opt-in</option>
                <option value="sms">SMS opt-in</option>
                <option value="whatsapp">WhatsApp opt-in</option>
              </select>
              <button type="button" onClick={() => setBroadcastOpen(true)} className="admin-primary-button">
                <MailPlus className="h-4 w-4" /> Broadcast
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {stages.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStage(item.value)}
                className={`admin-secondary-button shrink-0 ${stage === item.value ? 'border-accent text-accent' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <div className="admin-command-bar mt-5 flex-wrap gap-3">
              <span className="text-sm text-primary">{selected.size} selected · {selectedWithEmail} with email</span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setBulkOpen(true)} className="admin-primary-button" disabled={selectedWithEmail === 0}>
                  <MailPlus className="h-4 w-4" /> Email selected
                </button>
                <button type="button" onClick={convertSelected} className="admin-secondary-button">
                  <Handshake className="h-4 w-4" /> Move to {recordType === 'lead' ? 'Clients' : 'Leads'}
                </button>
                <button type="button" onClick={() => setSelected(new Set())} className="admin-secondary-button">
                  <X className="h-4 w-4" /> Clear
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {!rows && <div className="admin-card p-5 text-sm text-muted">Loading CRM...</div>}
            {rows && leads.length === 0 && <div className="admin-card p-5 text-sm text-muted">No leads match this view.</div>}
            {rows && leads.length > 0 && (
              <div className="flex items-center gap-2 px-1 text-xs text-muted">
                <button type="button" onClick={() => setSelected(new Set(leads.map((l) => l._id)))} className="hover:text-accent">Select all {leads.length}</button>
                <span>·</span>
                <span>Click a name to open the full profile</span>
              </div>
            )}
            {leads.map((lead) => (
              <article key={lead._id} className="admin-task-card">
                <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr_0.8fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(lead._id)}
                        onChange={() => toggleSelect(lead._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 shrink-0 accent-[var(--color-accent-2)]"
                        aria-label={`Select ${lead.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => setOpenLead(lead as unknown as PanelLead)}
                        className="text-left text-lg text-primary transition-colors hover:text-accent"
                      >
                        {lead.name}
                      </button>
                      <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-accent">
                        {bookingLabels[lead.bookingType]}
                      </span>
                      {(['email', 'sms', 'whatsapp'] as const).map((ch) =>
                        prefsOf(lead)[ch] ? (
                          <span key={ch} className="rounded-full bg-accent-2/14 px-2 py-1 text-[0.58rem] uppercase tracking-[0.1em] text-accent-2">
                            {ch === 'whatsapp' ? 'WA' : ch}
                          </span>
                        ) : null,
                      )}
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                      {lead.message || lead.interest || 'No message yet.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>{lead.email || 'No email'}</span>
                      <span>{lead.phone || 'No phone'}</span>
                      <span>{fmtDate(lead.createdAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-primary/80">
                    <div>{lead.service}</div>
                    {/* Notion-style editable estate variable — change it inline */}
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <select
                        value={lead.propertySlug ?? ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const est = estates.find((x) => x.slug === e.target.value);
                          updateLead({ token: token!, leadId: lead._id, propertySlug: e.target.value || undefined, propertyName: est?.name });
                        }}
                        className={`admin-filter-select max-w-[15rem] ${lead.propertyName ? 'text-accent-2' : 'text-muted'}`}
                        aria-label="Estate of interest"
                      >
                        <option value="">{lead.propertyName ? `${lead.propertyName} (unlinked)` : '+ Add estate'}</option>
                        {estates.map((est) => <option key={est.slug} value={est.slug}>{est.name}</option>)}
                      </select>
                    </div>
                    {lead.marketer && <div className="text-muted">Marketer: {lead.marketer}</div>}
                    {lead.budget && <div className="text-muted">Budget: {lead.budget}</div>}
                    {lead.preferredDate && (
                      <div className="text-muted">
                        Preferred: {lead.preferredDate} {lead.preferredTime || ''}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <select
                      value={lead.stage}
                      onChange={(event) => updateLead({ token: token!, leadId: lead._id, stage: event.target.value as Stage })}
                      className="admin-filter-select"
                    >
                      {stages.filter((item) => item.value !== 'all').map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={(lead.nextActionAt ?? '').slice(0, 10)}
                      onChange={(event) => updateLead({ token: token!, leadId: lead._id, nextActionAt: event.target.value })}
                      className="admin-filter-select"
                      aria-label="Next action date"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {lead.email ? (
                      <>
                        <button
                          type="button"
                          onClick={() => quickEmail(lead)}
                          disabled={sendingId === lead._id}
                          className="admin-primary-button"
                        >
                          <Mail className="h-4 w-4" />
                          {sendingId === lead._id ? 'Sending' : 'Send email'}
                        </button>
                        <a href={`mailto:${lead.email}`} className="admin-secondary-button">Mail app</a>
                      </>
                    ) : lead.phone ? (
                      <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="admin-secondary-button">Call</a>
                    ) : (
                      <span className="admin-secondary-button cursor-not-allowed opacity-50" aria-disabled="true">No contact</span>
                    )}
                    <button
                      type="button"
                      onClick={() => promoteLead(lead)}
                      disabled={promotingId === lead._id || promoted[lead._id]}
                      className={`admin-secondary-button ${promoted[lead._id] ? 'border-accent-2 text-accent-2' : ''}`}
                      title="Create a pipeline deal from this lead"
                    >
                      {promotingId === lead._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : promoted[lead._id] ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <SquareKanban className="h-4 w-4" />
                      )}
                      {promoted[lead._id] ? 'In pipeline' : '→ Deal'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                  <textarea
                    defaultValue={lead.notes ?? ''}
                    onBlur={(event) => updateLead({ token: token!, leadId: lead._id, notes: event.target.value })}
                    placeholder="Internal notes..."
                    className="min-h-16 resize-y rounded-[var(--admin-radius-control)] border border-rule bg-transparent px-3 py-2 text-sm text-primary outline-none placeholder:text-muted focus:border-accent"
                  />
                  <div className="text-xs text-muted">
                    Stage: <span className="text-primary">{stageLabels[lead.stage]}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {view === 'estates' && (() => {
        const active = selectedEstate ? estateGroups.find((g) => g.key === selectedEstate) : null;
        // ── Level 2: one estate's clients ──
        if (active) {
          return (
            <div className="mt-6">
              <button type="button" onClick={() => setSelectedEstate(null)} className="admin-secondary-button mb-4">
                <ChevronLeft className="h-4 w-4" /> All estates
              </button>
              <div className="admin-panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {active.estate?.img && <img src={active.estate.img} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <p className="truncate text-primary">{active.name}</p>
                      <p className="truncate text-xs text-muted">{active.estate ? `${active.estate.location} · ${active.estate.price}` : 'Not in the live listings'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent/12 px-3 py-1 text-xs text-accent">{active.leads.length} {recordType === 'client' ? 'client' : 'lead'}{active.leads.length === 1 ? '' : 's'}</span>
                </div>
                <div className="divide-y divide-white/6">
                  {active.leads.map((lead) => (
                    <button
                      key={lead._id}
                      type="button"
                      onClick={() => setOpenLead(lead as unknown as PanelLead)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-primary">{lead.name}</p>
                        <p className="truncate text-xs text-muted">
                          {lead.email || lead.phone || 'No contact'}
                          {lead.marketer ? ` · ${lead.marketer}` : ''} · {stageLabels[lead.stage]}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        // ── Level 1: minimal list of estates ──
        return (
          <div className="mt-6">
            {!rows && <div className="admin-card p-5 text-sm text-muted">Loading…</div>}
            {rows && estateGroups.length === 0 && (
              <div className="admin-card p-5 text-sm text-muted">No records are linked to an estate yet.</div>
            )}
            {estateGroups.length > 0 && (
              <div className="admin-panel divide-y divide-white/6 overflow-hidden">
                {estateGroups.map((group) => (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => setSelectedEstate(group.key)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Building2 className="h-4 w-4 shrink-0 text-accent" />
                      <span className="truncate text-primary">{group.name}</span>
                    </div>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-accent/12 px-3 py-1 text-xs text-accent">{group.leads.length}</span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </span>
                  </button>
                ))}
              </div>
            )}
            {noEstateCount > 0 && (
              <p className="mt-3 px-1 text-xs text-muted">{noEstateCount} {recordType === 'client' ? 'client' : 'lead'}{noEstateCount === 1 ? '' : 's'} not linked to any estate.</p>
            )}
          </div>
        );
      })()}

      {view === 'celebrations' && (
        <div className="mt-6 space-y-3">
          <div className="admin-card flex items-start gap-3 p-4 text-sm text-muted">
            <Gift className="h-4 w-4 shrink-0 text-accent-2" />
            Upcoming birthdays, anniversaries and key dates in the next 60 days. Add dates from any lead’s profile — a warm message on the right day keeps clients for life.
          </div>
          {!celebrations && <div className="admin-card p-5 text-sm text-muted">Loading…</div>}
          {celebrations && celebrations.length === 0 && (
            <div className="admin-card p-5 text-sm text-muted">No celebrations coming up. Open a lead and add a birthday or anniversary under “Celebrations & key dates”.</div>
          )}
          {(celebrations ?? []).map((c, i) => {
            const lead = (rows ?? []).find((l) => l._id === c.leadId);
            return (
              <div key={`${c.leadId}-${i}`} className="admin-card flex flex-wrap items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-2/12 text-accent-2">
                  {c.kind.toLowerCase().includes('birth') ? <Cake className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-primary">{c.name} · <span className="text-accent-2">{c.kind}</span></p>
                  <p className="text-xs text-muted">
                    {new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long' }).format(new Date(c.nextDate))}
                    {' · '}{c.daysAway === 0 ? 'Today 🎉' : c.daysAway === 1 ? 'Tomorrow' : `in ${c.daysAway} days`}
                    {c.note ? ` · ${c.note}` : ''}
                  </p>
                </div>
                {lead && (
                  <button type="button" onClick={() => setOpenLead(lead as unknown as PanelLead)} className="admin-secondary-button">
                    Open
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'pipeline' && (
        <>
          {!pipelineData ? (
            <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid flex-1 gap-3 sm:grid-cols-3">
                  <div className="admin-card p-4">
                    <div className="font-heading text-2xl font-light tnum text-primary">{fmtNaira(pipelineData.totals.open)}</div>
                    <div className="mt-0.5 text-[0.7rem] text-white/45">Open pipeline</div>
                  </div>
                  <div className="admin-card p-4">
                    <div className="font-heading text-2xl font-light tnum text-accent-2">{fmtNaira(pipelineData.totals.won)}</div>
                    <div className="mt-0.5 text-[0.7rem] text-white/45">Won</div>
                  </div>
                  <div className="admin-card p-4">
                    <div className="font-heading text-2xl font-light tnum text-primary">{pipelineData.totals.count}</div>
                    <div className="mt-0.5 text-[0.7rem] text-white/45">Total deals</div>
                  </div>
                </div>
                <button type="button" onClick={() => setDealFormOpen((v) => !v)} className="admin-primary-button shrink-0 self-start sm:self-center">
                  <Plus className="h-4 w-4" />
                  New deal
                </button>
              </div>

              {dealFormOpen && (
                <form onSubmit={submitDeal} className="admin-panel mt-5 space-y-3 p-4 md:p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={dealForm.name}
                      onChange={(event) => setDealForm({ ...dealForm, name: event.target.value })}
                      placeholder="Deal name"
                      required
                      className="admin-input"
                    />
                    <input
                      type="number"
                      min={0}
                      value={dealForm.value}
                      onChange={(event) => setDealForm({ ...dealForm, value: event.target.value })}
                      placeholder="Value (₦)"
                      className="admin-input"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={dealForm.stage}
                      onChange={(event) => setDealForm({ ...dealForm, stage: event.target.value as DealStage })}
                      className="admin-input"
                    >
                      {DEAL_STAGES.map((value) => (
                        <option key={value} value={value}>{dealStageLabels[value]}</option>
                      ))}
                    </select>
                    <select
                      value={dealForm.companyId}
                      onChange={(event) => setDealForm({ ...dealForm, companyId: event.target.value })}
                      className="admin-input"
                    >
                      <option value="">No company — use contact name</option>
                      {(companies ?? []).map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={dealForm.contactName}
                      onChange={(event) => setDealForm({ ...dealForm, contactName: event.target.value })}
                      placeholder="Contact name (if no company)"
                      className="admin-input"
                    />
                    <input
                      type="date"
                      value={dealForm.expectedClose}
                      onChange={(event) => setDealForm({ ...dealForm, expectedClose: event.target.value })}
                      className="admin-input"
                      aria-label="Expected close date"
                    />
                  </div>
                  <textarea
                    value={dealForm.notes}
                    onChange={(event) => setDealForm({ ...dealForm, notes: event.target.value })}
                    placeholder="Notes..."
                    rows={3}
                    className="admin-input resize-none"
                  />
                  <button type="submit" disabled={busy === 'deal'} className="admin-primary-button">
                    {busy === 'deal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Save deal
                  </button>
                </form>
              )}

              <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
                {DEAL_STAGES.map((column) => {
                  const columnDeals = pipelineData.deals.filter((deal) => deal.stage === column);
                  const columnValue = columnDeals.reduce((sum, deal) => sum + deal.value, 0);
                  return (
                    <div key={column} className="min-w-[15rem] flex-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs uppercase tracking-[0.12em] text-white/50">{dealStageLabels[column]}</span>
                        <span className="text-xs tnum text-white/38">{columnDeals.length} · {fmtNaira(columnValue)}</span>
                      </div>
                      <div className="mt-2 space-y-2">
                        {columnDeals.length === 0 && (
                          <div className="rounded-[var(--admin-radius-control)] border border-dashed border-rule px-3 py-5 text-center text-xs text-white/38">
                            No deals
                          </div>
                        )}
                        {columnDeals.map((deal) => {
                          const index = DEAL_STAGES.indexOf(deal.stage);
                          return (
                            <div key={deal.id} className="admin-card p-3">
                              <div className="text-sm text-primary">{deal.name}</div>
                              {(deal.company || deal.contactName) && (
                                <div className="mt-0.5 truncate text-xs text-white/50">{deal.company ?? deal.contactName}</div>
                              )}
                              <div className="mt-1.5 text-sm tnum text-accent">{fmtNaira(deal.value)}</div>
                              {deal.expectedClose && (
                                <div className="mt-1 flex items-center gap-1 text-[0.68rem] text-white/38">
                                  <CalendarDays className="h-3 w-3" />
                                  {deal.expectedClose}
                                </div>
                              )}
                              <div className="mt-2.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => shiftDeal(deal, -1)}
                                  disabled={index === 0}
                                  className="rounded-md border border-rule p-1 text-muted transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label="Move to previous stage"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => shiftDeal(deal, 1)}
                                  disabled={index === DEAL_STAGES.length - 1}
                                  className="rounded-md border border-rule p-1 text-muted transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label="Move to next stage"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <select
                                  value={deal.stage}
                                  onChange={(event) => setDealStage(deal, event.target.value as DealStage)}
                                  className="min-w-0 flex-1 rounded-md border border-rule bg-transparent px-1.5 py-1 text-[0.68rem] text-muted outline-none focus:border-accent"
                                  aria-label="Deal stage"
                                >
                                  {DEAL_STAGES.map((value) => (
                                    <option key={value} value={value}>{dealStageLabels[value]}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {view === 'companies' && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/70">Companies</h2>
            <button type="button" onClick={() => setCompanyFormOpen((v) => !v)} className="admin-primary-button">
              <Plus className="h-4 w-4" />
              New company
            </button>
          </div>

          {companyFormOpen && (
            <form onSubmit={submitCompany} className="admin-panel mt-4 space-y-3 p-4 md:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={companyForm.name}
                  onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })}
                  placeholder="Company name"
                  required
                  className="admin-input"
                />
                <input
                  value={companyForm.domain}
                  onChange={(event) => setCompanyForm({ ...companyForm, domain: event.target.value })}
                  placeholder="Website / domain"
                  className="admin-input"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(event) => setCompanyForm({ ...companyForm, email: event.target.value })}
                  placeholder="Email"
                  className="admin-input"
                />
                <input
                  value={companyForm.phone}
                  onChange={(event) => setCompanyForm({ ...companyForm, phone: event.target.value })}
                  placeholder="Phone"
                  className="admin-input"
                />
                <input
                  value={companyForm.location}
                  onChange={(event) => setCompanyForm({ ...companyForm, location: event.target.value })}
                  placeholder="Location"
                  className="admin-input"
                />
              </div>
              <textarea
                value={companyForm.notes}
                onChange={(event) => setCompanyForm({ ...companyForm, notes: event.target.value })}
                placeholder="Notes..."
                rows={3}
                className="admin-input resize-none"
              />
              <button type="submit" disabled={busy === 'company'} className="admin-primary-button">
                {busy === 'company' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save company
              </button>
            </form>
          )}

          {!companies ? (
            <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
          ) : companies.length === 0 ? (
            <div className="admin-card mt-4 p-5 text-sm text-muted">No companies yet — add the first one.</div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {companies.map((company) => (
                <div key={company.id} className="admin-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Building2 className="h-4 w-4 text-accent" />
                      {company.name}
                    </div>
                    <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-accent">
                      {company.dealCount} deal{company.dealCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-white/50">
                    {company.domain && <div>{company.domain}</div>}
                    {company.email && <div>{company.email}</div>}
                    {company.phone && <div>{company.phone}</div>}
                    {company.location && <div>{company.location}</div>}
                  </div>
                  {company.notes && <p className="mt-2 text-xs leading-5 text-white/38">{company.notes}</p>}
                  <div className="mt-3 text-sm tnum text-accent">{fmtNaira(company.pipelineValue)} <span className="text-[0.68rem] text-white/38">open pipeline</span></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'bookings' && (
        <>
          {!rows ? (
            <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
          ) : bookingGroups.length === 0 ? (
            <div className="admin-card mt-6 p-5 text-sm text-muted">No inspection or consultation bookings yet.</div>
          ) : (
            <div className="mt-6 space-y-6">
              {bookingGroups.map((group) => (
                <div key={group.date || 'unscheduled'}>
                  <h2 className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {group.date ? fmtBookingDate(group.date) : 'Unscheduled'}
                  </h2>
                  <div className="mt-3 space-y-2">
                    {group.leads.map((lead) => (
                      <div key={lead._id} className="admin-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                        <div className="w-20 shrink-0 text-sm tnum text-accent">{lead.preferredTime || '—'}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-primary">{lead.name}</span>
                            <span className="rounded-full bg-accent/12 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-accent">
                              {bookingLabels[lead.bookingType]}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-white/50">
                            <span>{lead.phone || lead.email || 'No contact'}</span>
                            <span>{lead.service}</span>
                          </div>
                        </div>
                        <span className="shrink-0 self-start rounded-full bg-accent-2/14 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.12em] text-accent-2 sm:self-center">
                          {stageLabels[lead.stage]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Notion-style lead profile slide-over */}
      <LeadPanel lead={openLead} onClose={() => setOpenLead(null)} />

      {/* Broadcast composer — email / SMS / WhatsApp to a segment */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setBroadcastOpen(false)}>
          <div className="admin-panel w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="admin-page-title font-heading text-xl">Broadcast</h2>
              <button type="button" onClick={() => setBroadcastOpen(false)} className="admin-icon-button rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-xs text-muted">
              Sends to all <strong className="text-primary">{recordType === 'client' ? 'clients' : 'leads'}</strong>
              {stage !== 'all' && stage !== 'open' ? ` in stage “${stage}”` : ''} who can be reached on this channel. Use <code className="text-accent-2">{'{{name}}'}</code> for the first name.
            </p>

            <div className="admin-segmented mt-4 w-fit">
              {(['email', 'sms', 'whatsapp'] as const).map((ch) => (
                <button key={ch} type="button" onClick={() => setBcChannel(ch)} className={`admin-segmented-button ${bcChannel === ch ? 'is-active' : ''}`}>
                  {ch === 'whatsapp' ? 'WhatsApp' : ch.toUpperCase()}
                </button>
              ))}
            </div>

            {bcChannel === 'email' && (
              <input value={bcSubject} onChange={(e) => setBcSubject(e.target.value)} placeholder="Subject" className="admin-input mt-3 w-full" />
            )}
            <textarea value={bcBody} onChange={(e) => setBcBody(e.target.value)} rows={7} placeholder="Your message…" className="admin-input mt-3 w-full resize-y" />

            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={bcOnlyOptedIn} onChange={(e) => setBcOnlyOptedIn(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent-2)]" />
              Only send to people opted in to {bcChannel === 'whatsapp' ? 'WhatsApp' : bcChannel.toUpperCase()}
            </label>
            {bcChannel !== 'email' && (
              <p className="mt-2 text-xs text-muted">
                {bcChannel === 'sms' ? 'SMS' : 'WhatsApp'} sends require a provider — {bcChannel === 'sms' ? 'Twilio' : 'Meta WhatsApp Cloud API'} keys in the Convex env. Until then this reports “not connected”.
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setBroadcastOpen(false)} className="admin-secondary-button">Cancel</button>
              <button type="button" onClick={sendBroadcast} disabled={bcBusy || !bcBody.trim()} className="admin-primary-button">
                {bcBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Send broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-sheet import picker */}
      {sheetPicker && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSheetPicker(null)}>
          <div className="admin-panel w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="admin-page-title font-heading text-xl">Import from workbook</h2>
              <button type="button" onClick={() => setSheetPicker(null)} className="admin-icon-button rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-xs text-muted">This workbook has {sheetPicker.length} sheets. Choose a target, then import each sheet.</p>
            <div className="admin-segmented mt-4 w-fit">
              {(['lead', 'client'] as const).map((rt) => (
                <button key={rt} type="button" onClick={() => setImportTarget(rt)} className={`admin-segmented-button ${importTarget === rt ? 'is-active' : ''}`}>
                  Import as {rt === 'lead' ? 'Leads' : 'Clients'}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-2">
              {sheetPicker.map((s) => (
                <div key={s.name} className="admin-card flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-primary">{s.name}</p>
                    <p className="text-xs text-muted">{Math.max(0, s.rows.length - 1)} data rows</p>
                  </div>
                  <button type="button" onClick={() => importSheet(s)} disabled={importBusy} className="admin-primary-button">
                    {importBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setSheetPicker(null)} className="admin-secondary-button">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk email composer */}
      {bulkOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setBulkOpen(false)}>
          <div className="admin-panel w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="admin-page-title font-heading text-xl">Email {selectedWithEmail} lead{selectedWithEmail === 1 ? '' : 's'}</h2>
              <button type="button" onClick={() => setBulkOpen(false)} className="admin-icon-button rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-xs text-muted">Sends from your connected Zoho mailbox. Use <code className="text-accent-2">{'{{name}}'}</code> to insert each person’s first name.</p>
            <input
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              placeholder="Subject"
              className="admin-input mt-4 w-full"
            />
            <textarea
              value={bulkBody}
              onChange={(e) => setBulkBody(e.target.value)}
              rows={8}
              placeholder="Your message…"
              className="admin-input mt-3 w-full resize-y"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="admin-secondary-button">Cancel</button>
              <button type="button" onClick={sendBulk} disabled={bulkBusy || !bulkSubject.trim()} className="admin-primary-button">
                {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Send to {selectedWithEmail}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return (
    <div className="admin-stat-card">
      <Icon className="mb-5 h-5 w-5 text-accent" />
      <div className="text-2xl font-light text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
