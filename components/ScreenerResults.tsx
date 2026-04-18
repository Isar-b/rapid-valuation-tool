"use client";

import { useState } from "react";
import { type ScreenerResult } from "@/hooks/useScreener";
import { fmt } from "@/lib/format";

type SortKey = "symbol" | "currentPrice" | "marketCap" | "trailingPE" | "forwardPE" | "pegRatio";

interface ScreenerResultsProps {
  results: ScreenerResult[];
  total: number;
  loading: boolean;
  onSelect: (symbol: string) => void;
  onAdd: (symbol: string, name: string) => void;
}

export function ScreenerResultsTable({
  results,
  total,
  loading,
  onSelect,
  onAdd,
}: ScreenerResultsProps) {
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "symbol");
    }
  }

  const sorted = [...results].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === "string" && typeof bVal === "string")
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  if (loading) {
    return (
      <div className="py-8 text-center text-text-secondary text-xs">
        Loading screener results...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-8 text-center text-text-secondary text-xs">
        No results found. Try adjusting your filters.
      </div>
    );
  }

  const columns: { key: SortKey; label: string; align?: "right" }[] = [
    { key: "symbol", label: "Symbol" },
    { key: "currentPrice", label: "Price", align: "right" },
    { key: "marketCap", label: "Mkt Cap", align: "right" },
    { key: "trailingPE", label: "PE", align: "right" },
    { key: "forwardPE", label: "Fwd PE", align: "right" },
    { key: "pegRatio", label: "PEG", align: "right" },
  ];

  return (
    <div>
      <div className="text-xs text-text-secondary mb-1">
        {total} result{total !== 1 ? "s" : ""}
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-panel">
            <tr>
              {columns.map(({ key, label, align }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`py-1 px-1.5 font-normal text-text-secondary border-b border-border cursor-pointer hover:text-text-primary ${
                    align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {label} {sortKey === key && (sortAsc ? "^" : "v")}
                </th>
              ))}
              <th className="py-1 px-1 border-b border-border w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.symbol}
                onClick={() => onSelect(row.symbol)}
                className="hover:bg-bg-card cursor-pointer"
              >
                <td className="py-1 px-1.5 border-b border-border/50">
                  <div className="font-medium">{row.symbol}</div>
                  <div className="text-text-secondary truncate max-w-[100px]">
                    {row.name}
                  </div>
                </td>
                <td className="py-1 px-1.5 text-right border-b border-border/50">
                  {fmt(row.currentPrice, { currency: true })}
                </td>
                <td className="py-1 px-1.5 text-right border-b border-border/50">
                  {fmt(row.marketCap, { compact: true })}
                </td>
                <td className="py-1 px-1.5 text-right border-b border-border/50">
                  {fmt(row.trailingPE, { ratio: true })}
                </td>
                <td className="py-1 px-1.5 text-right border-b border-border/50">
                  {fmt(row.forwardPE, { ratio: true })}
                </td>
                <td className="py-1 px-1.5 text-right border-b border-border/50">
                  {fmt(row.pegRatio, { ratio: true })}
                </td>
                <td className="py-1 px-1 text-right border-b border-border/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(row.symbol, row.name);
                    }}
                    className="text-accent hover:text-accent-hover text-xs"
                    title="Add to my assets"
                  >
                    +
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
