import { useRef, type PropsWithChildren } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

// 3D tilt + glare wrapper in the spirit of react-bits TiltedCard/GlareHover:
// the card leans toward the cursor in perspective and a soft glare tracks it.

interface TiltCardProps extends PropsWithChildren {
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

export default function TiltCard({ children, className = '', maxTilt = 6, glare = true }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useSpring(useMotionValue(0), { stiffness: 240, damping: 22, mass: 0.6 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 240, damping: 22, mass: 0.6 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });

  const glareBackground = useMotionTemplate`radial-gradient(60% 60% at ${glareX}% ${glareY}%, rgba(255,255,255,0.25), transparent 70%)`;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * maxTilt * 2);
    rotateX.set(-py * maxTilt * 2);
    glareX.set((px + 0.5) * 100);
    glareY.set((py + 0.5) * 100);
    glareOpacity.set(1);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      {glare && !reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{ background: glareBackground, opacity: glareOpacity }}
        />
      )}
    </motion.div>
  );
}
