import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { BookOpen, Bot, Cloud, LayoutDashboard, CheckSquare, Users, MessagesSquare, ShieldCheck, Mail, Building2, LogOut, Loader2, WandSparkles, PanelLeftClose, PanelLeftOpen, Network, Moon, Sun, Handshake, Boxes, Megaphone, Share2, Workflow, MoreHorizontal, X, Settings } from 'lucide-react';
import { useAdmin, roleBadgeClass } from './store';
import InstallButton from './InstallButton';

export default function AdminLayout() {
  const { token, me, loading, logout, can } = useAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('ek_admin_sidebar') === 'collapsed'; } catch { return false; }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('ek_admin_theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem('ek_admin_theme', theme); } catch { /* ignore */ }
  }, [theme]);

  // Close the mobile "More" sheet on navigation and on outside/escape interaction.
  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  if (!token) return <Navigate to="/admin/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-primary flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }
  if (!me) return <Navigate to="/admin/login" replace />;

  const nav = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, show: true },
    { to: '/admin/tasks', label: 'Tasks', icon: CheckSquare, end: false, show: true },
    { to: '/admin/crm', label: 'CRM', icon: Handshake, end: false, show: me.role !== 'Worker' },
    { to: '/admin/team', label: 'Team', icon: Users, end: false, show: true },
    { to: '/admin/listings', label: 'Listings', icon: Building2, end: false, show: me.role === 'Admin' },
    { to: '/admin/journal', label: 'Journal', icon: BookOpen, end: false, show: true },
    { to: '/admin/cloud', label: 'Cloud', icon: Cloud, end: false, show: true },
    { to: '/admin/chat', label: 'AI Chat', icon: Bot, end: false, show: true },
    { to: '/admin/agents', label: 'Agents', icon: Network, end: false, show: true },
    { to: '/admin/team-chat', label: 'Team Chat', icon: MessagesSquare, end: false, show: true },
    { to: '/admin/marketing', label: 'Marketing', icon: Megaphone, end: false, show: me.role !== 'Worker' },
    { to: '/admin/social', label: 'Social', icon: Share2, end: false, show: me.role !== 'Worker' },
    { to: '/admin/automations', label: 'Automations', icon: Workflow, end: false, show: me.role !== 'Worker' },
    { to: '/admin/apps', label: 'Suite', icon: Boxes, end: false, show: me.role !== 'Worker' },
    { to: '/admin/site-editor', label: 'Site', icon: WandSparkles, end: false, show: me.role === 'Admin' },
    { to: '/admin/mail', label: 'Mail', icon: Mail, end: false, show: true },
    { to: '/admin/permissions', label: 'Access', icon: ShieldCheck, end: false, show: can('manage_permissions') },
    { to: '/admin/settings', label: 'Settings', icon: Settings, end: false, show: true },
  ].filter((n) => n.show);

  // Mobile bottom bar shows ~5 primary destinations; the rest go behind "More".
  // Primaries are chosen by intent from the visible nav (role flags already applied),
  // then topped up to five from the remaining visible items so every role gets a full bar.
  const PRIMARY_MOBILE = ['/admin', '/admin/tasks', '/admin/crm', '/admin/team-chat', '/admin/marketing'];
  const MOBILE_PRIMARY_COUNT = 5;
  const preferredPrimary = PRIMARY_MOBILE
    .map((to) => nav.find((n) => n.to === to))
    .filter((n): n is (typeof nav)[number] => Boolean(n));
  const primaryNav = [...preferredPrimary];
  for (const item of nav) {
    if (primaryNav.length >= MOBILE_PRIMARY_COUNT) break;
    if (!primaryNav.includes(item)) primaryNav.push(item);
  }
  primaryNav.length = Math.min(primaryNav.length, MOBILE_PRIMARY_COUNT);
  const moreNav = nav.filter((n) => !primaryNav.includes(n));

  const signOut = async () => { await logout(); navigate('/admin/login'); };
  const workspaceMode = ['/admin/chat', '/admin/mail', '/admin/team-chat', '/admin/site-editor', '/admin/agents'].some((path) => pathname.startsWith(path));
  const logoSrc = theme === 'light' ? '/brand/ehi-kings-logo-color.png' : '/ehi-kings-logo.png';
  const toggleSidebar = () => {
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem('ek_admin_sidebar', next ? 'collapsed' : 'expanded'); } catch { /* ignore */ }
      return next;
    });
  };
  const toggleTheme = () => setTheme((value) => (value === 'dark' ? 'light' : 'dark'));

  return (
    <div className="admin-os min-h-screen bg-bg text-primary font-sans" data-theme={theme}>
      {/* Desktop sidebar */}
      <aside className={`admin-sidebar hidden md:flex fixed inset-y-0 left-0 flex-col py-8 transition-[width,padding] duration-300 ${collapsed ? 'w-20 px-3' : 'w-64 px-6'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3`}>
          {collapsed ? (
            <div className="admin-logo-mark">EK</div>
          ) : (
            <img src={logoSrc} alt="Ehi-Kings" className="h-10 w-auto object-contain" />
          )}
          <button onClick={toggleSidebar} className="admin-icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
        {/* Scrollable nav — with 18 destinations the list overflows the viewport;
            flex-1 + min-h-0 + overflow-y-auto keeps the footer pinned and reachable. */}
        <nav className="mt-10 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-1 -mr-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 text-sm transition-colors ${
                  isActive ? 'is-active' : ''
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" /> {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0 pt-4">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-4`}>
            <div className="admin-avatar">
              {me.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            {!collapsed && <div className="min-w-0">
              <div className="text-sm truncate">{me.name}</div>
              <span className={`inline-block mt-0.5 text-[0.6rem] tracking-[0.12em] uppercase px-2 py-0.5 rounded-full ${roleBadgeClass(me.role)}`}>
                {me.role}
              </span>
            </div>}
          </div>
          <div className="mb-3"><InstallButton collapsed={collapsed} /></div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`mb-3 flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'} text-xs tracking-[0.15em] uppercase text-muted hover:text-accent-2 transition-colors`}
            aria-label={theme === 'dark' ? 'Switch admin to light mode' : 'Switch admin to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
          </button>
          <button onClick={signOut} className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-2'} text-xs tracking-[0.15em] uppercase text-muted hover:text-accent-2 transition-colors`}>
            <LogOut className="w-4 h-4" /> {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="admin-mobile-top md:hidden sticky top-0 z-40 flex items-center justify-between px-5 h-16 border-b backdrop-blur-md">
        <div>
          <img src={logoSrc} alt="Ehi-Kings" className="h-7 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-auto"><InstallButton /></div>
          <button
            type="button"
            onClick={toggleTheme}
            className="admin-icon-button"
            aria-label={theme === 'dark' ? 'Switch admin to light mode' : 'Switch admin to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={signOut} className="text-muted"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Content */}
      <main
        className={`max-w-none transition-[margin] duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'} ${
          workspaceMode ? 'h-[100dvh] overflow-hidden pb-20 md:pb-0' : 'px-5 py-8 pb-28 md:px-10 md:pb-12'
        }`}
      >
        <Outlet />
      </main>

      {/* Mobile liquid-glass bottom nav */}
      <nav className="md:hidden fixed bottom-4 inset-x-4 z-50" ref={moreRef}>
        {/* "More" popover — lists the overflow destinations above the bar */}
        {moreOpen && moreNav.length > 0 && (
          <div
            id="admin-more-sheet"
            role="menu"
            aria-label="More destinations"
            className="admin-mobile-nav mb-2 rounded-2xl border backdrop-blur-2xl backdrop-saturate-150 shadow-2xl p-2"
            style={{ WebkitBackdropFilter: 'blur(24px) saturate(150%)' }}
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[0.6rem] tracking-[0.15em] uppercase text-muted">More</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="admin-icon-button"
                aria-label="Close more menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {moreNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl text-[0.58rem] tracking-wide text-center transition-colors ${
                      isActive ? 'text-accent' : 'text-primary/70'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" /> {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        <div
          className="admin-mobile-nav flex items-center justify-around gap-1 rounded-2xl border backdrop-blur-2xl backdrop-saturate-150 shadow-2xl px-2 py-2"
          style={{ WebkitBackdropFilter: 'blur(24px) saturate(150%)' }}
        >
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[0.58rem] tracking-wide transition-colors shrink-0 ${
                  isActive ? 'text-accent' : 'text-primary/70'
                }`
              }
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </NavLink>
          ))}
          {moreNav.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-controls="admin-more-sheet"
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[0.58rem] tracking-wide transition-colors shrink-0 ${
                moreOpen ? 'text-accent' : 'text-primary/70'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" /> More
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
