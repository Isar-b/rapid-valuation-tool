import { NextRequest } from "next/server";
import yf, { getCached, setCache } from "@/lib/yahoo";
import { CACHE_TTL_SCREENER } from "@/lib/constants";

type AnyRecord = Record<string, unknown>;

// Predefined screener IDs from yahoo-finance2
const SCREENER_IDS = [
  "most_actives",
  "undervalued_large_caps",
  "growth_technology_stocks",
  "undervalued_growth_stocks",
  "aggressive_small_caps",
] as const;

export async function GET(request: NextRequest) {
  const sector = request.nextUrl.searchParams.get("sector") || null;
  const peMin = parseFloat(request.nextUrl.searchParams.get("peMin") || "") || null;
  const peMax = parseFloat(request.nextUrl.searchParams.get("peMax") || "") || null;
  const fwdPeMin = parseFloat(request.nextUrl.searchParams.get("fwdPeMin") || "") || null;
  const fwdPeMax = parseFloat(request.nextUrl.searchParams.get("fwdPeMax") || "") || null;
  const mcapBand = request.nextUrl.searchParams.get("mcapBand") || null;

  const cacheKey = "screener:universe";
  let universe = getCached<AnyRecord[]>(cacheKey, CACHE_TTL_SCREENER);

  if (!universe) {
    try {
      const results = await Promise.allSettled(
        SCREENER_IDS.map((id) =>
          yf.screener({ scrIds: id, count: 50 }, undefined, { validateResult: false })
        )
      );

      const allQuotes = new Map<string, AnyRecord>();
      for (const result of results) {
        if (result.status === "fulfilled") {
          const quotes = ((result.value as AnyRecord).quotes as AnyRecord[]) || [];
          for (const q of quotes) {
            if (q.symbol && !allQuotes.has(q.symbol as string)) {
              allQuotes.set(q.symbol as string, q);
            }
          }
        }
      }

      universe = Array.from(allQuotes.values()).map((q) => ({
        symbol: q.symbol as string,
        name: (q.shortName as string) || (q.longName as string) || (q.symbol as string),
        sector: (q.sector as string) || null,
        currentPrice: (q.regularMarketPrice as number) ?? null,
        marketCap: (q.marketCap as number) ?? null,
        trailingPE: (q.trailingPE as number) ?? null,
        forwardPE: (q.forwardPE as number) ?? null,
        pegRatio: null, // not available in Yahoo screener data
        dividendYield: (q.dividendYield as number) ?? null,
        revenueGrowth: (q.revenueGrowth as number) ?? null,
        epsGrowth: (q.earningsQuarterlyGrowth as number) ?? null,
        analystRating: (q.averageAnalystRating as string) ?? null,
      }));

      setCache(cacheKey, universe);
    } catch (error) {
      console.error("Screener error:", error);
      return Response.json({ results: [], total: 0 }, { status: 500 });
    }
  }

  let filtered = universe;

  if (sector) {
    filtered = filtered.filter(
      (s) => (s.sector as string)?.toLowerCase() === sector.toLowerCase()
    );
  }
  if (peMin != null) {
    filtered = filtered.filter(
      (s) => s.trailingPE != null && (s.trailingPE as number) >= peMin
    );
  }
  if (peMax != null) {
    filtered = filtered.filter(
      (s) => s.trailingPE != null && (s.trailingPE as number) <= peMax
    );
  }
  if (fwdPeMin != null) {
    filtered = filtered.filter(
      (s) => s.forwardPE != null && (s.forwardPE as number) >= fwdPeMin
    );
  }
  if (fwdPeMax != null) {
    filtered = filtered.filter(
      (s) => s.forwardPE != null && (s.forwardPE as number) <= fwdPeMax
    );
  }
  if (mcapBand) {
    const bands: Record<string, [number, number]> = {
      Micro: [0, 3e8],
      Small: [3e8, 2e9],
      Mid: [2e9, 1e10],
      Large: [1e10, 2e11],
      Mega: [2e11, Infinity],
    };
    const [min, max] = bands[mcapBand] || [0, Infinity];
    filtered = filtered.filter(
      (s) =>
        s.marketCap != null &&
        (s.marketCap as number) >= min &&
        (s.marketCap as number) < max
    );
  }

  return Response.json({
    results: filtered.slice(0, 50),
    total: filtered.length,
  });
}
