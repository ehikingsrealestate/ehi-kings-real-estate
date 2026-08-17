import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

// Thin gradient progress bar pinned to the top of the viewport, tracking how
// far down the page you are. Reads scroll on rAF (event-independent).

export default function ScrollProgress() {
  const progress = useMotionValue(0);
  const scaleX = useSpring(progress, { stiffness: 150, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.set(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[90] h-[3px] origin-left bg-gradient-to-r from-accent via-accent to-accent-2"
    />
  );
}
