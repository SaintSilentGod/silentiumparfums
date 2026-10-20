// Silentium — read a perfume wardrobe from a photo (Supabase Edge Function, Deno).
// POST { image: "data:image/jpeg;base64,…", lang } with the user's Supabase session token.
// A vision model lists the fragrances it can see (reading labels and recognising bottle shapes);
// the client shows them as suggestions the user confirms. 10 scans per user and 20 per IP per day;
// scans don't spend layering generations. The photo itself is never stored.
//
// Secrets: OPENROUTER_API_KEY (required), OPENROUTER_VISION_MODEL / OPENROUTER_VISION_FALLBACK (optional),
//          LAYERING_IP_SALT (optional), LAYERING_TEST_KEY (optional, developer testing; unset in prod)

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const MODEL = Deno.env.get("OPENROUTER_VISION_MODEL") || "z-ai/glm-5.3-flash";
const FALLBACK = Deno.env.get("OPENROUTER_VISION_FALLBACK") || "google/gemini-2.5-flash-lite";
const SITE_URL = Deno.env.get("SITE_URL") || "https://silentiumparfums.netlify.app";
const MAX_IMAGE_CHARS = 6_000_000; // ~4.5 MB of base64; the client sends ~0.3–0.8 MB

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-layering-test",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["brand", "name", "confidence"],
        properties: {
          brand: { type: "string" },
          name: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
} as const;

const PROMPT = `You are looking at a photo of someone's perfume collection.
List every perfume bottle you can see, left to right. For each: the brand and the fragrance name, exactly as the house writes it (e.g. "Maison Francis Kurkdjian" / "Baccarat Rouge 540", "Tom Ford" / "Tobacco Vanille", "Dior" / "Sauvage Elixir").
Read the labels first; use the bottle's shape, cap and colour to identify it when the label is unreadable, and to tell flankers apart (EDT vs EDP vs Parfum/Elixir) only when you can actually see it.
confidence: "high" — label clearly read or an unmistakable bottle; "medium" — partly read or strongly recognised; "low" — a guess.
Do not invent bottles that aren't there. Skip anything that isn't a fragrance (creams, candles, deodorants). If there are no perfume bottles, return an empty list.
Keep brand and fragrance names in their original Latin spelling, never translate them.`;

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

  const testKey = Deno.env.get("LAYERING_TEST_KEY");
  const isTest = !!testKey && req.headers.get("x-layering-test") === testKey;

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user } } = isTest ? { data: { user: null } } : await userClient.auth.getUser();
  if (!user && !isTest) return json({ error: "auth_required" }, 401);

  const body = await req.json().catch(() => null) as { image?: unknown } | null;
  const image = typeof body?.image === "string" ? body.image : "";
  const header = image.match(/^data:image\/(jpeg|png|webp);base64,/);
  if (!header || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.slice(header[0].length))) return json({ error: "bad_image" }, 400);
  if (image.length > MAX_IMAGE_CHARS) return json({ error: "image_too_large" }, 413);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = ip ? await sha256(`${ip}:${Deno.env.get("LAYERING_IP_SALT") ?? "silentium"}`) : null;
  const { data: scanId, error: claimError } = isTest ? { data: null, error: null } : await admin.rpc("claim_wardrobe_scan", { p_user: user!.id, p_ip_hash: ipHash });
  if (claimError) {
    const msg = claimError.message ?? "";
    if (msg.includes("scan_limit_user")) return json({ error: "scan_limit_user" }, 429);
    if (msg.includes("scan_limit_ip")) return json({ error: "scan_limit_ip" }, 429);
    console.error("claim failed", claimError);
    return json({ error: "server_error" }, 500);
  }

  let usedModel = MODEL;
  let problem = "";
  let items: { brand: string; name: string; confidence: string }[] | null = null;
  for (let attempt = 0; attempt < 2 && !items; attempt++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": SITE_URL, "X-Title": "Silentium wardrobe scan" },
        body: JSON.stringify({
          models: [MODEL, FALLBACK],
          max_tokens: 6000,
          temperature: 0.1,
          messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: image } }] }],
          response_format: { type: "json_schema", json_schema: { name: "wardrobe", strict: true, schema: SCHEMA } },
        }),
      });
      if (!r.ok) { problem = `openrouter ${r.status}: ${(await r.text()).slice(0, 400)}`; continue; }
      const data = await r.json();
      usedModel = data?.model ?? usedModel;
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = parseModelJson(content);
        if (Array.isArray(parsed?.items)) items = parsed.items;
        else problem = `no items (model=${usedModel}): ${content.slice(0, 300)}`;
      } catch {
        problem = `bad json (finish=${data?.choices?.[0]?.finish_reason}, model=${usedModel}): …${content.slice(-300)}`;
      }
    } catch (e) {
      problem = `openrouter: ${(e as Error).message}`;
    }
  }

  if (!items) {
    if (!isTest) await admin.from("wardrobe_scans").update({ status: "failed", error: problem.slice(0, 1500), model: usedModel }).eq("id", scanId);
    console.error("scan failed", problem);
    return json(isTest ? { error: "scan_failed", detail: problem } : { error: "scan_failed" }, 502);
  }

  // Tidy: trim, drop empties and duplicates, cap the list
  const seen = new Set<string>();
  const clean = items
    .map((i) => ({ brand: String(i.brand ?? "").trim().slice(0, 60), name: String(i.name ?? "").trim().slice(0, 80), confidence: ["high", "medium", "low"].includes(i.confidence) ? i.confidence : "low" }))
    .filter((i) => i.name && !seen.has(`${i.brand}|${i.name}`.toLowerCase()) && seen.add(`${i.brand}|${i.name}`.toLowerCase()))
    .slice(0, 40);

  if (!isTest) await admin.from("wardrobe_scans").update({ status: "done", items: clean, model: usedModel }).eq("id", scanId);
  return json({ items: clean, model: usedModel });
});
