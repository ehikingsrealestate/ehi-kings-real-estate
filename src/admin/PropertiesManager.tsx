import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Building2, Plus, Loader2, Trash2, Eye, EyeOff, Download, Check, ArrowLeft, Star } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';
import { ESTATES } from '../data/site';

type Tier = { label: string; price: string; note?: string };
type Form = {
  slug: string; name: string; location: string; region: string;
  kind: 'land' | 'home'; title: string; size: string; price: string; note: string;
  overview: string; features: string; img: string; priceTiers: Tier[]; featured: boolean;
};

const blank: Form = {
  slug: '', name: '', location: '', region: 'Lagos', kind: 'land',
  title: '', size: '', price: '', note: '', overview: '', features: '', img: '', priceTiers: [], featured: false,
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function PropertiesManager() {
  const { token, me } = useAdmin();
  const rows = useQuery(api.properties.listAll, token ? { token } : 'skip');
  const upsert = useMutation(api.properties.upsert);
  const setActive = useMutation(api.properties.setActive);
  const remove = useMutation(api.properties.remove);
  const importListings = useMutation(api.properties.importListings);

  const [editing, setEditing] = useState<Form | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const isAdmin = me?.role === 'Admin';
  const list = useMemo(() => rows ?? [], [rows]);

  if (!isAdmin) {
    return (
      <div className="admin-panel max-w-xl p-5">
        <h1 className="admin-page-title font-heading">Listings</h1>
        <p className="admin-page-copy">Only admins can manage property listings. Ask an administrator for access.</p>
      </div>
    );
  }

  const startEdit = (r: typeof list[number]) => {
    setIsNew(false); setError('');
    setEditing({
      slug: r.slug, name: r.name, location: r.location, region: r.region, kind: r.kind,
      title: r.title, size: r.size, price: r.price, note: r.note ?? '',
      overview: (r.overview ?? []).join('\n'), features: (r.features ?? []).join('\n'),
      img: r.img ?? '', priceTiers: r.priceTiers ?? [], featured: r.featured ?? false,
    });
  };

  const startNew = () => { setIsNew(true); setError(''); setEditing({ ...blank }); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editing) return;
    setBusy(true); setError('');
    try {
      const slug = editing.slug || slugify(editing.name);
      await upsert({
        token, slug, name: editing.name, location: editing.location, region: editing.region,
        kind: editing.kind, title: editing.title, size: editing.size, price: editing.price,
        note: editing.note || undefined, img: editing.img || undefined,
        overview: editing.overview.split('\n').map((s) => s.trim()).filter(Boolean),
        features: editing.features.split('\n').map((s) => s.trim()).filter(Boolean),
        priceTiers: editing.priceTiers.filter((t) => t.label && t.price),
        featured: editing.featured,
      });
      setEditing(null);
    } catch (err) {
      setError((err as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, ''));
    } finally { setBusy(false); }
  };

  const runImport = async () => {
    if (!token) return;
    setImporting(true);
    try {
      await importListings({ token, items: ESTATES.map((e) => ({
        slug: e.slug, name: e.name, location: e.location, region: e.region, kind: e.kind,
        title: e.title, size: e.size, price: e.price, note: e.note, overview: e.overview,
        features: e.features, img: e.img, priceTiers: e.priceTiers,
      })) });
    } finally { setImporting(false); }
  };

  // ── Editor view ──
  if (editing) {
    const f = editing;
    const set = (patch: Partial<Form>) => setEditing({ ...f, ...patch });
    return (
      <div className="font-sans max-w-5xl">
        <button onClick={() => setEditing(null)} className="admin-secondary-button mb-5"><ArrowLeft className="w-4 h-4" /> All listings</button>
        <div className="admin-section-head">
          <div>
            <h1 className="admin-page-title font-heading">{isNew ? 'New listing' : f.name || 'Edit listing'}</h1>
            <p className="admin-page-copy">Saving publishes instantly to the public website.</p>
          </div>
        </div>

        <form onSubmit={save} className="admin-panel mt-6 p-4 md:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><input className={inp} value={f.name} onChange={(e) => set({ name: e.target.value, slug: isNew && !f.slug ? '' : f.slug })} required /></Field>
            <Field label="Slug (URL)"><input className={inp} value={f.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(f.name) || 'auto'} /></Field>
            <Field label="Location"><input className={inp} value={f.location} onChange={(e) => set({ location: e.target.value })} required /></Field>
            <Field label="Region"><input className={inp} value={f.region} onChange={(e) => set({ region: e.target.value })} required /></Field>
            <Field label="Type">
              <select className={inp} value={f.kind} onChange={(e) => set({ kind: e.target.value as 'land' | 'home' })}>
                <option value="land">Land</option><option value="home">Home</option>
              </select>
            </Field>
            <Field label="Title (legal)"><input className={inp} value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Size"><input className={inp} value={f.size} onChange={(e) => set({ size: e.target.value })} /></Field>
            <Field label="Headline price"><input className={inp} value={f.price} onChange={(e) => set({ price: e.target.value })} required /></Field>
            <Field label="Price note"><input className={inp} value={f.note} onChange={(e) => set({ note: e.target.value })} /></Field>
            <Field label="Image URL"><input className={inp} value={f.img} onChange={(e) => set({ img: e.target.value })} placeholder="/estates/…jpg" /></Field>
          </div>
          <Field label="Overview (one paragraph per line)"><textarea rows={3} className={inp} value={f.overview} onChange={(e) => set({ overview: e.target.value })} /></Field>
          <Field label="Highlights (one per line)"><textarea rows={3} className={inp} value={f.features} onChange={(e) => set({ features: e.target.value })} /></Field>

          {/* Price tiers */}
          <div className="admin-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="admin-field-label">Price tiers (optional)</span>
              <button type="button" onClick={() => set({ priceTiers: [...f.priceTiers, { label: '', price: '' }] })} className="admin-secondary-button px-3 py-2"><Plus className="w-3.5 h-3.5" /> Add tier</button>
            </div>
            <div className="space-y-2">
              {f.priceTiers.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2">
                  <input className={inp} placeholder="Label" value={t.label} onChange={(e) => { const tiers = [...f.priceTiers]; tiers[i] = { ...t, label: e.target.value }; set({ priceTiers: tiers }); }} />
                  <input className={inp} placeholder="₦…" value={t.price} onChange={(e) => { const tiers = [...f.priceTiers]; tiers[i] = { ...t, price: e.target.value }; set({ priceTiers: tiers }); }} />
                  <button type="button" onClick={() => set({ priceTiers: f.priceTiers.filter((_, j) => j !== i) })} className="admin-danger-button px-3 py-2 sm:w-10" title="Remove tier"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {f.priceTiers.length === 0 && <p className="text-xs text-white/32">Add tiers only when a listing has staged pricing.</p>}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} className="accent-accent" /> Feature on homepage
          </label>

          {error && <p className="text-sm text-accent-2">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" disabled={busy} className="admin-primary-button">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save & publish
            </button>
            <button type="button" onClick={() => setEditing(null)} className="admin-secondary-button">Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center"><Building2 className="w-4.5 h-4.5 text-accent" /></span>
          <div>
            <h1 className="admin-page-title font-heading">Listings</h1>
            <div className="text-xs text-white/40 mt-1">{list.length} propert{list.length === 1 ? 'y' : 'ies'} · edits go live on the website</div>
          </div>
        </div>
        <button onClick={startNew} className="admin-primary-button">
          <Plus className="w-4 h-4" /> New listing
        </button>
      </div>

      {rows === undefined ? (
        <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="admin-panel mt-8 p-6 max-w-xl">
          <h2 className="font-heading text-2xl font-light tracking-tight text-white">No database listings yet</h2>
          <p className="text-white/55 mt-3 leading-relaxed">Import the current website portfolio once. After that, edits publish straight to the public site.</p>
          <button onClick={runImport} disabled={importing} className="admin-primary-button mt-6">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Import current {ESTATES.length} listings
          </button>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((r) => (
            <div key={r.slug} className={`admin-card p-5 ${!r.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[0.6rem] tracking-[0.16em] uppercase px-2.5 py-1 rounded-full ${r.kind === 'land' ? 'bg-accent text-accent-ink' : 'bg-accent-2 text-accent-2-ink'}`}>{r.kind}</span>
                <div className="flex items-center gap-1">
                  {r.featured && <Star className="w-3.5 h-3.5 text-accent" fill="currentColor" />}
                  <button onClick={() => token && setActive({ token, slug: r.slug, active: !r.active })} className="text-white/40 hover:text-white p-1" title={r.active ? 'Hide from site' : 'Show on site'}>
                    {r.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => { if (token && confirm(`Delete "${r.name}"? This removes it from the website.`)) remove({ token, slug: r.slug }); }} className="text-white/40 hover:text-accent-2 p-1" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <button onClick={() => startEdit(r)} className="text-left w-full mt-3">
                <div className="font-heading text-xl text-white leading-tight">{r.name}</div>
                <div className="text-xs text-white/45 mt-1">{r.location}</div>
                <div className="text-sm text-white/85 mt-2 tnum">{r.price}{r.note ? <span className="text-white/40"> · {r.note}</span> : null}</div>
              </button>
              <button onClick={() => startEdit(r)} className="admin-secondary-button mt-4 px-3 py-2">Edit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp = 'admin-input';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="admin-field-label">{label}</span>
      {children}
    </label>
  );
}
