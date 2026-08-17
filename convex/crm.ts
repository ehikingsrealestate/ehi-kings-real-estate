import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { can, requireCap, requireUser } from "./lib";

const eventValidator = v.object({
  kind: v.string(),
  date: v.string(),
  note: v.optional(v.string()),
});

const contactPrefsValidator = v.object({
  email: v.boolean(),
  sms: v.boolean(),
  whatsapp: v.boolean(),
});

const recordTypeValidator = v.union(v.literal("lead"), v.literal("client"));

// Base64 for HTTP Basic auth — Convex actions have no btoa/Buffer.
const B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function b64(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i += 3) {
    const c1 = s.charCodeAt(i), c2 = s.charCodeAt(i + 1), c3 = s.charCodeAt(i + 2);
    out += B64_ALPHABET[c1 >> 2] + B64_ALPHABET[((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4)];
    out += isNaN(c2) ? "=" : B64_ALPHABET[((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6)];
    out += isNaN(c3) ? "=" : B64_ALPHABET[c3 & 63];
  }
  return out;
}

// Legacy rows only have consentMarketing — treat that as email consent.
function resolvePrefs(
  prefs: { email: boolean; sms: boolean; whatsapp: boolean } | undefined,
  consentMarketing: boolean | undefined,
) {
  if (prefs) return prefs;
  return { email: Boolean(consentMarketing), sms: false, whatsapp: false };
}

const bookingTypeValidator = v.union(
  v.literal("contact"),
  v.literal("consultation"),
  v.literal("inspection"),
  v.literal("payment_interest"),
  v.literal("newsletter"),
  v.literal("import"),
);

const stageValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("inspection_booked"),
  v.literal("negotiation"),
  v.literal("closed"),
  v.literal("lost"),
);

const priorityValidator = v.union(v.literal("low"), v.literal("normal"), v.literal("high"));

const leadInput = {
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  source: v.optional(v.string()),
  service: v.optional(v.string()),
  interest: v.optional(v.string()),
  propertySlug: v.optional(v.string()),
  propertyName: v.optional(v.string()),
  marketer: v.optional(v.string()),
  budget: v.optional(v.string()),
  message: v.optional(v.string()),
  bookingType: v.optional(bookingTypeValidator),
  preferredDate: v.optional(v.string()),
  preferredTime: v.optional(v.string()),
  consentMarketing: v.optional(v.boolean()),
  contactPrefs: v.optional(contactPrefsValidator),
  recordType: v.optional(recordTypeValidator),
  events: v.optional(v.array(eventValidator)),
  tags: v.optional(v.array(v.string())),
  notes: v.optional(v.string()),
  stage: v.optional(stageValidator),
};

function cleanText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function leadPriority(bookingType: string | undefined) {
  if (bookingType === "payment_interest" || bookingType === "inspection") return "high" as const;
  if (bookingType === "newsletter") return "low" as const;
  return "normal" as const;
}

function defaultService(bookingType: string | undefined) {
  if (bookingType === "inspection") return "Inspection booking";
  if (bookingType === "consultation") return "Consultation";
  if (bookingType === "payment_interest") return "Land payment interest";
  if (bookingType === "newsletter") return "Newsletter";
  return "General enquiry";
}

