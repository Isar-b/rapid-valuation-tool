"use client";

import { useState, useRef, useEffect } from "react";
import { useAssetSearch } from "@/hooks/useAssetSearch";

interface AssetSearchProps {
  onSelect: (symbol: string, name: string) => void;
  placeholder?: string;
}

export function AssetSearch({ onSelect, placeholder = "Search ticker or company..." }: AssetSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useAssetSearch(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-bg-card border border-border rounded text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      {open && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="px-3 py-2 text-text-secondary text-sm">Searching...</div>
          )}
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => {
                onSelect(r.symbol, r.name);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-bg-panel text-sm transition-colors"
            >
              <span className="font-medium text-text-primary">{r.symbol}</span>
              <span className="text-text-secondary ml-2">{r.name}</span>
              <span className="text-text-secondary text-xs ml-1">({r.exchange})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
