// Vercel serverless function: POST /api/request
import { handleFragranceRequest } from "../server/requests";

interface VercelReq { method?: string; body?: unknown }
interface VercelRes { status: (code: number) => VercelRes; json: (body: unknown) => void; setHeader: (k: string, v: string) => void }

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const result = await handleFragranceRequest(body, process.env);
  res.status(result.status).json(result.body);
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
