import { NextRequest } from "next/server";
import yf from "@/lib/yahoo";

type AnyRecord = Record<string, unknown>;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json({ results: [] });
  }

  try {
    const result = await yf.search(q, { quotesCount: 10, newsCount: 0 });
    const equities = ((result.quotes as AnyRecord[]) || []).filter(
      (quote) => quote.quoteType === "EQUITY"
    );
    return Response.json({
      results: equities.map((q) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname,
        exchange: q.exchange,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { results: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
