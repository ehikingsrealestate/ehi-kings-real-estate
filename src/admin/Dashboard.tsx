import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import {
  ArrowUpRight,
  Banknote,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Handshake,
  CheckSquare,
  Clock,
  Mail,
  MessagesSquare,
  Network,
  PanelTop,
  Plus,
  Search,
  Share2,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import { useAdmin } from './store';
import { useEstates } from '../data/useEstates';
import { ADMIN_AGENTS } from '../data/adminAgents';
import AssistantDock from './AssistantDock';
import CountUp from '../components/reactbits/CountUp';
import BlurText from '../components/reactbits/BlurText';

const HUE = {
  blue: '0,99,222',
  green: '110,140,20',
  red: '255,107,107',
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function isOverdue(due: string, status: string): boolean {
  const t = Date.parse(due);
  if (Number.isNaN(t) || status === 'done') return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return t < today.getTime();
}

// Compact naira for the pipeline KPI (whole-naira deal values in the DB).
const NGN_COMPACT = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  notation: 'compact',
  maximumFractionDigits: 1,
});

// Local-midnight timestamp offset by whole days (0 = today, 7 = a week out).
function dayStart(offsetDays = 0): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.getTime();
}

// Whether a date string (task due / booking preferredDate) lands in [from, to).
function inWindow(value: string | undefined, from: number, to: number): boolean {
  if (!value) return false;
  const t = Date.parse(value);
  return !Number.isNaN(t) && t >= from && t < to;
}

const FUNNEL_STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'inspection_booked', label: 'Inspection booked' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed', label: 'Closed' },
] as const;

