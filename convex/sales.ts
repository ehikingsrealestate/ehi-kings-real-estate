import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { can, requireUser } from "./lib";
import type { QueryCtx } from "./_generated/server";

// Native sales suite — companies, deals and a stage pipeline, built from
// scratch on our own tables (no external CRM). Rendered inside /admin/crm.

const stageValidator = v.union(
  v.literal("new"),
  v.literal("qualified"),
  v.literal("site_visit"),
  v.literal("negotiation"),
  v.literal("won"),
  v.literal("lost"),
);

async function requireSales(ctx: QueryCtx, token: string) {
  const me = await requireUser(ctx, token);
  const ok = (await can(ctx, me, "view_reports")) || me.role === "Agent";
  if (!ok) throw new Error("Forbidden — the sales suite is for sales and management staff.");
  return me;
}

// ── companies ───────────────────────────────────────────────────────────────

export const listCompanies = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSales(ctx, token);
    const rows = await ctx.db.query("companies").collect();
    const deals = await ctx.db.query("deals").collect();
    return rows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((c) => ({
        id: c._id,
        name: c.name,
        domain: c.domain,
        email: c.email,
        phone: c.phone,
        location: c.location,
        notes: c.notes,
        ownerId: c.ownerId,
        dealCount: deals.filter((d) => d.companyId === c._id).length,
        pipelineValue: deals
          .filter((d) => d.companyId === c._id && d.stage !== "won" && d.stage !== "lost")
          .reduce((n, d) => n + d.value, 0),
      }));
  },
});

export const upsertCompany = mutation({
  args: {
    token: v.string(),
    companyId: v.optional(v.id("companies")),
    name: v.string(),
    domain: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { token, companyId, ...fields }) => {
    const me = await requireSales(ctx, token);
    const now = Date.now();
    const name = fields.name.trim();
    if (!name) throw new Error("Company name is required.");
    if (companyId) {
      await ctx.db.patch(companyId, { ...fields, name, updatedAt: now });
      return companyId;
    }
    return ctx.db.insert("companies", { ...fields, name, ownerId: me._id, createdAt: now, updatedAt: now });
  },
});

// ── deals / pipeline ────────────────────────────────────────────────────────

export const pipeline = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireSales(ctx, token);
    const [deals, companies] = await Promise.all([
      ctx.db.query("deals").collect(),
      ctx.db.query("companies").collect(),
    ]);
    const companyName = new Map(companies.map((c) => [c._id, c.name]));
    const openStages = ["new", "qualified", "site_visit", "negotiation"] as const;
    return {
      deals: deals
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((d) => ({
          id: d._id,
          name: d.name,
          stage: d.stage,
          value: d.value,
          company: d.companyId ? companyName.get(d.companyId) : undefined,
          companyId: d.companyId,
          contactName: d.contactName,
          ownerId: d.ownerId,
          expectedClose: d.expectedClose,
          notes: d.notes,
          leadId: d.leadId,
        })),
      totals: {
        open: deals.filter((d) => openStages.includes(d.stage as (typeof openStages)[number])).reduce((n, d) => n + d.value, 0),
        won: deals.filter((d) => d.stage === "won").reduce((n, d) => n + d.value, 0),
        count: deals.length,
      },
    };
  },
});

export const upsertDeal = mutation({
  args: {
    token: v.string(),
    dealId: v.optional(v.id("deals")),
    name: v.string(),
    value: v.number(),
    stage: v.optional(stageValidator),
    companyId: v.optional(v.id("companies")),
    contactName: v.optional(v.string()),
    expectedClose: v.optional(v.string()),
    notes: v.optional(v.string()),
    leadId: v.optional(v.id("leads")),
  },
  handler: async (ctx, { token, dealId, ...fields }) => {
    const me = await requireSales(ctx, token);
    const now = Date.now();
    const name = fields.name.trim();
    if (!name) throw new Error("Deal name is required.");
    if (fields.value < 0) throw new Error("Deal value cannot be negative.");
    if (dealId) {
      await ctx.db.patch(dealId, { ...fields, name, updatedAt: now });
      return dealId;
    }
    return ctx.db.insert("deals", {
      ...fields,
      name,
      stage: fields.stage ?? "new",
      ownerId: me._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const moveDeal = mutation({
  args: { token: v.string(), dealId: v.id("deals"), stage: stageValidator },
  handler: async (ctx, { token, dealId, stage }) => {
    await requireSales(ctx, token);
    await ctx.db.patch(dealId, { stage, updatedAt: Date.now() });
  },
});

// Promote a CRM lead into a pipeline deal (keeps the link both ways).
export const dealFromLead = mutation({
  args: { token: v.string(), leadId: v.id("leads"), value: v.optional(v.number()) },
  handler: async (ctx, { token, leadId, value }) => {
    const me = await requireSales(ctx, token);
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found.");
    const existing = (await ctx.db.query("deals").collect()).find((d) => d.leadId === leadId);
    if (existing) return existing._id;
    const now = Date.now();
    return ctx.db.insert("deals", {
      name: `${lead.name} — ${lead.propertyName ?? lead.service}`,
      leadId,
      contactName: lead.name,
      value: value ?? 0,
      stage: "new",
      ownerId: lead.assignedToId ?? me._id,
      notes: lead.message,
      createdAt: now,
      updatedAt: now,
    });
  },
});
