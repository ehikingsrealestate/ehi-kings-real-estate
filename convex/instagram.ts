import { v } from "convex/values";
import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./lib";

// REAL Instagram (Meta Graph API) publishing — not a placeholder.
//
// Instagram only lets an app post on your behalf after you authorize a Meta
// app (this is Meta's rule, the same for Buffer/Hootsuite/Postiz). Flow:
//   1. Admin saves the Meta App ID + Secret (from a free app they create at
//      developers.facebook.com — one time). Stored server-side in appConfig.
//   2. "Connect Instagram" → Facebook OAuth (connectUrl) → /instagram/callback
//      exchanges the code for a long-lived token, finds the FB Page + its linked
//      IG Business account, and stores them on the socialConnections row.
//   3. publishNow() posts a scheduled post's image + caption via the Graph API.
//
// For the business's OWN Instagram (they're an admin/tester of their own app),
// this works immediately — no Meta App Review needed.

const GRAPH = "https://graph.facebook.com/v21.0";
const OAUTH = "https://www.facebook.com/v21.0/dialog/oauth";
const SCOPES = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management";

function redirectUri(): string {
  // Points at the Convex HTTP endpoint (see convex/http.ts).
  const site = process.env.CONVEX_SITE_URL ?? "";
  return `${site}/instagram/callback`;
}

// ── config (Meta app id/secret) ─────────────────────────────────────────────
export const getConfigValue = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db.query("appConfig").withIndex("by_key", (q) => q.eq("key", key)).unique();
    return row?.value ?? null;
  },
});

export const putConfigValue = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const row = await ctx.db.query("appConfig").withIndex("by_key", (q) => q.eq("key", key)).unique();
    if (row) await ctx.db.patch(row._id, { value });
    else await ctx.db.insert("appConfig", { key, value });
  },
});

// Whether Instagram publishing is set up, and the redirect URI to register in
// the Meta app (so the admin can copy it). Never returns the secret.
export const setupStatus = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    const appId = await ctx.db.query("appConfig").withIndex("by_key", (q) => q.eq("key", "meta_app_id")).unique();
    const conn = await ctx.db.query("socialConnections").withIndex("by_platform", (q) => q.eq("platform", "instagram")).unique();
    return {
      configured: Boolean(appId?.value),
      appIdSet: Boolean(appId?.value),
      redirectUri: redirectUri(),
      connected: Boolean(conn?.igUserId),
      igHandle: conn?.handle,
    };
  },
});

// Admin pastes the Meta App ID + Secret from their Meta app.
export const saveMetaApp = mutation({
  args: { token: v.string(), appId: v.string(), appSecret: v.string() },
  handler: async (ctx, { token, appId, appSecret }) => {
    const me = await requireUser(ctx, token);
    if (me.role !== "Admin" && me.role !== "Manager") throw new Error("Only an admin can set up publishing.");
    const id = appId.trim();
    const secret = appSecret.trim();
    if (!id || !secret) throw new Error("Enter both the App ID and App Secret.");
    for (const [key, value] of [["meta_app_id", id], ["meta_app_secret", secret]] as const) {
      const row = await ctx.db.query("appConfig").withIndex("by_key", (q) => q.eq("key", key)).unique();
      if (row) await ctx.db.patch(row._id, { value });
      else await ctx.db.insert("appConfig", { key, value });
    }
    return { ok: true };
  },
});

// ── OAuth ────────────────────────────────────────────────────────────────────
export const connectUrl = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ url?: string; error?: string }> => {
    await ctx.runQuery(internal.instagram.requireUserId, { token });
    const appId = await ctx.runQuery(internal.instagram.getConfigValue, { key: "meta_app_id" });
    if (!appId) return { error: "Add your Meta App ID and Secret first." };
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri(),
      scope: SCOPES,
      response_type: "code",
      state: token, // ties the callback back to this staff session
    });
    return { url: `${OAUTH}?${params.toString()}` };
  },
});

export const requireUserId = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const u = await requireUser(ctx, token);
    return { id: u._id };
  },
});

