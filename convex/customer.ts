import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { hashPassword, makeSalt, randomToken } from "./crypto";
import type { Id } from "./_generated/dataModel";

// Customer portal auth — public website accounts, entirely separate from the
// staff `users`/`sessions` tables. Customers sign up, log in, browse available
// properties, and reserve ones into "Your Properties".

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

// ── internal db helpers (actions can't touch the db directly) ────────────────
export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db.query("customers").withIndex("by_email", (q) => q.eq("email", email)).unique(),
});

export const insertCustomer = internalMutation({
  args: { email: v.string(), name: v.string(), phone: v.optional(v.string()), passwordHash: v.string(), passwordSalt: v.string() },
  handler: async (ctx, args) => ctx.db.insert("customers", { ...args, createdAt: Date.now() }),
});

export const createSession = internalMutation({
  args: { customerId: v.id("customers"), token: v.string() },
  handler: async (ctx, { customerId, token }) => {
    await ctx.db.insert("customerSessions", { customerId, token });
  },
});

async function customerByToken(ctx: { db: any }, token: string | undefined) {
  if (!token) return null;
  const session = await ctx.db.query("customerSessions").withIndex("by_token", (q: any) => q.eq("token", token)).unique();
  if (!session) return null;
  return ctx.db.get(session.customerId);
}

// ── public actions/queries ───────────────────────────────────────────────────
export const signUp = action({
  args: { email: v.string(), name: v.string(), phone: v.optional(v.string()), password: v.string() },
  handler: async (ctx, { email, name, phone, password }): Promise<{ token: string; name: string }> => {
    const lower = normEmail(email);
    if (!lower.includes("@")) throw new Error("Enter a valid email address.");
    if (password.length < 6) throw new Error("Use a password of at least 6 characters.");
    const existing = await ctx.runQuery(internal.customer.getByEmail, { email: lower });
    if (existing) throw new Error("An account with this email already exists — sign in instead.");
    const salt = makeSalt();
    const passwordHash = await hashPassword(password, salt);
    const customerId = await ctx.runMutation(internal.customer.insertCustomer, {
      email: lower,
      name: name.trim() || lower.split("@")[0],
      phone: phone?.trim() || undefined,
      passwordHash,
      passwordSalt: salt,
    });
    const token = randomToken();
    await ctx.runMutation(internal.customer.createSession, { customerId, token });
    return { token, name: name.trim() || lower.split("@")[0] };
  },
});

export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }): Promise<{ token: string; name: string }> => {
    const lower = normEmail(email);
    const customer = await ctx.runQuery(internal.customer.getByEmail, { email: lower });
    if (!customer || !customer.passwordHash) throw new Error("No account found for this email.");
    const hash = await hashPassword(password, customer.passwordSalt);
    if (hash !== customer.passwordHash) throw new Error("Incorrect password.");
    const token = randomToken();
    await ctx.runMutation(internal.customer.createSession, { customerId: customer._id, token });
    return { token, name: customer.name };
  },
});

export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const c = await customerByToken(ctx, token);
    return c ? { id: c._id, email: c.email, name: c.name, phone: c.phone } : null;
  },
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db.query("customerSessions").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});

// "Your Properties" — the reserved/owned list joined to the live listing data.
export const myProperties = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const c = await customerByToken(ctx, token);
    if (!c) return [];
    const rows = await ctx.db
      .query("customerProperties")
      .withIndex("by_customer", (q) => q.eq("customerId", c._id))
      .collect();
    const out = [];
    for (const r of rows.sort((a, b) => b.createdAt - a.createdAt)) {
      const prop = await ctx.db.query("properties").withIndex("by_slug", (q) => q.eq("slug", r.propertySlug)).unique();
      out.push({
        id: r._id,
        slug: r.propertySlug,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt,
        name: prop?.name ?? r.propertySlug,
        location: prop?.location,
        price: prop?.price,
        kind: prop?.kind,
        img: prop?.img,
      });
    }
    return out;
  },
});

export const reserve = mutation({
  args: { token: v.string(), propertySlug: v.string(), note: v.optional(v.string()) },
  handler: async (ctx, { token, propertySlug, note }): Promise<{ ok: boolean }> => {
    const c = await customerByToken(ctx, token);
    if (!c) throw new Error("Please sign in first.");
    const existing = await ctx.db
      .query("customerProperties")
      .withIndex("by_customer_slug", (q) => q.eq("customerId", c._id).eq("propertySlug", propertySlug))
      .unique();
    if (existing) return { ok: true };
    await ctx.db.insert("customerProperties", {
      customerId: c._id,
      propertySlug,
      status: "reserved",
      note: note?.trim() || undefined,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const unreserve = mutation({
  args: { token: v.string(), propertySlug: v.string() },
  handler: async (ctx, { token, propertySlug }) => {
    const c = await customerByToken(ctx, token);
    if (!c) throw new Error("Please sign in first.");
    const existing = await ctx.db
      .query("customerProperties")
      .withIndex("by_customer_slug", (q) => q.eq("customerId", c._id).eq("propertySlug", propertySlug))
      .unique();
    if (existing && existing.status === "reserved") await ctx.db.delete(existing._id);
  },
});

// Which slugs the signed-in customer has already reserved (to mark cards).
export const myReservedSlugs = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }): Promise<string[]> => {
    const c = await customerByToken(ctx, token);
    if (!c) return [];
    const rows = await ctx.db.query("customerProperties").withIndex("by_customer", (q) => q.eq("customerId", c._id)).collect();
    return rows.map((r) => r.propertySlug);
  },
});
