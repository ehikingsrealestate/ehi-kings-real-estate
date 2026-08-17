import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { userByToken } from "./lib";
import { randomToken } from "./crypto";
import { DEFAULT_PERMISSIONS, ROLES } from "./defaults";

// Per-user Zoho Mail.
//
// Each employee connects their OWN Zoho mailbox via OAuth (redirect handled by
// convex/http.ts at /zoho/callback). We store their refresh token keyed by user,
// so the inbox + sending always act as the signed-in person.
//
// App-level env vars (one OAuth client for everyone):
//   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI, APP_URL
//   (optional) ZOHO_ACCOUNTS_HOST default https://accounts.zoho.com
//   (optional) ZOHO_MAIL_HOST     default https://mail.zoho.com

const SCOPES = "ZohoMail.messages.READ,ZohoMail.messages.CREATE,ZohoMail.accounts.READ";

const accountsHost = () => process.env.ZOHO_ACCOUNTS_HOST ?? "https://accounts.zoho.com";
const mailHost = () => process.env.ZOHO_MAIL_HOST ?? "https://mail.zoho.com";

type ZohoEmail = { id: string; folderId: string; from: string; subject: string; summary: string; receivedTime: string };

async function accessTokenFromRefresh(refreshToken: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    refresh_token: refreshToken,
  });
  const res = await fetch(`${accountsHost()}/oauth/v2/token`, { method: "POST", body });
  const json = await res.json();
  if (!json.access_token) throw new Error(json.error ?? "Zoho token refresh failed.");
  return json.access_token as string;
}

// ── internal data helpers (actions can't touch the db directly) ──────────────
export const resolveUser = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const u = await userByToken(ctx, token);
    return u ? { userId: u._id } : null;
  },
});

export const getAccount = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) =>
    ctx.db.query("mailAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).unique(),
});

export const userForState = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const row = await ctx.db.query("oauthStates").withIndex("by_state", (q) => q.eq("state", state)).unique();
    if (!row) return null;
    return { userId: row.userId ?? null, purpose: row.purpose ?? (row.userId ? "connect" : "login") };
  },
});

export const putState = internalMutation({
  args: {
    state: v.string(),
    userId: v.optional(v.id("users")),
    purpose: v.union(v.literal("login"), v.literal("connect")),
  },
  handler: async (ctx, a) => {
    await ctx.db.insert("oauthStates", a);
  },
});

// Find an existing staff account by email, or create one (default Worker) for a
// first-time Zoho sign-in. Existing accounts keep their role.
export const findOrCreateUser = internalMutation({
  args: { email: v.string(), name: v.string() },
  handler: async (ctx, { email, name }) => {
    const lower = email.toLowerCase();
    for (const role of ROLES) {
      const existingPermission = await ctx.db
        .query("permissions")
        .withIndex("by_role", (q) => q.eq("role", role))
        .unique();
      if (!existingPermission) {
        await ctx.db.insert("permissions", { role, caps: DEFAULT_PERMISSIONS[role] });
      }
    }
    const allUsers = await ctx.db.query("users").collect();
    const activeAdmins = allUsers.filter((user) => user.active && user.role === "Admin").length;
    const configuredAdminEmail = (process.env.INITIAL_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "kings.ceo@ehikings.com")
      .toLowerCase()
      .trim();
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", lower)).unique();
    if (existing) {
      const promoteToAdmin = lower === configuredAdminEmail && activeAdmins === 0 && existing.role !== "Admin";
      if (!existing.active || promoteToAdmin) {
        await ctx.db.patch(existing._id, { active: true, ...(promoteToAdmin ? { role: "Admin" as const, title: "Administrator" } : {}) });
      }
      return existing._id;
    }
    const makeAdmin = allUsers.length === 0 || lower === configuredAdminEmail;
    return await ctx.db.insert("users", {
      email: lower,
      name: name || lower.split("@")[0],
      role: makeAdmin ? "Admin" : "Worker",
      title: makeAdmin ? "Administrator" : "Staff",
      passwordHash: "",
      passwordSalt: "",
      active: true,
    });
  },
});

export const createLoginSession = internalMutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    await ctx.db.insert("sessions", { userId, token });
  },
});

export const saveAccount = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    accountId: v.string(),
    refreshToken: v.string(),
    fromAddress: v.string(),
    state: v.string(),
  },
  handler: async (ctx, { state, userId, ...rest }) => {
    const existing = await ctx.db.query("mailAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) await ctx.db.patch(existing._id, rest);
    else await ctx.db.insert("mailAccounts", { userId, ...rest });
    // consume the one-time state nonce
    const st = await ctx.db.query("oauthStates").withIndex("by_state", (q) => q.eq("state", state)).unique();
    if (st) await ctx.db.delete(st._id);
  },
});

