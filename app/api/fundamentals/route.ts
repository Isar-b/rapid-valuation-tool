import { NextRequest } from "next/server";
import yf, { getCached, setCache } from "@/lib/yahoo";
import { CACHE_TTL_FUNDAMENTALS } from "@/lib/constants";
import type { FundamentalsTimeSeriesResult } from "yahoo-finance2/modules/fundamentalsTimeSeries";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return Response.json({ error: "symbol is required" }, { status: 400 });
  }

  const cacheKey = `fundamentals:${symbol}`;
  const cached = getCached<Record<string, unknown>>(cacheKey, CACHE_TTL_FUNDAMENTALS);
  if (cached) return Response.json(cached);

  try {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const noValidate = { validateResult: false } as const;
    const [cashFlowRaw, balanceSheetRaw, trailingRaw] = await Promise.all([
      yf.fundamentalsTimeSeries(symbol, {
        period1: fiveYearsAgo,
        type: "annual",
        module: "cash-flow",
      }, noValidate),
      yf.fundamentalsTimeSeries(symbol, {
        period1: fiveYearsAgo,
        type: "annual",
        module: "balance-sheet",
      }, noValidate),
      yf.fundamentalsTimeSeries(symbol, {
        period1: twoYearsAgo,
        type: "trailing",
        module: "all",
      }, noValidate),
    ]);

    const cashFlow = cashFlowRaw as FundamentalsTimeSeriesResult[];
    const balanceSheet = balanceSheetRaw as FundamentalsTimeSeriesResult[];
    const trailing = trailingRaw as FundamentalsTimeSeriesResult[];

    // Extract annual cash flow history
    type AnyRecord = Record<string, unknown>;
    const annualFCF = cashFlow
      .filter((r) => (r as AnyRecord).freeCashFlow != null)
      .map((r) => ({
        date: r.date,
        freeCashFlow: (r as AnyRecord).freeCashFlow as number,
        operatingCashFlow: ((r as AnyRecord).operatingCashFlow as number) ?? null,
        capitalExpenditure: ((r as AnyRecord).capitalExpenditure as number) ?? null,
      }));

    // Extract balance sheet data (most recent)
    const latestBS = (balanceSheet.length > 0
      ? balanceSheet[balanceSheet.length - 1]
      : {}) as AnyRecord;

    // Extract trailing data (most recent)
    const latestTrailing = (trailing.length > 0
      ? trailing[trailing.length - 1]
      : {}) as AnyRecord;

    const data = {
      symbol,
      annualFCF,
      trailingFCF: (latestTrailing.freeCashFlow as number) ?? null,
      trailingRevenue: (latestTrailing.totalRevenue as number) ?? null,
      totalAssets: (latestBS.totalAssets as number) ?? null,
      totalLiabilities:
        (latestBS.totalLiabilitiesNetMinorityInterest as number) ?? null,
      stockholdersEquity: (latestBS.stockholdersEquity as number) ?? null,
      tangibleBookValue: (latestBS.tangibleBookValue as number) ?? null,
      totalDebt: (latestBS.totalDebt as number) ?? null,
      cashAndEquivalents:
        (latestBS.cashAndCashEquivalents as number) ?? null,
      ordinarySharesNumber:
        (latestBS.ordinarySharesNumber as number) ?? null,
    };

    setCache(cacheKey, data);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Fundamentals error:", message, error);
    return Response.json(
      { error: "Failed to fetch fundamentals", detail: message },
      { status: 500 }
    );
  }
}
