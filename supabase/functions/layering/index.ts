// Silentium — layering atelier (Supabase Edge Function, Deno).
// POST { wardrobe: [{ brand, name }], lang } with the user's Supabase session token.
// Claims one of the user's 3 generations, asks the model (via OpenRouter) for layering combinations
// built only from the user's wardrobe plus one bonus combination with a Silentium fragrance,
// stores the result and returns it. Failed generations are not counted.
//
// Secrets: OPENROUTER_API_KEY (required), OPENROUTER_MODEL / OPENROUTER_FALLBACK_MODEL (optional),
//          LAYERING_IP_SALT (optional), SITE_URL (optional, OpenRouter attribution),
//          LAYERING_TEST_KEY (optional — lets the developer test prompts without signing in; unset it after)

import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { SILENTIUM } from "./silentium.ts";

// Cheap, multilingual, supports structured output. OpenRouter falls back to the second model if the first fails.
const MODEL = Deno.env.get("OPENROUTER_MODEL") || "z-ai/glm-5.3-flash";
const FALLBACK_MODEL = Deno.env.get("OPENROUTER_FALLBACK_MODEL") || "deepseek/deepseek-v4-flash";
const USER_LIMIT = 3; // successful blends per account, lifetime
const DAILY_GLOBAL = Number(Deno.env.get("LAYERING_DAILY_GLOBAL") || 300); // whole-site ceiling per day
const SITE_URL = Deno.env.get("SITE_URL") || "https://silentiumparfums.netlify.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-layering-test",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

interface Item { brand: string; name: string }

const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "combos", "silentium"],
  properties: {
    intro: { type: "string" },
    combos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "idea", "perfumes", "application", "result", "mood", "occasion", "season", "why", "intensity"],
        properties: {
          title: { type: "string" },
          idea: { type: "string" },
          perfumes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "role", "sprays", "where"],
              properties: {
                name: { type: "string" },
                role: { type: "string", enum: ["base", "middle", "top"] },
                sprays: { type: "integer" },
                where: { type: "string" },
              },
            },
          },
          application: { type: "string" },
          result: { type: "string" },
          mood: { type: "string" },
          occasion: { type: "string" },
          season: { type: "string" },
          why: { type: "string" },
          intensity: { type: "integer" },
        },
      },
    },
    silentium: {
      type: "object",
      additionalProperties: false,
      required: ["id", "title", "pairWith", "application", "result", "why"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        pairWith: { type: "string" },
        application: { type: "string" },
        result: { type: "string" },
        why: { type: "string" },
      },
    },
  },
} as const;

function systemPrompt(lang: "ru" | "en") {
  const language = lang === "ru" ? "Russian" : "English";
  return `You are the master perfumer of Silentium, an independent niche perfume house that sees fragrance as emotion and memory.
You design perfume LAYERING combinations — wearing two or three fragrances together so they become a third, new scent.

Craft rules you follow:
- Heavier, denser, longer-lasting fragrances (woods, resins, amber, musk, leather, oud, vanilla) go on first, as the base; lighter, brighter ones (citrus, aquatic, green, aldehydic, light florals) go on top.
- Spray the base first and let it settle 20–60 seconds before the next layer.
- A bridge note shared by both fragrances makes a seamless blend; contrast (fresh over smoky, sweet over bitter) makes a deliberate, striking one — say which you are doing.
- Two fragrances is the default; three only when it clearly adds something. Never more than three.
- Keep total sprays sensible (3–6). Use placement (skin vs clothes, neck vs wrists vs hair) as part of the craft.
- Be honest: if two fragrances would clash, don't pair them.

Use your own knowledge of each fragrance's notes and character. If you don't recognise a fragrance, infer cautiously from its name and brand, and prefer combinations built on fragrances you do know.

Write in ${language}, in the voice of the house: evocative, sensory, precise, never generic marketing.${lang === "ru" ? " Write natural, literary Russian — no calques from English, no anglicisms where a Russian word exists." : ""} Keep every text field to one or two sentences.

Silentium's own fragrances (for the bonus pairing only):
${JSON.stringify(SILENTIUM)}`;
}

