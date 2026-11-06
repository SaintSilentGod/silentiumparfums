// Cloudflare Worker: static site from dist/public + POST /api/request.
// Only /api/* reaches this code (run_worker_first in wrangler.jsonc); every other path is served
// from the assets, with index.html for client-side routes.
import { handleFragranceRequest, type Env as RequestEnv } from "../server/requests";

type Env = RequestEnv & { ASSETS: { fetch: (req: Request) => Promise<Response> } };

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/request") {
      if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, { Allow: "POST" });
      const body = await request.json().catch(() => null);
      const result = await handleFragranceRequest(body, env as unknown as RequestEnv);
      return json(result.body, result.status);
    }
    if (pathname.startsWith("/api/")) return json({ ok: false, error: "not_found" }, 404);
    return env.ASSETS.fetch(request);
  },
};
