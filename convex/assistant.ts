/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api } from "./_generated/api";

// Odysseus-style AI copilot — provider-agnostic + agentic.
//
// Provider: any OpenAI-compatible Chat Completions endpoint (Gemini's OpenAI
// compat, Groq, OpenRouter, DeepSeek, Together, Cerebras, Mistral, OpenAI, or a
// local Ollama). Configure with Convex env vars:
//   AI_BASE_URL   default https://generativelanguage.googleapis.com/v1beta/openai
//   AI_API_KEY    (falls back to GEMINI_API_KEY)
//   AI_MODEL      default gemini-2.0-flash
//
// Agent: a multi-round tool loop (like Odysseus's agent_loop) where the model
// can call tools. Tools run through our RBAC'd Convex mutations, so the copilot
// can only do what the signed-in user is allowed to do.

type ProviderId = "custom" | "gemini" | "groq" | "deepseek" | "nvidia";
type Provider = { id: ProviderId; label: string; base: string; key: string; model: string };

function providers(): Provider[] {
  const customBase = process.env.AI_BASE_URL;
  const customKey = process.env.AI_API_KEY;
  const all = [
    customBase && customKey ? {
      id: "custom",
      label: "Custom OpenAI-compatible",
      base: customBase,
      key: customKey,
      model: process.env.AI_MODEL ?? "gemini-2.0-flash",
    } : undefined,
    {
      id: "gemini",
      label: "Gemini",
      base: "https://generativelanguage.googleapis.com/v1beta/openai",
      key: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? (!customBase ? customKey ?? "" : ""),
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    },
    {
      id: "groq",
      label: "Groq",
      base: "https://api.groq.com/openai/v1",
      key: process.env.GROQ_API_KEY ?? "",
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      base: "https://api.deepseek.com",
      key: process.env.DEEPSEEK_API_KEY ?? "",
      model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    },
    {
      // NVIDIA NIM — OpenAI-compatible endpoint for hosted Llama/Nemotron/etc.
      id: "nvidia",
      label: "NVIDIA NIM",
      base: "https://integrate.api.nvidia.com/v1",
      key: process.env.NVIDIA_API_KEY ?? "",
      model: process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct",
    },
  ].filter(Boolean) as Provider[];

  const configured = all.filter((p) => p.key);
  const preferred = (process.env.AI_PROVIDER ?? "").toLowerCase();
  if (!preferred) return configured;
  return [...configured.filter((p) => p.id === preferred), ...configured.filter((p) => p.id !== preferred)];
}

