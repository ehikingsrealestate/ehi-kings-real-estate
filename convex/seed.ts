import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { makeSalt, hashPassword } from "./crypto";
import { DEFAULT_PERMISSIONS, ROLES } from "./defaults";

function cleanEmail(value: string | undefined) {
  return (value ?? "").toLowerCase().trim();
}

export const seed = action({
  args: {},
  handler: async (ctx): Promise<{ seededAdmin: boolean; permissionsReady: boolean; message: string }> => {
    await ctx.runMutation(internal.seed.ensurePermissions, {});

    const existingUsers = await ctx.runQuery(internal.seed.countUsers, {});
    if (existingUsers > 0) {
      return { seededAdmin: false, permissionsReady: true, message: "Existing staff accounts preserved." };
    }

    const email = cleanEmail(process.env.INITIAL_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL);
    const password = process.env.INITIAL_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";
    if (!email || !password) {
      return {
        seededAdmin: false,
        permissionsReady: true,
        message: "Permissions are ready. Create the first admin with Zoho or set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD.",
      };
    }

    const salt = makeSalt();
    await ctx.runMutation(internal.seed.insertInitialAdmin, {
      email,
      name: process.env.INITIAL_ADMIN_NAME ?? "Ehi-Kings Admin",
      title: process.env.INITIAL_ADMIN_TITLE ?? "Administrator",
      passwordSalt: salt,
      passwordHash: await hashPassword(password, salt),
    });
    return { seededAdmin: true, permissionsReady: true, message: "Initial admin created." };
  },
});

export const countUsers = internalQuery({
  args: {},
  handler: async (ctx) => (await ctx.db.query("users").collect()).length,
});

export const ensurePermissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const role of ROLES) {
      const existing = await ctx.db
        .query("permissions")
        .withIndex("by_role", (q) => q.eq("role", role))
        .unique();
      if (!existing) {
        await ctx.db.insert("permissions", { role, caps: DEFAULT_PERMISSIONS[role] });
      }
    }
  },
});

export const insertInitialAdmin = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    title: v.string(),
    passwordSalt: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: "Admin",
      title: args.title,
      passwordHash: args.passwordHash,
      passwordSalt: args.passwordSalt,
      active: true,
    });
  },
});
