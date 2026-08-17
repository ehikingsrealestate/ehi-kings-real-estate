import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { JOURNAL, type JournalPost } from './site';

// Live journal posts from Convex (what admins edit in /admin/journal).
// Falls back to the static JOURNAL array while loading or if the table is
// empty / not yet imported — mirrors useEstates.

type Row = {
  slug: string; title: string; excerpt: string; category: string;
  date: string; readingTime: string; metaDescription?: string;
  keywords?: string[]; body: string[];
};

const toPost = (r: Row): JournalPost => ({
  slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category,
  date: r.date, readingTime: r.readingTime,
  metaDescription: r.metaDescription ?? r.excerpt,
  keywords: r.keywords ?? [], body: r.body,
});

export function usePostsState(): { posts: JournalPost[]; loading: boolean } {
  const rows = useQuery(api.posts.list, {}) as Row[] | undefined;
  return {
    posts: !rows || rows.length === 0 ? JOURNAL : rows.map(toPost),
    loading: rows === undefined,
  };
}

export function usePosts(): JournalPost[] {
  return usePostsState().posts;
}

export function usePost(slug: string | undefined): JournalPost | undefined {
  const all = usePosts();
  return slug ? all.find((p) => p.slug === slug) : undefined;
}
