import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

// Journal/blog posts — the admin panel edits these; the public Journal pages
// read `list`/`getBySlug` (falling back to the static JOURNAL array while the
// table is empty). Mirrors the properties.ts admin-gated pattern.

const postFields = {
  slug: v.string(),
  title: v.string(),
  excerpt: v.string(),
  category: v.string(),
  date: v.string(),
  readingTime: v.string(),
  metaDescription: v.optional(v.string()),
  keywords: v.optional(v.array(v.string())),
  body: v.array(v.string()),
};

// PUBLIC — the website reads this. Published posts, newest first.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    return row && row.published ? row : null;
  },
});

// Admin roster (includes drafts) for the journal manager.
export const listAll = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    return (await ctx.db.query("posts").collect()).sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const upsert = mutation({
  args: { token: v.string(), published: v.optional(v.boolean()), ...postFields },
  handler: async (ctx, { token, published, ...fields }) => {
    const me = await requireUser(ctx, token);
    const existing = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", fields.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        published: published ?? existing.published,
        updatedById: me._id,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return ctx.db.insert("posts", {
      ...fields,
      published: published ?? false,
      updatedById: me._id,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const setPublished = mutation({
  args: { token: v.string(), slug: v.string(), published: v.boolean() },
  handler: async (ctx, { token, slug, published }) => {
    const me = await requireUser(ctx, token);
    const row = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!row) throw new Error("Post not found.");
    await ctx.db.patch(row._id, { published, updatedById: me._id, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), slug: v.string() },
  handler: async (ctx, { token, slug }) => {
    await requireUser(ctx, token);
    const row = await ctx.db.query("posts").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (row) await ctx.db.delete(row._id);
  },
});

// One-time import of the static JOURNAL array so editing starts from the
// current live content. Only inserts slugs that don't already exist.
export const importPosts = mutation({
  args: { token: v.string(), items: v.array(v.object(postFields)) },
  handler: async (ctx, { token, items }) => {
    const me = await requireUser(ctx, token);
    const existing = new Set((await ctx.db.query("posts").collect()).map((p) => p.slug));
    let added = 0;
    for (const item of items) {
      if (existing.has(item.slug)) continue;
      await ctx.db.insert("posts", {
        ...item,
        published: true,
        updatedById: me._id,
        updatedAt: Date.now(),
        createdAt: Date.now() - added, // preserve given order
      });
      added += 1;
    }
    return { added };
  },
});
