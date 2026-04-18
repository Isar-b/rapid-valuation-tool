"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AssetSearch } from "@/components/AssetSearch";
import { AssetSummaryCard } from "@/components/AssetSummaryCard";
import { ScreenerFiltersPanel } from "@/components/ScreenerFilters";
import { ScreenerResultsTable } from "@/components/ScreenerResults";
import { useScreener, EMPTY_FILTERS, type ScreenerFilters } from "@/hooks/useScreener";

export function AssetPanel() {
  const {
    assets,
    selectedSymbol,
    setSelectedSymbol,
    addAsset,
    removeAsset,
    assetPanelTab,
    setAssetPanelTab,
  } = useAppState();

  const [filters, setFilters] = useState<ScreenerFilters>(EMPTY_FILTERS);
  const { results, total, loading } = useScreener(filters);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Rapid Valuation</h1>
      </div>

      {/* Tab toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setAssetPanelTab("my-assets")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            assetPanelTab === "my-assets"
              ? "text-accent border-b-2 border-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          My Assets
        </button>
        <button
          onClick={() => setAssetPanelTab("screener")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            assetPanelTab === "screener"
              ? "text-accent border-b-2 border-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Screen
        </button>
      </div>

      {assetPanelTab === "my-assets" ? (
        <>
          {/* Search */}
          <div className="p-3">
            <AssetSearch
              onSelect={(symbol, name) => {
                addAsset({ symbol, name });
                setSelectedSymbol(symbol);
              }}
            />
          </div>

          {/* Summary card */}
          {selectedSymbol && (
            <div className="px-3 pb-3">
              <AssetSummaryCard />
            </div>
          )}

          {/* Asset list */}
          <div className="flex-1 overflow-y-auto px-2">
            {assets.map((asset) => (
              <div
                key={asset.symbol}
                className={`flex items-center group rounded mb-0.5 transition-colors ${
                  selectedSymbol === asset.symbol
                    ? "bg-accent/20"
                    : "hover:bg-bg-card"
                }`}
              >
                <button
                  onClick={() => setSelectedSymbol(asset.symbol)}
                  className={`flex-1 text-left px-3 py-2.5 text-sm ${
                    selectedSymbol === asset.symbol
                      ? "text-accent"
                      : "text-text-primary"
                  }`}
                >
                  <span className="font-medium">{asset.symbol}</span>
                  <span className="text-text-secondary ml-2 text-xs">
                    {asset.name}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAsset(asset.symbol);
                  }}
                  className="px-2 py-1 text-text-secondary opacity-0 group-hover:opacity-100 hover:text-red transition-all text-xs"
                  title="Remove"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Screener filters */}
          <div className="p-3 border-b border-border">
            <ScreenerFiltersPanel filters={filters} onChange={setFilters} />
          </div>

          {/* Screener results */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <ScreenerResultsTable
              results={results}
              total={total}
              loading={loading}
              onSelect={(symbol) => {
                setSelectedSymbol(symbol);
                setAssetPanelTab("my-assets");
              }}
              onAdd={(symbol, name) => {
                addAsset({ symbol, name });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
