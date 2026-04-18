"use client";

import { useState, useMemo } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useQuote } from "@/hooks/useQuote";
import { useFundamentals } from "@/hooks/useFundamentals";
import { usePeers } from "@/hooks/usePeers";
import { reverseDCF, forwardDCF } from "@/lib/dcf";
import { AssetPanel } from "@/components/panels/AssetPanel";
import { IntrinsicValuePanel } from "@/components/panels/IntrinsicValuePanel";
import { ComparativeValuePanel } from "@/components/panels/ComparativeValuePanel";
import { AssetValuePanel } from "@/components/panels/AssetValuePanel";
import { SummaryPanel } from "@/components/panels/SummaryPanel";
import { ExportDialog } from "@/components/ExportDialog";

export function ValuationApp() {
  const { selectedSymbol, dcfInputs, peers } = useAppState();
  const { data: quote } = useQuote(selectedSymbol);
  const { data: fundamentals } = useFundamentals(selectedSymbol);
  const { data: peerData } = usePeers(peers);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiSummary] = useState<string | null>(null);

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
    if (!fundamentals?.trailingFCF || !quote?.sharesOutstanding || !quote?.currentPrice)
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

  return (
    <div className="h-screen flex">
      {/* Left sidebar - Asset Panel */}
      <div className="w-[280px] min-w-[280px] border-r border-border bg-bg-panel flex flex-col">
        <AssetPanel />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSymbol ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-end px-4 py-2 border-b border-border bg-bg-panel">
              <button
                onClick={() => setExportOpen(true)}
                className="px-3 py-1.5 bg-bg-card hover:bg-border text-text-primary text-xs font-medium rounded border border-border transition-colors"
              >
                Export
              </button>
            </div>

            {/* Top row - Intrinsic Value */}
            <div className="flex-1 min-h-0 border-b border-border overflow-auto p-4">
              <IntrinsicValuePanel />
            </div>

            {/* Bottom row - Comparators side by side */}
            <div className="flex-1 min-h-0 flex border-b border-border">
              <div className="flex-[3] border-r border-border overflow-auto p-4">
                <ComparativeValuePanel />
              </div>
              <div className="flex-[2] overflow-auto p-4">
                <AssetValuePanel />
              </div>
            </div>

            {/* Bottom - Summary */}
            <div className="h-[200px] min-h-[200px] overflow-auto p-4 bg-bg-panel">
              <SummaryPanel />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <div className="text-center">
              <p className="text-lg mb-2">Select an asset to begin</p>
              <p className="text-sm">
                Choose a stock from the asset panel or search for one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Export dialog */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        quote={quote}
        fundamentals={fundamentals}
        reverseResult={reverseResult}
        forwardResult={forwardResult}
        peerData={peerData}
        summary={aiSummary}
      />
    </div>
  );
}
