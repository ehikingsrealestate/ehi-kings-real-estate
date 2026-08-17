import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";
import { randomToken } from "./crypto";
import type { Id } from "./_generated/dataModel";

// Native customer-support inbox — built from scratch, no external app.
// Public side: the website chat widget + contact form create conversations and
// post visitor messages. Staff side: the Team Chat → Customers tab lists, reads,
// replies, assigns and resolves. Everything lives in our own Convex tables.

const statusValidator = v.union(v.literal("open"), v.literal("pending"), v.literal("resolved"));

function preview(body: string) {
  const clean = body.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean;
}

// ── PUBLIC (website widget) ────────────────────────────────────────────────

// Start a new conversation from the website. Returns a visitorToken the widget
// keeps to post follow-ups and read replies for just this thread.
export const startConversation = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    channel: v.optional(v.union(v.literal("web"), v.literal("email"), v.literal("whatsapp"), v.literal("phone"))),
  },
  handler: async (ctx, args) => {
    const body = args.message.trim();
    if (!body) throw new Error("Please type a message.");
    const name = args.name.trim() || "Website visitor";
    const now = Date.now();
    const visitorToken = randomToken();

    const conversationId = await ctx.db.insert("supportConversations", {
      contactName: name,
      contactEmail: args.email?.trim().toLowerCase() || undefined,
      contactPhone: args.phone?.trim() || undefined,
      channel: args.channel ?? "web",
      subject: args.subject?.trim() || undefined,
      status: "open",
      lastMessageAt: now,
      lastMessagePreview: preview(body),
      unreadForAgents: 1,
      visitorToken,
      createdAt: now,
    });
    await ctx.db.insert("supportMessages", {
      conversationId,
      direction: "incoming",
      private: false,
      authorName: name,
      body,
      createdAt: now,
    });
    return { visitorToken, conversationId };
  },
});

// Visitor posts a follow-up to their own thread.
export const postVisitorMessage = mutation({
  args: { visitorToken: v.string(), message: v.string() },
  handler: async (ctx, { visitorToken, message }) => {
    const body = message.trim();
    if (!body) return { ok: false };
    const convo = await ctx.db
      .query("supportConversations")
      .withIndex("by_visitorToken", (q) => q.eq("visitorToken", visitorToken))
      .unique();
    if (!convo) throw new Error("Conversation not found.");
    const now = Date.now();
    await ctx.db.insert("supportMessages", {
      conversationId: convo._id,
      direction: "incoming",
      private: false,
      authorName: convo.contactName,
      body,
      createdAt: now,
    });
    await ctx.db.patch(convo._id, {
      lastMessageAt: now,
      lastMessagePreview: preview(body),
      unreadForAgents: convo.unreadForAgents + 1,
      status: convo.status === "resolved" ? "open" : convo.status,
    });
    return { ok: true };
  },
});

// The website AI assistant posts its reply into the visitor's thread. Gated by
// the visitor token (same trust level as the visitor's own messages) so staff
// see the full AI conversation in the admin inbox and can take over anytime.
export const postAssistantMessage = mutation({
  args: { visitorToken: v.string(), message: v.string() },
  handler: async (ctx, { visitorToken, message }) => {
    const body = message.trim();
    if (!body) return { ok: false };
    const convo = await ctx.db
      .query("supportConversations")
      .withIndex("by_visitorToken", (q) => q.eq("visitorToken", visitorToken))
      .unique();
    if (!convo) throw new Error("Conversation not found.");
    const now = Date.now();
    await ctx.db.insert("supportMessages", {
      conversationId: convo._id,
      direction: "outgoing",
      private: false,
      authorName: "Ehi-Kings AI",
      body: body.slice(0, 4000),
      createdAt: now,
    });
    await ctx.db.patch(convo._id, {
      lastMessageAt: now,
      lastMessagePreview: preview(body),
    });
    return { ok: true };
  },
});

// Visitor reads their own thread (public replies only, no private notes).
export const visitorThread = query({
  args: { visitorToken: v.string() },
  handler: async (ctx, { visitorToken }) => {
    const convo = await ctx.db
      .query("supportConversations")
      .withIndex("by_visitorToken", (q) => q.eq("visitorToken", visitorToken))
      .unique();
    if (!convo) return { messages: [], status: "open" as const };
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
      .collect();
    return {
      status: convo.status,
      messages: messages
        .filter((m) => !m.private)
        .map((m) => ({ id: m._id, mine: m.direction === "incoming", author: m.authorName, body: m.body, at: m.createdAt })),
    };
  },
});

