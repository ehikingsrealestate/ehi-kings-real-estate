import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { COMPANY, NAV } from '../data/site';
import { useCustomer } from '../customer/useCustomer';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { pathname } = useLocation();
  const { token, me } = useCustomer();
  const signedIn = Boolean(token && me);
  const account = signedIn
    ? { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }
    : { to: '/account', label: 'Sign in', Icon: LogIn };

  useEffect(() => setMenuOpen(false), [pathname]);

  // Hide on scroll down, reveal on scroll up using an event-driven passive listener
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (Math.abs(y - last) > 8) {
            setHidden(y > last && y > 380 && !menuOpen);
            last = y;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-5 md:px-8"
      style={{ transform: hidden ? 'translateY(-120%)' : 'translateY(0)' }}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1680px] items-center justify-between rounded-2xl border border-white/10 bg-primary/90 px-4 text-white shadow-[0_10px_40px_rgba(10,20,40,0.18)] backdrop-blur-xl md:px-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label={`${COMPANY.short} home`}>
          <span className="flex h-14 w-[4.4rem] items-center justify-center overflow-hidden">
            <img
              src="/ehi-kings-logo.png"
              alt="Ehi-Kings Logo"
              width={64}
              height={48}
              loading="eager"
              fetchPriority="high"
              className="max-h-12 max-w-[4rem] object-contain transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-rotate-3 hover:scale-110"
            />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.68rem] uppercase tracking-[0.16em] lg:flex" aria-label="Main Navigation">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative whitespace-nowrap py-3 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:bg-white ${
                  isActive
                    ? 'text-white after:scale-x-100'
                    : 'text-white/65 hover:text-white hover:after:scale-x-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to={account.to}
            className="hidden min-h-[48px] items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-white transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white hover:text-primary lg:inline-flex"
          >
            <account.Icon className="h-4 w-4" />
            {account.label}
          </Link>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="relative flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-white/15 text-white transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <Menu className={`absolute h-6 w-6 transition duration-500 ${menuOpen ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
            <X className={`absolute h-6 w-6 transition duration-500 ${menuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            aria-label="Mobile Navigation"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-h-[calc(100svh-5.5rem)] max-w-[1680px] overflow-y-auto rounded-2xl border border-white/10 bg-primary/98 p-4 text-white shadow-[0_16px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-5 lg:hidden"
          >
            <div className="grid gap-2">
              {NAV.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 + index * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[48px] items-center rounded-[1rem] px-5 py-3.5 text-2xl font-light tracking-normal transition-colors sm:text-3xl ${
                        isActive ? 'bg-white text-primary font-normal' : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 + NAV.length * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={account.to}
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex min-h-[48px] items-center gap-3 rounded-[1rem] bg-white px-5 py-3.5 text-2xl font-light tracking-normal text-primary transition-colors hover:bg-white/90 sm:text-3xl"
                >
                  <account.Icon className="h-6 w-6" />
                  {account.label}
                </Link>
              </motion.div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
