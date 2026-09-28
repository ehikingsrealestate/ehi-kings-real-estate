import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Download, Maximize2, X, Award, CheckCircle2, MessageSquare, PhoneCall, Sparkles } from 'lucide-react';
import { REALTOR_INCENTIVES, REALTOR_INCENTIVE_FLIER } from '../data/media';
import { COMPANY } from '../data/site';

export default function RealtorIncentives() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="rounded-[1.5rem] bg-gradient-to-br from-primary via-[#0f1d32] to-[#0a1424] p-6 text-white shadow-2xl sm:p-8 md:p-12">
      {/* Top Heading */}
      <div className="flex flex-col gap-6 border-b border-white/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-2-ink">
              <Sparkles className="h-3.5 w-3.5" /> 2026 Partner Program
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
              For Realtors & Brokers
            </span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-light leading-[1.05] sm:text-4xl md:text-5xl">
            Realtor Incentive Package.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            Earn top-tier electronics, laptops, home appliances, and cash commissions up to ₦5,000,000 on every closed deal with Ehi-Kings Real Estate.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary shadow-lg transition hover:bg-white/90 active:scale-95"
          >
            <Maximize2 className="h-4 w-4" /> View Official Flyer
          </button>
          <a
            href={REALTOR_INCENTIVE_FLIER}
            download="Ehi-Kings-Realtor-Incentive-2026.png"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white/20 active:scale-95"
          >
            <Download className="h-4 w-4" /> Download PDF / PNG
          </a>
        </div>
      </div>

      {/* Main Grid: Visual Flyer Preview + Incentive Table */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.5fr] lg:items-center">
        {/* Flyer Card Preview */}
        <div
          onClick={() => setModalOpen(true)}
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl transition duration-500 hover:border-accent-2/60"
        >
          <div className="aspect-[3/4] w-full overflow-hidden bg-black/40">
            <img
              src={REALTOR_INCENTIVE_FLIER}
              alt="Ehi-Kings Realtor Incentive Package 2026"
              className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2-ink">Official 2026 Incentive</p>
              <p className="font-heading text-lg text-white">Full Reward Schedule</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition group-hover:bg-accent group-hover:text-accent-ink">
              <Maximize2 className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* Structured Milestone Rewards Table */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent-2" />
                <h3 className="font-heading text-lg font-light text-white">Sales Target & Rewards</h3>
              </div>
              <span className="text-xs text-white/60">Instant Claim upon verification</span>
            </div>

            <div className="mt-4 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
              {REALTOR_INCENTIVES.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col justify-between gap-2 rounded-xl p-3 text-xs sm:flex-row sm:items-center ${
                    item.highlight
                      ? 'border border-amber-400/40 bg-amber-500/15 text-amber-200'
                      : 'border border-white/5 bg-white/5 text-white/90 hover:bg-white/10'
                  }`}
                >
                  <div className="flex-1">
                    <span className="font-medium text-white">{item.salesTarget}</span>
                    <span className="ml-2 text-[0.75rem] text-white/60 font-mono">({item.amount})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-accent-2">
                    <Gift className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.reward}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Realtor Partner Registration CTA */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 p-5 sm:flex-row">
            <div>
              <p className="font-heading text-base font-normal text-white">Ready to partner with Ehi-Kings?</p>
              <p className="text-xs text-white/70">Register today to receive verified sales materials, direct updates, and priority allocation.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`https://wa.me/2348109227485?text=Hello%20Ehi-Kings,%20I%20want%20to%20register%20as%20a%20Realtor%20and%20access%20the%202026%20incentive%20package.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-emerald-600"
              >
                <MessageSquare className="h-4 w-4" /> WhatsApp Realtor Desk
              </a>
              <a
                href={`tel:${COMPANY.phones[0]}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-primary"
                title="Call Realtor Desk"
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/95 p-4 backdrop-blur-2xl md:p-8"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="relative flex max-h-[95vh] w-full max-w-3xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex w-full items-center justify-between text-white">
                <div>
                  <h4 className="font-heading text-lg font-light sm:text-xl">Ehi-Kings Realtor Incentive Package 2026</h4>
                  <p className="text-xs text-white/70">Official company incentive and sales milestone guidelines</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={REALTOR_INCENTIVE_FLIER}
                    download="Ehi-Kings-Realtor-Incentive-2026.png"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-white hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white hover:text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative max-h-[82vh] w-full overflow-hidden rounded-2xl bg-black/40 shadow-2xl">
                <img
                  src={REALTOR_INCENTIVE_FLIER}
                  alt="Ehi-Kings Realtor Incentive Package 2026"
                  className="max-h-[82vh] w-full object-contain"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
