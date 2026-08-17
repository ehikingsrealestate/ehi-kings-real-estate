import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, BookOpen, Check, Download, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';
import { JOURNAL } from '../data/site';

// Journal manager — edits the posts the public /blog pages render.
// Mirrors PropertiesManager: list + editor + one-time import of the static
// JOURNAL array, all admin-gated.

type Form = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  metaDescription: string;
  keywords: string;
  body: string;
  published: boolean;
};

const blank: Form = {
  slug: '', title: '', excerpt: '', category: 'Guides', date: '', readingTime: '4 min read',
  metaDescription: '', keywords: '', body: '', published: false,
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function Journal() {
  const { token, me } = useAdmin();
  const rows = useQuery(api.posts.listAll, token ? { token } : 'skip');
  const upsert = useMutation(api.posts.upsert);
  const setPublished = useMutation(api.posts.setPublished);
  const remove = useMutation(api.posts.remove);
  const importPosts = useMutation(api.posts.importPosts);

  const [editing, setEditing] = useState<Form | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const list = useMemo(() => rows ?? [], [rows]);

  const startEdit = (r: (typeof list)[number]) => {
    setIsNew(false);
    setError('');
    setEditing({
      slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category,
      date: r.date, readingTime: r.readingTime,
      metaDescription: r.metaDescription ?? '', keywords: (r.keywords ?? []).join(', '),
      body: (r.body ?? []).join('\n\n'), published: r.published,
    });
  };

  const startNew = () => {
    setIsNew(true);
    setError('');
    setEditing({ ...blank, date: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editing) return;
    setBusy(true);
    setError('');
    try {
      await upsert({
        token,
        slug: editing.slug || slugify(editing.title),
        title: editing.title,
        excerpt: editing.excerpt,
        category: editing.category,
        date: editing.date,
        readingTime: editing.readingTime,
        metaDescription: editing.metaDescription || undefined,
        keywords: editing.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        body: editing.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
        published: editing.published,
      });
      setEditing(null);
    } catch (err) {
      setError((err as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, ''));
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!token) return;
    setImporting(true);
    setError('');
    try {
      await importPosts({
        token,
        items: JOURNAL.map((p) => ({
          slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
          date: p.date, readingTime: p.readingTime, metaDescription: p.metaDescription,
          keywords: p.keywords, body: p.body,
        })),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  if (editing) {
    return (
      <div className="admin-page-shell">
        <button type="button" onClick={() => setEditing(null)} className="admin-secondary-button mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </button>
        <form onSubmit={save} className="admin-panel grid max-w-3xl gap-4 p-5">
          <h1 className="admin-page-title font-heading">{isNew ? 'New post' : `Edit — ${editing.title}`}</h1>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <label className="grid gap-1.5">
            <span className="admin-field-label">Title</span>
            <input
              className="admin-input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: isNew ? slugify(e.target.value) : editing.slug })}
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="admin-field-label">Slug (URL)</span>
              <input className="admin-input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
            </label>
            <label className="grid gap-1.5">
              <span className="admin-field-label">Category</span>
              <input className="admin-input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            </label>
            <label className="grid gap-1.5">
              <span className="admin-field-label">Display date (e.g. July 2026)</span>
              <input className="admin-input" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            </label>
            <label className="grid gap-1.5">
              <span className="admin-field-label">Reading time</span>
              <input className="admin-input" value={editing.readingTime} onChange={(e) => setEditing({ ...editing, readingTime: e.target.value })} />
            </label>
          </div>
          <label className="grid gap-1.5">
            <span className="admin-field-label">Excerpt (listing card summary)</span>
            <textarea className="admin-input min-h-20" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} required />
          </label>
          <label className="grid gap-1.5">
            <span className="admin-field-label">Body — separate paragraphs with a blank line</span>
            <textarea className="admin-input min-h-72 font-mono text-[0.82rem]" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} required />
          </label>
          <label className="grid gap-1.5">
            <span className="admin-field-label">SEO meta description (optional)</span>
            <textarea className="admin-input min-h-16" value={editing.metaDescription} onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })} />
          </label>
          <label className="grid gap-1.5">
            <span className="admin-field-label">SEO keywords, comma-separated (optional)</span>
            <input className="admin-input" value={editing.keywords} onChange={(e) => setEditing({ ...editing, keywords: e.target.value })} />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} />
            <span className="admin-field-label !text-sm">Published (visible on the website)</span>
          </label>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="admin-primary-button">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isNew ? 'Create post' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page-shell">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">Journal</h1>
          <p className="admin-page-copy">
            Posts published here appear on the public Journal instantly. Import the current articles once, then edit freely.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {list.length === 0 && (
            <button type="button" onClick={runImport} disabled={importing} className="admin-secondary-button">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Import current articles
            </button>
          )}
          <button type="button" onClick={startNew} className="admin-primary-button">
            <Plus className="h-4 w-4" /> New post
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-5 grid gap-3">
        {list.length === 0 && (
          <div className="admin-panel p-5">
            <p className="admin-page-copy flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> No posts in the database yet — the website is showing the built-in articles.
              Import them to start editing.
            </p>
          </div>
        )}
        {list.map((post) => (
          <div key={post.slug} className="admin-card flex flex-wrap items-center justify-between gap-3 p-4">
            <button type="button" onClick={() => startEdit(post)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[0.95rem] text-white admin-theme-title">{post.title}</p>
              <p className="admin-theme-subtle mt-1 text-xs">
                {post.category} · {post.date} · {post.readingTime} · /blog/{post.slug}
              </p>
            </button>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.12em] ${post.published ? 'bg-accent-2/15 text-accent-2' : 'admin-theme-soft'}`}>
                {post.published ? 'Live' : 'Draft'}
              </span>
              <button
                type="button"
                className="admin-icon-button rounded-full"
                title={post.published ? 'Unpublish' : 'Publish'}
                onClick={() => token && setPublished({ token, slug: post.slug, published: !post.published })}
              >
                {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                className="admin-icon-button rounded-full"
                title="Delete"
                onClick={() => token && window.confirm(`Delete “${post.title}”?`) && remove({ token, slug: post.slug })}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
