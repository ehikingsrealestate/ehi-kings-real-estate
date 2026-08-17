import { useEffect, type PropsWithChildren } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

// Skews its children with scroll velocity — fast scrolling makes the content
// lean into the motion, springing upright when scrolling stops.

interface VelocitySkewProps extends PropsWithChildren {
  className?: string;
  max?: number;
}

export default function VelocitySkew({ children, className = '', max = 6 }: VelocitySkewProps) {
  const skewRaw = useMotionValue(0);
  const skewX = useSpring(skewRaw, { stiffness: 160, damping: 22 });

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const loop = () => {
      const y = window.scrollY;
      const velocity = y - last;
      last = y;
      skewRaw.set(Math.max(-max, Math.min(max, velocity * 0.35)));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [skewRaw, max]);

  return (
    <motion.div style={{ skewX }} className={className}>
      {children}
    </motion.div>
  );
}