export const submitLead = mutation({
  args: leadInput,
  handler: async (ctx, args) => {
    const bookingType = args.bookingType ?? "contact";
    const email = cleanText(args.email)?.toLowerCase();
    const phone = cleanText(args.phone);
    if (!email && bookingType === "newsletter") throw new Error("Email is required for newsletter signup.");
    if (!email && !phone) throw new Error("Please provide an email address or phone number.");

    const now = Date.now();
    const leadId = await ctx.db.insert("leads", {
      name: cleanText(args.name) ?? "Website lead",
      email,
      phone,
      source: cleanText(args.source) ?? "website",
      service: cleanText(args.service) ?? defaultService(bookingType),
      interest: cleanText(args.interest),
      propertySlug: cleanText(args.propertySlug),
      propertyName: cleanText(args.propertyName),
      marketer: cleanText(args.marketer),
      budget: cleanText(args.budget),
      message: cleanText(args.message),
      bookingType,
      preferredDate: cleanText(args.preferredDate),
      preferredTime: cleanText(args.preferredTime),
      consentMarketing: Boolean(args.consentMarketing),
      contactPrefs: resolvePrefs(args.contactPrefs, args.consentMarketing),
      recordType: args.recordType ?? "lead",
      events: args.events,
      tags: args.tags,
      notes: cleanText(args.notes),
      stage: args.stage ?? "new",
      priority: leadPriority(bookingType),
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true, leadId };
  },
});

export const listLeads = query({
  args: { token: v.string(), stage: v.optional(stageValidator), recordType: v.optional(recordTypeValidator) },
  handler: async (ctx, { token, stage, recordType }) => {
    const me = await requireUser(ctx, token);
    const seeReports = await can(ctx, me, "view_reports");
    const seeAllTasks = await can(ctx, me, "view_all_tasks");
    if (!seeReports && !seeAllTasks && me.role !== "Agent") {
      throw new Error("Forbidden — CRM access is for sales and management staff.");
    }
    const rows = stage
      ? await ctx.db.query("leads").withIndex("by_stage", (q) => q.eq("stage", stage)).collect()
      : await ctx.db.query("leads").collect();
    // Normalise legacy rows so the client always has recordType + contactPrefs.
    const normalised = rows.map((r) => ({
      ...r,
      recordType: r.recordType ?? "lead",
      contactPrefs: resolvePrefs(r.contactPrefs, r.consentMarketing),
    }));
    const filtered = recordType ? normalised.filter((r) => r.recordType === recordType) : normalised;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateLead = mutation({
  args: {
    token: v.string(),
    leadId: v.id("leads"),
    // Editable contact/deal fields (Notion-style inline editing).
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    service: v.optional(v.string()),
    interest: v.optional(v.string()),
    budget: v.optional(v.string()),
    message: v.optional(v.string()),
    propertySlug: v.optional(v.string()),
    propertyName: v.optional(v.string()),
    marketer: v.optional(v.string()),
    consentMarketing: v.optional(v.boolean()),
    contactPrefs: v.optional(contactPrefsValidator),
    recordType: v.optional(recordTypeValidator),
    events: v.optional(v.array(eventValidator)),
    tags: v.optional(v.array(v.string())),
    stage: v.optional(stageValidator),
    priority: v.optional(priorityValidator),
    assignedToId: v.optional(v.id("users")),
    nextActionAt: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
  },
  handler: async (ctx, { token, leadId, ...patch }) => {
    const me = await requireUser(ctx, token);
    const allowed = (await can(ctx, me, "view_reports")) || me.role === "Agent";
    if (!allowed) throw new Error("Forbidden — you cannot update CRM leads.");
    const lead = await ctx.db.get(leadId);
    if (!lead) throw new Error("Lead not found.");

    // Build a patch that only touches provided fields; text fields are trimmed.
    const next: Record<string, unknown> = { updatedAt: Date.now() };
    if (patch.name !== undefined) next.name = cleanText(patch.name) ?? lead.name;
    if (patch.email !== undefined) next.email = cleanText(patch.email)?.toLowerCase();
    if (patch.phone !== undefined) next.phone = cleanText(patch.phone);
    if (patch.service !== undefined) next.service = cleanText(patch.service) ?? lead.service;
    if (patch.interest !== undefined) next.interest = cleanText(patch.interest);
    if (patch.budget !== undefined) next.budget = cleanText(patch.budget);
    if (patch.message !== undefined) next.message = cleanText(patch.message);
    if (patch.propertySlug !== undefined) next.propertySlug = cleanText(patch.propertySlug);
    if (patch.propertyName !== undefined) next.propertyName = cleanText(patch.propertyName);
    if (patch.marketer !== undefined) next.marketer = cleanText(patch.marketer);
    // Keep contactPrefs.email and the legacy consentMarketing flag in lockstep,
    // whichever side was edited.
    if (patch.contactPrefs !== undefined) {
      next.contactPrefs = patch.contactPrefs;
      next.consentMarketing = patch.contactPrefs.email;
    } else if (patch.consentMarketing !== undefined) {
      const base = resolvePrefs(lead.contactPrefs, lead.consentMarketing);
      next.contactPrefs = { ...base, email: patch.consentMarketing };
      next.consentMarketing = patch.consentMarketing;
    }
    if (patch.recordType !== undefined) next.recordType = patch.recordType;
    if (patch.events !== undefined) next.events = patch.events.filter((e) => e.kind.trim() && e.date.trim());
    if (patch.tags !== undefined) next.tags = patch.tags.map((t) => t.trim()).filter(Boolean);
    if (patch.stage !== undefined) next.stage = patch.stage;
    if (patch.priority !== undefined) next.priority = patch.priority;
    if (patch.assignedToId !== undefined) next.assignedToId = patch.assignedToId;
    if (patch.nextActionAt !== undefined) next.nextActionAt = cleanText(patch.nextActionAt);
    if (patch.notes !== undefined) next.notes = cleanText(patch.notes);
    if (patch.lastContactedAt !== undefined) next.lastContactedAt = patch.lastContactedAt;

    await ctx.db.patch(leadId, next);
  },
});

// Upcoming celebrations — leads with a birthday/anniversary/event whose
// month+day falls within the next `days` window (recurring yearly). Returns
// each with the next occurrence date and days-away, soonest first.
export const upcomingCelebrations = query({
  args: { token: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, { token, days }) => {
    const me = await requireUser(ctx, token);
    const allowed = (await can(ctx, me, "view_reports")) || me.role === "Agent";
    if (!allowed) throw new Error("Forbidden — CRM access is for sales and management staff.");
    const window = days ?? 60;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const out: Array<{
      leadId: string;
      name: string;
      email?: string;
      phone?: string;
      kind: string;
      note?: string;
      nextDate: string;
      daysAway: number;
    }> = [];

    for (const lead of await ctx.db.query("leads").collect()) {
      for (const ev of lead.events ?? []) {
        const parsed = new Date(ev.date);
        if (Number.isNaN(parsed.getTime())) continue;
        // Next yearly occurrence from today.
        let next = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate());
        if (next < today) next = new Date(today.getFullYear() + 1, parsed.getMonth(), parsed.getDate());
        const daysAway = Math.round((next.getTime() - today.getTime()) / 86400000);
        if (daysAway <= window) {
          out.push({
            leadId: lead._id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            kind: ev.kind,
            note: ev.note,
            nextDate: next.toISOString().slice(0, 10),
            daysAway,
          });
        }
      }
    }
    return out.sort((a, b) => a.daysAway - b.daysAway);
  },
});

// Mass email — send one message to many leads via the sender's Zoho mailbox.
// Marks each recipient as contacted. Capped so a mistake can't blast the DB.
export const bulkEmail = action({
  args: {
    token: v.string(),
    leadIds: v.array(v.id("leads")),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (
    ctx,
    { token, leadIds, subject, body },
  ): Promise<{ sent: number; failed: number; errors: string[] }> => {
    const leads = await ctx.runQuery(api.crm.listLeads, { token });
    const byId = new Map(leads.map((l) => [l._id, l] as const));
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const leadId of leadIds.slice(0, 200)) {
      const lead = byId.get(leadId);
      if (!lead?.email) {
        failed += 1;
        continue;
      }
      const personalised = body.replace(/\{\{\s*name\s*\}\}/gi, lead.name.split(" ")[0] || lead.name);
      const res = await ctx.runAction(api.zoho.sendMail, { token, to: lead.email, subject, body: personalised });
      if (res.ok) {
        sent += 1;
        await ctx.runMutation(api.crm.updateLead, { token, leadId, lastContactedAt: Date.now() });
      } else {
        failed += 1;
        if (res.error && !errors.includes(res.error)) errors.push(res.error);
      }
    }
    return { sent, failed, errors };
  },
});

// Broadcast to a whole segment on a chosen channel. Segment = recordType +
// stage + channel opt-in. Email sends via the sender's Zoho mailbox now;
// SMS/WhatsApp send when a provider is configured (Twilio / WhatsApp Cloud
// API env), otherwise they report "not connected" cleanly.
export const broadcast = action({
  args: {
    token: v.string(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp")),
    recordType: v.optional(recordTypeValidator),
    stage: v.optional(stageValidator),
    onlyOptedIn: v.optional(v.boolean()),
    subject: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (
    ctx,
    { token, channel, recordType, stage, onlyOptedIn, subject, body },
  ): Promise<{ sent: number; failed: number; skipped: number; configured: boolean; note?: string }> => {
    const all = await ctx.runQuery(api.crm.listLeads, { token, recordType });
    const segment = all.filter((l) => {
      if (stage && l.stage !== stage) return false;
      const prefs = l.contactPrefs ?? { email: l.consentMarketing, sms: false, whatsapp: false };
      const hasChannel = channel === "email" ? Boolean(l.email) : Boolean(l.phone);
      if (!hasChannel) return false;
      if (onlyOptedIn && !prefs[channel]) return false;
      return true;
    });

    if (channel === "email") {
      let sent = 0, failed = 0;
      for (const lead of segment.slice(0, 300)) {
        if (!lead.email) { failed += 1; continue; }
        const personalised = body.replace(/\{\{\s*name\s*\}\}/gi, lead.name.split(" ")[0] || lead.name);
        const res = await ctx.runAction(api.zoho.sendMail, { token, to: lead.email, subject: subject ?? "Ehi-Kings Real Estate", body: personalised });
        if (res.ok) { sent += 1; await ctx.runMutation(api.crm.updateLead, { token, leadId: lead._id, lastContactedAt: Date.now() }); }
        else failed += 1;
      }
      return { sent, failed, skipped: Math.max(0, segment.length - 300), configured: true };
    }

    // SMS via Twilio.
    if (channel === "sms") {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const tok = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_SMS_FROM;
      if (!sid || !tok || !from) {
        return { sent: 0, failed: 0, skipped: segment.length, configured: false, note: "SMS not connected — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM." };
      }
      let sent = 0, failed = 0;
      for (const lead of segment.slice(0, 300)) {
        const to = (lead.phone ?? "").replace(/[^0-9+]/g, "");
        if (!to) { failed += 1; continue; }
        const msg = body.replace(/\{\{\s*name\s*\}\}/gi, lead.name.split(" ")[0] || lead.name);
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: { Authorization: `Basic ${b64(`${sid}:${tok}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ To: to, From: from, Body: msg }),
        });
        if (res.ok) { sent += 1; await ctx.runMutation(api.crm.updateLead, { token, leadId: lead._id, lastContactedAt: Date.now() }); }
        else failed += 1;
      }
      return { sent, failed, skipped: Math.max(0, segment.length - 300), configured: true };
    }

    // WhatsApp via Meta WhatsApp Cloud API.
    const waToken = process.env.WHATSAPP_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_ID;
    if (!waToken || !waPhoneId) {
      return { sent: 0, failed: 0, skipped: segment.length, configured: false, note: "WhatsApp not connected — set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID (Meta WhatsApp Cloud API)." };
    }
    let sent = 0, failed = 0;
    for (const lead of segment.slice(0, 300)) {
      const to = (lead.phone ?? "").replace(/[^0-9]/g, "");
      if (!to) { failed += 1; continue; }
      const msg = body.replace(/\{\{\s*name\s*\}\}/gi, lead.name.split(" ")[0] || lead.name);
      const res = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${waToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: msg } }),
      });
      if (res.ok) { sent += 1; await ctx.runMutation(api.crm.updateLead, { token, leadId: lead._id, lastContactedAt: Date.now() }); }
      else failed += 1;
    }
    return { sent, failed, skipped: Math.max(0, segment.length - 300), configured: true };
  },
});

