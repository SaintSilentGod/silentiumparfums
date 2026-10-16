// Fragrance requests: validate, send to Telegram, keep a copy in Supabase.
// Platform-neutral — wrapped by api/request.ts (Vercel), netlify/functions/request.mts (Netlify),
// the Express server (server/index.ts) and the Vite dev middleware.
//
// Env (server-side only, never prefix with VITE_):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID           — where requests are delivered
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY         — optional journal (table from server/requests.sql)
//   SUPABASE_REQUESTS_TABLE                         — optional, defaults to "fragrance_requests"

export type Env = Record<string, string | undefined>;

export interface RequestPayload {
  perfume?: unknown;
  name?: unknown;
  telegram?: unknown;
  phone?: unknown;
  email?: unknown;
  lang?: unknown;
  page?: unknown;
  website?: unknown; // honeypot — real people never see this field
  elapsedMs?: unknown; // time between opening the form and sending it
}

export interface Result {
  status: number;
  body: { ok: boolean; error?: string; delivered?: string[]; detail?: string };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Dashboard values often get pasted with stray spaces or quotes ("123:ABC" ) — Telegram then rejects them
const clean = (v: string | undefined) => v?.trim().replace(/^["'`]+|["'`]+$/g, "").trim() || undefined;

export async function handleFragranceRequest(raw: unknown, rawEnv: Env): Promise<Result> {
  const env: Env = { ...rawEnv };
  for (const k of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_REQUESTS_TABLE"]) env[k] = clean(rawEnv[k]);
  const p = (raw && typeof raw === "object" ? raw : {}) as RequestPayload;

  // Bots: fill the hidden field or submit instantly. Pretend success so they don't retry.
  if (str(p.website, 200) || (typeof p.elapsedMs === "number" && p.elapsedMs < 800)) {
    console.warn("[fragrance-request] dropped as spam", { honeypot: !!str(p.website, 200), elapsedMs: p.elapsedMs });
    return { status: 200, body: { ok: true, delivered: [] } };
  }

  const data = {
    perfume: str(p.perfume, 80),
    name: str(p.name, 80),
    telegram: str(p.telegram, 64).replace(/^https?:\/\/t\.me\//i, "@"),
    phone: str(p.phone, 32),
    email: str(p.email, 120),
    lang: str(p.lang, 2) === "en" ? "en" : "ru",
    page: str(p.page, 120),
  };
  if (!data.name) return { status: 400, body: { ok: false, error: "name_required" } };
  if (!data.telegram && !data.phone && !data.email) return { status: 400, body: { ok: false, error: "contact_required" } };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { status: 400, body: { ok: false, error: "email_invalid" } };

  const delivered: string[] = [];
  const failures: string[] = [];
  let telegramDetail = ""; // Telegram's own reason ("Unauthorized", "Bad Request: chat not found") — safe to show, no secrets

  // 1) Telegram
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const tg = data.telegram ? data.telegram.replace(/^@?/, "@") : "";
    const lines = [
      `🧴 <b>Новая заявка — ${escapeHtml(data.perfume || "без аромата")}</b>`,
      " ",
      `<b>Имя:</b> ${escapeHtml(data.name)}`,
      tg && `<b>Telegram:</b> <a href="https://t.me/${encodeURIComponent(tg.slice(1))}">${escapeHtml(tg)}</a>`,
      data.phone && `<b>Телефон:</b> ${escapeHtml(data.phone)}`,
      data.email && `<b>Email:</b> ${escapeHtml(data.email)}`,
      " ",
      `<i>${data.lang.toUpperCase()} · ${escapeHtml(data.page || "/")}</i>`,
    ].filter(Boolean) as string[];
    try {
      const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join("\n"), parse_mode: "HTML", disable_web_page_preview: true }),
      });
      if (r.ok) delivered.push("telegram");
      else {
        const text = (await r.text()).slice(0, 200);
        failures.push(`telegram ${r.status}: ${text}`);
        try { telegramDetail = `telegram ${r.status}: ${JSON.parse(text).description ?? ""}`; } catch { telegramDetail = `telegram ${r.status}`; }
      }
    } catch (e) {
      failures.push(`telegram: ${(e as Error).message}`);
    }
  }

  // 2) Journal in Supabase
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const table = env.SUPABASE_REQUESTS_TABLE || "fragrance_requests";
    try {
      const r = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ ...data, telegram_delivered: delivered.includes("telegram") }),
      });
      if (r.ok) delivered.push("journal");
      else failures.push(`journal ${r.status}: ${(await r.text()).slice(0, 200)}`);
    } catch (e) {
      failures.push(`journal: ${(e as Error).message}`);
    }
  }

  if (failures.length) console.error("[fragrance-request]", failures.join(" | "));

  if (delivered.length) return { status: 200, body: { ok: true, delivered } };

  const configured = !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) || !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  // Only `vite dev` passes NODE_ENV=development. Hosted functions (Netlify doesn't set NODE_ENV at
  // runtime) must never fake a success when the keys are missing.
  if (!configured && env.NODE_ENV === "development") {
    // Local development without keys: show the request in the terminal instead
    console.log("[fragrance-request] (no TELEGRAM_* / SUPABASE_* configured)", data);
    return { status: 200, body: { ok: true, delivered: ["console"] } };
  }
  if (!configured) console.error("[fragrance-request] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not visible to this function");
  return { status: configured ? 502 : 500, body: { ok: false, error: configured ? "delivery_failed" : "not_configured", ...(telegramDetail ? { detail: telegramDetail } : {}) } };
}
