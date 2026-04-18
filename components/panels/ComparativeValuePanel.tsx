"use client";

import { useState, useEffect, useRef } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useQuote } from "@/hooks/useQuote";
import { usePeers } from "@/hooks/usePeers";
import { PeerSearch } from "@/components/PeerSearch";
import { PeerBarChart } from "@/components/PeerBarChart";
import { SECTOR_PEERS } from "@/lib/constants";
import { fmt } from "@/lib/format";

type SortKey = "symbol" | "trailingPE" | "forwardPE" | "pegRatio";

export function ComparativeValuePanel() {
  const { selectedSymbol, peers, setPeers, removePeer } = useAppState();
  const { data: quote } = useQuote(selectedSymbol);
  const { data: peerData, loading } = usePeers(peers);
  const [sortKey, setSortKey] = useState<SortKey>("trailingPE");
  const [sortAsc, setSortAsc] = useState(true);
  const [metric, setMetric] = useState<"trailingPE" | "forwardPE" | "pegRatio">("trailingPE");
  const prevSector = useRef<string | null>(null);

  // Auto-populate peers when sector changes
  useEffect(() => {
    if (!quote?.sector || quote.sector === prevSector.current) return;
    prevSector.current = quote.sector;
    const sectorPeers = SECTOR_PEERS[quote.sector];
    if (sectorPeers) {
      const filtered = sectorPeers
        .filter((s) => s !== selectedSymbol)
        .slice(0, 4);
      setPeers(filtered);
    }
  }, [quote?.sector, selectedSymbol, setPeers]);

  // Build combined table data
  const allData = [
    ...(quote
      ? [
          {
            symbol: quote.symbol,
            name: quote.name,
            trailingPE: quote.trailingPE,
            forwardPE: quote.forwardPE,
            pegRatio: quote.pegRatio,
            isSelected: true,
          },
        ]
      : []),
    ...peerData.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      trailingPE: p.trailingPE,
      forwardPE: p.forwardPE,
      pegRatio: p.pegRatio,
      isSelected: false,
    })),
  ];

  // Sort
  const sorted = [...allData].sort((a, b) => {
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

  // Chart data
  const chartData = allData.map((d) => ({
    symbol: d.symbol,
    value: d[metric],
  }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const metricLabel =
    metric === "trailingPE"
      ? "Trailing PE"
      : metric === "forwardPE"
        ? "Forward PE"
        : "PEG";

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <div className="flex bg-bg-card rounded border border-border">
          {(["trailingPE", "forwardPE", "pegRatio"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                metric === m
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              } ${m === "trailingPE" ? "rounded-l" : m === "pegRatio" ? "rounded-r" : ""}`}
            >
              {m === "trailingPE" ? "Trail PE" : m === "forwardPE" ? "Fwd PE" : "PEG"}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      {selectedSymbol && (
        <PeerBarChart
          data={chartData}
          selectedSymbol={selectedSymbol}
          label={metricLabel}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {[
                { key: "symbol" as SortKey, label: "Symbol" },
                { key: "trailingPE" as SortKey, label: "Trail PE" },
                { key: "forwardPE" as SortKey, label: "Fwd PE" },
                { key: "pegRatio" as SortKey, label: "PEG" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`py-1.5 px-2 text-left text-text-secondary font-normal border-b border-border cursor-pointer hover:text-text-primary ${
                    key !== "symbol" ? "text-right" : ""
                  }`}
                >
                  {label} {sortKey === key && (sortAsc ? "^" : "v")}
                </th>
              ))}
              <th className="py-1.5 px-2 border-b border-border w-6" />
            </tr>
          </thead>
          <tbody>
            {loading && peerData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-secondary">
                  Loading peer data...
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row.symbol}
                  className={row.isSelected ? "bg-accent/10" : ""}
                >
                  <td className="py-1.5 px-2 border-b border-border/50">
                    <span className={`font-medium ${row.isSelected ? "text-accent" : ""}`}>
                      {row.symbol}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {fmt(row.trailingPE, { ratio: true })}
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {fmt(row.forwardPE, { ratio: true })}
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {fmt(row.pegRatio, { ratio: true })}
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {!row.isSelected && (
                      <button
                        onClick={() => removePeer(row.symbol)}
                        className="text-text-secondary hover:text-red text-xs"
                      >
                        x
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add peer */}
      <div className="mt-3">
        <PeerSearch />
      </div>
    </div>
  );
}
