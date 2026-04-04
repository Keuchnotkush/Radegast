const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${API_URL}/api/prices`, { next: { revalidate: 30 } });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
