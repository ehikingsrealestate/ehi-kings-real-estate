import { v } from "convex/values";
import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// AI Property Matchmaker (public, customer-facing) — a buyer describes what they
// want in plain language; we rank the live listings and explain WHY each fits.
// Rule-based scoring guarantees sensible results; an LLM adds a short, human
// "why it fits" line when a key is configured.

export const activeListings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("properties").collect();
    return rows
      .filter((p) => p.active)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        location: p.location,
        region: p.region,
        kind: p.kind,
        size: p.size,
        price: p.price,
        features: p.features ?? [],
        overview: p.overview ?? [],
        img: p.img,
      }));
  },
});

// Very rough naira parser: "₦30M", "30 million", "30,000,000" → number.
function parseBudget(text: string): number | null {
  const t = text.toLowerCase().replace(/,/g, "");
  const m = t.match(/(?:₦|n)?\s*([\d.]+)\s*(m|million|k|thousand|b|billion)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = m[2];
  if (unit === "m" || unit === "million") n *= 1_000_000;
  else if (unit === "k" || unit === "thousand") n *= 1_000;
  else if (unit === "b" || unit === "billion") n *= 1_000_000_000;
  return n > 0 ? n : null;
}

function priceToNumber(price: string): number | null {
  return parseBudget(price);
}

type Listing = {
  slug: string; name: string; location: string; region: string;
  kind: string; size: string; price: string; features: string[]; overview: string[]; img?: string;
};

function scoreListing(l: Listing, brief: string, budget: number | null): { score: number; reasons: string[] } {
  const q = brief.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  // Kind — reasons are phrased to read cleanly after "It's".
  if (/\bland\b|\bplot\b/.test(q) && l.kind === "land") { score += 30; reasons.push("the land you're after"); }
  if (/\bhome\b|\bhouse\b|apartment|duplex|bungalow/.test(q) && l.kind === "home") { score += 30; reasons.push("a built home, as you asked"); }

  // Location / region
  const hay = `${l.location} ${l.region} ${l.name}`.toLowerCase();
  for (const place of ["lekki", "epe", "ibeju", "ajah", "benin", "abuja", "lagos", "ikorodu", "sangotedo"]) {
    if (q.includes(place) && hay.includes(place)) { score += 25; reasons.push(`right in ${place[0].toUpperCase() + place.slice(1)}`); break; }
  }

  // Budget fit
  const price = priceToNumber(l.price);
  if (budget && price) {
    if (price <= budget) { score += 25; reasons.push("within your budget"); }
    else if (price <= budget * 1.15) { score += 12; reasons.push("a touch above your budget"); }
    else { score -= 10; }
  }

  // Feature keywords add score, but stay out of the human "why" to keep it clean.
  const feats = (l.features.join(" ") + " " + l.overview.join(" ")).toLowerCase();
  for (const kw of ["gated", "c of o", "waterfront", "estate", "serviced", "pool", "family", "investment", "commercial", "residential"]) {
    if (q.includes(kw) && feats.includes(kw)) score += 6;
  }

  score += 3; // baseline so everything is rankable
  return { score, reasons: [...new Set(reasons)] };
}

// Ask the LLM for a warm one-liner per property. Reuses the assistant's
// multi-provider fallback chain (Gemini→Groq→DeepSeek→NVIDIA) so a single
// provider's quota/outage doesn't disable the AI copy. Keyed by INDEX (1..n)
// so punctuation/spacing in a title can never break the match.
async function llmBlurb(
  ctx: { runAction: (ref: any, args: any) => Promise<{ text: string | null }> },
  brief: string,
  top: { name: string; reasons: string[] }[],
): Promise<Record<number, string>> {
  try {
    const prompt = `A buyer told us: "${brief}".

Write a warm, personal one-line recommendation for EACH numbered property below — the kind a friendly estate agent would say. Name the property, and connect it to something the buyer actually asked for. 12–22 words, no clichés, no "this property", vary your openings.

Reply ONLY as strict JSON mapping the number to the sentence, e.g. {"1":"Grace Court sits right in the Lekki you wanted, and it's comfortably inside your budget."}.

Properties:
${top.map((t, i) => `${i + 1}. ${t.name} — ${t.reasons.join("; ") || "a solid pick from our portfolio"}`).join("\n")}`;
    const { text } = await ctx.runAction(internal.assistant.rawCompletion, {
      prompt,
      system: "You are Ada, a warm, sharp estate agent for Ehi-Kings Real Estate in Lagos, Nigeria. You write natural, human recommendations — never robotic or templated.",
      temperature: 0.7,
      maxTokens: 600,
    });
    if (!text) return {};
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return {};
    const raw = JSON.parse(m[0]) as Record<string, string>;
    const out: Record<number, string> = {};
    for (const [k, val] of Object.entries(raw)) {
      const n = parseInt(k, 10);
      if (Number.isFinite(n) && typeof val === "string" && val.trim()) out[n] = val.trim();
    }
    return out;
  } catch {
    return {};
  }
}

// Clean, grammatical fallback when the LLM is unavailable.
function fallbackWhy(reasons: string[]): string {
  if (!reasons.length) return "A strong option from our portfolio worth a closer look.";
  if (reasons.length === 1) return `It's ${reasons[0]}.`;
  const last = reasons[reasons.length - 1];
  return `It's ${reasons.slice(0, -1).join(", ")} and ${last}.`;
}

export const suggest = action({
  args: { brief: v.string(), budget: v.optional(v.string()) },
  handler: async (ctx, { brief, budget }): Promise<{
    matches: { slug: string; name: string; location: string; price: string; kind: string; img?: string; why: string; score: number }[];
  }> => {
    const listings: Listing[] = await ctx.runQuery(internal.match.activeListings, {});
    const budgetNum = budget ? parseBudget(budget) : parseBudget(brief);
    const ranked = listings
      .map((l) => ({ l, ...scoreListing(l, brief, budgetNum) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const blurbs = await llmBlurb(ctx, brief, ranked.map((r) => ({ name: r.l.name, reasons: r.reasons })));

    return {
      matches: ranked.map((r, i) => ({
        slug: r.l.slug,
        name: r.l.name,
        location: r.l.location,
        price: r.l.price,
        kind: r.l.kind,
        img: r.l.img,
        why: blurbs[i + 1] ?? fallbackWhy(r.reasons),
        score: r.score,
      })),
    };
  },
});
