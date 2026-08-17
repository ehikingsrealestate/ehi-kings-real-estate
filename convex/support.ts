import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { userByToken } from "./lib";
import { randomToken } from "./crypto";

// Chatwoot one-click SSO — the "Support" feature of the admin panel.
//
// Uses Chatwoot's Platform API (env: CHATWOOT_URL, CHATWOOT_PLATFORM_TOKEN,
// CHATWOOT_ACCOUNT_ID). For the signed-in staff member we find-or-create a
// Chatwoot agent, attach them to the company account, and mint a login link —
// so opening Support never shows a Chatwoot login screen.
//
// NOTE: the platform token is sent as `X-Cw-Token`; Caddy rewrites it to the
// underscored header Chatwoot expects (underscored headers get dropped in
// proxy hops).

const CW = () => (process.env.CHATWOOT_URL ?? "").replace(/\/$/, "");
const headers = () => ({
  "Content-Type": "application/json",
  "X-Cw-Token": process.env.CHATWOOT_PLATFORM_TOKEN ?? "",
});

export const me = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const u = await userByToken(ctx, token);
    return u ? { id: u._id, name: u.name, email: u.email, role: u.role, chatwootUserId: u.chatwootUserId } : null;
  },
});

export const saveChatwootId = internalMutation({
  args: { userId: v.id("users"), chatwootUserId: v.number() },
  handler: async (ctx, { userId, chatwootUserId }) => {
    await ctx.db.patch(userId, { chatwootUserId });
  },
});

export const ssoLink = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ configured: boolean; url?: string; error?: string }> => {
    const user = await ctx.runQuery(internal.support.me, { token });
    if (!user) throw new Error("Not authenticated.");
    if (!CW() || !process.env.CHATWOOT_PLATFORM_TOKEN || !process.env.CHATWOOT_ACCOUNT_ID) {
      return { configured: false };
    }

    try {
      let cwId = user.chatwootUserId;

      if (!cwId) {
        // Create the agent (platform apps can only see users they created,
        // and only this backend creates them — so create-once then store).
        const res = await fetch(`${CW()}/platform/api/v1/users`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ name: user.name, email: user.email, password: `Ek!${randomToken().slice(0, 18)}9` }),
        });
        const json = await res.json();
        if (!res.ok || !json.id) {
          return { configured: true, error: json?.message ?? json?.error ?? `Could not create the support agent (${res.status}).` };
        }
        cwId = json.id as number;

        // Attach to the company account. Admins/Managers run the inbox.
        const roleInCw = user.role === "Admin" || user.role === "Manager" ? "administrator" : "agent";
        await fetch(`${CW()}/platform/api/v1/accounts/${process.env.CHATWOOT_ACCOUNT_ID}/account_users`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ user_id: cwId, role: roleInCw }),
        }).catch(() => {});

        await ctx.runMutation(internal.support.saveChatwootId, { userId: user.id, chatwootUserId: cwId });
      }

      const loginRes = await fetch(`${CW()}/platform/api/v1/users/${cwId}/login`, { headers: headers() });
      const login = await loginRes.json();
      if (!loginRes.ok || !login.url) {
        return { configured: true, error: login?.error ?? "Could not mint the login link." };
      }
      return { configured: true, url: login.url as string };
    } catch (e) {
      return { configured: true, error: e instanceof Error ? e.message : String(e) };
    }
  },
});