// Called by the OAuth callback (http.ts) after Meta redirects back with a code.
export const completeConnect = action({
  args: { code: v.string(), userToken: v.string() },
  handler: async (ctx, { code, userToken }): Promise<{ ok: boolean; handle?: string; error?: string }> => {
    const user = await ctx.runQuery(internal.instagram.requireUserId, { token: userToken });
    const appId = await ctx.runQuery(internal.instagram.getConfigValue, { key: "meta_app_id" });
    const appSecret = await ctx.runQuery(internal.instagram.getConfigValue, { key: "meta_app_secret" });
    if (!appId || !appSecret) return { ok: false, error: "Meta app not configured." };
    try {
      // 1. code → short-lived token
      const tokRes = await fetch(
        `${GRAPH}/oauth/access_token?` +
          new URLSearchParams({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri(), code }),
      );
      const tok = await tokRes.json();
      if (!tok.access_token) return { ok: false, error: tok.error?.message ?? "Facebook did not return a token." };

      // 2. short-lived → long-lived (~60 days)
      const llRes = await fetch(
        `${GRAPH}/oauth/access_token?` +
          new URLSearchParams({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: tok.access_token }),
      );
      const ll = await llRes.json();
      const accessToken = ll.access_token ?? tok.access_token;
      const expiresAt = ll.expires_in ? Date.now() + ll.expires_in * 1000 : undefined;

      // 3. find the FB Page + its linked IG business account
      const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${accessToken}`);
      const pages = await pagesRes.json();
      const page = (pages.data ?? []).find((p: { instagram_business_account?: unknown }) => p.instagram_business_account);
      if (!page) {
        return { ok: false, error: "No Instagram Business account found. Link your Instagram (Business/Creator) to a Facebook Page, then reconnect." };
      }
      const ig = page.instagram_business_account;
      await ctx.runMutation(internal.instagram.saveConnection, {
        platform: "instagram",
        handle: ig.username ? `@${ig.username}` : "Instagram",
        igUserId: ig.id,
        pageId: page.id,
        accessToken: page.access_token ?? accessToken,
        tokenExpiresAt: expiresAt,
        connectedById: user.id,
      });
      return { ok: true, handle: ig.username ? `@${ig.username}` : "Instagram" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
});

export const saveConnection = internalMutation({
  args: {
    platform: v.string(),
    handle: v.string(),
    igUserId: v.string(),
    pageId: v.string(),
    accessToken: v.string(),
    tokenExpiresAt: v.optional(v.number()),
    connectedById: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("socialConnections").withIndex("by_platform", (q) => q.eq("platform", args.platform)).unique();
    const patch = { ...args, connected: true, updatedAt: Date.now() };
    if (existing) await ctx.db.patch(existing._id, patch);
    else await ctx.db.insert("socialConnections", patch);
  },
});

export const getConnection = internalQuery({
  args: { platform: v.string() },
  handler: async (ctx, { platform }) =>
    ctx.db.query("socialConnections").withIndex("by_platform", (q) => q.eq("platform", platform)).unique(),
});

export const getPost = internalQuery({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, { postId }) => ctx.db.get(postId),
});

export const markPublished = internalMutation({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, { postId }) => {
    await ctx.db.patch(postId, { status: "published", publishedAt: Date.now() });
  },
});

// Actually publish a scheduled post to Instagram via the Graph API.
export const publishNow = action({
  args: { token: v.string(), postId: v.id("socialPosts") },
  handler: async (ctx, { token, postId }): Promise<{ ok: boolean; error?: string; permalink?: string }> => {
    await ctx.runQuery(internal.instagram.requireUserId, { token });
    const conn = await ctx.runQuery(internal.instagram.getConnection, { platform: "instagram" });
    if (!conn?.igUserId || !conn.accessToken) return { ok: false, error: "Connect Instagram first." };
    const post = await ctx.runQuery(internal.instagram.getPost, { postId });
    if (!post) return { ok: false, error: "Post not found." };
    if (!post.mediaUrl) return { ok: false, error: "Instagram requires an image — add a public media URL to this post." };
    try {
      // 1. create the media container
      const createRes = await fetch(`${GRAPH}/${conn.igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: post.mediaUrl, caption: post.content, access_token: conn.accessToken }),
      });
      const create = await createRes.json();
      if (!create.id) return { ok: false, error: create.error?.message ?? "Instagram rejected the image." };
      // 2. publish it
      const pubRes = await fetch(`${GRAPH}/${conn.igUserId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: create.id, access_token: conn.accessToken }),
      });
      const pub = await pubRes.json();
      if (!pub.id) return { ok: false, error: pub.error?.message ?? "Publish failed." };
      await ctx.runMutation(internal.instagram.markPublished, { postId });
      return { ok: true, permalink: `https://www.instagram.com/${conn.handle?.replace("@", "")}/` };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
});

export const disconnect = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    const conn = await ctx.db.query("socialConnections").withIndex("by_platform", (q) => q.eq("platform", "instagram")).unique();
    if (conn) await ctx.db.delete(conn._id);
  },
});
