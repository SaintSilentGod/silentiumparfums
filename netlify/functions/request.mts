// Netlify function: POST /api/request
import { handleFragranceRequest } from "../../server/requests";

export default async (req: Request) => {
  if (req.method !== "POST") return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405, headers: { Allow: "POST" } });
  const body = await req.json().catch(() => null);
  const result = await handleFragranceRequest(body, process.env);
  return Response.json(result.body, { status: result.status });
};

export const config = { path: "/api/request" };