// ── STAFF (Team Chat → Customers) ──────────────────────────────────────────

export const listConversations = query({
  args: { token: v.string(), status: v.optional(statusValidator) },
  handler: async (ctx, { token, status }) => {
    await requireUser(ctx, token);
    const rows = status
      ? await ctx.db.query("supportConversations").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("supportConversations").collect();
    return rows
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .map((c) => ({
        id: c._id,
        contactName: c.contactName,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        channel: c.channel,
        subject: c.subject,
        status: c.status,
        assignedToId: c.assignedToId,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        unread: c.unreadForAgents,
        createdAt: c.createdAt,
      }));
  },
});

export const counts = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireUser(ctx, token);
    const all = await ctx.db.query("supportConversations").collect();
    return {
      open: all.filter((c) => c.status === "open").length,
      pending: all.filter((c) => c.status === "pending").length,
      resolved: all.filter((c) => c.status === "resolved").length,
      unread: all.reduce((n, c) => n + c.unreadForAgents, 0),
    };
  },
});

export const getThread = query({
  args: { token: v.string(), conversationId: v.id("supportConversations") },
  handler: async (ctx, { token, conversationId }) => {
    await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found.");
    const messages = await ctx.db
      .query("supportMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    return {
      conversation: {
        id: convo._id,
        contactName: convo.contactName,
        contactEmail: convo.contactEmail,
        contactPhone: convo.contactPhone,
        channel: convo.channel,
        subject: convo.subject,
        status: convo.status,
        assignedToId: convo.assignedToId,
        createdAt: convo.createdAt,
      },
      messages: messages.map((m) => ({
        id: m._id,
        direction: m.direction,
        private: m.private,
        authorId: m.authorId,
        author: m.authorName,
        body: m.body,
        at: m.createdAt,
      })),
    };
  },
});

export const sendReply = mutation({
  args: {
    token: v.string(),
    conversationId: v.id("supportConversations"),
    body: v.string(),
    private: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, conversationId, body, private: isPrivate }) => {
    const me = await requireUser(ctx, token);
    const text = body.trim();
    if (!text) return;
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found.");
    const now = Date.now();
    await ctx.db.insert("supportMessages", {
      conversationId,
      direction: "outgoing",
      private: Boolean(isPrivate),
      authorId: me._id,
      authorName: me.name,
      body: text,
      createdAt: now,
    });
    // A public reply moves the thread forward + clears the unread flag; a
    // private note just annotates without touching the customer-facing state.
    if (!isPrivate) {
      await ctx.db.patch(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: preview(text),
        unreadForAgents: 0,
        status: convo.status === "open" ? "pending" : convo.status,
        assignedToId: convo.assignedToId ?? me._id,
      });
    }
  },
});

export const updateConversation = mutation({
  args: {
    token: v.string(),
    conversationId: v.id("supportConversations"),
    status: v.optional(statusValidator),
    assignedToId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, { token, conversationId, status, assignedToId }) => {
    await requireUser(ctx, token);
    const patch: Record<string, unknown> = {};
    if (status) patch.status = status;
    if (assignedToId !== undefined) patch.assignedToId = assignedToId ?? undefined;
    if (Object.keys(patch).length) await ctx.db.patch(conversationId, patch);
  },
});

// Clear the unread badge when a staff member opens a thread.
export const markRead = mutation({
  args: { token: v.string(), conversationId: v.id("supportConversations") },
  handler: async (ctx, { token, conversationId }) => {
    await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (convo && convo.unreadForAgents > 0) await ctx.db.patch(conversationId, { unreadForAgents: 0 });
  },
});

// Convert a support contact into a CRM lead (one click from the inbox).
export const toLead = mutation({
  args: { token: v.string(), conversationId: v.id("supportConversations") },
  handler: async (ctx, { token, conversationId }): Promise<{ leadId: Id<"leads"> }> => {
    const me = await requireUser(ctx, token);
    const convo = await ctx.db.get(conversationId);
    if (!convo) throw new Error("Conversation not found.");
    if (convo.leadId) return { leadId: convo.leadId };
    const now = Date.now();
    const leadId = await ctx.db.insert("leads", {
      name: convo.contactName,
      email: convo.contactEmail,
      phone: convo.contactPhone,
      source: `support:${convo.channel}`,
      service: convo.subject || "Support conversation",
      message: convo.lastMessagePreview,
      bookingType: "contact",
      consentMarketing: false,
      stage: "new",
      priority: "normal",
      assignedToId: me._id,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(conversationId, { leadId });
    return { leadId };
  },
});
