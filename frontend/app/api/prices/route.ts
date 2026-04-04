const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

export async function GET() {
  const res = await fetch(`${AI_API_URL}/api/prices`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
