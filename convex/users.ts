import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { roleValidator } from "./schema";
import { requireUser, requireCap, publicUser } from "./lib";
import { makeSalt, hashPassword } from "./crypto";

// Roster — every signed-in staff member can see who's on the team.
export const list = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    const users = await ctx.db.query("users").collect();
    return users.map(publicUser);
  },
});

// Add an employee — requires the manage_employees capability (Admin by default).
export const createEmployee = action({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    role: roleValidator,
    title: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const me = await ctx.runQuery(internal.users.requireManager, { token: args.token });
    if (!me.ok) throw new Error(me.error);
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.runQuery(internal.auth.getByEmail, { email });
    if (existing) throw new Error("An account with that email already exists.");
    const password = (args.password ?? "").trim();
    const salt = password ? makeSalt() : "";
    const passwordHash = password ? await hashPassword(password, salt) : "";
    await ctx.runMutation(internal.users.insert, {
      name: args.name,
      email,
      role: args.role,
      title: args.title,
      passwordHash,
      passwordSalt: salt,
    });
    return { ok: true };
  },
});

// Personal profile — any signed-in staff member can update their OWN
// name/title/phone. Role and email deliberately can't be changed here.
export const updateProfile = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    title: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { token, name, title, phone }) => {
    const me = await requireUser(ctx, token);
    const cleanName = name.trim();
    const cleanTitle = title.trim();
    if (!cleanName) throw new Error("Name is required.");
    if (!cleanTitle) throw new Error("Job title is required.");
    const cleanPhone = phone?.trim() || undefined;
    await ctx.db.patch(me._id, { name: cleanName, title: cleanTitle, phone: cleanPhone });
    return { name: cleanName, title: cleanTitle, phone: cleanPhone };
  },
});

export const updateRole = mutation({
  args: { token: v.string(), userId: v.id("users"), role: roleValidator },
  handler: async (ctx, { token, userId, role }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "manage_employees");
    await ctx.db.patch(userId, { role });
  },
});

export const setActive = mutation({
  args: { token: v.string(), userId: v.id("users"), active: v.boolean() },
  handler: async (ctx, { token, userId, active }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "manage_employees");
    if (me._id === userId) throw new Error("You can't deactivate your own account.");
    await ctx.db.patch(userId, { active });
  },
});

// ── internal ─────────────────────────────────────────────────────────────────
export const requireManager = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await requireUser(ctx, token);
    try {
      await requireCap(ctx, me, "manage_employees");
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  },
});

export const insert = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: roleValidator,
    title: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", { ...args, active: true });
  },
});
