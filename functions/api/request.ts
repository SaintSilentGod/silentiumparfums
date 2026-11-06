// Cloudflare Pages Function: POST /api/request
import { handleFragranceRequest, type Env } from "../../server/requests";

interface Ctx { request: Request; env: Env }

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

export const onRequestPost = async ({ request, env }: Ctx) => {
  const body = await request.json().catch(() => null);
  const result = await handleFragranceRequest(body, env);
  return json(result.body, result.status);
};

export const onRequest = () => json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
