"use client";

import { useQuote } from "@/hooks/useQuote";
import { useAppState } from "@/state/AppStateContext";
import { fmt } from "@/lib/format";

export function AssetSummaryCard() {
  const { selectedSymbol } = useAppState();
  const { data, loading } = useQuote(selectedSymbol);

  if (!selectedSymbol) return null;

  if (loading) {
    return (
      <div className="p-3 bg-bg-card rounded border border-border animate-pulse">
        <div className="h-4 bg-border rounded w-3/4 mb-2" />
        <div className="h-6 bg-border rounded w-1/2 mb-2" />
        <div className="h-3 bg-border rounded w-full" />
      </div>
    );
  }

  if (!data) return null;

  const change =
    data.currentPrice != null && data.previousClose != null
      ? data.currentPrice - data.previousClose
      : null;
  const changePct =
    change != null && data.previousClose
      ? change / data.previousClose
      : null;
  const isUp = change != null && change >= 0;

  return (
    <div className="p-3 bg-bg-card rounded border border-border">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-semibold text-sm">{data.name}</span>
        <span className="text-xs text-text-secondary">{data.symbol}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-bold">
          {fmt(data.currentPrice, { currency: true })}
        </span>
        {change != null && (
          <span className={`text-sm font-medium ${isUp ? "text-green" : "text-red"}`}>
            {isUp ? "+" : ""}
            {fmt(change, { decimals: 2 })} ({fmt(changePct, { pct: true })})
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-secondary">
        <div>
          <span className="opacity-60">Sector</span>{" "}
          <span className="text-text-primary">{data.sector || "--"}</span>
        </div>
        <div>
          <span className="opacity-60">Mkt Cap</span>{" "}
          <span className="text-text-primary">{fmt(data.marketCap, { compact: true })}</span>
        </div>
        <div>
          <span className="opacity-60">52w High</span>{" "}
          <span className="text-text-primary">{fmt(data.fiftyTwoWeekHigh, { currency: true })}</span>
        </div>
        <div>
          <span className="opacity-60">52w Low</span>{" "}
          <span className="text-text-primary">{fmt(data.fiftyTwoWeekLow, { currency: true })}</span>
        </div>
      </div>
    </div>
  );
}
