import { v } from "convex/values";
import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { hashPassword, randomToken } from "./crypto";
import { userByToken, capsForRole, publicUser } from "./lib";

// ── Sign in ──────────────────────────────────────────────────────────────────
export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }): Promise<{ token: string }> => {
    const user = await ctx.runQuery(internal.auth.getByEmail, { email: email.toLowerCase().trim() });
    if (!user || !user.active) throw new Error("No active staff account for that email.");
    if (!user.passwordHash || !user.passwordSalt) {
      throw new Error("Use Zoho sign-in for this staff account.");
    }
    const hash = await hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) throw new Error("Incorrect password.");
    const token = randomToken();
    await ctx.runMutation(internal.auth.createSession, { userId: user._id, token });
    return { token };
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

// Current user + their capabilities (drives client-side gating; server still enforces).
export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const user = await userByToken(ctx, token);
    if (!user) return null;
    const caps = await capsForRole(ctx, user.role);
    return { ...publicUser(user), phone: user.phone, createdAt: user._creationTime, caps };
  },
});

// ── internal ─────────────────────────────────────────────────────────────────
export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique(),
});

export const createSession = internalMutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, { userId, token }) => {
    await ctx.db.insert("sessions", { userId, token });
  },
});

// Used by actions (which can't read the db directly) to enforce a capability.
export const checkCap = internalQuery({
  args: { token: v.string(), cap: v.string() },
  handler: async (ctx, { token, cap }) => {
    const user = await userByToken(ctx, token);
    if (!user) return { ok: false as const, error: "Not authenticated." };
    const caps = await capsForRole(ctx, user.role);
    if (!caps || !(caps as Record<string, boolean>)[cap]) {
      return { ok: false as const, error: `Forbidden — missing "${cap}".` };
    }
    return { ok: true as const, name: user.name };
  },
});
