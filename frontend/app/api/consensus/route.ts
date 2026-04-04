import { proxyToAI } from "../_lib/ai-proxy";

export async function POST(req: Request) {
  return proxyToAI("/api/consensus", req);
}
