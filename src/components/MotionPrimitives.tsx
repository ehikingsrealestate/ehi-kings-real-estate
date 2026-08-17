import { type MouseEvent, type ReactNode, useRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

export const smoothEase = [0.16, 1, 0.3, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  blur?: boolean;
};

export function Reveal({ children, className = '', delay = 0, distance = 34, blur = false }: RevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: distance, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduce ? 0.01 : 0.8, delay, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type MagneticLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function MagneticLink({ children, className = '', strength = 0.16, ...props }: MagneticLinkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 170, damping: 20, mass: 0.55 });
  const springY = useSpring(y, { stiffness: 170, damping: 20, mass: 0.55 });
  const innerX = useTransform(springX, (value) => value * -0.22);
  const innerY = useTransform(springY, (value) => value * -0.22);

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) * strength);
    y.set((event.clientY - centerY) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMove} onMouseLeave={reset}>
      <Link {...props} className={className}>
        <motion.span style={{ x: innerX, y: innerY }} className="relative z-10 inline-flex items-center gap-3">
          {children}
        </motion.span>
      </Link>
    </motion.div>
  );
}
