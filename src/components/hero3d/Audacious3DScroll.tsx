import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

type Props = {
  image?: string;
  video?: string;
  children?: ReactNode;
};

export default function Audacious3DScroll({
  image = '/hero/audacious-final-frame.png',
  video = '/hero/audacious-scroll-video.mp4',
  children,
}: Props) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const loop = () => {
      const el = root.current;
      if (el) {
        const scrub = Math.max(1, el.offsetHeight - window.innerHeight);
        progress.set(Math.min(1, Math.max(0, window.scrollY / scrub)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progress, reduced]);

  const p = useSpring(progress, { stiffness: 120, damping: 32, restDelta: 0.0005 });
  const mediaScale = useTransform(p, [0, 1], [1.02, 1.12]);
  const mediaY = useTransform(p, [0, 1], [0, -70]);
  const contentY = useTransform(p, [0, 0.58], [0, -84]);
  const contentOpacity = useTransform(p, [0.1, 0.62], [1, 0.12]);
  const handoffOpacity = useTransform(p, [0.78, 1], [0, 1]);

  return (
    <section ref={root} data-hero-3d className="relative h-[210vh] text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#07111f]">
        <motion.div style={{ scale: mediaScale, y: mediaY }} className="absolute inset-0">
          {reduced ? (
            <img
              src={image}
              alt="Audacious Hotel Apartments, an Ehi-Kings development"
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              className="h-full w-full object-cover"
              src={video}
              poster={image}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Audacious Hotel Apartments scroll video"
            />
          )}
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,8,15,0.82),rgba(3,8,15,0.44)_38%,rgba(3,8,15,0.12)_72%),linear-gradient(180deg,rgba(3,8,15,0.18),rgba(3,8,15,0.02)_42%,rgba(3,8,15,0.72))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36vh] bg-gradient-to-t from-[#07111f] via-[#07111f]/54 to-transparent" />

        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="absolute inset-0 z-10 flex items-center px-4 pb-[10vh] pt-24 sm:px-6 md:px-10 lg:px-14"
        >
          {children}
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: handoffOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[30vh] bg-gradient-to-b from-transparent to-white"
        />
      </div>
    </section>
  );
}
