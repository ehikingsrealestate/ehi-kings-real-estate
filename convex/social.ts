import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";
import type { QueryCtx } from "./_generated/server";

// Native social planner — compose, schedule and track posts across channels,
// built from scratch on our own tables (no external scheduler). Rendered at
// /admin/social. Posting to networks stays manual until per-network API keys
// are added; the planner is the single source of truth for what goes out when.

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("scheduled"),
  v.literal("published"),
  v.literal("cancelled"),
);

async function requireStaff(ctx: QueryCtx, token: string) {
  const me = await requireUser(ctx, token);
  if (me.role === "Worker") throw new Error("The social planner is available to Agents and above.");
  return me;
}

export const listPosts = query({
  args: { token: v.string(), status: v.optional(statusValidator) },
  handler: async (ctx, { token, status }) => {
    await requireStaff(ctx, token);
    const rows = status
      ? await ctx.db.query("socialPosts").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("socialPosts").collect();
    return rows
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .map((p) => ({
        id: p._id,
        content: p.content,
        platforms: p.platforms,
        mediaUrl: p.mediaUrl,
        scheduledAt: p.scheduledAt,
        status: p.status,
        publishedAt: p.publishedAt,
        createdById: p.createdById,
      }));
  },
});

export const upsertPost = mutation({
  args: {
    token: v.string(),
    postId: v.optional(v.id("socialPosts")),
    content: v.string(),
    platforms: v.array(v.string()),
    mediaUrl: v.optional(v.string()),
    scheduledAt: v.number(),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, { token, postId, content, platforms, mediaUrl, scheduledAt, status }) => {
    const me = await requireStaff(ctx, token);
    const text = content.trim();
    if (!text) throw new Error("Write the post first.");
    if (!platforms.length) throw new Error("Pick at least one channel.");
    // Guard against a bad datetime coming from the picker (NaN/Infinity would
    // fail schema validation with an opaque server error).
    if (!Number.isFinite(scheduledAt)) throw new Error("Pick a valid date and time.");
    const media = mediaUrl?.trim() || undefined;
    if (postId) {
      await ctx.db.patch(postId, {
        content: text,
        platforms,
        mediaUrl: media,
        scheduledAt,
        ...(status ? { status } : {}),
      });
      return postId;
    }
    return ctx.db.insert("socialPosts", {
      content: text,
      platforms,
      mediaUrl: media,
      scheduledAt,
      status: status ?? "scheduled",
      createdById: me._id,
      createdAt: Date.now(),
    });
  },
});

// ── channel connections ─────────────────────────────────────────────────────

export const listConnections = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireStaff(ctx, token);
    const rows = await ctx.db.query("socialConnections").collect();
    return rows.map((c) => ({
      id: c._id,
      platform: c.platform,
      handle: c.handle,
      connected: c.connected,
      autoPost: Boolean(c.webhookUrl || c.apiToken),
      updatedAt: c.updatedAt,
    }));
  },
});

export const connectChannel = mutation({
  args: {
    token: v.string(),
    platform: v.string(),
    handle: v.string(),
    apiToken: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
  },
  handler: async (ctx, { token, platform, handle, apiToken, webhookUrl }) => {
    const me = await requireStaff(ctx, token);
    const cleanHandle = handle.trim();
    if (!cleanHandle) throw new Error("Enter the account handle.");
    const existing = await ctx.db
      .query("socialConnections")
      .withIndex("by_platform", (q) => q.eq("platform", platform))
      .unique();
    const patch = {
      platform,
      handle: cleanHandle,
      connected: true,
      apiToken: apiToken?.trim() || undefined,
      webhookUrl: webhookUrl?.trim() || undefined,
      connectedById: me._id,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("socialConnections", patch);
  },
});

export const disconnectChannel = mutation({
  args: { token: v.string(), platform: v.string() },
  handler: async (ctx, { token, platform }) => {
    await requireStaff(ctx, token);
    const existing = await ctx.db
      .query("socialConnections")
      .withIndex("by_platform", (q) => q.eq("platform", platform))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const setPostStatus = mutation({
  args: { token: v.string(), postId: v.id("socialPosts"), status: statusValidator },
  handler: async (ctx, { token, postId, status }) => {
    await requireStaff(ctx, token);
    await ctx.db.patch(postId, {
      status,
      publishedAt: status === "published" ? Date.now() : undefined,
    });
  },
});
