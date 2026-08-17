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

  // Hide on scroll down, reveal on scroll up (rAF read — event-independent).
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const loop = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 8) {
        setHidden(y > last && y > 480 && !menuOpen);
        last = y;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [menuOpen]);

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-5 md:px-8"
      style={{ transform: hidden ? 'translateY(-120%)' : 'translateY(0)' }}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1680px] items-center justify-between rounded-2xl border border-white/10 bg-primary/85 px-4 text-white shadow-[0_10px_40px_rgba(10,20,40,0.18)] backdrop-blur-xl md:px-6">
        <Link to="/" className="flex shrink-0 items-center" aria-label={`${COMPANY.short} home`}>
          <span className="flex h-14 w-[4.4rem] items-center justify-center overflow-hidden">
            <img src="/ehi-kings-logo.png" alt="" className="max-h-12 max-w-[4rem] object-contain transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-rotate-3 hover:scale-110" />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[0.68rem] uppercase tracking-[0.16em] lg:flex">
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
            className="hidden items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.16em] text-white transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white hover:text-primary lg:inline-flex"
          >
            <account.Icon className="h-4 w-4" />
            {account.label}
          </Link>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <Menu className={`absolute h-5 w-5 transition duration-500 ${menuOpen ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
            <X className={`absolute h-5 w-5 transition duration-500 ${menuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-3 max-w-[1680px] overflow-hidden rounded-2xl border border-white/10 bg-primary/95 p-5 text-white shadow-[0_16px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:hidden"
          >
            <div className="grid gap-2">
              {NAV.map((item, index) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-[1.25rem] px-5 py-4 text-3xl font-light tracking-normal transition-colors ${
                        isActive ? 'bg-white text-primary' : 'text-white/74 hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + NAV.length * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={account.to}
                  className="mt-2 flex items-center gap-3 rounded-[1.25rem] bg-white px-5 py-4 text-3xl font-light tracking-normal text-primary transition-colors hover:bg-white/90"
                >
                  <account.Icon className="h-7 w-7" />
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
