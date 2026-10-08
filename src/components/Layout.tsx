import { lazy, Suspense, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import Nav from './Nav';
import Footer from './Footer';
import LenisProvider from './fx/LenisProvider';
import ScrollProgress from './fx/ScrollProgress';
import BackToTop from './fx/BackToTop';
import { CONVEX_ENABLED } from '../admin/convexClient';
import CustomerProvider from '../customer/CustomerProvider';

const ChatWidget = lazy(() => import('./ChatWidget'));
const ClickSpark = lazy(() => import('./reactbits/ClickSpark'));

export default function Layout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();

  // Reset scroll on navigation (through Lenis when active).
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <CustomerProvider>
      <div className="site-shell bg-bg text-primary min-h-screen font-sans selection:bg-accent selection:text-bg">
        <LenisProvider />
        <ScrollProgress />
        <Nav />
        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <ClickSpark sparkColor="#d9a94f" />
        </Suspense>
        <BackToTop />
        {CONVEX_ENABLED && (
          <Suspense fallback={null}>
            <ChatWidget />
          </Suspense>
        )}
      </div>
    </CustomerProvider>
  );
}
