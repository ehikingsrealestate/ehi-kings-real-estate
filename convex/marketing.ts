/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Headless listmonk — the "Marketing" feature of the admin panel.
// Staff manage lists/campaigns from our UI; nobody logs into listmonk.
//
// Env (Convex): LISTMONK_URL, LISTMONK_USER (API user), LISTMONK_TOKEN.

const BASE = () => (process.env.LISTMONK_URL ?? "").replace(/\/$/, "");

// Tiny base64 (avoids runtime btoa/Buffer assumptions).
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function b64(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i += 3) {
    const c1 = s.charCodeAt(i), c2 = s.charCodeAt(i + 1), c3 = s.charCodeAt(i + 2);
    out += B64[c1 >> 2] + B64[((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4)];
    out += isNaN(c2) ? "=" : B64[((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6)];
    out += isNaN(c3) ? "=" : B64[c3 & 63];
  }
  return out;
}

const authHeader = () => "Basic " + b64(`${process.env.LISTMONK_USER}:${process.env.LISTMONK_TOKEN}`);

async function lm(path: string, method = "GET", body?: unknown): Promise<any> {
  const res = await fetch(`${BASE()}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message ?? `listmonk ${method} ${path} failed (${res.status})`);
  return json;
}

const configured = () => Boolean(BASE() && process.env.LISTMONK_USER && process.env.LISTMONK_TOKEN);

async function requireStaff(ctx: any, token: string) {
  const me = await ctx.runQuery(api.auth.me, { token });
  if (!me) throw new Error("Not authenticated.");
  if (me.role === "Worker") throw new Error("Marketing is available to Agents and above.");
  return me;
}

// Is listmonk able to actually send? A fresh install ships a placeholder SMTP
// (smtp.yoursite.com) that silently fails — detect that so the UI can prompt
// for real credentials instead of "sending" into a black hole.
async function sendingReady(): Promise<{ ready: boolean; host?: string }> {
  try {
    const s = await lm("/api/settings");
    const smtp = (s?.data?.smtp ?? []) as Array<{ enabled: boolean; host: string }>;
    const live = smtp.find((x) => x.enabled && x.host && !/yoursite\.com|example\.com|localhost/i.test(x.host));
    return { ready: Boolean(live), host: live?.host };
  } catch {
    return { ready: false };
  }
}

// Configure a real SMTP server so campaigns actually deliver (e.g. Zoho:
// smtp.zoho.com:465 with an app-specific password).
export const setSmtp = action({
  args: {
    token: v.string(),
    host: v.string(),
    port: v.number(),
    username: v.string(),
    password: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, { token, host, port, username, password, fromEmail }): Promise<{ ok: boolean; error?: string }> => {
    await requireStaff(ctx, token);
    if (!configured()) return { ok: false, error: "listmonk is not connected." };
    try {
      const s = await lm("/api/settings");
      const cfg = s.data;
      cfg["app.from_email"] = fromEmail;
      cfg.smtp = [
        {
          enabled: true,
          host,
          port,
          auth_protocol: "login",
          username,
          password,
          hello_hostname: "",
          max_conns: 10,
          max_msg_retries: 2,
          idle_timeout: "15s",
          wait_timeout: "5s",
          tls_type: port === 465 ? "TLS" : "STARTTLS",
          tls_skip_verify: false,
          email_headers: [],
        },
      ];
      await lm("/api/settings", "PUT", cfg);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
});

export const overview = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireStaff(ctx, token);
    if (!configured()) return { configured: false as const };
    const sending = await sendingReady();
    const [lists, campaigns] = await Promise.all([
      lm("/api/lists?per_page=100"),
      lm("/api/campaigns?per_page=50&order=desc&order_by=created_at"),
    ]);
    return {
      configured: true as const,
      sendingReady: sending.ready,
      sendingHost: sending.host,
      lists: (lists?.data?.results ?? []).map((l: any) => ({
        id: l.id, name: l.name, type: l.type, optin: l.optin,
        subscribers: l.subscriber_count ?? l.subscriber_statuses?.confirmed ?? 0,
      })),
      campaigns: (campaigns?.data?.results ?? []).map((c: any) => ({
        id: c.id, name: c.name, subject: c.subject, status: c.status,
        sent: c.sent, toSend: c.to_send, views: c.views, clicks: c.clicks,
        createdAt: c.created_at,
      })),
    };
  },
});

// Find-or-create the default audience list and return its id.
export const ensureDefaultList = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<{ id: number; name: string }> => {
    await requireStaff(ctx, token);
    const lists = await lm("/api/lists?per_page=100");
    const existing = (lists?.data?.results ?? []).find((l: any) => l.name === "Ehi-Kings Updates");
    if (existing) return { id: existing.id, name: existing.name };
    const created = await lm("/api/lists", "POST", {
      name: "Ehi-Kings Updates", type: "private", optin: "single",
      description: "Website opt-ins and client updates",
    });
    return { id: created.data.id, name: created.data.name };
  },
});

// Push every consenting CRM lead into a listmonk list.
export const syncOptIns = action({
  args: { token: v.string(), listId: v.number() },
  handler: async (ctx, { token, listId }): Promise<{ added: number; skipped: number; total: number }> => {
    await requireStaff(ctx, token);
    const leads: any[] = await ctx.runQuery(api.crm.listLeads, { token });
    // Email-channel opt-in (contactPrefs.email), falling back to the legacy flag.
    const consenting = leads.filter((l) => (l.contactPrefs?.email ?? l.consentMarketing) && l.email);
    let added = 0, skipped = 0;
    for (const lead of consenting) {
      try {
        await lm("/api/subscribers", "POST", {
          email: lead.email, name: lead.name || lead.email,
          status: "enabled", lists: [listId], preconfirm_subscriptions: true,
        });
        added++;
      } catch {
        skipped++; // already subscribed
      }
    }
    return { added, skipped, total: consenting.length };
  },
});

export const createCampaign = action({
  args: {
    token: v.string(),
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    listId: v.number(),
    sendNow: v.optional(v.boolean()),
  },
  handler: async (ctx, { token, name, subject, body, listId, sendNow }): Promise<{ id: number; status: string; warning?: string }> => {
    await requireStaff(ctx, token);
    const created = await lm("/api/campaigns", "POST", {
      name, subject, lists: [listId], type: "regular",
      content_type: "richtext",
      body: `<div style="font-family:Arial,sans-serif;line-height:1.6">${body.replace(/\n/g, "<br/>")}</div>`,
    });
    const id = created.data.id as number;
    if (sendNow) {
      const sending = await sendingReady();
      if (!sending.ready) {
        return { id, status: created.data.status, warning: "Saved as draft — set up email sending first (Marketing → Sending settings) so it can actually deliver." };
      }
      const started = await lm(`/api/campaigns/${id}/status`, "PUT", { status: "running" });
      return { id, status: started.data.status };
    }
    return { id, status: created.data.status };
  },
});

export const sendCampaign = action({
  args: { token: v.string(), campaignId: v.number() },
  handler: async (ctx, { token, campaignId }): Promise<{ status: string; warning?: string }> => {
    await requireStaff(ctx, token);
    const sending = await sendingReady();
    if (!sending.ready) {
      throw new Error("Email sending isn't set up yet. Open Marketing → Sending settings and add your SMTP details (e.g. Zoho: smtp.zoho.com, port 465) first.");
    }
    const res = await lm(`/api/campaigns/${campaignId}/status`, "PUT", { status: "running" });
    return { status: res.data.status };
  },
});
