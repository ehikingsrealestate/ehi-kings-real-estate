import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { COMPANY } from '../data/site';
import { usePostsState } from '../data/usePosts';
import NotFound from './NotFound';
import { Reveal } from '../components/MotionPrimitives';

export default function BlogPost() {
  const { slug } = useParams();
  const { posts, loading } = usePostsState();
  const post = posts.find((item) => item.slug === slug);
  const related = posts.filter((item) => item.slug !== post?.slug).slice(0, 3);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | ${COMPANY.short} Journal`;
    const description = document.querySelector('meta[name="description"]') ?? document.createElement('meta');
    description.setAttribute('name', 'description');
    description.setAttribute('content', post.metaDescription);
    if (!description.parentNode) document.head.appendChild(description);
  }, [post]);

  if (!post) return loading ? null : <NotFound />;

  return (
    <article className="px-3 pb-20 pt-24 sm:px-5 sm:pb-24 sm:pt-28 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm text-primary shadow-[0_14px_50px_rgba(0,0,0,0.06)] transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-2 hover:text-accent-2-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Journal
        </Link>

        <Reveal blur>
          <header className="mt-10 rounded-[1.65rem] bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.05)] sm:p-7 md:rounded-[2.5rem] md:p-12">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="rounded-full bg-accent-2 px-4 py-2 font-medium text-accent-2-ink">{post.category}</span>
              <span>{post.date}</span>
              <span>{post.readingTime}</span>
            </div>
            <h1 className="mt-8 max-w-5xl text-balance font-heading text-[2.65rem] font-light leading-[0.98] tracking-normal sm:text-5xl sm:leading-[0.96] md:text-6xl lg:text-[6.8rem]">
              {post.title}
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-8 text-muted md:text-xl md:leading-9">
              {post.excerpt}
            </p>
          </header>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-12 lg:grid-cols-[1fr_16rem]">
          <Reveal className="rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.04)] md:p-12">
            <div className="space-y-7 text-lg leading-9 text-primary/86">
              {post.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <aside className="lg:sticky lg:top-28 lg:h-max">
            <div className="rounded-[1.6rem] border border-accent-2/30 bg-primary p-5 text-white">
              <p className="text-sm font-medium text-accent-2">Search topics</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-accent-2/25 px-3 py-1 text-xs text-white/78">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="px-2 text-3xl font-light tracking-normal">Read next</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((item, index) => (
              <div key={item.slug}>
                <Reveal delay={index * 0.06}>
                  <Link
                    to={`/blog/${item.slug}`}
                    className="group flex min-h-[16rem] flex-col justify-between rounded-[1.45rem] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.05)] transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-primary hover:text-white sm:rounded-[1.7rem]"
                  >
                    <div>
                      <p className="text-sm opacity-60">{item.category}</p>
                      <h3 className="mt-5 text-2xl font-light leading-tight tracking-normal">{item.title}</h3>
                    </div>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm text-accent-2 group-hover:text-accent-2">
                      Open
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </span>
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
