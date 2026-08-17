import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { UserPlus, Loader2, Users2, UserCheck, ShieldCheck, type LucideIcon } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useAdmin, roleBadgeClass, RANK, ROLES, type Role } from './store';

const ROLE_NOTE: Record<Role, string> = {
  Admin: 'Full access · assigns work · sees everything',
  Manager: 'Assigns work · oversees agents & field team',
  Agent: 'Sales & client-facing',
  Worker: 'Field, site & inspections',
};

export default function Team() {
  const { token, can } = useAdmin();
  const users = useQuery(api.users.list, token ? { token } : 'skip') ?? [];
  const createEmployee = useAction(api.users.createEmployee);
  const updateRole = useMutation(api.users.updateRole);
  const setActive = useMutation(api.users.setActive);

  const canManage = can('manage_employees');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'Worker' as Role, title: '', password: '' });

  const sorted = [...users].sort((a, b) => RANK[a.role] - RANK[b.role]);
  const activeCount = users.filter((u) => u.active).length;
  const managerCount = users.filter((u) => RANK[u.role] <= RANK.Manager).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(''); setBusy(true);
    try {
      await createEmployee({ token, ...form, email: form.email.trim(), password: form.password.trim() || undefined });
      setForm({ name: '', email: '', role: 'Worker', title: '', password: '' });
      setOpen(false);
    } catch (err) {
      setError((err as Error).message.replace(/^.*Uncaught Error:\s*/, '').replace(/\s+at\s.*$/, ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="font-sans">
      <div className="admin-section-head">
        <div>
          <h1 className="admin-page-title font-heading">People</h1>
          <p className="admin-page-copy">Manage staff profiles, roles, and active access.</p>
        </div>
        {canManage && (
          <button onClick={() => setOpen((v) => !v)} className="admin-primary-button shrink-0">
            <UserPlus className="w-4 h-4" /> Add staff
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <TeamStat icon={Users2} value={users.length} label="Profiles" />
        <TeamStat icon={UserCheck} value={activeCount} label="Active" />
        <TeamStat icon={ShieldCheck} value={managerCount} label="Managers+" />
        <TeamStat icon={UserPlus} value={users.length - activeCount} label="Inactive" />
      </div>

      {canManage && open && (
        <form onSubmit={submit} className="admin-panel mt-5 p-4 md:p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required
              className="admin-input" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@ehikings.com" type="email" required
              className="admin-input" />
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job title" required
              className="admin-input" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="admin-input">
              {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Optional temporary password" type="text" minLength={6}
            className="admin-input" />
          <p className="text-xs text-white/42">Leave blank for Zoho-only sign-in.</p>
          {error && <p className="text-sm text-accent-2">{error}</p>}
          <button type="submit" disabled={busy} className="admin-primary-button">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Create staff profile
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        {ROLES.map((r) => (
          <span key={r} className={`text-[0.62rem] tracking-[0.12em] uppercase px-3 py-1 rounded-full ${roleBadgeClass(r)}`}>{r}</span>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((u) => (
          <div key={u.id} className={`admin-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${!u.active ? 'opacity-50' : ''}`}>
            <div className="w-11 h-11 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium shrink-0">
              {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white truncate">{u.name}</span>
                <span className={`text-[0.58rem] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full ${roleBadgeClass(u.role)}`}>{u.role}</span>
                {!u.active && <span className="text-[0.65rem] text-white/38">Inactive</span>}
              </div>
              <div className="text-xs text-white/45 mt-0.5">{u.title}</div>
              <div className="text-xs text-white/32 mt-1">{ROLE_NOTE[u.role]}</div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <select value={u.role} onChange={(e) => token && updateRole({ token, userId: u.id as Id<'users'>, role: e.target.value as Role })}
                  className="admin-input py-2 text-xs sm:w-32">
                  {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
                <button onClick={() => token && setActive({ token, userId: u.id as Id<'users'>, active: !u.active })}
                  className="admin-secondary-button px-3 py-2">
                  {u.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamStat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <div className="admin-card p-4">
      <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <div className="font-heading text-2xl font-light tnum text-white">{value}</div>
      <div className="text-[0.7rem] text-white/45 mt-0.5">{label}</div>
    </div>
  );
}
