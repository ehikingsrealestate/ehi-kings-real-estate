import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'motion/react';

// Adapted from react-bits ShinyText — a shine sweeps across the text on a loop.

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  delay?: number;
  className?: string;
  color?: string;
  shineColor?: string;
  spread?: number;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 3,
  delay = 1.2,
  className = '',
  color = '#8fa3bd',
  shineColor = '#ffffff',
  spread = 120,
}: ShinyTextProps) {
  const [paused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame((time) => {
    if (disabled || paused) {
      lastTimeRef.current = null;
      return;
    }
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const cycleDuration = animationDuration + delayDuration;
    const cycleTime = elapsedRef.current % cycleDuration;
    progress.set(cycleTime < animationDuration ? (cycleTime / animationDuration) * 100 : 100);
  });

  useEffect(() => {
    elapsedRef.current = 0;
    progress.set(0);
  }, [progress]);

  const backgroundPosition = useTransform(progress, (p) => `${150 - p * 2}% center`);

  return (
    <motion.span
      className={className}
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 38%, ${shineColor} 50%, ${color} 62%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        display: 'inline-block',
      }}
    >
      {text}
    </motion.span>
  );
}
