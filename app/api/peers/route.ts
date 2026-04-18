import { NextRequest } from "next/server";
import yf, { getCached, setCache } from "@/lib/yahoo";
import { CACHE_TTL_PEERS } from "@/lib/constants";

type AnyRecord = Record<string, unknown>;

export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return Response.json({ error: "symbols is required" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").filter(Boolean);
  if (symbols.length === 0) {
    return Response.json({ peers: [] });
  }

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const cacheKey = `peer:${symbol}`;
      const cached = getCached<AnyRecord>(cacheKey, CACHE_TTL_PEERS);
      if (cached) return cached;

      const result = await yf.quoteSummary(symbol, {
        modules: ["price", "defaultKeyStatistics", "summaryDetail", "summaryProfile"],
      });

      const price = (result.price || {}) as AnyRecord;
      const keyStats = (result.defaultKeyStatistics || {}) as AnyRecord;
      const summaryDetail = (result.summaryDetail || {}) as AnyRecord;
      const profile = (result.summaryProfile || {}) as AnyRecord;

      const data = {
        symbol,
        name: (price.shortName as string) || (price.longName as string) || symbol,
        currentPrice: (price.regularMarketPrice as number) ?? null,
        marketCap: (price.marketCap as number) ?? null,
        trailingPE: (summaryDetail.trailingPE as number) ?? null,
        forwardPE: (summaryDetail.forwardPE as number) ?? null,
        pegRatio: (keyStats.pegRatio as number) ?? null,
        priceToBook: (keyStats.priceToBook as number) ?? null,
        bookValue: (keyStats.bookValue as number) ?? null,
        sector: (profile.sector as string) ?? null,
      };

      setCache(cacheKey, data);
      return data;
    })
  );

  const peers = results
    .filter(
      (r): r is PromiseFulfilledResult<AnyRecord> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  return Response.json({ peers });
}
