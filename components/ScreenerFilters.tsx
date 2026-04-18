"use client";

import { type ScreenerFilters as Filters, EMPTY_FILTERS } from "@/hooks/useScreener";

const SECTORS = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Energy",
  "Industrials",
  "Communication Services",
  "Basic Materials",
  "Real Estate",
  "Utilities",
];

const MCAP_BANDS = ["Micro", "Small", "Mid", "Large", "Mega"];

interface ScreenerFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function ScreenerFiltersPanel({ filters, onChange }: ScreenerFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-text-secondary block mb-0.5">Sector</label>
          <select
            value={filters.sector}
            onChange={(e) => update("sector", e.target.value)}
            className="w-full px-2 py-1 bg-bg-card border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-text-secondary block mb-0.5">Market Cap</label>
          <select
            value={filters.mcapBand}
            onChange={(e) => update("mcapBand", e.target.value)}
            className="w-full px-2 py-1 bg-bg-card border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All</option>
            {MCAP_BANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <RangeInput
          label="Trailing PE"
          minVal={filters.peMin}
          maxVal={filters.peMax}
          onMinChange={(v) => update("peMin", v)}
          onMaxChange={(v) => update("peMax", v)}
        />
        <RangeInput
          label="Forward PE"
          minVal={filters.fwdPeMin}
          maxVal={filters.fwdPeMax}
          onMinChange={(v) => update("fwdPeMin", v)}
          onMaxChange={(v) => update("fwdPeMax", v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <RangeInput
          label="PEG Ratio"
          minVal={filters.pegMin}
          maxVal={filters.pegMax}
          onMinChange={(v) => update("pegMin", v)}
          onMaxChange={(v) => update("pegMax", v)}
        />
        <div />
      </div>
      {hasActiveFilters && (
        <button
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-xs text-accent hover:text-accent-hover"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

function RangeInput({
  label,
  minVal,
  maxVal,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  minVal: string;
  maxVal: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary block mb-0.5">{label}</label>
      <div className="flex gap-1">
        <input
          type="number"
          placeholder="Min"
          value={minVal}
          onChange={(e) => onMinChange(e.target.value)}
          className="w-full px-2 py-1 bg-bg-card border border-border rounded text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
        />
        <input
          type="number"
          placeholder="Max"
          value={maxVal}
          onChange={(e) => onMaxChange(e.target.value)}
          className="w-full px-2 py-1 bg-bg-card border border-border rounded text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
