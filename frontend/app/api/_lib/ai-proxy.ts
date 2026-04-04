const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

export async function proxyToAI(path: string, req: Request): Promise<Response> {
  const body = await req.text();
  const res = await fetch(`${AI_API_URL}${path}`, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: body || undefined,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
