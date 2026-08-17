import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { usePosts } from '../data/usePosts';
import { Reveal } from '../components/MotionPrimitives';
import Seo from '../components/Seo';

export default function Blog() {
  const posts = usePosts();
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="px-3 pb-20 pt-24 sm:px-5 sm:pb-24 sm:pt-28 md:px-8 lg:px-12">
      <Seo
        title="Journal — Land, Property & Construction Guides"
        description="Practical Ehi-Kings guides for buying land, checking title, inspecting sites, and planning property development in Nigeria."
        path="/blog"
      />
      <div className="mx-auto max-w-[1520px]">
        <Reveal blur>
          <header className="rounded-[1.65rem] bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-7 md:rounded-[2.5rem] md:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-accent-2">Journal</p>
                <h1 className="mt-6 max-w-5xl text-balance font-heading text-[2.75rem] font-light leading-[0.98] tracking-normal sm:text-5xl sm:leading-[0.96] md:text-6xl lg:text-[6.4rem] xl:text-[7.5rem]">
                  Practical property notes from the field.
                </h1>
              </div>
              <div className="max-w-sm rounded-[1.35rem] border border-accent-2/20 bg-surface p-5 text-sm leading-6 text-muted sm:rounded-[1.5rem]">
                Field notes for buyers comparing land, homes, title documents, inspections, and construction decisions.
              </div>
            </div>
          </header>
        </Reveal>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <Reveal>
            <Link
              to={`/blog/${featured.slug}`}
              className="group relative block min-h-[30rem] overflow-hidden rounded-[1.65rem] bg-primary p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.12)] sm:min-h-[34rem] sm:p-7 md:rounded-[2.5rem] md:p-10"
            >
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(13,30,70,0.96),rgba(4,11,23,0.98))]" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08))]" />
              <div className="relative z-10 flex min-h-[30rem] flex-col justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span className="rounded-full border border-accent-2/35 bg-accent-2 px-4 py-2 font-medium text-accent-2-ink">{featured.category}</span>
                  <span>{featured.date}</span>
                  <span>{featured.readingTime}</span>
                </div>
                <div>
                  <h2 className="max-w-3xl text-balance text-[2.5rem] font-light leading-[0.98] tracking-normal sm:text-5xl sm:leading-[0.96] md:text-6xl lg:text-[6.4rem]">
                    {featured.title}
                  </h2>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{featured.excerpt}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-3 rounded-full bg-accent-2 px-5 py-3 text-sm font-medium text-accent-2-ink transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                  Read guide
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-[1.65rem] bg-white p-4 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-5 md:rounded-[2.5rem]">
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-accent-2/20 bg-surface px-5 py-4 text-sm text-muted sm:rounded-full">
                <Search className="h-4 w-4 text-accent-2" />
                <span>Indexed by topic, title, location, and buyer intent</span>
              </div>
              <div className="mt-4 divide-y divide-rule">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    to={`/blog/${post.slug}`}
                    className="group grid gap-4 py-6 transition-colors hover:text-accent-2"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span>{post.category}</span>
                      <span>{post.date}</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <div className="flex items-start justify-between gap-6">
                      <h2 className="text-2xl font-light leading-tight tracking-normal text-primary group-hover:text-accent-2">
                        {post.title}
                      </h2>
                      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-muted">{post.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
