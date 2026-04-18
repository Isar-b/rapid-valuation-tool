"use client";

import { useState, useRef, useEffect } from "react";
import { useAssetSearch } from "@/hooks/useAssetSearch";
import { useAppState } from "@/state/AppStateContext";

export function PeerSearch() {
  const { addPeer, peers, selectedSymbol } = useAppState();
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

  const filtered = results.filter(
    (r) => r.symbol !== selectedSymbol && !peers.includes(r.symbol)
  );

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
        placeholder="Add peer..."
        className="w-full px-2 py-1.5 bg-bg-card border border-border rounded text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      {open && (filtered.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
          {loading && filtered.length === 0 && (
            <div className="px-2 py-1.5 text-text-secondary text-xs">
              Searching...
            </div>
          )}
          {filtered.map((r) => (
            <button
              key={r.symbol}
              onClick={() => {
                addPeer(r.symbol);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1.5 hover:bg-bg-panel text-xs transition-colors"
            >
              <span className="font-medium text-text-primary">{r.symbol}</span>
              <span className="text-text-secondary ml-1">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
