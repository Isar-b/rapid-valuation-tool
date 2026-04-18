"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import { fmt } from "@/lib/format";
import type { QuoteData } from "@/hooks/useQuote";
import type { FundamentalsData } from "@/hooks/useFundamentals";
import type { PeerData } from "@/hooks/usePeers";
import type { ForwardDCFResult, ReverseDCFResult } from "@/lib/dcf";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteData | null;
  fundamentals: FundamentalsData | null;
  reverseResult: ReverseDCFResult | null;
  forwardResult: ForwardDCFResult | null;
  peerData: PeerData[];
  summary: string | null;
}

const SECTIONS = [
  { id: "asset", label: "Asset Summary" },
  { id: "dcf", label: "Intrinsic Value (DCF / Reverse DCF)" },
  { id: "pe", label: "PE Comparators" },
  { id: "pb", label: "Asset Value (P/B & NAV)" },
  { id: "summary", label: "AI Summary" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function ExportDialog({
  isOpen,
  onClose,
  quote,
  fundamentals,
  reverseResult,
  forwardResult,
  peerData,
  summary,
}: ExportDialogProps) {
  const [selected, setSelected] = useState<Set<SectionId>>(
    new Set(SECTIONS.map((s) => s.id))
  );

  const toggle = (id: SectionId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canExport = selected.size > 0 && quote != null;

  const generatePDF = useCallback(() => {
    if (!quote) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;
    const lineHeight = 6;

    function addLine(text: string, fontSize = 10, bold = false) {
      if (y > 270) {
        addFooter();
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
    }

    function addFooter() {
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128);
      doc.text(
        "This is not financial advice. Generated from public data and model assumptions.",
        margin,
        285
      );
      doc.setTextColor(0);
    }

    function addSpacer(height = 4) {
      y += height;
    }

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${quote.name} (${quote.symbol})`, margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Price: ${fmt(quote.currentPrice, { currency: true })} | Date: ${new Date().toLocaleDateString()}`,
      margin,
      y
    );
    y += 10;

    // Asset Summary
    if (selected.has("asset")) {
      addLine("ASSET SUMMARY", 12, true);
      addSpacer(2);
      addLine(`Sector: ${quote.sector || "--"}`);
      addLine(`Market Cap: ${fmt(quote.marketCap, { compact: true })}`);
      addLine(`52-Week Range: ${fmt(quote.fiftyTwoWeekLow, { currency: true })} - ${fmt(quote.fiftyTwoWeekHigh, { currency: true })}`);
      addLine(`Beta: ${fmt(quote.beta)}`);
      addLine(`Trailing PE: ${fmt(quote.trailingPE, { ratio: true })}  |  Forward PE: ${fmt(quote.forwardPE, { ratio: true })}  |  PEG: ${fmt(quote.pegRatio, { ratio: true })}`);
      addLine(`Dividend Yield: ${fmt(quote.dividendYield, { pct: true })}`);
      addSpacer(6);
    }

    // DCF
    if (selected.has("dcf")) {
      addLine("INTRINSIC VALUE", 12, true);
      addSpacer(2);
      if (reverseResult?.converged) {
        addLine(`Implied FCF Growth Rate (Reverse DCF): ${fmt(reverseResult.impliedGrowthRate, { pct: true })}`);
      }
      if (forwardResult) {
        addLine(`Fair Value per Share: ${fmt(forwardResult.fairValuePerShare, { currency: true })}`);
        addLine(`Margin of Safety: ${fmt(forwardResult.marginOfSafety, { pct: true })}`);
        addLine(`Verdict: ${forwardResult.verdict}`);
      }
      if (fundamentals) {
        addLine(`Trailing FCF: ${fmt(fundamentals.trailingFCF, { compact: true })}`);
        addLine(`Trailing Revenue: ${fmt(fundamentals.trailingRevenue, { compact: true })}`);
      }
      addSpacer(6);
    }

    // PE Comparators
    if (selected.has("pe")) {
      addLine("PE COMPARATORS", 12, true);
      addSpacer(2);
      addLine(`${"Symbol".padEnd(10)} ${"Trail PE".padStart(10)} ${"Fwd PE".padStart(10)} ${"PEG".padStart(8)}`, 9, true);
      addLine(
        `${quote.symbol.padEnd(10)} ${(fmt(quote.trailingPE, { ratio: true })).padStart(10)} ${(fmt(quote.forwardPE, { ratio: true })).padStart(10)} ${(fmt(quote.pegRatio, { ratio: true })).padStart(8)}`,
        9
      );
      for (const p of peerData) {
        addLine(
          `${p.symbol.padEnd(10)} ${(fmt(p.trailingPE, { ratio: true })).padStart(10)} ${(fmt(p.forwardPE, { ratio: true })).padStart(10)} ${(fmt(p.pegRatio, { ratio: true })).padStart(8)}`,
          9
        );
      }
      addSpacer(6);
    }

    // P/B
    if (selected.has("pb")) {
      addLine("ASSET VALUE (P/B)", 12, true);
      addSpacer(2);
      addLine(`${"Symbol".padEnd(10)} ${"P/B".padStart(8)} ${"Book Value".padStart(12)}`, 9, true);
      addLine(
        `${quote.symbol.padEnd(10)} ${(fmt(quote.priceToBook, { ratio: true })).padStart(8)} ${(fmt(quote.bookValue, { currency: true })).padStart(12)}`,
        9
      );
      for (const p of peerData) {
        addLine(
          `${p.symbol.padEnd(10)} ${(fmt(p.priceToBook, { ratio: true })).padStart(8)} ${(fmt(p.bookValue, { currency: true })).padStart(12)}`,
          9
        );
      }
      addSpacer(6);
    }

    // AI Summary
    if (selected.has("summary") && summary) {
      addLine("AI SUMMARY", 12, true);
      addSpacer(2);
      addLine(summary, 9);
      addSpacer(6);
    }

    addFooter();
    doc.save(`${quote.symbol}_valuation_${new Date().toISOString().slice(0, 10)}.pdf`);
    onClose();
  }, [quote, fundamentals, reverseResult, forwardResult, peerData, summary, selected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-panel border border-border rounded-lg p-6 w-[400px] max-w-[90vw]">
        <h3 className="text-base font-semibold mb-4">Export Report</h3>
        <div className="space-y-2 mb-4">
          {SECTIONS.map((section) => (
            <label
              key={section.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(section.id)}
                onChange={() => toggle(section.id)}
                className="accent-accent"
              />
              <span className="text-text-primary">{section.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generatePDF}
            disabled={!canExport}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
