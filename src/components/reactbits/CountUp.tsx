import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

// Adapted from react-bits CountUp — number springs up when scrolled into view.

interface CountUpProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
  separator?: string;
}

export default function CountUp({ to, from = 0, delay = 0, duration = 1.6, className = '', separator = ',' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const formatValue = useCallback(
    (latest: number) => {
      const formatted = Intl.NumberFormat('en-US', {
        useGrouping: !!separator,
        maximumFractionDigits: 0,
      }).format(Math.round(latest));
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [separator]
  );

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(from);
  }, [from, formatValue]);

  useEffect(() => {
    if (!isInView) return;
    const timeoutId = setTimeout(() => motionValue.set(to), delay * 1000);
    return () => clearTimeout(timeoutId);
  }, [isInView, motionValue, to, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
