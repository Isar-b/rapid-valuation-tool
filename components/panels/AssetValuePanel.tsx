"use client";

import { useAppState } from "@/state/AppStateContext";
import { useQuote } from "@/hooks/useQuote";
import { usePeers } from "@/hooks/usePeers";
import { useFundamentals } from "@/hooks/useFundamentals";
import { PeerSearch } from "@/components/PeerSearch";
import { PeerDotPlot } from "@/components/PeerDotPlot";
import { fmt } from "@/lib/format";

export function AssetValuePanel() {
  const { selectedSymbol, peers, removePeer } = useAppState();
  const { data: quote } = useQuote(selectedSymbol);
  const { data: fundamentals } = useFundamentals(selectedSymbol);
  const { data: peerData, loading } = usePeers(peers);

  // Calculate NAV per share for the selected asset
  const navPerShare =
    fundamentals?.totalAssets != null &&
    fundamentals?.totalLiabilities != null &&
    fundamentals?.ordinarySharesNumber != null &&
    fundamentals.ordinarySharesNumber > 0
      ? (fundamentals.totalAssets - fundamentals.totalLiabilities) /
        fundamentals.ordinarySharesNumber
      : null;

  // Build combined table data
  const allData = [
    ...(quote
      ? [
          {
            symbol: quote.symbol,
            name: quote.name,
            priceToBook: quote.priceToBook,
            bookValue: quote.bookValue,
            navPerShare,
            isSelected: true,
          },
        ]
      : []),
    ...peerData.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      priceToBook: p.priceToBook,
      bookValue: p.bookValue,
      navPerShare: null as number | null, // would need separate fundamentals call per peer
      isSelected: false,
    })),
  ];

  // Chart data for P/B dot plot
  const chartData = allData.map((d) => ({
    symbol: d.symbol,
    value: d.priceToBook,
  }));

  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Asset Value</h2>

      {/* Dot plot */}
      {selectedSymbol && (
        <PeerDotPlot
          data={chartData}
          selectedSymbol={selectedSymbol}
          label="P/B Ratio"
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="py-1.5 px-2 text-left text-text-secondary font-normal border-b border-border">
                Symbol
              </th>
              <th className="py-1.5 px-2 text-right text-text-secondary font-normal border-b border-border">
                P/B
              </th>
              <th className="py-1.5 px-2 text-right text-text-secondary font-normal border-b border-border">
                Book Value
              </th>
              <th className="py-1.5 px-2 text-right text-text-secondary font-normal border-b border-border">
                NAV/Share
              </th>
              <th className="py-1.5 px-2 border-b border-border w-6" />
            </tr>
          </thead>
          <tbody>
            {loading && peerData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-text-secondary">
                  Loading...
                </td>
              </tr>
            ) : (
              allData.map((row) => (
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
                    {fmt(row.priceToBook, { ratio: true })}
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {fmt(row.bookValue, { currency: true })}
                  </td>
                  <td className="py-1.5 px-2 text-right border-b border-border/50">
                    {fmt(row.navPerShare, { currency: true })}
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
