import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

const blockType = v.union(v.literal("text"), v.literal("textarea"), v.literal("image"), v.literal("layout"));

function requireAdmin(role: string) {
  if (role !== "Admin") throw new Error("Forbidden — only admins can edit website content.");
}

export const listBlocks = query({
  args: {},
  handler: async (ctx) => {
    return (await ctx.db.query("siteBlocks").collect()).sort((a, b) => a.area.localeCompare(b.area) || a.label.localeCompare(b.label));
  },
});

export const listBlocksForAdmin = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requireUser(ctx, token);
    requireAdmin(me.role);
    return (await ctx.db.query("siteBlocks").collect()).sort((a, b) => a.area.localeCompare(b.area) || a.label.localeCompare(b.label));
  },
});

export const upsertBlock = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    label: v.string(),
    type: blockType,
    value: v.string(),
    area: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx, args.token);
    requireAdmin(me.role);
    const existing = await ctx.db
      .query("siteBlocks")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const patch = {
      label: args.label,
      type: args.type,
      value: args.value,
      area: args.area,
      updatedById: me._id,
      updatedAt: Date.now(),
      status: "published" as const,
      publishedById: me._id,
      publishedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("siteBlocks", { key: args.key, ...patch });
  },
});

export const saveDraft = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    label: v.string(),
    type: blockType,
    value: v.string(),
    area: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx, args.token);
    requireAdmin(me.role);
    const existing = await ctx.db
      .query("siteBlocks")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const patch = {
      label: args.label,
      type: args.type,
      area: args.area,
      draftValue: args.value,
      status: "draft" as const,
      updatedById: me._id,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("siteBlocks", {
      key: args.key,
      value: args.value,
      publishedById: me._id,
      publishedAt: Date.now(),
      ...patch,
    });
  },
});

export const submitReview = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    label: v.string(),
    type: blockType,
    value: v.string(),
    area: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx, args.token);
    requireAdmin(me.role);
    const existing = await ctx.db
      .query("siteBlocks")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const patch = {
      label: args.label,
      type: args.type,
      area: args.area,
      draftValue: args.value,
      reviewValue: args.value,
      status: "review" as const,
      updatedById: me._id,
      updatedAt: Date.now(),
      submittedById: me._id,
      submittedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("siteBlocks", {
      key: args.key,
      value: args.value,
      publishedById: me._id,
      publishedAt: Date.now(),
      ...patch,
    });
  },
});

export const publishBlock = mutation({
  args: {
    token: v.string(),
    key: v.string(),
    label: v.string(),
    type: blockType,
    value: v.string(),
    area: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx, args.token);
    requireAdmin(me.role);
    const existing = await ctx.db
      .query("siteBlocks")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    const patch = {
      label: args.label,
      type: args.type,
      value: args.value,
      area: args.area,
      draftValue: undefined,
      reviewValue: undefined,
      status: "published" as const,
      updatedById: me._id,
      updatedAt: Date.now(),
      publishedById: me._id,
      publishedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("siteBlocks", { key: args.key, ...patch });
  },
});
