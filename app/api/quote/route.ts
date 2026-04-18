import { NextRequest } from "next/server";
import yf, { getCached, setCache } from "@/lib/yahoo";
import { CACHE_TTL_QUOTE } from "@/lib/constants";

type AnyRecord = Record<string, unknown>;

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 });
  }

  const cacheKey = `quote:${symbol}`;
  const cached = getCached<AnyRecord>(cacheKey, CACHE_TTL_QUOTE);
  if (cached) return Response.json(cached);

  try {
    const result = await yf.quoteSummary(symbol, {
      modules: [
        "price",
        "summaryDetail",
        "summaryProfile",
        "defaultKeyStatistics",
        "financialData",
        "recommendationTrend",
        "earningsTrend",
      ],
    });

    const price = (result.price || {}) as AnyRecord;
    const summary = (result.summaryDetail || {}) as AnyRecord;
    const profile = (result.summaryProfile || {}) as AnyRecord;
    const keyStats = (result.defaultKeyStatistics || {}) as AnyRecord;
    const financial = (result.financialData || {}) as AnyRecord;
    const recTrend = (
      ((result.recommendationTrend as AnyRecord)?.trend as AnyRecord[]) || []
    )[0] as AnyRecord | undefined;

    // Extract analyst-projected 5-year earnings growth from earningsTrend
    const earningsTrendArr = ((result.earningsTrend as AnyRecord)?.trend as AnyRecord[]) || [];
    const fiveYearEstimate = earningsTrendArr.find(
      (t) => t.period === "+5y"
    ) as AnyRecord | undefined;
    const nextYearEstimate = earningsTrendArr.find(
      (t) => t.period === "+1y"
    ) as AnyRecord | undefined;
    const projectedEarningsGrowth5Y =
      ((fiveYearEstimate?.growth as AnyRecord)?.raw as number) ??
      (fiveYearEstimate?.growth as number) ??
      null;
    const projectedEarningsGrowthNextYear =
      ((nextYearEstimate?.growth as AnyRecord)?.raw as number) ??
      (nextYearEstimate?.growth as number) ??
      null;

    const data = {
      symbol,
      name:
        (price.shortName as string) ||
        (price.longName as string) ||
        symbol,
      currency: (price.currency as string) || "USD",
      currentPrice: (price.regularMarketPrice as number) ?? null,
      previousClose: (price.regularMarketPreviousClose as number) ?? null,
      marketCap: (price.marketCap as number) ?? null,
      sharesOutstanding: (keyStats.sharesOutstanding as number) ?? null,
      sector: (profile.sector as string) ?? null,
      industry: (profile.industry as string) ?? null,
      trailingPE: (summary.trailingPE as number) ?? null,
      forwardPE: (summary.forwardPE as number) ?? null,
      pegRatio: (keyStats.pegRatio as number) ?? null,
      priceToBook: (keyStats.priceToBook as number) ?? null,
      bookValue: (keyStats.bookValue as number) ?? null,
      beta: (keyStats.beta as number) ?? null,
      fiftyTwoWeekHigh: (summary.fiftyTwoWeekHigh as number) ?? null,
      fiftyTwoWeekLow: (summary.fiftyTwoWeekLow as number) ?? null,
      dividendYield: (summary.dividendYield as number) ?? null,
      epsTrailing: (keyStats.trailingEps as number) ?? null,
      epsForward: (keyStats.forwardEps as number) ?? null,
      revenueGrowth: (financial.revenueGrowth as number) ?? null,
      earningsGrowth: (financial.earningsGrowth as number) ?? null,
      projectedEarningsGrowth5Y,
      projectedEarningsGrowthNextYear,
      targetMeanPrice: (financial.targetMeanPrice as number) ?? null,
      recommendationKey: (financial.recommendationKey as string) ?? null,
      analystCount: recTrend
        ? ((recTrend.strongBuy as number) || 0) +
          ((recTrend.buy as number) || 0) +
          ((recTrend.hold as number) || 0) +
          ((recTrend.sell as number) || 0) +
          ((recTrend.strongSell as number) || 0)
        : null,
    };

    setCache(cacheKey, data);
    return Response.json(data);
  } catch (error) {
    console.error("Quote error:", error);
    return Response.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}