function userPrompt(items: Item[], lang: "ru" | "en") {
  const list = items.map((i, n) => `${n + 1}. ${i.brand ? `${i.brand} — ` : ""}${i.name}`).join("\n");
  return `My wardrobe:
${list}

Give me:
1. "combos": exactly 3 layering combinations built ONLY from fragrances in my wardrobe (use their names exactly as written above in "perfumes[].name", without the brand). Each with: a poetic "title", the "idea" (bridge or contrast), "perfumes" in application order with role (base/middle/top), number of sprays and where to apply, "application" technique, "result" — how the blend smells over time, "mood", "occasion", "season", "why" it works, and "intensity" from 1 (skin scent) to 5 (loud).
2. "silentium": ONE bonus pairing — the Silentium fragrance (by its "id") that would best complete my wardrobe, which of MY fragrances to pair it with ("pairWith", exact name), how to apply it, what it gives, and why.
3. "intro": one or two sentences reading my wardrobe as a personality.
Language: ${lang === "ru" ? "Russian" : "English"}.`;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// The client's address as Cloudflare saw it (can't be spoofed: Supabase overwrites forwarding headers).
// IPv6 is reduced to its /64 — one household or server gets a whole /64, so per-address limits would be trivial to dodge.
function clientIp(req: Request) {
  const raw = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  if (!raw.includes(":")) return raw;
  return raw.split(":").slice(0, 4).join(":") + "::/64";
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseModelJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json({ error: "not_configured" }, 500);

  // Developer test mode: valid only while the LAYERING_TEST_KEY secret exists; nothing is stored or counted
  const testKey = Deno.env.get("LAYERING_TEST_KEY");
  const isTest = !!testKey && req.headers.get("x-layering-test") === testKey;

  // Who is asking
  const authHeader = req.headers.get("Authorization") ?? "";
  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = isTest ? { data: { user: null } } : await userClient.auth.getUser();
  if (!user && !isTest) return json({ error: "auth_required" }, 401);

  // What they own
  const body = await req.json().catch(() => null) as { wardrobe?: unknown; lang?: unknown } | null;
  const lang: "ru" | "en" = body?.lang === "en" ? "en" : "ru";
  const raw = Array.isArray(body?.wardrobe) ? body!.wardrobe as unknown[] : [];
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.replace(/[\r\n\t]+/g, " ").trim().slice(0, 80) : "";
    const brand = typeof o.brand === "string" ? o.brand.replace(/[\r\n\t]+/g, " ").trim().slice(0, 60) : "";
    const key = norm(`${brand} ${name}`);
    if (!name || seen.has(key)) continue;
    seen.add(key);
    items.push({ brand, name });
    if (items.length >= 30) break;
  }
  if (items.length < 2) return json({ error: "wardrobe_too_small" }, 400);

  // Claim a generation (atomic, per user and per IP)
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ip = clientIp(req);
  const ipHash = ip ? await sha256(`${ip}:${Deno.env.get("LAYERING_IP_SALT") ?? "silentium"}`) : null;
  const { data: genId, error: claimError } = isTest ? { data: null, error: null } : await admin.rpc("claim_layering_generation", {
    p_user: user!.id, p_ip_hash: ipHash, p_lang: lang, p_wardrobe: items, p_user_limit: USER_LIMIT, p_global_limit: DAILY_GLOBAL,
  });
  if (claimError) {
    const msg = claimError.message ?? "";
    if (msg.includes("limit_user")) return json({ error: "limit_reached", remaining: 0 }, 429);
    if (msg.includes("limit_ip")) return json({ error: "limit_ip" }, 429);
    if (msg.includes("limit_attempts")) return json({ error: "limit_attempts" }, 429);
    if (msg.includes("limit_global")) return json({ error: "limit_global" }, 503);
    console.error("claim failed", claimError);
    return json({ error: "server_error" }, 500);
  }

  let usedModel = MODEL;
  const fail = async (error: string, detail: string) => {
    if (!isTest) await admin.from("layering_generations").update({ status: "failed", error: detail.slice(0, 1500), model: usedModel }).eq("id", genId);
    console.error(error, detail);
    return json(isTest ? { error, detail: detail.slice(0, 1500) } : { error }, 502);
  };

  // Ask the model (one retry if the answer can't be parsed)
  type Parsed = { intro: string; combos: { perfumes: { name: string }[] }[]; silentium: { id: string; pairWith: string } };
  let result: Parsed | null = null;
  let lastProblem = "";
  for (let attempt = 0; attempt < 2 && !result; attempt++) {
    let content = "";
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": SITE_URL,
          "X-Title": "Silentium layering atelier",
        },
        body: JSON.stringify({
          models: [MODEL, FALLBACK_MODEL],
          max_tokens: 12000,
          temperature: 0.8,
          messages: [
            { role: "system", content: systemPrompt(lang) },
            { role: "user", content: userPrompt(items, lang) },
          ],
          response_format: { type: "json_schema", json_schema: { name: "layering", strict: true, schema: RESULT_SCHEMA } },
        }),
      });
      if (!r.ok) { lastProblem = `openrouter ${r.status}: ${(await r.text()).slice(0, 400)}`; continue; }
      const data = await r.json();
      usedModel = data?.model ?? usedModel;
      content = data?.choices?.[0]?.message?.content ?? "";
      const finish = data?.choices?.[0]?.finish_reason;
      try {
        result = parseModelJson(content);
      } catch {
        lastProblem = `bad json (finish=${finish}, model=${usedModel}, ${content.length} chars): …${content.slice(-300)}`;
      }
    } catch (e) {
      lastProblem = `openrouter: ${(e as Error).message}`;
    }
  }
  if (!result) return await fail("generation_failed", lastProblem);

  // Validate: combos may only use what the user owns; the bonus must be a real Silentium fragrance
  const owned = items.map((i) => norm(i.name));
  const isOwned = (n: string) => { const k = norm(n); return owned.some((o) => o === k || o.includes(k) || k.includes(o)); };
  result.combos = (result.combos ?? []).filter((c) => c.perfumes?.length >= 2 && c.perfumes.every((p) => isOwned(p.name))).slice(0, 4);
  if (!result.combos.length) return await fail("generation_failed", `no valid combos (model=${usedModel}): ${JSON.stringify(result).slice(0, 400)}`);
  if (!SILENTIUM.some((s) => s.id === result.silentium?.id)) {
    // keep the result, just drop an invalid bonus
    (result as { silentium: unknown }).silentium = null;
  }

  if (isTest) return json({ result, model: usedModel });
  await admin.from("layering_generations").update({ status: "done", result, model: usedModel }).eq("id", genId);
  const { count } = await admin.from("layering_generations").select("id", { count: "exact", head: true }).eq("user_id", user!.id).neq("status", "failed");
  return json({ id: genId, result, remaining: Math.max(0, USER_LIMIT - (count ?? USER_LIMIT)) });
});
