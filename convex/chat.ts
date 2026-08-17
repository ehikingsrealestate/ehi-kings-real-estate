import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser, requireCap, can } from "./lib";

// A channel is visible if it's company-wide (no members), you're a member,
// or you have org-wide visibility (Admin/Manager). Restricted channels stay
// hidden from staff who aren't members — e.g. a leadership-only channel.
function visible(channel: Doc<"channels">, meId: Id<"users">, seeAll: boolean) {
  return seeAll || channel.memberIds.length === 0 || channel.memberIds.includes(meId);
}

async function getAccessibleChannel(ctx: QueryCtx, token: string, channelId: Id<"channels">) {
  const me = await requireUser(ctx, token);
  const channel = await ctx.db.get(channelId);
  if (!channel) throw new Error("Channel not found.");
  const seeAll = await can(ctx, me, "view_all_tasks");
  if (!visible(channel, me._id, seeAll)) throw new Error("Forbidden — you're not a member of this channel.");
  return { me, channel };
}

export const listChannels = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => {
    const me = await requireUser(ctx, token);
    const seeAll = await can(ctx, me, "view_all_tasks");
    const all = await ctx.db.query("channels").collect();
    return all.filter((c) => visible(c, me._id, seeAll));
  },
});

export const createChannel = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    project: v.string(),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, { token, name, project, memberIds }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "create_channels");
    return ctx.db.insert("channels", {
      name,
      project,
      memberIds: memberIds ?? [],
      createdById: me._id,
    });
  },
});

export const listMessages = query({
  args: { token: v.string(), channelId: v.id("channels") },
  handler: async (ctx, { token, channelId }) => {
    await getAccessibleChannel(ctx, token, channelId);
    return ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", channelId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: { token: v.string(), channelId: v.id("channels"), text: v.string() },
  handler: async (ctx, { token, channelId, text }) => {
    const { me } = await getAccessibleChannel(ctx, token, channelId);
    if (!text.trim()) return;
    await ctx.db.insert("messages", { channelId, userId: me._id, text: text.trim() });
  },
});
