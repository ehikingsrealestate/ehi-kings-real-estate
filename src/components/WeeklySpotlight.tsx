import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarCheck,
  CheckCircle2,
  Download,
  Maximize2,
  MessageSquare,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { COMPANY } from '../data/site';
import { WEEKLY_SPOTLIGHT } from '../data/media';
import { useSiteBlocks } from '../data/useSiteBlocks';
import { Reveal } from './MotionPrimitives';
import GrowRule from './fx/GrowRule';
import SpotlightCard from './reactbits/SpotlightCard';

function isVideoAsset(url: string, fallbackType: 'video' | 'image'): boolean {
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return true;
  if (/\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url)) return false;
  return fallbackType === 'video';
}

export default function WeeklySpotlight() {
  const site = useSiteBlocks();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const badgeText = site.get('home.weekly.badge', WEEKLY_SPOTLIGHT.weekLabel);
  const titleText = site.get('home.weekly.title', WEEKLY_SPOTLIGHT.title);
  const subtitleText = site.get('home.weekly.subtitle', WEEKLY_SPOTLIGHT.subtitle);
  const bodyText = site.get('home.weekly.body', WEEKLY_SPOTLIGHT.description);
  const mediaUrl = site.get('home.weekly.media', WEEKLY_SPOTLIGHT.mediaUrl);
  const isVideo = isVideoAsset(mediaUrl, WEEKLY_SPOTLIGHT.mediaType);

  const whatsappMessage = encodeURIComponent(WEEKLY_SPOTLIGHT.whatsappPrompt);
  const whatsappHref = `https://wa.me/${COMPANY.whatsappRaw}?text=${whatsappMessage}`;

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  return (
    <section
      id="weekly-spotlight"
      aria-label="Weekly Real Estate Spotlight & Inspection Update"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:px-14"
    >
      <Reveal>
        <div className="mx-auto max-w-[1520px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-[#071426] via-primary to-[#0d274c] p-6 text-white shadow-[0_30px_90px_rgba(7,20,38,0.24)] sm:p-10 md:p-14">
            {/* Ambient blueprint & gold glow accents */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" />

            {/* Top Weekly Status Ribbon */}
            <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" /> {badgeText}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85">
                  <RefreshCw className="h-3 w-3 text-accent-2" /> {WEEKLY_SPOTLIGHT.badge}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-primary active:scale-95"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Expand Design
                </button>
                <a
                  href={mediaUrl}
                  download={WEEKLY_SPOTLIGHT.downloadName}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#071426] shadow-sm transition hover:bg-amber-300 active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" /> Save Media
                </a>
              </div>
            </div>

            {/* Main Content & Animated Design Grid */}
            <div className="relative mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center xl:gap-16">
              {/* Left Column — Weekly Editorial & Inspection Action */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Weekly Portfolio Dispatch
                </p>
                <GrowRule className="mt-3 w-16" />

                <h2 className="mt-6 font-heading text-[clamp(2rem,3.8vw,3.6rem)] font-light leading-[1.06] tracking-tight text-white">
                  {titleText}
                </h2>

                <p className="mt-4 font-heading text-lg font-medium tracking-wide text-amber-300 sm:text-xl">
                  {subtitleText}
                </p>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                  {bodyText}
                </p>

                {/* Three Core Pillars */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {WEEKLY_SPOTLIGHT.pillars.map((pillar, idx) => (
                    <SpotlightCard
                      key={pillar.title}
                      className="rounded-2xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-md transition duration-300 hover:border-amber-400/40"
                      spotlightColor="rgba(251, 191, 36, 0.12)"
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300">
                        0{idx + 1}
                      </span>
                      <h3 className="mt-3 font-heading text-base font-medium text-white">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-5 text-white/70">
                        {pillar.detail}
                      </p>
                    </SpotlightCard>
                  ))}
                </div>

                {/* Inspection Schedule & Direct DM Box */}
                <div className="mt-8 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-400/15 via-white/[0.06] to-transparent p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                      <CalendarCheck className="h-4 w-4 shrink-0" />
                      {WEEKLY_SPOTLIGHT.ctaText}
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-white/85">
                      Tue · Thu · Sat — 10:00 AM
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
                    >
                      <MessageSquare className="h-4 w-4" /> Send WhatsApp DM ({COMPANY.whatsapp})
                    </a>
                    <Link
                      to="/book?type=inspection"
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-primary active:scale-95"
                    >
                      <CalendarCheck className="h-4 w-4" /> Book Inspection Slot
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> Verified Land & Luxury Homes
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Guided Physical & Virtual Tours
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column — Animated Design Showcase */}
              <div className="mx-auto w-full max-w-[400px]">
                <div className="group relative overflow-hidden rounded-[1.75rem] border-2 border-amber-400/35 bg-[#040d1a] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#040d1a]">
                    {isVideo ? (
                      <>
                        <video
                          ref={videoRef}
                          src={mediaUrl}
                          autoPlay
                          loop
                          muted={muted}
                          playsInline
                          onPlay={() => setPlaying(true)}
                          onPause={() => setPlaying(false)}
                          className="h-full w-full object-cover"
                        />
                        {/* Floating Video Controls */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-full border border-white/15 bg-black/65 px-3.5 py-2 backdrop-blur-md">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-amber-400 hover:text-[#071426]"
                              aria-label={playing ? 'Pause weekly animation' : 'Play weekly animation'}
                            >
                              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={toggleMute}
                              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[0.7rem] font-semibold text-white transition hover:bg-amber-400 hover:text-[#071426]"
                              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                            >
                              {muted ? (
                                <>
                                  <VolumeX className="h-3.5 w-3.5 text-amber-300" /> Tap for Sound
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> Sound On
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setLightboxOpen(true)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-primary"
                            aria-label="Open full-screen view"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={titleText}
                        onClick={() => setLightboxOpen(true)}
                        className="h-full w-full cursor-pointer object-cover transition duration-700 group-hover:scale-[1.02]"
                      />
                    )}
                  </div>

                  {/* Card Footer Caption */}
                  <div className="flex items-center justify-between border-t border-white/10 bg-[#071426] px-4 py-3 text-xs">
                    <div>
                      <p className="font-medium text-white">{COMPANY.short} Weekly Creative</p>
                      <p className="text-[0.68rem] text-white/60">Refreshed weekly with current inspection focus</p>
                    </div>
                    <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-300">
                      Live Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Full-Screen Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-2xl md:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative flex max-h-[94vh] w-full max-w-2xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex w-full items-center justify-between text-white">
                <div>
                  <h4 className="font-heading text-lg font-light sm:text-xl">{titleText}</h4>
                  <p className="text-xs text-white/70">{subtitleText}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={mediaUrl}
                    download={WEEKLY_SPOTLIGHT.downloadName}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white hover:text-primary"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative max-h-[80vh] w-full overflow-hidden rounded-2xl bg-black/70 shadow-2xl">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="max-h-[80vh] w-full object-contain"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={titleText}
                    className="max-h-[80vh] w-full object-contain"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

