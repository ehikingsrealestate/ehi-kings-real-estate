import { useEffect } from 'react';
import Lenis from 'lenis';

// Site-wide inertial smooth scrolling (darkroomengineering/lenis).
// Exposed on window.__lenis so nav resets and back-to-top can drive it.

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function LenisProvider() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, autoRaf: false });
    window.__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);
  return null;
}
