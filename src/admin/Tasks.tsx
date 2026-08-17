import { useMemo, useState, Fragment, type FormEvent } from 'react';
import { useQuery, useMutation } from 'convex/react';
import {
  Plus, Loader2, Search, LayoutGrid, List as ListIcon, Download, AlertTriangle,
  Clock, CheckCircle2, CalendarClock, Users2, Flame,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAdmin } from './store';

type Status = 'todo' | 'in_progress' | 'done';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

const STATUS: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];
const PRIORITIES: Priority[] = ['urgent', 'high', 'normal', 'low'];
const PRIO_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
const PRIO_HUE: Record<Priority, string> = { urgent: '255,107,107', high: '255,142,120', normal: '0,99,222', low: '150,150,150' };
const DEPARTMENTS = ['Sales', 'Land & Survey', 'Construction', 'Operations', 'Finance', 'Marketing'];

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
function dueMeta(due: string, status: Status) {
  const t = Date.parse(due);
  if (Number.isNaN(t) || status === 'done') return { overdue: false, soon: false };
  const today = startOfToday();
  const days = Math.round((t - today) / 86400000);
  return { overdue: days < 0, soon: days >= 0 && days <= 3, days };
}

export default function Tasks() {
  const { token, me } = useAdmin();
  const tasksRaw = useQuery(api.tasks.list, token ? { token } : 'skip');
  const users = useQuery(api.users.list, token ? { token } : 'skip') ?? [];
  const create = useMutation(api.tasks.create);
  const setStatus = useMutation(api.tasks.setStatus);
  const setPriority = useMutation(api.tasks.setPriority);
  const reassign = useMutation(api.tasks.reassign);

  const canAssign = useMemo(() => Boolean(me?.caps?.assign_tasks), [me]);
  const seeAll = Boolean(me?.caps?.view_all_tasks);
  const nameById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const [view, setView] = useState<'board' | 'list'>('board');
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState<'all' | Status>('all');
  const [fAssignee, setFAssignee] = useState<'all' | 'me' | string>('all');
  const [fPriority, setFPriority] = useState<'all' | Priority>('all');
  const [sort, setSort] = useState<'due' | 'priority' | 'newest'>('due');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', detail: '', assigneeId: '', due: '', priority: 'normal' as Priority, department: '' });

  const tasks = useMemo(() => (tasksRaw ?? []).map((t) => ({ ...t, priority: (t.priority ?? 'normal') as Priority })), [tasksRaw]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (q.trim()) { const s = q.toLowerCase(); list = list.filter((t) => (t.title + ' ' + (t.detail ?? '')).toLowerCase().includes(s)); }
    if (fStatus !== 'all') list = list.filter((t) => t.status === fStatus);
    if (fPriority !== 'all') list = list.filter((t) => t.priority === fPriority);
    if (fAssignee === 'me') list = list.filter((t) => t.assigneeId === me?.id);
    else if (fAssignee !== 'all') list = list.filter((t) => t.assigneeId === fAssignee);
    const arr = [...list];
    if (sort === 'due') arr.sort((a, b) => (Date.parse(a.due) || Infinity) - (Date.parse(b.due) || Infinity));
    else if (sort === 'priority') arr.sort((a, b) => PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
    else arr.sort((a, b) => b._creationTime - a._creationTime);
    return arr;
  }, [tasks, q, fStatus, fPriority, fAssignee, sort, me]);

  // Oversight metrics (MD command-center)
  const stats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done');
    const overdue = open.filter((t) => dueMeta(t.due, t.status).overdue).length;
    const soon = open.filter((t) => dueMeta(t.due, t.status).soon).length;
    const inProg = tasks.filter((t) => t.status === 'in_progress').length;
    const weekAgo = Date.now() - 7 * 86400000;
    const doneWeek = tasks.filter((t) => t.status === 'done' && (t.completedAt ?? 0) > weekAgo).length;
    return { open: open.length, overdue, soon, inProg, doneWeek };
  }, [tasks]);

  const workload = useMemo(() => {
    const m = new Map<Id<'users'>, number>();
    tasks.filter((t) => t.status !== 'done').forEach((t) => m.set(t.assigneeId, (m.get(t.assigneeId) ?? 0) + 1));
    return [...m.entries()].map(([id, n]) => ({ id, name: nameById.get(id) ?? '—', n })).sort((a, b) => b.n - a.n);
  }, [tasks, nameById]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !form.title.trim() || !form.assigneeId) { setError('Title and assignee are required.'); return; }
    setBusy(true); setError('');
    try {
      await create({ token, title: form.title, detail: form.detail, assigneeId: form.assigneeId as Id<'users'>, due: form.due || '—', priority: form.priority, department: form.department || undefined });
      setForm({ title: '', detail: '', assigneeId: '', due: '', priority: 'normal', department: '' });
      setOpen(false);
    } catch (err) { setError((err as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, '')); }
    finally { setBusy(false); }
  };

  const exportCsv = () => {
    const rows = [['Title', 'Assignee', 'Status', 'Priority', 'Due', 'Department']].concat(
      filtered.map((t) => [t.title, nameById.get(t.assigneeId) ?? '', t.status, t.priority, t.due, t.department ?? '']),
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ehikings-tasks.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="admin-page-title font-heading">{seeAll ? 'Operations' : 'My tasks'}</h1>
          <p className="admin-page-copy">{seeAll ? 'Every task across the company, live.' : 'Everything assigned to you.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="admin-segmented">
            <button onClick={() => setView('board')} className={`admin-segmented-button ${view === 'board' ? 'is-active' : ''}`}><LayoutGrid className="w-3.5 h-3.5" /> Board</button>
            <button onClick={() => setView('list')} className={`admin-segmented-button ${view === 'list' ? 'is-active' : ''}`}><ListIcon className="w-3.5 h-3.5" /> List</button>
          </div>
          <button onClick={exportCsv} className="admin-round-icon" title="Export CSV"><Download className="w-4 h-4" /></button>
          {canAssign && (
            <button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-ink px-4 py-2.5 text-xs font-medium hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" /> Assign</button>
          )}
        </div>
      </div>

      {/* Oversight stat band */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
        <Stat icon={Clock} hue="0,99,222" value={stats.open} label="Open" />
        <Stat icon={Flame} hue="0,99,222" value={stats.inProg} label="In progress" />
        <Stat icon={AlertTriangle} hue="255,107,107" value={stats.overdue} label="Overdue" alert={stats.overdue > 0} />
        <Stat icon={CalendarClock} hue="255,142,120" value={stats.soon} label="Due ≤3 days" />
        <Stat icon={CheckCircle2} hue="110,140,20" value={stats.doneWeek} label="Done this week" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-muted absolute left-[0.95rem] top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" className="admin-search" />
        </div>
        <Select value={fStatus} onChange={(v) => setFStatus(v as 'all' | Status)} options={[['all', 'All status'], ...STATUS.map((s) => [s.value, s.label] as [string, string])]} />
        <Select value={fPriority} onChange={(v) => setFPriority(v as 'all' | Priority)} options={[['all', 'All priority'], ...PRIORITIES.map((p) => [p, p[0].toUpperCase() + p.slice(1)] as [string, string])]} />
        {seeAll && <Select value={fAssignee} onChange={(v) => setFAssignee(v)} options={[['all', 'Everyone'], ['me', 'Me'], ...users.map((u) => [u.id, u.name] as [string, string])]} />}
        <Select value={sort} onChange={(v) => setSort(v as 'due' | 'priority' | 'newest')} options={[['due', 'Sort: Due'], ['priority', 'Sort: Priority'], ['newest', 'Sort: Newest']]} />
      </div>

      {/* Assign form */}
      {canAssign && open && (
        <form onSubmit={submit} className="admin-panel mt-4 p-5 space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className={inp} />
          <textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Details…" rows={2} className={`${inp} resize-none`} />
          <div className="grid sm:grid-cols-4 gap-3">
            <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className={inp}>
              <option value="">Assign to…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={inp}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inp}>
              <option value="">Department…</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={inp} />
          </div>
          {error && <p className="text-sm text-accent-2">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-ink px-5 py-2.5 text-xs font-medium hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Create task
          </button>
        </form>
      )}

      {/* Content */}
      {tasksRaw === undefined ? (
        <div className="mt-16 flex justify-center"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>
      ) : view === 'board' ? (
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {STATUS.map((col) => {
            const items = filtered.filter((t) => t.status === col.value);
            return (
              <div key={col.value} className="admin-task-column">
                <div className="flex items-center justify-between px-1 py-2">
                  <span className="text-xs font-medium text-primary/80">{col.label}</span>
                  <span className="text-[0.65rem] text-muted">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <Fragment key={t._id}>
                      <TaskCard t={t} who={nameById.get(t.assigneeId) ?? '—'} onStatus={(s) => token && setStatus({ token, taskId: t._id, status: s })} onPriority={(p) => token && setPriority({ token, taskId: t._id, priority: p })} onReassign={canAssign ? (id) => token && reassign({ token, taskId: t._id, assigneeId: id as Id<'users'> }) : undefined} users={users} />
                    </Fragment>
                  ))}
                  {items.length === 0 && <div className="text-xs text-muted px-1 py-3">Nothing here.</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {filtered.map((t) => (
            <Fragment key={t._id}>
              <TaskCard t={t} who={nameById.get(t.assigneeId) ?? '—'} onStatus={(s) => token && setStatus({ token, taskId: t._id, status: s })} onPriority={(p) => token && setPriority({ token, taskId: t._id, priority: p })} onReassign={canAssign ? (id) => token && reassign({ token, taskId: t._id, assigneeId: id as Id<'users'> }) : undefined} users={users} />
            </Fragment>
          ))}
          {filtered.length === 0 && <div className="text-muted text-sm py-8 text-center">No tasks match your filters.</div>}
        </div>
      )}

      {/* Team workload (MD oversight) */}
      {seeAll && workload.length > 0 && (
        <div className="admin-workload-panel mt-10">
          <div className="flex items-center gap-2 text-sm text-primary/80 mb-4"><Users2 className="w-4 h-4 text-accent" /> Team workload — open tasks per person</div>
          <div className="space-y-2">
            {workload.map((w) => (
              <div key={w.id} className="flex items-center gap-3">
                <span className="text-sm text-primary w-44 truncate">{w.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[rgba(16,62,118,0.1)] overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (w.n / Math.max(...workload.map((x) => x.n))) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted tnum w-6 text-right">{w.n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inp = 'admin-input';

function Stat({ icon: Icon, value, label, hue, alert }: { icon: typeof Clock; value: number; label: string; hue: string; alert?: boolean }) {
  return (
    <div className={`admin-stat-card ${alert ? 'is-alert' : ''}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ background: `rgba(${hue},0.16)` }}><Icon className="w-4 h-4" style={{ color: `rgb(${hue})` }} /></div>
      <div className="font-heading text-2xl font-light tnum text-primary">{value}</div>
      <div className="text-[0.7rem] text-muted mt-0.5">{label}</div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="admin-filter-select">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

type CardTask = { _id: Id<'tasks'>; title: string; detail?: string; status: Status; priority: Priority; due: string; department?: string; assigneeId: string };
function TaskCard({ t, who, onStatus, onPriority, onReassign, users }: {
  t: CardTask; who: string;
  onStatus: (s: Status) => void; onPriority: (p: Priority) => void; onReassign?: (id: string) => void;
  users: { id: string; name: string; role: string }[];
}) {
  const dm = dueMeta(t.due, t.status);
  return (
    <div className="admin-task-card">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ background: `rgb(${PRIO_HUE[t.priority]})` }} title={t.priority} />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-primary leading-snug">{t.title}</div>
          {t.detail && <div className="text-xs text-muted mt-0.5 line-clamp-2">{t.detail}</div>}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[0.68rem]">
            <span className="text-muted">{who}</span>
            {t.department && <span className="text-muted">· {t.department}</span>}
            {Number.isNaN(Date.parse(t.due)) ? (
              <span className="text-muted">· No due date</span>
            ) : (
              <span className={`inline-flex items-center gap-1 ${dm.overdue ? 'text-[rgb(255,107,107)]' : dm.soon ? 'text-[rgb(255,142,120)]' : 'text-muted'}`}>· {dm.overdue ? 'Overdue' : 'due'} {t.due}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {STATUS.map((s) => (
          <button key={s.value} onClick={() => onStatus(s.value)} className={`admin-task-status-button ${
            t.status === s.value ? (s.value === 'done' ? 'is-done' : s.value === 'in_progress' ? 'is-progress' : 'is-todo') : ''
          }`}>{s.label}</button>
        ))}
        <select value={t.priority} onChange={(e) => onPriority(e.target.value as Priority)} className="admin-mini-select ml-auto" title="Priority">
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {onReassign && (
          <select value="" onChange={(e) => e.target.value && onReassign(e.target.value)} className="admin-mini-select" title="Reassign">
            <option value="">↪ reassign</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
