import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

// Property listings — the shared source of truth for the admin manager and the
// public website. Public `list` returns active listings (no auth); all writes
// require an Admin (mirrors the site-content admin gate).

const tier = v.object({ label: v.string(), price: v.string(), note: v.optional(v.string()) });

const propFields = {
  slug: v.string(),
  name: v.string(),
  location: v.string(),
  region: v.string(),
  kind: v.union(v.literal("land"), v.literal("home")),
  title: v.string(),
  size: v.string(),
  price: v.string(),
  note: v.optional(v.string()),
  overview: v.array(v.string()),
  features: v.array(v.string()),
  img: v.optional(v.string()),
  priceTiers: v.optional(v.array(tier)),
  featured: v.optional(v.boolean()),
};

function requireAdmin(role: string) {
  if (role !== "Admin") throw new Error("Forbidden — only admins can edit property listings.");
}

// PUBLIC — the website reads this. Returns active listings in display order.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("properties")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

// PUBLIC LIGHTWEIGHT — returns summary fields only for cards and landing pages.
export const listSummaries = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("properties")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows
      .sort((a, b) => a.order - b.order)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        location: p.location,
        region: p.region,
        kind: p.kind,
        title: p.title,
        size: p.size,
        price: p.price,
        note: p.note,
        img: p.img,
        featured: p.featured,
        order: p.order,
      }));
  },
});

// PUBLIC — Fetch single property by slug with fast index lookup
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("properties")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// Admin roster (includes inactive) for the management table.
export const listAll = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    return (await ctx.db.query("properties").collect()).sort((a, b) => a.order - b.order);
  },
});

export const upsert = mutation({
  args: { token: v.string(), ...propFields },
  handler: async (ctx, { token, ...fields }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    const existing = await ctx.db.query("properties").withIndex("by_slug", (q) => q.eq("slug", fields.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...fields, updatedById: me._id, updatedAt: Date.now() });
      return existing._id;
    }
    const all = await ctx.db.query("properties").collect();
    const order = all.reduce((m, p) => Math.max(m, p.order), 0) + 1;
    return ctx.db.insert("properties", { ...fields, order, active: true, updatedById: me._id, updatedAt: Date.now() });
  },
});

export const setActive = mutation({
  args: { token: v.string(), slug: v.string(), active: v.boolean() },
  handler: async (ctx, { token, slug, active }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    const row = await ctx.db.query("properties").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (!row) throw new Error("Listing not found.");
    await ctx.db.patch(row._id, { active, updatedById: me._id, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { token: v.string(), slug: v.string() },
  handler: async (ctx, { token, slug }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    const row = await ctx.db.query("properties").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    if (row) await ctx.db.delete(row._id);
  },
});

// One-time import of the current static portfolio into the table so the MD can
// start editing real data. Only inserts slugs that don't already exist.
export const importListings = mutation({
  args: { token: v.string(), items: v.array(v.object(propFields)) },
  handler: async (ctx, { token, items }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    const existing = new Set((await ctx.db.query("properties").collect()).map((p) => p.slug));
    let added = 0;
    let order = (await ctx.db.query("properties").collect()).reduce((m, p) => Math.max(m, p.order), 0);
    for (const it of items) {
      if (existing.has(it.slug)) continue;
      order += 1;
      await ctx.db.insert("properties", { ...it, order, active: true, updatedById: me._id, updatedAt: Date.now() });
      added += 1;
    }
    return { added };
  },
});