export default function Dashboard() {
  const { token, me } = useAdmin();
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const tasks = useQuery(api.tasks.list, token ? { token } : 'skip') ?? [];
  const users = useQuery(api.users.list, token ? { token } : 'skip') ?? [];
  const estates = useEstates();
  const canSeeLeads = Boolean(token) && me?.role !== 'Worker';
  const leads = useQuery(api.crm.listLeads, canSeeLeads && token ? { token } : 'skip') ?? [];
  const pipeline = useQuery(api.sales.pipeline, canSeeLeads && token ? { token } : 'skip');
  const openLeads = leads.filter((l) => l.stage !== 'closed' && l.stage !== 'lost');
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const activeUsers = users.filter((u) => u.active);

  const open = tasks.filter((t) => t.status !== 'done');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const overdue = open.filter((t) => isOverdue(t.due, t.status));
  const done = tasks.filter((t) => t.status === 'done');
  const land = estates.filter((e) => e.kind === 'land').length;
  const homes = estates.filter((e) => e.kind === 'home').length;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const priorityTasks = useMemo(() => {
    return [...open].sort((a, b) => {
      const ad = Date.parse(a.due);
      const bd = Date.parse(b.due);
      if (Number.isNaN(ad) && Number.isNaN(bd)) return 0;
      if (Number.isNaN(ad)) return 1;
      if (Number.isNaN(bd)) return -1;
      return ad - bd;
    }).slice(0, 5);
  }, [open]);

  // ── Operations data (leads/deals hidden from Workers, tasks visible to all) ──
  const todayStart = dayStart(0);
  const tomorrowStart = dayStart(1);
  const newLeads7 = leads.filter((l) => l.createdAt >= dayStart(-7)).length;
  const prevLeads7 = leads.filter((l) => l.createdAt >= dayStart(-14) && l.createdAt < dayStart(-7)).length;
  const leadDelta = newLeads7 - prevLeads7;
  const bookings = leads.filter(
    (l) => (l.bookingType === 'inspection' || l.bookingType === 'consultation') && l.stage !== 'closed' && l.stage !== 'lost',
  );
  const upcomingBookings = bookings.filter((l) => inWindow(l.preferredDate, todayStart, dayStart(7)));
  const bookingsToday = bookings.filter((l) => inWindow(l.preferredDate, todayStart, tomorrowStart));
  const tasksDueToday = open.filter((t) => inWindow(t.due, todayStart, tomorrowStart));

  const funnel = FUNNEL_STAGES.map((s) => ({ ...s, count: leads.filter((l) => l.stage === s.key).length }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const kpis: { label: string; value: number | string; sub: string; to: string; icon: LucideIcon }[] = canSeeLeads
    ? [
        { label: 'New leads (7d)', value: newLeads7, sub: leadDelta === 0 ? 'level with prior week' : `${leadDelta > 0 ? '+' : ''}${leadDelta} vs prior 7d`, to: '/admin/crm', icon: UserPlus },
        { label: 'Open leads', value: openLeads.length, sub: `${leads.length - openLeads.length} closed or lost`, to: '/admin/crm', icon: Handshake },
        { label: 'Pipeline value', value: pipeline ? NGN_COMPACT.format(pipeline.totals.open) : '—', sub: pipeline ? `${pipeline.totals.count} deals tracked` : 'loading deals…', to: '/admin/crm', icon: Banknote },
        { label: 'Overdue tasks', value: overdue.length, sub: `${open.length} open in total`, to: '/admin/tasks', icon: Clock },
        { label: 'Inspections (7d)', value: upcomingBookings.length, sub: `${bookingsToday.length} scheduled today`, to: '/admin/crm', icon: CalendarDays },
      ]
    : [
        { label: 'Open tasks', value: open.length, sub: `${inProgress.length} in progress`, to: '/admin/tasks', icon: CheckSquare },
        { label: 'Due today', value: tasksDueToday.length, sub: 'on your plate today', to: '/admin/tasks', icon: CalendarDays },
        { label: 'Overdue tasks', value: overdue.length, sub: overdue.length ? 'needs attention' : 'all on schedule', to: '/admin/tasks', icon: Clock },
        { label: 'Completed', value: done.length, sub: 'marked done so far', to: '/admin/tasks', icon: CheckSquare },
      ];

  const quickActions = [
    { label: 'New task', to: '/admin/tasks', icon: Plus, show: true },
    { label: 'Add lead', to: '/admin/crm', icon: UserPlus, show: me?.role !== 'Worker' },
    { label: 'Compose mail', to: '/admin/mail', icon: Mail, show: true },
    { label: 'Post update', to: '/admin/social', icon: Share2, show: me?.role !== 'Worker' },
    { label: 'Launch automation', to: '/admin/automations', icon: Workflow, show: me?.role !== 'Worker' },
  ].filter((a) => a.show);

  const todayRows: { key: string; title: string; sub: string; to: string; dot: string }[] = [
    ...bookingsToday.map((l) => ({
      key: `b-${l._id}`,
      title: l.name,
      sub: `${l.bookingType === 'inspection' ? 'Inspection' : 'Consultation'}${l.preferredTime ? ` · ${l.preferredTime}` : ''}${l.propertyName ? ` · ${l.propertyName}` : ''}`,
      to: '/admin/crm',
      dot: 'var(--color-accent)',
    })),
    ...tasksDueToday.map((t) => ({
      key: `t-${t._id}`,
      title: t.title,
      sub: `Task · ${nameById.get(t.assigneeId) ?? 'Unassigned'} · due today`,
      to: '/admin/tasks',
      dot: 'var(--color-accent-2)',
    })),
    ...(canSeeLeads
      ? leads.slice(0, 3).map((l) => ({
          key: `l-${l._id}`,
          title: l.name,
          sub: `Newest lead · ${l.service}`,
          to: '/admin/crm',
          dot: `rgb(${HUE.red})`,
        }))
      : []),
  ];

  const submitCommand = (event: FormEvent) => {
    event.preventDefault();
    const ask = command.trim();
    if (!ask) return;
    navigate(`/admin/chat?ask=${encodeURIComponent(ask)}`);
  };

  const workspace = [
    { label: 'Tasks', detail: `${open.length} open · ${inProgress.length} in progress`, to: '/admin/tasks', icon: CheckSquare },
    { label: 'Listings', detail: `${estates.length} live · ${land} land · ${homes} homes`, to: '/admin/listings', icon: Building2, adminOnly: true },
    { label: 'CRM', detail: `${openLeads.length} open leads to work`, to: '/admin/crm', icon: Handshake, workerHidden: true },
    { label: 'Journal', detail: 'Write and publish website articles', to: '/admin/journal', icon: BookOpen, adminOnly: true },
    { label: 'AI Chat', detail: 'Company copilot with role-aware tools', to: '/admin/chat', icon: Bot },
    { label: 'Agents', detail: `${ADMIN_AGENTS.length} specialist work modes`, to: '/admin/agents', icon: Network },
    { label: 'Team Chat', detail: 'Channels and project messages', to: '/admin/team-chat', icon: MessagesSquare },
    { label: 'Mail', detail: 'Connected Zoho inbox per staff member', to: '/admin/mail', icon: Mail },
    { label: 'Site Studio', detail: 'Draft, review, publish content', to: '/admin/site-editor', icon: PanelTop, adminOnly: true },
    { label: 'Team', detail: `${activeUsers.length} active staff`, to: '/admin/team', icon: Users },
  ].filter((item) => (!item.adminOnly || me?.role === 'Admin') && (!item.workerHidden || me?.role !== 'Worker'));

  return (
    <div className="admin-dashboard">
      <section className="admin-command-stage">
        <div className="admin-command-copy">
          <p className="admin-kicker">{today}</p>
          <BlurText as="h1" text={`${greeting()}, ${me?.name.split(' ')[0] ?? 'team'}.`} animateBy="words" delay={90} className="admin-hero-title" />
          <p className="admin-hero-copy">
            Control the company workspace from one screen: tasks, listings, mail, agents, website edits, and team communication.
          </p>
        </div>

        <form onSubmit={submitCommand} className="admin-command-bar">
          <Search className="h-5 w-5 text-white/50" />
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ask the company copilot..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/36"
          />
          <button type="submit" className="admin-command-submit" aria-label="Ask copilot">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>

        <div className="admin-suggestion-row">
          {[
            'Summarise today’s open tasks',
            'Which listings need attention?',
            'Draft a sales follow-up plan',
          ].map((item) => (
            <button key={item} type="button" onClick={() => navigate(`/admin/chat?ask=${encodeURIComponent(item)}`)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${canSeeLeads ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
          {kpis.map((kpi) => (
            <Kpi key={kpi.label} label={kpi.label} value={kpi.value} sub={kpi.sub} to={kpi.to} icon={kpi.icon} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="admin-secondary-button inline-flex items-center gap-2 px-3 py-2 text-xs">
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-signal-grid">
        <Signal label="Open work" value={open.length} sub={`${overdue.length} overdue`} icon={Clock} hue={overdue.length ? HUE.red : HUE.green} />
        <Signal label="Listings" value={estates.length} sub={`${land} land · ${homes} homes`} icon={Building2} hue={HUE.blue} />
        <Signal label="Open leads" value={canSeeLeads ? openLeads.length : done.length} sub={canSeeLeads ? `${leads.length - openLeads.length} closed or lost` : 'visible to you'} icon={CheckSquare} hue={openLeads.length ? HUE.green : HUE.blue} />
        <Signal label="Team" value={activeUsers.length} sub="active staff" icon={Users} hue={HUE.blue} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="admin-workspace-grid">
          {workspace.map((item, index) => (
            <div key={item.to}>
              <WorkspaceTile label={item.label} detail={item.detail} to={item.to} icon={item.icon} delay={index * 45} />
            </div>
          ))}
        </div>

        <aside className="admin-priority-panel">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="admin-kicker">Priority queue</p>
              <h2 className="mt-1 text-2xl font-light text-white">What needs motion</h2>
            </div>
            <Link to="/admin/tasks" className="text-white/44 transition-colors hover:text-accent-2" aria-label="Open tasks">
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-white/8">
            {priorityTasks.length === 0 && (
              <p className="py-10 text-center text-sm text-white/42">No open tasks visible to you.</p>
            )}
            {priorityTasks.map((task) => {
              const who = nameById.get(task.assigneeId) ?? 'Unassigned';
              return (
                <Link key={task._id} to="/admin/tasks" className="block py-4 transition-colors hover:text-accent-2">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: isOverdue(task.due, task.status) ? `rgb(${HUE.red})` : `rgb(${HUE.green})` }} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white">{task.title}</span>
                      <span className="mt-1 block text-xs text-white/42">{who} · due {task.due}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>

      <section className={`grid gap-4 ${canSeeLeads ? 'lg:grid-cols-2' : ''}`}>
        {canSeeLeads && (
          <div className="admin-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="admin-kicker">Lead funnel</p>
                <h2 className="mt-1 text-xl font-light text-primary">Where leads sit</h2>
              </div>
              <Link to="/admin/crm" className="text-muted transition-colors hover:text-accent" aria-label="Open CRM">
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {funnel.map((stage) => (
                <Link key={stage.key} to="/admin/crm" className="group block">
                  <span className="flex items-center justify-between text-xs">
                    <span className="text-muted transition-colors group-hover:text-accent">{stage.label}</span>
                    <span className="tnum text-primary">{stage.count}</span>
                  </span>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-accent/10">
                    <span
                      className={`block h-full rounded-full ${stage.key === 'closed' ? 'bg-accent-2' : 'bg-accent'}`}
                      style={{ width: `${stage.count === 0 ? 0 : Math.max(4, Math.round((stage.count / funnelMax) * 100))}%` }}
                    />
                  </span>
                </Link>
              ))}
              {leads.length === 0 && <p className="pt-1 text-xs text-muted">No leads yet — new website enquiries land here.</p>}
            </div>
          </div>
        )}

        <div className="admin-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="admin-kicker">Today</p>
              <h2 className="mt-1 text-xl font-light text-primary">On deck today</h2>
            </div>
            <Link to="/admin/tasks" className="text-muted transition-colors hover:text-accent" aria-label="Open tasks">
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-rule">
            {todayRows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">Nothing scheduled for today. Enjoy the quiet.</p>
            )}
            {todayRows.slice(0, 8).map((row) => (
              <Link key={row.key} to={row.to} className="group flex items-start gap-3 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: row.dot }} />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-primary transition-colors group-hover:text-accent">{row.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{row.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-agent-ribbon">
        <div>
          <p className="admin-kicker">Agency layer</p>
          <h2 className="mt-1 text-3xl font-light text-white">Specialist agents are ready.</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {ADMIN_AGENTS.slice(0, 7).map((agent) => (
            <Link key={agent.id} to={`/admin/agents?agent=${agent.id}`} className="admin-agent-pill">
              <agent.icon className="h-4 w-4" />
              {agent.name}
            </Link>
          ))}
          <Link to="/admin/agents" className="admin-agent-pill is-more">
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <AssistantDock />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  to,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub: string;
  to: string;
  icon: LucideIcon;
}) {
  return (
    <Link to={to} className="admin-card group flex flex-col gap-3 p-4">
      <span className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-accent" />
        <ArrowUpRight className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-accent" />
      </span>
      <span>
        <span className="block text-2xl font-light leading-none text-primary tnum">
          {typeof value === 'number' ? <CountUp to={value} duration={1} /> : value}
        </span>
        <span className="mt-1.5 block text-xs text-muted">{label}</span>
        <span className="mt-0.5 block text-[0.68rem] text-muted">{sub}</span>
      </span>
    </Link>
  );
}

function Signal({ label, value, sub, icon: Icon, hue }: { label: string; value: number; sub: string; icon: LucideIcon; hue: string }) {
  return (
    <div className="admin-signal">
      <span className="admin-signal-icon" style={{ color: `rgb(${hue})`, background: `rgba(${hue},0.14)` }}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-4xl font-light leading-none text-white tnum"><CountUp to={value} duration={1.2} /></span>
        <span className="mt-2 block text-sm text-white/78">{label}</span>
        <span className="mt-1 block text-xs text-white/38">{sub}</span>
      </span>
    </div>
  );
}

function WorkspaceTile({
  label,
  detail,
  to,
  icon: Icon,
  delay,
}: {
  label: string;
  detail: string;
  to: string;
  icon: LucideIcon;
  delay: number;
}) {
  return (
    <Link to={to} className="admin-workspace-tile" style={{ animationDelay: `${delay}ms` }}>
      <span className="admin-workspace-orb"><Icon className="h-6 w-6" /></span>
      <span className="mt-auto">
        <span className="flex items-center gap-2 text-lg text-white">
          {label} <ArrowUpRight className="h-4 w-4 text-accent-2" />
        </span>
        <span className="mt-2 block text-sm leading-6 text-white/48">{detail}</span>
      </span>
    </Link>
  );
}
