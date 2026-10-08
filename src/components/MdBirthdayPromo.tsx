import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Gift,
  Instagram,
  Maximize2,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Tv,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { COMPANY } from '../data/site';
import ResponsiveImage from './ResponsiveImage';
import SpotlightCard from './reactbits/SpotlightCard';

const PROMO_IMAGE = '/promos/md-birthday-offer.jpeg';

const GIFT_SETS = [
  {
    setNumber: '1ST SET',
    title: 'Comfort & Entertainment Pack',
    badge: 'Popular Choice',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
    items: [
      { name: 'Air Conditioner (AC)', icon: Wind, desc: 'High-efficiency split unit' },
      { name: '32-inch Smart TV', icon: Tv, desc: 'HD digital screen' },
      { name: 'Microwave Oven', icon: Zap, desc: 'Quick reheat & defrost' },
    ],
  },
  {
    setNumber: '2ND SET',
    title: 'Home Care & Kitchen Pack',
    badge: 'Premium Value',
    badgeColor: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    items: [
      { name: 'Automatic Washing Machine', icon: Sparkles, desc: 'Front/top load convenience' },
      { name: '32-inch Smart TV', icon: Tv, desc: 'HD digital screen' },
      { name: 'Microwave Oven', icon: Zap, desc: 'Kitchen countertop essential' },
    ],
  },
  {
    setNumber: '3RD SET',
    title: 'Chef & Laundry Pack',
    badge: 'Complete Setup',
    badgeColor: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
    items: [
      { name: 'Modern Gas Burner', icon: Flame, desc: 'High-speed auto ignition' },
      { name: '32-inch Smart TV', icon: Tv, desc: 'HD digital screen' },
      { name: 'Automatic Washing Machine', icon: Sparkles, desc: 'Effortless home laundry' },
    ],
  },
];

