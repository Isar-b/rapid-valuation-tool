"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
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
  const lastGeneratedSymbol = useRef<string | null>(null);

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

  const effectiveGrowthRate =
    dcfInputs.fcfGrowthOverride ?? reverseResult?.impliedGrowthRate ?? 0.05;

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

  const handleGenerate = useCallback(() => {
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
  }, [quote, fundamentals, reverseResult, forwardResult, peerData, generate]);

  // Auto-generate when asset changes and all data is loaded
  useEffect(() => {
    if (!selectedSymbol) return;
    if (!quote || !fundamentals) return;
    if (lastGeneratedSymbol.current === selectedSymbol) return;

    lastGeneratedSymbol.current = selectedSymbol;
    handleGenerate();
  }, [selectedSymbol, quote, fundamentals, handleGenerate]);

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={handleGenerate}
          disabled={loading || !quote}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
        >
          {loading
            ? "Generating..."
            : summary
              ? "Regenerate"
              : "Generate Summary"}
        </button>
      </div>

      {error && (
        <div className="text-red text-xs mb-2 bg-red/10 rounded p-2">
          {error}
        </div>
      )}

      {loading && !summary && (
        <div className="space-y-2">
          <div className="h-3 bg-bg-card rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-bg-card rounded w-full animate-pulse" />
          <div className="h-3 bg-bg-card rounded w-5/6 animate-pulse" />
          <div className="h-3 bg-bg-card rounded w-2/3 animate-pulse" />
        </div>
      )}

      {summary && (
        <div className="text-sm text-text-primary leading-relaxed mb-3">
          <FormattedSummary text={summary} />
        </div>
      )}

      {disclaimer && summary && (
        <div className="text-xs text-text-secondary italic border-t border-border pt-2">
          {disclaimer}
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="text-text-secondary text-xs">
          Select an asset to get an AI-powered valuation analysis
        </div>
      )}
    </div>
  );
}

function FormattedSummary({ text }: { text: string }) {
  // Render **bold** as section headers on their own line, regular text otherwise
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <div
              key={i}
              className="text-text-primary font-semibold text-xs uppercase tracking-wide text-accent mt-3 first:mt-0"
            >
              {part.slice(2, -2)}
            </div>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </div>
  );
}
