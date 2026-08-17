import { motion } from 'motion/react';

const PROMOS = [
  'EXCLUSIVE: Get 1 FREE plot for every 5 plots at Charis Garden Estate this month',
  'Plot sizes range from ₦1.6 million (300sqm) to ₦2.8 million with amazing discounts. Hurry!!!',
];

// Scrolling promo announcement ticker (restored from the original site).
export default function PromoTicker() {
  // Duplicate the run so the -50% loop is seamless.
  const run = [...PROMOS, ...PROMOS];

  return (
    <div className="bg-accent text-accent-ink py-3 overflow-hidden whitespace-nowrap border-y border-accent">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        className="flex items-center gap-10 text-xs font-heading tracking-widest uppercase font-medium w-max"
      >
        {run.map((text, i) => (
          <span key={i} className="flex items-center gap-10">
            {text}
            <span aria-hidden className="opacity-60">
              •
            </span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