// Bulk-move records between Lead and Client (e.g. reclassify an imported
// spreadsheet of existing customers). Pass explicit ids, or set all=true to
// convert every record currently of the opposite type.
// Delete one or more records (e.g. remove duplicates or test entries).
export const removeLeads = mutation({
  args: { token: v.string(), leadIds: v.array(v.id("leads")) },
  handler: async (ctx, { token, leadIds }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "view_reports");
    let removed = 0;
    for (const id of leadIds) {
      const row = await ctx.db.get(id);
      if (row) { await ctx.db.delete(id); removed += 1; }
    }
    return { removed };
  },
});

export const setRecordTypeBulk = mutation({
  args: {
    token: v.string(),
    recordType: recordTypeValidator,
    leadIds: v.optional(v.array(v.id("leads"))),
    all: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, recordType, leadIds, all }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "view_reports");
    const now = Date.now();
    let updated = 0;
    if (all) {
      const rows = await ctx.db.query("leads").collect();
      for (const r of rows) {
        if ((r.recordType ?? "lead") !== recordType) {
          await ctx.db.patch(r._id, { recordType, updatedAt: now });
          updated += 1;
        }
      }
    } else {
      for (const id of leadIds ?? []) {
        await ctx.db.patch(id, { recordType, updatedAt: now });
        updated += 1;
      }
    }
    return { updated };
  },
});

