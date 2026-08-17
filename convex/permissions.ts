import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireCap } from "./lib";

const capValidator = v.union(
  v.literal("assign_tasks"),
  v.literal("manage_employees"),
  v.literal("manage_permissions"),
  v.literal("create_channels"),
  v.literal("view_reports"),
  v.literal("view_all_tasks"),
);

// Any signed-in user can read the matrix (the client uses it to gate UI);
// the server still enforces every capability independently.
export const list = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    return ctx.db.query("permissions").collect();
  },
});

// Editing the matrix requires manage_permissions (Admin only by default).
export const setCap = mutation({
  args: {
    token: v.string(),
    role: v.union(v.literal("Admin"), v.literal("Manager"), v.literal("Agent"), v.literal("Worker")),
    cap: capValidator,
    value: v.boolean(),
  },
  handler: async (ctx, { token, role, cap, value }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "manage_permissions");
    // Guard rail: never let the last Admin lock themselves out of permission control.
    if (role === "Admin" && cap === "manage_permissions" && value === false) {
      throw new Error("Admins must keep permission control.");
    }
    const row = await ctx.db
      .query("permissions")
      .withIndex("by_role", (q) => q.eq("role", role))
      .unique();
    if (!row) throw new Error("Unknown role.");
    await ctx.db.patch(row._id, { caps: { ...row.caps, [cap]: value } });
  },
});
