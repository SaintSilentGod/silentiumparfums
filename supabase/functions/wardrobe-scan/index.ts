// Silentium — read a perfume wardrobe from a photo (Supabase Edge Function, Deno).
// POST { image: "data:image/jpeg;base64,…", lang } with the user's Supabase session token.
// A vision model lists the fragrances it can see (reading labels and recognising bottle shapes);
// the client shows them as suggestions the user confirms. 10 scans per user and 20 per IP per day;
// scans don't spend layering generations. The photo itself is never stored.
//
// Secrets: OPENROUTER_API_KEY (required), OPENROUTER_VISION_MODEL / OPENROUTER_VISION_FALLBACK (optional),
//          LAYERING_IP_SALT (optional), LAYERING_TEST_KEY (optional, developer testing; unset in prod)

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

// Chosen by comparing 8 models on a real shelf photo: most accurate of the cheap ones (~$0.001, ~6 s).
// GLM 5.3 Flash spent its whole budget "thinking" on photos and timed out.
const MODEL = Deno.env.get("OPENROUTER_VISION_MODEL") || "google/gemini-3.1-flash-lite";
const FALLBACK = Deno.env.get("OPENROUTER_VISION_FALLBACK") || "google/gemini-2.5-flash";
const SITE_URL = Deno.env.get("SITE_URL") || "https://silentiumparfums.netlify.app";
const MAX_IMAGE_CHARS = 2_800_000; // ~2 MB of base64; the client sends ≤1600 px JPEGs, ~0.2–0.8 MB
const DAILY_GLOBAL = Number(Deno.env.get("SCAN_DAILY_GLOBAL") || 1000); // whole-site ceiling per day

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-layering-test, x-scan-model",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items", "unidentified"],
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
    unidentified: { type: "array", items: { type: "string" } },
  },
} as const;

