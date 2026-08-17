import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireCap, can } from "./lib";

const statusValidator = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"));
const priorityValidator = v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"));

// RBAC: holders of view_all_tasks (Admin/Manager) see everything.
// Everyone else sees ONLY tasks assigned to them or created by them.
// → a Worker literally cannot read the MD's tasks; they're filtered on the server.
export const list = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const me = await requireUser(ctx, token);
    const seeAll = await can(ctx, me, "view_all_tasks");
    if (seeAll) {
      return (await ctx.db.query("tasks").collect()).sort((a, b) => b._creationTime - a._creationTime);
    }
    const assigned = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", me._id))
      .collect();
    const created = await ctx.db
      .query("tasks")
      .withIndex("by_creator", (q) => q.eq("createdById", me._id))
      .collect();
    const map = new Map(assigned.concat(created).map((t) => [t._id, t]));
    return Array.from(map.values()).sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    detail: v.string(),
    assigneeId: v.id("users"),
    due: v.string(),
    priority: v.optional(priorityValidator),
    department: v.optional(v.string()),
  },
  handler: async (ctx, { token, title, detail, assigneeId, due, priority, department }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "assign_tasks");
    await ctx.db.insert("tasks", {
      title,
      detail,
      assigneeId,
      createdById: me._id,
      due,
      status: "todo",
      priority: priority ?? "normal",
      department,
    });
  },
});

export const setStatus = mutation({
  args: { token: v.string(), taskId: v.id("tasks"), status: statusValidator },
  handler: async (ctx, { token, taskId, status }) => {
    const me = await requireUser(ctx, token);
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found.");
    const seeAll = await can(ctx, me, "view_all_tasks");
    if (!seeAll && task.assigneeId !== me._id && task.createdById !== me._id) {
      throw new Error("Forbidden — you can only update your own tasks.");
    }
    await ctx.db.patch(taskId, { status, completedAt: status === "done" ? Date.now() : undefined });
  },
});

export const setPriority = mutation({
  args: { token: v.string(), taskId: v.id("tasks"), priority: priorityValidator },
  handler: async (ctx, { token, taskId, priority }) => {
    const me = await requireUser(ctx, token);
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found.");
    const seeAll = await can(ctx, me, "view_all_tasks");
    if (!seeAll && task.assigneeId !== me._id && task.createdById !== me._id) {
      throw new Error("Forbidden — you can only update your own tasks.");
    }
    await ctx.db.patch(taskId, { priority });
  },
});

// Reassign a task to another staff member (requires the assign-tasks capability).
export const reassign = mutation({
  args: { token: v.string(), taskId: v.id("tasks"), assigneeId: v.id("users") },
  handler: async (ctx, { token, taskId, assigneeId }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "assign_tasks");
    const task = await ctx.db.get(taskId);
    if (!task) throw new Error("Task not found.");
    await ctx.db.patch(taskId, { assigneeId });
  },
});