export const removeAccount = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db.query("mailAccounts").withIndex("by_user", (q) => q.eq("userId", userId)).unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ── public actions ───────────────────────────────────────────────────────────
export const status = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ connected: boolean; email?: string; oauthReady: boolean }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    const oauthReady = Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_REDIRECT_URI);
    const account = await ctx.runQuery(internal.zoho.getAccount, { userId: me.userId });
    return { connected: Boolean(account), email: account?.email, oauthReady };
  },
});

export const connectUrl = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ url: string }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REDIRECT_URI) {
      throw new Error("Zoho OAuth is not configured yet (ZOHO_CLIENT_ID / ZOHO_REDIRECT_URI).");
    }
    const state = randomToken();
    await ctx.runMutation(internal.zoho.putState, { state, userId: me.userId, purpose: "connect" });
    return { url: authorizeUrl(state) };
  },
});

// Public — no session required. Starts the "Sign in with Zoho" flow.
export const loginUrl = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_REDIRECT_URI) {
      throw new Error("Zoho sign-in is not configured yet.");
    }
    const state = randomToken();
    await ctx.runMutation(internal.zoho.putState, { state, purpose: "login" });
    return { url: authorizeUrl(state) };
  },
});

function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOHO_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${accountsHost()}/oauth/v2/auth?${params.toString()}`;
}

export const disconnect = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ ok: boolean }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    await ctx.runMutation(internal.zoho.removeAccount, { userId: me.userId });
    return { ok: true };
  },
});

export const listInbox = action({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { token, limit }): Promise<{ connected: boolean; messages?: ZohoEmail[]; error?: string }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    const account = await ctx.runQuery(internal.zoho.getAccount, { userId: me.userId });
    if (!account) return { connected: false };
    try {
      const at = await accessTokenFromRefresh(account.refreshToken);
      const url = `${mailHost()}/api/accounts/${account.accountId}/messages/view?limit=${limit ?? 15}`;
      const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${at}` } });
      const json = await res.json();
      const rows = (json?.data ?? []) as Array<Record<string, string>>;
      const messages: ZohoEmail[] = rows.map((m) => ({
        id: String(m.messageId ?? m.mid ?? Math.random()),
        folderId: String(m.folderId ?? ""),
        from: m.fromAddress ?? m.sender ?? "—",
        subject: m.subject ?? "(no subject)",
        summary: m.summary ?? "",
        receivedTime: m.receivedTime ?? m.sentDateInGMT ?? "",
      }));
      return { connected: true, messages };
    } catch (e) {
      return { connected: true, error: (e as Error).message };
    }
  },
});

// Full message body (HTML) for the reading pane. Zoho's list view only gives a
// one-line summary, so we fetch the real content on demand.
export const getMessage = action({
  args: { token: v.string(), messageId: v.string(), folderId: v.string() },
  handler: async (
    ctx,
    { token, messageId, folderId },
  ): Promise<{ ok: boolean; content?: string; isHtml?: boolean; error?: string }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    const account = await ctx.runQuery(internal.zoho.getAccount, { userId: me.userId });
    if (!account) return { ok: false, error: "Connect your Zoho Mail first." };
    try {
      const at = await accessTokenFromRefresh(account.refreshToken);
      const url = `${mailHost()}/api/accounts/${account.accountId}/folders/${folderId}/messages/${messageId}/content`;
      const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${at}` } });
      const json = await res.json();
      const data = json?.data ?? {};
      const content: string = data.content ?? data.htmlContent ?? data.body ?? "";
      // Zoho returns HTML content for most messages; treat anything with tags as HTML.
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(content);
      if (!content) return { ok: false, error: "No content returned for this message." };
      return { ok: true, content, isHtml };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
});

export const sendMail = action({
  args: { token: v.string(), to: v.string(), subject: v.string(), body: v.string() },
  handler: async (ctx, { token, to, subject, body }): Promise<{ ok: boolean; error?: string }> => {
    const me = await ctx.runQuery(internal.zoho.resolveUser, { token });
    if (!me) throw new Error("Not authenticated.");
    const account = await ctx.runQuery(internal.zoho.getAccount, { userId: me.userId });
    if (!account) return { ok: false, error: "Connect your Zoho Mail first." };
    try {
      const at = await accessTokenFromRefresh(account.refreshToken);
      const url = `${mailHost()}/api/accounts/${account.accountId}/messages`;
      // Send as HTML so the recipient sees the paragraphs/line breaks the sender
      // typed, instead of one run-on block.
      const htmlBody = body
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Zoho-oauthtoken ${at}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fromAddress: account.fromAddress, toAddress: to, subject, content: htmlBody, mailFormat: "html" }),
      });
      const json = await res.json();
      if (json?.status?.code && json.status.code !== 200) {
        return { ok: false, error: json.status.description ?? "Send failed." };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
});
