import { NextRequest, NextResponse } from "next/server";

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "AAPL";
  const period = req.nextUrl.searchParams.get("period") || "1M";
  const config = RANGE_MAP[period] || RANGE_MAP["1M"];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ prices: [] }, { status: 200 });
    }

    const json = await res.json();
    const closes: (number | null)[] =
      json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const prices = closes.filter((v): v is number => v != null);

    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: [] }, { status: 200 });
  }
}
