import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("Admin"),
  v.literal("Manager"),
  v.literal("Agent"),
  v.literal("Worker"),
);

export const capsValidator = v.object({
  assign_tasks: v.boolean(),
  manage_employees: v.boolean(),
  manage_permissions: v.boolean(),
  create_channels: v.boolean(),
  view_reports: v.boolean(),
  view_all_tasks: v.boolean(),
});

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: roleValidator,
    title: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    active: v.boolean(),
    // Chatwoot agent id for one-click SSO into the support inbox.
    chatwootUserId: v.optional(v.number()),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  tasks: defineTable({
    title: v.string(),
    detail: v.string(),
    assigneeId: v.id("users"),
    createdById: v.id("users"),
    status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done")),
    due: v.string(),
    // Optional so existing rows stay valid.
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    department: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  })
    .index("by_assignee", ["assigneeId"])
    .index("by_creator", ["createdById"]),

  leads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    service: v.string(),
    interest: v.optional(v.string()),
    propertySlug: v.optional(v.string()),
    propertyName: v.optional(v.string()),
    // The agent/marketer who brought this client (from the estate sheets).
    marketer: v.optional(v.string()),
    budget: v.optional(v.string()),
    message: v.optional(v.string()),
    bookingType: v.union(
      v.literal("contact"),
      v.literal("consultation"),
      v.literal("inspection"),
      v.literal("payment_interest"),
      v.literal("newsletter"),
      v.literal("import"),
    ),
    preferredDate: v.optional(v.string()),
    preferredTime: v.optional(v.string()),
    consentMarketing: v.boolean(),
    // Record type: new prospects ("lead") vs existing customers ("client").
    // The same table/UI serves both; defaults to lead when unset.
    recordType: v.optional(v.union(v.literal("lead"), v.literal("client"))),
    // Per-channel contact consent, replacing the single opt-in. Falls back to
    // { email: consentMarketing } for legacy rows without it.
    contactPrefs: v.optional(
      v.object({
        email: v.boolean(),
        sms: v.boolean(),
        whatsapp: v.boolean(),
      }),
    ),
    // Relationship / celebration dates for staying in touch (birthday,
    // anniversary, move-in date, custom milestones). kind is free-text so
    // the team can add any event type; date is ISO YYYY-MM-DD.
    events: v.optional(
      v.array(
        v.object({
          kind: v.string(),
          date: v.string(),
          note: v.optional(v.string()),
        }),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    stage: v.union(
      v.literal("new"),
      v.literal("contacted"),
      v.literal("inspection_booked"),
      v.literal("negotiation"),
      v.literal("closed"),
      v.literal("lost"),
    ),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high")),
    assignedToId: v.optional(v.id("users")),
    nextActionAt: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_email", ["email"])
    .index("by_created", ["createdAt"]),

  // Property/estate listings — single source of truth shared by the admin
  // manager AND the public website. Admin edits here surface on the live site.
  properties: defineTable({
    slug: v.string(),
    name: v.string(),
    location: v.string(),
    region: v.string(),
    kind: v.union(v.literal("land"), v.literal("home")),
    title: v.string(),
    size: v.string(),
    price: v.string(),
    note: v.optional(v.string()),
    overview: v.array(v.string()),
    features: v.array(v.string()),
    img: v.optional(v.string()),
    priceTiers: v.optional(v.array(v.object({ label: v.string(), price: v.string(), note: v.optional(v.string()) }))),
    order: v.number(),
    featured: v.optional(v.boolean()),
    active: v.boolean(),
    updatedById: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),

  channels: defineTable({
    name: v.string(),
    project: v.string(),
    // Empty memberIds = company-wide (everyone). Otherwise restricted to members.
    memberIds: v.array(v.id("users")),
    createdById: v.id("users"),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    text: v.string(),
  }).index("by_channel", ["channelId"]),

  // ── Native customer-support inbox (built from scratch; replaces Chatwoot) ──
  // A conversation with one website visitor / client. Fed by the public chat
  // widget and the contact form; worked by staff inside Team Chat → Customers.
  supportConversations: defineTable({
    contactName: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    channel: v.union(v.literal("web"), v.literal("email"), v.literal("whatsapp"), v.literal("phone")),
    subject: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("pending"), v.literal("resolved")),
    assignedToId: v.optional(v.id("users")),
    // Denormalised for a fast inbox list without reading every message.
    lastMessageAt: v.number(),
    lastMessagePreview: v.string(),
    // Unread = messages from the contact the team hasn't opened yet.
    unreadForAgents: v.number(),
    leadId: v.optional(v.id("leads")),
    // Opaque token the website widget uses to keep posting to its own thread.
    visitorToken: v.string(),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_lastMessage", ["lastMessageAt"])
    .index("by_visitorToken", ["visitorToken"])
    .index("by_assigned", ["assignedToId"]),

  supportMessages: defineTable({
    conversationId: v.id("supportConversations"),
    // incoming = from the contact; outgoing = from staff.
    direction: v.union(v.literal("incoming"), v.literal("outgoing")),
    // Private notes are staff-only and never shown to the visitor.
    private: v.boolean(),
    authorId: v.optional(v.id("users")), // set for staff messages
    authorName: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // ── Native sales suite (built from scratch; replaces Twenty CRM) ──────────
  companies: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  deals: defineTable({
    name: v.string(),
    companyId: v.optional(v.id("companies")),
    leadId: v.optional(v.id("leads")),
    contactName: v.optional(v.string()),
    // Amount in naira (whole numbers; UI formats).
    value: v.number(),
    stage: v.union(
      v.literal("new"),
      v.literal("qualified"),
      v.literal("site_visit"),
      v.literal("negotiation"),
      v.literal("won"),
      v.literal("lost"),
    ),
    ownerId: v.optional(v.id("users")),
    expectedClose: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_company", ["companyId"]),

  // ── Native social planner (built from scratch; replaces Postiz) ───────────
  socialPosts: defineTable({
    content: v.string(),
    platforms: v.array(v.string()),
    mediaUrl: v.optional(v.string()),
    scheduledAt: v.number(),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("published"), v.literal("cancelled")),
    createdById: v.id("users"),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_scheduledAt", ["scheduledAt"]),

  // Per-channel social connection (handle + optional API token for auto-post).
  socialConnections: defineTable({
    platform: v.string(), // instagram | facebook | x | linkedin | tiktok | whatsapp
    handle: v.string(),
    connected: v.boolean(),
    // Optional posting credential (kept server-side; empty until the network
    // API/n8n webhook is wired for that platform).
    apiToken: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    // Real Meta Graph API connection (Instagram/Facebook): long-lived token +
    // the IG business account / FB page id we publish to.
    accessToken: v.optional(v.string()),
    igUserId: v.optional(v.string()),
    pageId: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    connectedById: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_platform", ["platform"]),

  // Server-side app configuration (secrets never sent to the browser), e.g. the
  // Meta app id/secret used for the real Instagram/Facebook OAuth + publishing.
  appConfig: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),

  // Saved AI chat conversations, per user, for the Company Assistant and the
  // PicoClaw console — so previous chats survive a reload.
  conversations: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("assistant"), v.literal("picoclaw")),
    title: v.string(),
    preview: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_kind", ["userId", "kind"])
    .index("by_user", ["userId"]),

  conversationMessages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("model")),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  // ── Customer accounts (public website portal — separate from staff `users`) ─
  customers: defineTable({
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  customerSessions: defineTable({
    customerId: v.id("customers"),
    token: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_customer", ["customerId"]),

  // A property a customer has reserved or owns (their "Your Properties").
  customerProperties: defineTable({
    customerId: v.id("customers"),
    propertySlug: v.string(),
    status: v.union(v.literal("reserved"), v.literal("owned")),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_customer_slug", ["customerId", "propertySlug"]),

  // Journal/blog posts — editable from the admin panel, rendered on the
  // public Journal pages (with the static JOURNAL array as fallback).
  posts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    category: v.string(),
    date: v.string(),
    readingTime: v.string(),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    body: v.array(v.string()),
    published: v.boolean(),
    updatedById: v.id("users"),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  siteBlocks: defineTable({
    key: v.string(),
    label: v.string(),
    type: v.union(v.literal("text"), v.literal("textarea"), v.literal("image"), v.literal("layout")),
    value: v.string(),
    draftValue: v.optional(v.string()),
    reviewValue: v.optional(v.string()),
    status: v.optional(v.union(v.literal("published"), v.literal("draft"), v.literal("review"))),
    area: v.string(),
    updatedById: v.id("users"),
    updatedAt: v.number(),
    submittedById: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
    publishedById: v.optional(v.id("users")),
    publishedAt: v.optional(v.number()),
  }).index("by_key", ["key"]),

  permissions: defineTable({
    role: roleValidator,
    caps: capsValidator,
  }).index("by_role", ["role"]),

  // Per-user Zoho Mail connection (each employee links their own mailbox).
  mailAccounts: defineTable({
    userId: v.id("users"),
    email: v.string(),
    accountId: v.string(),
    refreshToken: v.string(),
    fromAddress: v.string(),
  }).index("by_user", ["userId"]),

  // Short-lived CSRF nonce for the Zoho OAuth redirect flow.
  // purpose "login" = sign-in (no user yet); "connect" = link mailbox to an
  // already-signed-in user.
  oauthStates: defineTable({
    state: v.string(),
    userId: v.optional(v.id("users")),
    purpose: v.optional(v.union(v.literal("login"), v.literal("connect"))),
  }).index("by_state", ["state"]),
});
