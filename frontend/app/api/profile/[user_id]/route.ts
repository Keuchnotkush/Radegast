import { NextRequest } from "next/server";

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params;
  const res = await fetch(`${AI_API_URL}/api/profile/${user_id}`);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