export default function MdBirthdayPromo() {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const whatsappMessage = encodeURIComponent(
    "Hello Ehi-Kings! I'm interested in securing a 1-Bedroom Luxury Apartment at Grace Apartments, Sangotedo Lekki under the MD's Birthday Offer with complimentary gifts. Please share details on allocation and payment schedule.",
  );

  return (
    <section
      id="md-birthday-promo"
      aria-label="MD's Birthday Offer at Grace Apartments"
      className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:px-14"
    >
      {/* Decorative ambient gradients */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-accent-2/10 blur-3xl" />

      <div className="mx-auto max-w-[1520px]">
        {/* Main Promo Card Container */}
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/25 bg-gradient-to-b from-white via-surface to-white p-6 shadow-[0_25px_80px_rgba(20,70,135,0.08)] sm:p-10 md:p-14">
          {/* Top Banner Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-yellow-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                <Gift className="h-4 w-4 text-amber-600" /> MD's Birthday Offer
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-2/30 bg-accent-2/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-2">
                <Sparkles className="h-3.5 w-3.5" /> Limited Time Campaign
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-rule bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm transition hover:border-accent hover:text-accent active:scale-95"
              >
                <Maximize2 className="h-3.5 w-3.5 text-accent" /> View Full Flyer
              </button>
              <a
                href={PROMO_IMAGE}
                download="Ehi-Kings-MD-Birthday-Offer-Grace-Apartments.jpeg"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-accent active:scale-95"
              >
                <Download className="h-3.5 w-3.5" /> Save Flyer
              </a>
            </div>
          </div>

          {/* Hero Content & Flyer Split Grid */}
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center xl:gap-16">
            {/* Left Content Column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-2">
                Exclusive Birthday Promotion
              </p>
              <h2 className="mt-4 font-heading text-[clamp(2.2rem,4.2vw,4rem)] font-light leading-[1.05] tracking-tight text-primary">
                LUXURY LIVING JUST GOT MORE REWARDING.
              </h2>
              <p className="mt-5 text-lg font-medium leading-relaxed text-primary/90 sm:text-xl">
                It's our MD's Birthday Offer, and we're celebrating <span className="text-accent">YOU</span> with exciting gifts!
              </p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
                Own a unit or more at <strong className="font-semibold text-primary">Grace Apartments, Sangotedo, Lekki</strong>, and receive a comprehensive <strong className="font-semibold text-accent-2">COMPLIMENTARY GIFT PACKAGE</strong> delivered straight to your new property upon allocation.
              </p>

              {/* Property Details Matrix */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-rule bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-muted">
                    <Building2 className="h-3.5 w-3.5 text-accent" /> Unit Type
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary sm:text-base">1-Bed Luxury</p>
                  <p className="text-[0.7rem] text-muted">Finished Layout</p>
                </div>

                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-accent">
                    <Zap className="h-3.5 w-3.5" /> Unit Price
                  </div>
                  <p className="mt-2 text-sm font-bold text-accent sm:text-base">₦65 Million</p>
                  <p className="text-[0.7rem] text-muted">Per Apartment</p>
                </div>

                <div className="rounded-2xl border border-accent-2/20 bg-accent-2/5 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-accent-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Initial Deposit
                  </div>
                  <p className="mt-2 text-sm font-bold text-accent-2 sm:text-base">₦20 Million</p>
                  <p className="text-[0.7rem] text-muted">Instant Allocation</p>
                </div>

                <div className="rounded-2xl border border-rule bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-muted">
                    <Clock className="h-3.5 w-3.5 text-accent" /> Flexible Plan
                  </div>
                  <p className="mt-2 text-sm font-semibold text-primary sm:text-base">12 Months</p>
                  <p className="text-[0.7rem] text-muted">Spread Balance</p>
                </div>
              </div>

              {/* Key Trust & Location Highlights */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Governor's Consent Title
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> 24/7 Power & Security
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-accent-2" /> Sangotedo (Near ShopRite Novare Mall)
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Flyer Preview Card */}
            <div className="relative">
              <div
                onClick={() => setLightboxOpen(true)}
                className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border-2 border-accent/30 bg-primary/95 shadow-2xl transition duration-500 hover:border-accent hover:shadow-[0_20px_60px_rgba(0,99,222,0.22)]"
              >
                <ResponsiveImage
                  src={PROMO_IMAGE}
                  alt="Dr. Kingsley Ehikioya MD Birthday Offer — Grace Apartments Lekki"
                  aspectRatio="auto"
                  priority
                  containerClassName="w-full max-h-[540px] bg-slate-900 flex items-center justify-center"
                  className="max-h-[540px] w-full object-contain transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition duration-300 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-xl">
                    <Maximize2 className="h-4 w-4 text-accent" /> Click to Expand Flyer
                  </span>
                </div>

                {/* Bottom Bar Info */}
                <div className="flex items-center justify-between border-t border-white/10 bg-primary/95 px-5 py-3.5 text-white">
                  <div>
                    <p className="text-xs font-medium">Dr. Kingsley Ehikioya (MD, Ehi-Kings)</p>
                    <p className="text-[0.68rem] text-white/60">Grace Apartments 2026 Celebration</p>
                  </div>
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-amber-300">
                    Complimentary Gifts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Complimentary Gift Packages Section */}
          <div className="mt-14 border-t border-rule pt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Reward Breakdown
                </p>
                <h3 className="mt-2 font-heading text-2xl font-light text-primary sm:text-3xl">
                  Choose Your Complimentary Gift Package
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                  Every confirmed unit purchased during the promo qualifies for one of these complete household appliance sets at no extra cost:
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                  <Gift className="h-4 w-4 text-accent-2" /> Fully branded & warrantied appliances
                </span>
              </div>
            </div>

            {/* 3 Gift Set Cards */}
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {GIFT_SETS.map((gift) => (
                <SpotlightCard
                  key={gift.setNumber}
                  className="flex h-full flex-col rounded-[1.5rem] border border-rule bg-white p-6 transition-all duration-300 hover:border-accent/40 hover:shadow-lg"
                  spotlightColor="rgba(0, 99, 222, 0.08)"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-primary px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      {gift.setNumber}
                    </span>
                    <span className={`rounded-full border px-3 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ${gift.badgeColor}`}>
                      {gift.badge}
                    </span>
                  </div>

                  <h4 className="mt-4 font-heading text-lg font-normal text-primary">
                    {gift.title}
                  </h4>

                  <ul className="mt-4 flex-1 space-y-3">
                    {gift.items.map((item) => (
                      <li key={item.name} className="flex items-start gap-3 rounded-xl bg-surface/70 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-primary">{item.name}</p>
                          <p className="text-[0.7rem] text-muted">{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 border-t border-rule/60 pt-4">
                    <p className="text-[0.75rem] font-medium text-emerald-700">
                      ✓ Included with each unit purchase
                    </p>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* Action Callout Bar */}
          <div className="mt-12 rounded-[1.5rem] bg-gradient-to-r from-primary via-primary/95 to-[#0b284d] p-6 text-white shadow-xl sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-2-ink">
                  Don't Just Invest In Luxury. Get Rewarded For It!
                </p>
                <h4 className="mt-2 font-heading text-2xl font-light leading-snug sm:text-3xl">
                  Send us a DM today to secure your unit!
                </h4>
                <p className="mt-2 text-sm text-white/75">
                  Units are strictly allocated on a first-come, first-served basis. Connect with our dedicated sales desk directly:
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
                {/* WhatsApp DM Button */}
                <a
                  href={`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2.5 rounded-full bg-emerald-500 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition duration-300 hover:bg-emerald-600 active:scale-95"
                >
                  <MessageSquare className="h-4 w-4" /> Send WhatsApp DM
                </a>

                {/* View Estate Listing Button */}
                <Link
                  to="/estates/grace-apartments-lekki"
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition duration-300 hover:bg-white hover:text-primary active:scale-95"
                >
                  Estate Details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Social Channels & Contact Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-white/70">
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://instagram.com/ehikingsdevelopment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <Instagram className="h-4 w-4 text-pink-400" /> @ehikingsdevelopment
                </a>
                <a
                  href="https://facebook.com/ehikingsrealestate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                    f
                  </span>{' '}
                  @ehikingsrealestate
                </a>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={`tel:${COMPANY.marketingSales.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-1.5 font-medium text-white transition-colors hover:text-accent-2-ink"
                >
                  <Phone className="h-3.5 w-3.5 text-accent-2" /> Sales Desk: {COMPANY.marketingSales}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Flyer Lightbox Modal */}
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
              className="relative flex max-h-[96vh] w-full max-w-4xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Controls */}
              <div className="mb-3 flex w-full items-center justify-between text-white">
                <div>
                  <h4 className="font-heading text-lg font-light sm:text-xl">
                    MD's Birthday Special Offer — Grace Apartments
                  </h4>
                  <p className="text-xs text-white/70">
                    ₦65M / Unit · ₦20M Initial Deposit · Complimentary Gift Package
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={PROMO_IMAGE}
                    download="Ehi-Kings-MD-Birthday-Offer-Grace-Apartments.jpeg"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Flyer
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(false)}
                    className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white hover:text-primary"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* High-Resolution Flyer Image */}
              <div className="relative max-h-[78vh] w-full overflow-hidden rounded-2xl bg-black/60 shadow-2xl">
                <img
                  src={PROMO_IMAGE}
                  alt="MD Birthday Offer Grace Apartments full flyer"
                  className="max-h-[78vh] w-full object-contain"
                />
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-2">
                <Link
                  to="/estates/grace-apartments-lekki"
                  onClick={() => setLightboxOpen(false)}
                  className="text-xs text-white/80 underline-offset-4 hover:underline"
                >
                  View full estate specifications & floor plan →
                </Link>
                <a
                  href={`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-emerald-600"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Secure Your Unit via WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
