import { motion } from 'motion/react';

// Hairline that draws itself in from the left when scrolled into view.

export default function GrowRule({ className = '' }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className={`h-px origin-left bg-accent-2/60 ${className}`}
    />
  );
}
