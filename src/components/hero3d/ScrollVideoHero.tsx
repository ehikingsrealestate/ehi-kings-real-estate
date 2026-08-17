import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';

// Scroll-scrubbed cinematic hero.
//
// Timeline (scrollYProgress 0 → 1 across a tall pinned section):
//   0.00 – 0.62  building video scrubs (camera dolly-in, ends looking at sky)
//   0.55 – 0.90  clouds rise/fade in over the frame
//   0.82 – 0.97  white overlay ramps to solid → releases into the white page
//
// Asset contract (all optional — graceful fallback at every step):
//   /hero/building.webm | /hero/building.mp4   scrub clip (dense keyframes!)
//   /hero/building-poster.jpg                  first frame / static fallback
//   /hero/clouds.webm   | /hero/clouds.mp4     cloud fly-through ending white
// Missing video → static poster with parallax. Missing clouds → CSS clouds.
// Reduced motion → static hero, simple fade. Mobile → poster parallax (no scrub).

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=88';

type Props = {
  poster?: string;
  videoBase?: string; // e.g. "/hero/building" → tries .webm + .mp4
  cloudBase?: string; // e.g. "/hero/clouds"
  children?: ReactNode; // headline / CTA overlay
};

export default function ScrollVideoHero({
  poster = '/hero/building-poster.jpg',
  videoBase = '/hero/building',
  cloudBase = '/hero/clouds',
  children,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cloudRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);

  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [hasBuildingVideo, setHasBuildingVideo] = useState(false);
  const [hasCloudVideo, setHasCloudVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const [posterSrc, setPosterSrc] = useState(poster);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Preflight assets — a dev-server SPA fallback or 404 must not count as video.
  useEffect(() => {
    let live = true;
    const probe = async (base: string, set: (v: boolean) => void) => {
      for (const ext of ['.webm', '.mp4']) {
        try {
          const res = await fetch(`${base}${ext}`, { method: 'HEAD' });
          const type = res.headers.get('content-type') ?? '';
          if (res.ok && type.startsWith('video/')) { if (live) set(true); return; }
        } catch { /* try next */ }
      }
    };
    void probe(videoBase, setHasBuildingVideo);
    void probe(cloudBase, setHasCloudVideo);
    return () => { live = false; };
  }, [videoBase, cloudBase]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  // Springed copy for transforms (weight); raw progress drives video time.
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  // — scroll-scrubbed video time (building 0→0.62 · clouds 0.55→0.96) —
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (rafRef.current) return; // rAF throttle
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const building = videoRef.current;
      if (building && videoReady && Number.isFinite(building.duration) && !reduced && !isMobile) {
        const phase = Math.min(1, Math.max(0, v / 0.62));
        building.currentTime = Math.min(building.duration - 0.05, phase * building.duration);
      }
      const clouds = cloudRef.current;
      if (clouds && cloudReady && Number.isFinite(clouds.duration)) {
        if (!clouds.paused) clouds.pause(); // scrubbed, never free-running
        const phase = Math.min(1, Math.max(0, (v - 0.55) / (0.96 - 0.55)));
        clouds.currentTime = Math.min(clouds.duration - 0.05, phase * clouds.duration);
      }
    });
  });
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // — transforms —
  const posterScale = useTransform(smooth, [0, 0.62], [1, 1.16]);
  const posterY = useTransform(smooth, [0, 0.62], ['0%', '-6%']);
  const headlineOpacity = useTransform(smooth, [0, 0.28], [1, 0]);
  const headlineY = useTransform(smooth, [0, 0.3], [0, -70]);
  const cloudOpacity = useTransform(smooth, [0.55, 0.78], [0, 1]);
  const cssCloudY = useTransform(smooth, [0.5, 0.95], ['65vh', '-30vh']);
  const whiteOpacity = useTransform(smooth, [0.82, 0.97], [0, 1]);

  // Reduced motion: plain static hero, no pinning theatre.
  if (reduced) {
    return (
      <section className="relative min-h-[100svh] overflow-hidden bg-white">
        <img src={posterSrc} alt="" className="absolute inset-0 h-full w-full object-cover"
          onError={() => setPosterSrc(FALLBACK_POSTER)} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-white" />
        <div className="relative z-10 flex min-h-[100svh] flex-col justify-center px-6 md:px-14">{children}</div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative h-[260vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-white">
        {/* Layer 1 — poster (always present; also the video's first frame) */}
        <motion.img
          src={posterSrc}
          alt="Audacious Hotel Apartments, Lekki"
          style={{ scale: posterScale, y: posterY }}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setPosterSrc(FALLBACK_POSTER)}
        />

        {/* Layer 2 — scrub video (desktop only; sits over the poster once ready) */}
        {!isMobile && hasBuildingVideo && (
          <video
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            style={{ opacity: videoReady ? 1 : 0 }}
            className="absolute inset-0 h-full w-full object-cover"
            onLoadedData={() => setVideoReady(true)}
          >
            <source src={`${videoBase}.webm`} type="video/webm" />
            <source src={`${videoBase}.mp4`} type="video/mp4" />
          </video>
        )}

        {/* Layer 3 — legibility gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10" />

        {/* Layer 4 — headline overlay */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="relative z-10 flex h-full flex-col justify-end px-5 pb-24 sm:px-8 md:px-14"
        >
          {children}
        </motion.div>

        {/* Layer 5 — clouds: scroll-scrubbed Higgsfield clip when present, CSS clouds otherwise */}
        <motion.div style={{ opacity: cloudOpacity }} className="pointer-events-none absolute inset-0 z-20">
          {hasCloudVideo && (
            <video
              ref={cloudRef}
              muted
              playsInline
              preload="auto"
              style={{ opacity: cloudReady ? 1 : 0 }}
              className="absolute inset-0 h-full w-full object-cover"
              onLoadedData={() => setCloudReady(true)}
            >
              <source src={`${cloudBase}.webm`} type="video/webm" />
              <source src={`${cloudBase}.mp4`} type="video/mp4" />
            </video>
          )}
          {!(hasCloudVideo && cloudReady) && (
            <motion.div style={{ y: cssCloudY }} className="absolute inset-x-[-20%] top-0 h-[160vh]">
              <CssClouds />
            </motion.div>
          )}
        </motion.div>

        {/* Layer 6 — white ramp into the page */}
        <motion.div style={{ opacity: whiteOpacity }} className="pointer-events-none absolute inset-0 z-30 bg-white" />
      </div>
    </section>
  );
}

// Soft procedural clouds — placeholder until the generated clip lands.
function CssClouds() {
  const blobs = [
    { w: 60, h: 26, l: -5, t: 8, o: 0.95, b: 30 },
    { w: 48, h: 20, l: 42, t: 2, o: 0.9, b: 34 },
    { w: 70, h: 30, l: 15, t: 22, o: 1, b: 26 },
    { w: 55, h: 24, l: 60, t: 30, o: 0.92, b: 30 },
    { w: 80, h: 34, l: -10, t: 44, o: 1, b: 22 },
    { w: 65, h: 28, l: 45, t: 55, o: 1, b: 24 },
    { w: 90, h: 40, l: 5, t: 68, o: 1, b: 18 },
  ];
  return (
    <div className="relative h-full w-full">
      {blobs.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${c.w}vw`,
            height: `${c.h}vh`,
            left: `${c.l}%`,
            top: `${c.t}%`,
            opacity: c.o,
            filter: `blur(${c.b}px)`,
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.98), rgba(255,255,255,0.55) 60%, transparent)',
          }}
        />
      ))}
      {/* solid white floor so the tail of the cloud bank reads fully white */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-white via-white to-transparent" />
    </div>
  );
}