const normEmail = (e: string | undefined) => cleanText(e)?.toLowerCase();
const normPhone = (p: string | undefined) => cleanText(p)?.replace(/[^0-9+]/g, "");
const normName = (n: string | undefined) => cleanText(n)?.toLowerCase().replace(/\s+/g, " ");

export const importLeads = mutation({
  args: {
    token: v.string(),
    leads: v.array(v.object(leadInput)),
    // Tag the whole batch as leads or existing clients (defaults per-row/lead).
    recordType: v.optional(recordTypeValidator),
    // Upsert (default): update an existing record matched by email → phone →
    // name+estate instead of creating a duplicate. false = always insert.
    upsert: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, leads, recordType, upsert }) => {
    const me = await requireUser(ctx, token);
    await requireCap(ctx, me, "view_reports");
    const now = Date.now();
    const doUpsert = upsert !== false;

    // Build lookup maps once (kept in sync as we insert this batch).
    const existing = await ctx.db.query("leads").collect();
    const byEmail = new Map<string, (typeof existing)[number]>();
    const byPhone = new Map<string, (typeof existing)[number]>();
    const byNameEstate = new Map<string, (typeof existing)[number]>();
    for (const r of existing) {
      const e = normEmail(r.email); if (e) byEmail.set(e, r);
      const p = normPhone(r.phone); if (p) byPhone.set(p, r);
      const ne = normName(r.name); if (ne) byNameEstate.set(`${ne}|${(r.propertyName ?? "").toLowerCase()}`, r);
    }

    let inserted = 0;
    let updated = 0;
    for (const row of leads.slice(0, 3000)) {
      const email = normEmail(row.email);
      const phone = normPhone(row.phone);
      const name = cleanText(row.name);
      if (!email && !phone && !name) continue;

      const match = doUpsert
        ? (email && byEmail.get(email)) ||
          (phone && byPhone.get(phone)) ||
          (name && byNameEstate.get(`${normName(name)}|${(cleanText(row.propertyName) ?? "").toLowerCase()}`)) ||
          null
        : null;

      const estate = cleanText(row.propertyName);
      const prefs = resolvePrefs(row.contactPrefs, row.consentMarketing);
      const tags = (row.tags ?? []).map((t) => t.trim()).filter(Boolean);
      const events = (row.events ?? []).filter((e) => e.kind.trim() && e.date.trim());

      if (match) {
        // Update existing client — only fill fields the import actually carries,
        // and keep the estate discoverable via tags for multi-estate buyers.
        const mergedTags = Array.from(new Set([...(match.tags ?? []), ...tags, ...(estate ? [estate] : [])]));
        await ctx.db.patch(match._id, {
          name: name ?? match.name,
          email: email ?? match.email,
          phone: cleanText(row.phone) ?? match.phone,
          propertyName: estate ?? match.propertyName,
          marketer: cleanText(row.marketer) ?? match.marketer,
          recordType: row.recordType ?? recordType ?? match.recordType ?? "lead",
          contactPrefs: match.contactPrefs ?? prefs,
          tags: mergedTags,
          events: events.length ? events : match.events,
          updatedAt: now,
        });
        updated += 1;
      } else {
        const bookingType = row.bookingType ?? "import";
        const id = await ctx.db.insert("leads", {
          name: name ?? email ?? phone ?? "Imported record",
          email,
          phone: cleanText(row.phone),
          source: cleanText(row.source) ?? "spreadsheet import",
          service: cleanText(row.service) ?? defaultService(bookingType),
          interest: cleanText(row.interest),
          propertySlug: cleanText(row.propertySlug),
          propertyName: estate,
          marketer: cleanText(row.marketer),
          budget: cleanText(row.budget),
          message: cleanText(row.message),
          bookingType,
          recordType: row.recordType ?? recordType ?? "lead",
          contactPrefs: prefs,
          preferredDate: cleanText(row.preferredDate),
          preferredTime: cleanText(row.preferredTime),
          consentMarketing: Boolean(row.consentMarketing),
          events,
          tags: estate ? Array.from(new Set([...tags, estate])) : tags,
          stage: "new",
          priority: leadPriority(bookingType),
          createdAt: now,
          updatedAt: now,
        });
        // Keep maps current so later rows in the batch upsert onto this one.
        const fresh = await ctx.db.get(id);
        if (fresh) {
          if (email) byEmail.set(email, fresh);
          if (phone) byPhone.set(phone, fresh);
          const ne = normName(name); if (ne) byNameEstate.set(`${ne}|${(estate ?? "").toLowerCase()}`, fresh);
        }
        inserted += 1;
      }
    }

    return { imported: inserted, updated };
  },
});