async function chatCompletion(payload: Record<string, unknown>, opts?: { prefer?: string; model?: string }) {
  let active = providers();
  if (!active.length) return { configured: false as const };

  // Honor a provider chosen in the model picker (still falls back to others).
  if (opts?.prefer) {
    active = [...active.filter((p) => p.id === opts.prefer), ...active.filter((p) => p.id !== opts.prefer)];
  }

  let lastError = "";
  for (const provider of active) {
    const model = opts?.model && provider.id === opts.prefer ? opts.model : provider.model;
    // Per-provider timeout so a slow/overloaded endpoint (e.g. NVIDIA's free
    // NIM tier under load) falls through to the next provider instead of
    // hanging the whole request.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 22000);
    try {
      const res = await fetch(`${provider.base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({ ...payload, model }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        lastError = `${provider.label}: ${json?.error?.message ?? res.statusText}`;
        continue;
      }
      return { configured: true as const, provider: { ...provider, model }, json };
    } catch (e) {
      lastError = ctrl.signal.aborted ? `${provider.label}: timed out` : `${provider.label}: ${clean(e)}`;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(lastError || "No configured AI provider returned a response.");
}

// Reusable one-shot completion for other backend modules (e.g. the public
// Property Matchmaker). Runs the same Gemini→Groq→DeepSeek→NVIDIA fallback
// chain; returns { text } or { text: null } if nothing is configured/answers.
export const rawCompletion = internalAction({
  args: {
    prompt: v.string(),
    system: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (_ctx, { prompt, system, temperature, maxTokens }): Promise<{ text: string | null }> => {
    try {
      const messages: { role: string; content: string }[] = [];
      if (system) messages.push({ role: "system", content: system });
      messages.push({ role: "user", content: prompt });
      const out = await chatCompletion({
        messages,
        temperature: temperature ?? 0.5,
        max_tokens: maxTokens ?? 500,
      });
      if (!out.configured) return { text: null };
      const text = out.json?.choices?.[0]?.message?.content;
      return { text: typeof text === "string" && text.trim() ? text : null };
    } catch {
      return { text: null };
    }
  },
});

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create and assign a task to a staff member. Needs the 'assign tasks' permission.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          assignee: { type: "string", description: "Staff member's name or email" },
          due: { type: "string", description: "Due date as YYYY-MM-DD or short text" },
        },
        required: ["title", "assignee"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Change the status of an existing task the user can see.",
      parameters: {
        type: "object",
        properties: {
          task: { type: "string", description: "Task title or part of it" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["task", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_estate",
      description: "Search the Ehi-Kings property portfolio by name, location, or type.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_mail",
      description: "Search or summarize the signed-in user's own Zoho mailbox. This never reads another staff member's inbox.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Sender, subject, topic, or empty string for the latest mail" },
          limit: { type: "number", description: "Number of recent messages to scan, up to 25" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_crm",
      description: "Search CRM leads visible to the signed-in staff member by name, email, phone, service, property, or stage.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Lead name, email, phone, property, service, or blank for recent open leads" },
          stage: { type: "string", enum: ["new", "contacted", "inspection_booked", "negotiation", "closed", "lost"] },
          limit: { type: "number", description: "Number of leads to return, up to 20" },
        },
      },
    },
  },
];

function clean(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).replace(/^.*Uncaught Error:\s*/, "").replace(/\s+at\s.*$/, "");
}

type AskResult = { configured: false } | { configured: true; reply?: string; error?: string; usedTools?: string[]; provider?: string };
type PublicAskResult = { configured: false } | { configured: true; reply?: string; error?: string; provider?: string };

export const providerStatus = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const me = await ctx.runQuery(api.auth.me, { token });
    if (!me) throw new Error("Not authenticated.");
    return providers().map((p) => ({
      id: p.id,
      label: p.label,
      model: p.model,
      configured: true,
    }));
  },
});

export const suggestSiteEdits = action({
  args: {
    token: v.string(),
    prompt: v.string(),
    blocks: v.array(v.object({
      key: v.string(),
      label: v.string(),
      type: v.union(v.literal("text"), v.literal("textarea"), v.literal("image"), v.literal("layout")),
      value: v.string(),
      area: v.string(),
    })),
  },
  handler: async (ctx, { token, prompt, blocks }) => {
    const me = await ctx.runQuery(api.auth.me, { token });
    if (!me || me.role !== "Admin") throw new Error("Only admins can ask the website editor to change site content.");
    const result = await chatCompletion({
        temperature: 0.25,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: [
              "You are an admin-only website content editor for Ehi-Kings Real Estate and Construction.",
              "Return ONLY valid JSON. No markdown. No commentary.",
              "Use only the block keys supplied. Do not invent new keys.",
              "Layout blocks can change section order, section visibility, featured count, and hero layout when those keys are supplied.",
              "For image blocks, return a URL or existing local asset path only if the user explicitly asks for image changes.",
              "Schema: {\"summary\":\"short summary\",\"updates\":[{\"key\":\"block key\",\"value\":\"new value\",\"reason\":\"short reason\"}]}",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({ request: prompt, editableBlocks: blocks }),
          },
        ],
    });
    if (!result.configured) return { configured: false as const };
    const json = result.json;
    if (json.error) return { configured: true as const, error: json.error.message ?? "Model error." };
    const text = json?.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(String(text).replace(/```json|```/g, "").trim());
      return { configured: true as const, provider: result.provider.label, ...parsed };
    } catch {
      return { configured: true as const, error: "The model returned an invalid edit plan. Try a simpler instruction." };
    }
  },
});

export const publicAsk = action({
  args: {
    history: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("model")),
      text: v.string(),
    })),
  },
  handler: async (ctx, { history }): Promise<PublicAskResult> => {
    if (!providers().length) return { configured: false };

    const safeHistory = history
      .slice(-10)
      .map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: String(m.text).slice(0, 900),
      }));
    const properties = await ctx.runQuery(api.properties.list, {});
    const siteBlocks = await ctx.runQuery(api.site.listBlocks, {});
    const propertyLines = properties.length
      ? properties.slice(0, 18).map((p: any) => `- ${p.name}: ${p.location}; ${p.kind}; ${p.size}; ${p.price}${p.note ? ` (${p.note})` : ""}; title ${p.title}`).join("\n")
      : "(public listings are using static defaults or are not imported yet)";
    const siteLines = siteBlocks.length
      ? siteBlocks.slice(0, 20).map((b: any) => `- ${b.label}: ${String(b.value).slice(0, 220)}`).join("\n")
      : "(website is using static default content)";

    try {
      const result = await chatCompletion({
        temperature: 0.28,
        max_tokens: 560,
        messages: [
          {
            role: "system",
            content: [
              "You are the public website assistant for Ehi-Kings Real Estate and Construction.",
              "Answer visitors using only the public company, website, and listing data below.",
              "Keep answers short, factual, and helpful. Do not invent prices, metrics, owners, testimonials, guarantees, or unavailable features.",
              "You are not an admin assistant. Do not claim to access private staff data, Zoho mail, CRM notes, internal tasks, or unpublished admin information.",
              "For bookings, inspections, negotiation, payments, legal confirmation, or construction quotes, direct the visitor to contact the Ehi-Kings team.",
              "",
              "Company:",
              "Name: Ehi-Kings Real Estate and Construction",
              "Tagline: Invest with us today, and smile tomorrow.",
              "Philosophy: Turning dreams into homes, and homes into legacies.",
              "Office: Ehi-Kings Real Estate Close, adjacent Jakande ShopRite (Triangle Mall), Lekki-Epe Expressway, Lagos.",
              "Email: info@ehikings.com",
              "Phones: +234 810 922 7485, +234 906 115 4872, +234 907 376 5081",
              "",
              `Public listings:\n${propertyLines}`,
              "",
              `Website content:\n${siteLines}`,
            ].join("\n"),
          },
          ...safeHistory,
        ],
      });

      if (!result.configured) return { configured: false };
      const msg = result.json?.choices?.[0]?.message?.content;
      return { configured: true, reply: msg ?? "I could not produce a response.", provider: result.provider.label };
    } catch (e) {
      return { configured: true, error: clean(e) };
    }
  },
});

export const ask = action({
  args: {
    token: v.string(),
    history: v.array(v.object({ role: v.union(v.literal("user"), v.literal("model")), text: v.string() })),
    portfolio: v.optional(v.string()),
    catalog: v.optional(v.array(v.object({ name: v.string(), location: v.string(), price: v.string(), kind: v.string(), size: v.string() }))),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    attachments: v.optional(v.array(v.object({ name: v.string(), mime: v.string(), dataUrl: v.optional(v.string()), text: v.optional(v.string()) }))),
  },
  handler: async (ctx, { token, history, portfolio, catalog, provider, model, attachments }): Promise<AskResult> => {
    const me = await ctx.runQuery(api.auth.me, { token });
    if (!me) throw new Error("Not authenticated.");
    if (!providers().length) return { configured: false };

    const tasks = await ctx.runQuery(api.tasks.list, { token });
    const users = await ctx.runQuery(api.users.list, { token });
    const siteBlocks = await ctx.runQuery(api.site.listBlocks, {});
    let leads: any[] = [];
    try {
      leads = await ctx.runQuery(api.crm.listLeads, { token });
    } catch {
      leads = [];
    }
    const nameById = new Map(users.map((u: any) => [u.id, u.name]));

    const taskLines =
      tasks.slice(0, 40).map((t: any) => `- ${t.title} — ${nameById.get(t.assigneeId) ?? "?"} — ${t.status} — due ${t.due}`).join("\n") ||
      "(no tasks visible to this user)";
    const teamLines = users.map((u: any) => `- ${u.name} (${u.role}, ${u.email})`).join("\n");
    const siteLines =
      siteBlocks.length > 0
        ? siteBlocks.map((b: any) => `- ${b.label} (${b.area}): ${b.value}`).join("\n")
        : "(website is using static default content)";
    const leadLines =
      leads.length > 0
        ? leads.slice(0, 30).map((l: any) => `- ${l.name} — ${l.service} — ${l.stage} — ${l.email ?? l.phone ?? "no contact"}${l.propertyName ? ` — ${l.propertyName}` : ""}`).join("\n")
        : "(no CRM leads visible to this user)";

    const system = [
      "You are the Ehi-Kings copilot — an AI assistant inside the internal admin workspace of a Nigerian real-estate & construction company.",
      `You are speaking with ${me.name} (role: ${me.role}). Today's data is below.`,
      "Be concise, professional and practical. You can ANSWER questions and TAKE ACTIONS via tools (create/assign tasks, change task status, search the portfolio, search/summarize the signed-in user's own Zoho mailbox, and search CRM leads visible to the user).",
      "When the user asks you to do something actionable, call the matching tool. If a tool reports a permission error, relay it plainly — never pretend an action succeeded.",
      "Use only the data and tool results provided. Never invent tasks, people, emails, prices, or numbers. The user only sees data they're permitted to.",
      "Mailbox rule: the search_mail tool uses this user's own Zoho OAuth token. Do not claim to read another employee's mailbox unless that employee is the signed-in user.",
      portfolio ? `\nPortfolio: ${portfolio}` : "",
      `\nTasks visible to ${me.name}:\n${taskLines}`,
      `\nTeam:\n${teamLines}`,
      `\nCRM leads visible to ${me.name}:\n${leadLines}`,
      `\nWebsite content overrides:\n${siteLines}`,
    ].join("\n");

    const messages: any[] = [{ role: "system", content: system }];
    for (const h of history) messages.push({ role: h.role === "model" ? "assistant" : "user", content: h.text });

    // Attach uploaded files to the latest user turn: images as vision parts,
    // text files inlined into the prompt (OpenAI-compatible multimodal content).
    if (attachments && attachments.length) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role !== "user") continue;
        const parts: any[] = [{ type: "text", text: String(messages[i].content ?? "") }];
        for (const a of attachments) {
          if (a.dataUrl && a.mime.startsWith("image/")) {
            parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
          } else if (a.text) {
            parts[0].text += `\n\n[Attached file: ${a.name}]\n${a.text.slice(0, 12000)}`;
          } else {
            parts[0].text += `\n\n[Attached file: ${a.name} (${a.mime})]`;
          }
        }
        messages[i].content = parts;
        break;
      }
    }

    const usedTools: string[] = [];

    const executeTool = async (name: string, args: any): Promise<string> => {
      try {
        if (name === "create_task") {
          const who = String(args.assignee ?? "").toLowerCase();
          const u = users.find((x: any) => x.email.toLowerCase() === who || x.name.toLowerCase().includes(who));
          if (!u) return `No staff member matches "${args.assignee}".`;
          await ctx.runMutation(api.tasks.create, {
            token, title: String(args.title), detail: String(args.detail ?? ""), assigneeId: u.id, due: String(args.due ?? "—"),
          });
          return `Created task "${args.title}" for ${u.name} (due ${args.due ?? "—"}).`;
        }
        if (name === "update_task_status") {
          const fresh = await ctx.runQuery(api.tasks.list, { token });
          const q = String(args.task ?? "").toLowerCase();
          const t = fresh.find((x: any) => x.title.toLowerCase().includes(q));
          if (!t) return `No task matches "${args.task}".`;
          await ctx.runMutation(api.tasks.setStatus, { token, taskId: t._id, status: args.status });
          return `Marked "${t.title}" as ${args.status}.`;
        }
        if (name === "find_estate") {
          const q = String(args.query ?? "").toLowerCase();
          const hits = (catalog ?? []).filter((e) => `${e.name} ${e.location} ${e.kind}`.toLowerCase().includes(q));
          return hits.length
            ? hits.slice(0, 6).map((e) => `${e.name} — ${e.location} — ${e.price} (${e.kind}, ${e.size})`).join("\n")
            : `No estates match "${args.query}".`;
        }
        if (name === "search_mail") {
          const limit = Math.min(25, Math.max(1, Number(args.limit ?? 15)));
          const inbox = await ctx.runAction(api.zoho.listInbox, { token, limit });
          if (!inbox.connected) return "Zoho Mail is not connected for this signed-in user.";
          if (inbox.error) return `Zoho Mail error: ${inbox.error}`;
          const q = String(args.query ?? "").toLowerCase().trim();
          const rows = (inbox.messages ?? []).filter((m: any) => {
            if (!q) return true;
            return `${m.from} ${m.subject} ${m.summary}`.toLowerCase().includes(q);
          });
          if (!rows.length) return q ? `No visible mailbox messages match "${args.query}".` : "No mailbox messages returned.";
          return rows.slice(0, limit).map((m: any) => `- From: ${m.from}\n  Subject: ${m.subject}\n  Date: ${m.receivedTime || "unknown"}\n  Preview: ${m.summary || "(no preview)"}`).join("\n");
        }
        if (name === "search_crm") {
          const limit = Math.min(20, Math.max(1, Number(args.limit ?? 12)));
          const rows = await ctx.runQuery(api.crm.listLeads, { token, stage: args.stage });
          const q = String(args.query ?? "").toLowerCase().trim();
          const filtered = (rows as any[]).filter((lead) => {
            if (!q) return lead.stage !== "closed" && lead.stage !== "lost";
            return `${lead.name} ${lead.email ?? ""} ${lead.phone ?? ""} ${lead.service} ${lead.propertyName ?? ""} ${lead.message ?? ""} ${lead.stage}`.toLowerCase().includes(q);
          });
          if (!filtered.length) return q ? `No CRM leads match "${args.query}".` : "No open CRM leads returned.";
          return filtered.slice(0, limit).map((lead) => [
            `- ${lead.name} (${lead.stage})`,
            `  Contact: ${lead.email ?? lead.phone ?? "missing"}`,
            `  Service: ${lead.service}${lead.propertyName ? ` — ${lead.propertyName}` : ""}`,
            lead.preferredDate ? `  Preferred: ${lead.preferredDate} ${lead.preferredTime ?? ""}` : "",
            lead.message ? `  Message: ${lead.message}` : "",
          ].filter(Boolean).join("\n")).join("\n");
        }
        return `Unknown tool: ${name}`;
      } catch (e) {
        return `Action failed: ${clean(e)}`;
      }
    };

    const chat = async (): Promise<{ json: any; provider: Provider }> => {
      const result = await chatCompletion({ messages, tools: TOOLS, temperature: 0.4, max_tokens: 900 }, { prefer: provider, model });
      if (!result.configured) throw new Error("No AI provider is configured.");
      return { json: result.json, provider: result.provider };
    };

    try {
      let providerLabel = "";
      for (let round = 0; round < 5; round++) {
        const { json: data, provider } = await chat();
        providerLabel = provider.label;
        const msg = data?.choices?.[0]?.message;
        if (!msg) return { configured: true, error: "Empty response from model." };

        if (msg.tool_calls && msg.tool_calls.length) {
          messages.push(msg);
          for (const tc of msg.tool_calls) {
            let parsed: any = {};
            try { parsed = JSON.parse(tc.function?.arguments ?? "{}"); } catch { /* ignore */ }
            usedTools.push(tc.function?.name);
            const result = await executeTool(tc.function?.name, parsed);
            messages.push({ role: "tool", tool_call_id: tc.id, content: result });
          }
          continue; // let the model read tool results and respond
        }

        return { configured: true, reply: msg.content ?? "", usedTools: usedTools.length ? usedTools : undefined, provider: providerLabel };
      }
      return { configured: true, reply: "I took several steps but didn't finish — try narrowing the request.", usedTools, provider: providerLabel };
    } catch (e) {
      return { configured: true, error: clean(e) };
    }
  },
});
