import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, MapPin, Ruler, ScrollText } from 'lucide-react';
import type { Estate } from '../data/site';
import { estateMedia } from '../data/propertyMedia';
import TiltCard from './reactbits/TiltCard';

export default function EstateGrid({ estates }: { estates: Estate[] }) {
  return (
    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {estates.map((estate, index) => (
        <motion.article
          key={estate.slug}
          initial={{ y: 26, opacity: 0, filter: 'blur(8px)' }}
          whileInView={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.76, delay: (index % 3) * 0.055, ease: [0.16, 1, 0.3, 1] }}
          className="group min-w-0"
        >
          <TiltCard className="rounded-[1.25rem]" maxTilt={5}>
          <Link
            to={`/estates/${estate.slug}`}
            className="block overflow-hidden rounded-[1.25rem] border border-rule bg-white transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_18px_60px_rgba(0,0,0,0.08)]"
          >
            <motion.div
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-[4/3] overflow-hidden bg-surface sm:aspect-[16/10]"
            >
              <img
                src={estateMedia(estate)}
                alt={estate.img ? estate.name : `Representative ${estate.kind === 'land' ? 'land' : 'home'} photography for ${estate.name}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/4 to-black/8" />
              <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xl sm:left-4 sm:top-4">
                {estate.kind === 'land' ? 'Land' : 'Home'}
              </span>
              <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white sm:right-4 sm:top-4">
                <ArrowUpRight className="h-4 w-4" />
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-5">
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                  <MapPin className="h-3.5 w-3.5" />
                  {estate.region}
                </p>
                <h3 className="mt-2 max-w-md text-balance font-heading text-xl font-light leading-[1.15] tracking-normal sm:text-2xl">
                  {estate.name}
                </h3>
              </div>
            </motion.div>

            <div className="grid gap-5 p-4 sm:p-5">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted" />
                  {estate.size}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted" />
                  {estate.title}
                </span>
              </div>
              <div className="flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xl font-medium tabular-nums text-primary sm:text-2xl">{estate.price}</p>
                  {estate.note && <p className="mt-1 max-w-xs text-xs leading-5 text-muted">{estate.note}</p>}
                </div>
                <span className="w-fit shrink-0 rounded-full border border-primary/15 px-4 py-2 text-sm text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  Overview
                </span>
              </div>
            </div>
          </Link>
          </TiltCard>
        </motion.article>
      ))}
    </div>
  );
}
