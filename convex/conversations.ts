import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";
import type { Id } from "./_generated/dataModel";

// Persisted AI chat history — per user, per surface ('assistant' | 'picoclaw').
// The UI starts a conversation, appends each message, and can reopen past ones.

const kindValidator = v.union(v.literal("assistant"), v.literal("picoclaw"));

function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 48 ? `${clean.slice(0, 45)}…` : clean;
}

export const list = query({
  args: { token: v.string(), kind: kindValidator },
  handler: async (ctx, { token, kind }) => {
    const me = await requireUser(ctx, token);
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user_kind", (q) => q.eq("userId", me._id).eq("kind", kind))
      .collect();
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((c) => ({ id: c._id, title: c.title, preview: c.preview, updatedAt: c.updatedAt }));
  },
});

export const messages = query({
  args: { token: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, { token, conversationId }) => {
    const me = await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== me._id) return [];
    const rows = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    return rows.map((m) => ({ id: m._id, role: m.role, text: m.text, at: m.createdAt }));
  },
});

export const start = mutation({
  args: { token: v.string(), kind: kindValidator },
  handler: async (ctx, { token, kind }): Promise<Id<"conversations">> => {
    const me = await requireUser(ctx, token);
    const now = Date.now();
    return ctx.db.insert("conversations", {
      userId: me._id,
      kind,
      title: "New chat",
      preview: "",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const append = mutation({
  args: {
    token: v.string(),
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("model")),
    text: v.string(),
  },
  handler: async (ctx, { token, conversationId, role, text }) => {
    const me = await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== me._id) throw new Error("Conversation not found.");
    const now = Date.now();
    await ctx.db.insert("conversationMessages", { conversationId, userId: me._id, role, text, createdAt: now });
    const patch: Record<string, unknown> = { updatedAt: now, preview: text.replace(/\s+/g, " ").trim().slice(0, 120) };
    // First user message names the conversation.
    if (role === "user" && (convo.title === "New chat" || !convo.title)) patch.title = titleFrom(text);
    await ctx.db.patch(conversationId, patch);
  },
});

export const rename = mutation({
  args: { token: v.string(), conversationId: v.id("conversations"), title: v.string() },
  handler: async (ctx, { token, conversationId, title }) => {
    const me = await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== me._id) throw new Error("Conversation not found.");
    await ctx.db.patch(conversationId, { title: title.trim().slice(0, 80) || convo.title });
  },
});

export const remove = mutation({
  args: { token: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, { token, conversationId }) => {
    const me = await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo || convo.userId !== me._id) throw new Error("Conversation not found.");
    const msgs = await ctx.db
      .query("conversationMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    for (const m of msgs) await ctx.db.delete(m._id);
    await ctx.db.delete(conversationId);
  },
});
