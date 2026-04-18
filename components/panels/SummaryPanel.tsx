"use client";

import { useMemo } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useQuote } from "@/hooks/useQuote";
import { useFundamentals } from "@/hooks/useFundamentals";
import { usePeers } from "@/hooks/usePeers";
import { useSummary } from "@/hooks/useSummary";
import { reverseDCF, forwardDCF } from "@/lib/dcf";

export function SummaryPanel() {
  const { selectedSymbol, dcfInputs, peers } = useAppState();
  const { data: quote } = useQuote(selectedSymbol);
  const { data: fundamentals } = useFundamentals(selectedSymbol);
  const { data: peerData } = usePeers(peers);
  const { summary, disclaimer, loading, error, generate } = useSummary();

  const reverseResult = useMemo(() => {
    if (!quote?.marketCap || !fundamentals?.trailingFCF) return null;
    return reverseDCF(
      quote.marketCap,
      fundamentals.trailingFCF,
      dcfInputs.discountRate,
      dcfInputs.terminalGrowthRate,
      dcfInputs.projectionYears
    );
  }, [quote?.marketCap, fundamentals?.trailingFCF, dcfInputs]);

  const effectiveGrowthRate = dcfInputs.fcfGrowthOverride ?? reverseResult?.impliedGrowthRate ?? 0.05;

  const forwardResult = useMemo(() => {
    if (
      !fundamentals?.trailingFCF ||
      !quote?.sharesOutstanding ||
      !quote?.currentPrice
    )
      return null;
    return forwardDCF(
      fundamentals.trailingFCF,
      effectiveGrowthRate,
      dcfInputs.discountRate,
      dcfInputs.terminalGrowthRate,
      dcfInputs.projectionYears,
      quote.sharesOutstanding,
      quote.currentPrice
    );
  }, [fundamentals?.trailingFCF, effectiveGrowthRate, dcfInputs, quote]);

  function handleGenerate() {
    if (!quote) return;
    generate({
      symbol: quote.symbol,
      name: quote.name,
      currentPrice: quote.currentPrice,
      marketCap: quote.marketCap,
      sector: quote.sector,
      reverseDCF: reverseResult
        ? {
            impliedGrowthRate: reverseResult.impliedGrowthRate,
            converged: reverseResult.converged,
          }
        : null,
      forwardDCF: forwardResult
        ? {
            fairValuePerShare: forwardResult.fairValuePerShare,
            marginOfSafety: forwardResult.marginOfSafety,
            verdict: forwardResult.verdict,
          }
        : null,
      peComparisons: [
        {
          symbol: quote.symbol,
          trailingPE: quote.trailingPE,
          forwardPE: quote.forwardPE,
          pegRatio: quote.pegRatio,
        },
        ...peerData.map((p) => ({
          symbol: p.symbol,
          trailingPE: p.trailingPE,
          forwardPE: p.forwardPE,
          pegRatio: p.pegRatio,
        })),
      ],
      pbComparisons: [
        {
          symbol: quote.symbol,
          priceToBook: quote.priceToBook,
          bookValue: quote.bookValue,
        },
        ...peerData.map((p) => ({
          symbol: p.symbol,
          priceToBook: p.priceToBook,
          bookValue: p.bookValue,
        })),
      ],
    });
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !quote}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </div>

      {error && (
        <div className="text-red text-xs mb-2 bg-red/10 rounded p-2">
          {error}
        </div>
      )}

      {summary && (
        <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-3">
          {summary}
        </div>
      )}

      {disclaimer && (
        <div className="text-xs text-text-secondary italic border-t border-border pt-2">
          {disclaimer}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="text-text-secondary text-xs">
          Click &quot;Generate Summary&quot; to get an AI-powered valuation analysis
        </div>
      )}
    </div>
  );
}