const PROMPT = (lang: "ru" | "en") => `You are looking at a photo of someone's perfume collection. Identify the fragrances.

"items" — every bottle you can actually identify, front row first, then the ones behind:
- "brand": the perfume house only (e.g. "Maison Francis Kurkdjian", "Penhaligon's", "Nasomatto", "Maison Crivelli"). Never a perfumer's name, never a description, never "unknown".
- "name": the fragrance name only, exactly as the house writes it (e.g. "Baccarat Rouge 540", "Halfeti", "Black Afgano"). Add a concentration (Elixir, Parfum, Extrait, Intense) only if you can read it.
- Read every label, including small print. For Maison Margiela REPLICA bottles the fragrance name is the line after "Originally:" (e.g. "Jazz Club", "By the Fireplace", "On a Date", "From the Garden").
- Don't confuse similar houses: "Maison Crivelli" vs "Maison Margiela", "Maison Francis Kurkdjian" vs "Maison Margiela".
- Recognise iconic bottles by shape when the label is hidden (e.g. Jean Paul Gaultier's torso bottles, Paco Rabanne's ingot, Creed's tall bottles), and say only what the shape proves (a JPG torso in dark blue is a Le Male flanker — name it only if you can tell which).
- confidence: "high" — label read or unmistakable bottle; "medium" — partly read or strongly recognised; "low" — an educated guess.

"unidentified" — bottles you see but cannot name with at least a guess, each as a very short description in ${lang === "ru" ? "Russian" : "English"} (e.g. "${lang === "ru" ? "высокий чёрный флакон с золотой крышкой, за другими" : "tall black bottle with a gold cap, behind the others"}"). Never put descriptions into "items".

Skip anything that isn't a fragrance (vases, figurines, flowers, candles, creams). Never invent bottles that aren't there. Keep brand and fragrance names in their original Latin spelling.`;

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

  const testKey = Deno.env.get("LAYERING_TEST_KEY");
  const isTest = !!testKey && req.headers.get("x-layering-test") === testKey;

  const url = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: { user } } = isTest ? { data: { user: null } } : await userClient.auth.getUser();
  if (!user && !isTest) return json({ error: "auth_required" }, 401);

  if (Number(req.headers.get("content-length") ?? 0) > MAX_IMAGE_CHARS + 2000) return json({ error: "image_too_large" }, 413);
  const body = await req.json().catch(() => null) as { image?: unknown; lang?: unknown } | null;
  const lang: "ru" | "en" = body?.lang === "en" ? "en" : "ru";
  // test mode may try other models: header x-scan-model
  const models = isTest && req.headers.get("x-scan-model") ? [req.headers.get("x-scan-model")!] : [MODEL, FALLBACK];
  const image = typeof body?.image === "string" ? body.image : "";
  const header = image.match(/^data:image\/(jpeg|png|webp);base64,/);
  if (!header || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.slice(header[0].length))) return json({ error: "bad_image" }, 400);
  if (image.length > MAX_IMAGE_CHARS) return json({ error: "image_too_large" }, 413);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ip = clientIp(req);
  const ipHash = ip ? await sha256(`${ip}:${Deno.env.get("LAYERING_IP_SALT") ?? "silentium"}`) : null;
  const { data: scanId, error: claimError } = isTest ? { data: null, error: null } : await admin.rpc("claim_wardrobe_scan", { p_user: user!.id, p_ip_hash: ipHash, p_global_limit: DAILY_GLOBAL });
  if (claimError) {
    const msg = claimError.message ?? "";
    if (msg.includes("scan_limit_user")) return json({ error: "scan_limit_user" }, 429);
    if (msg.includes("scan_limit_ip")) return json({ error: "scan_limit_ip" }, 429);
    if (msg.includes("scan_limit_global")) return json({ error: "scan_limit_global" }, 503);
    console.error("claim failed", claimError);
    return json({ error: "server_error" }, 500);
  }

  let usedModel = models[0];
  let problem = "";
  let items: { brand: string; name: string; confidence: string }[] | null = null;
  let unidentified: string[] = [];
  let usage: unknown = null;
  for (let attempt = 0; attempt < 2 && !items; attempt++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": SITE_URL, "X-Title": "Silentium wardrobe scan" },
        body: JSON.stringify({
          models,
          max_tokens: 3000,
          usage: { include: true },
          temperature: 0.1,
          messages: [{ role: "user", content: [{ type: "text", text: PROMPT(lang) }, { type: "image_url", image_url: { url: image } }] }],
          response_format: { type: "json_schema", json_schema: { name: "wardrobe", strict: true, schema: SCHEMA } },
        }),
      });
      if (!r.ok) { problem = `openrouter ${r.status}: ${(await r.text()).slice(0, 400)}`; continue; }
      const data = await r.json();
      usedModel = data?.model ?? usedModel;
      usage = data?.usage ?? null;
      const content: string = data?.choices?.[0]?.message?.content ?? "";
      try {
        const parsed = parseModelJson(content);
        if (Array.isArray(parsed?.items)) {
          items = parsed.items;
          unidentified = Array.isArray(parsed.unidentified) ? parsed.unidentified.filter((x: unknown) => typeof x === "string").slice(0, 20) : [];
        }
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

  // Tidy: trim, drop empties, placeholder brands and duplicates; cap the lists
  const placeholder = /^(unknown|unidentified|n\/a|none|-|неизвест\S*)$/i;
  const seen = new Set<string>();
  const clean = items
    .map((i) => ({ brand: String(i.brand ?? "").trim().slice(0, 60), name: String(i.name ?? "").trim().slice(0, 80), confidence: ["high", "medium", "low"].includes(i.confidence) ? i.confidence : "low" }))
    .map((i) => ({ ...i, brand: placeholder.test(i.brand) ? "" : i.brand }))
    .filter((i) => i.name && !placeholder.test(i.name) && !seen.has(`${i.brand}|${i.name}`.toLowerCase()) && seen.add(`${i.brand}|${i.name}`.toLowerCase()))
    .slice(0, 40);
  const notes = unidentified.map((u) => u.trim().slice(0, 140)).filter(Boolean);

  if (!isTest) await admin.from("wardrobe_scans").update({ status: "done", items: { items: clean, unidentified: notes }, model: usedModel }).eq("id", scanId);
  return json(isTest ? { items: clean, unidentified: notes, model: usedModel, usage } : { items: clean, unidentified: notes, model: usedModel });
});
