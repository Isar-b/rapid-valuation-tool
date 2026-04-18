"use client";

import { useState, useEffect, useCallback } from "react";

export interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  analystRating: string | null;
}

export interface ScreenerFilters {
  sector: string;
  peMin: string;
  peMax: string;
  fwdPeMin: string;
  fwdPeMax: string;
  mcapBand: string;
}

export const EMPTY_FILTERS: ScreenerFilters = {
  sector: "",
  peMin: "",
  peMax: "",
  fwdPeMin: "",
  fwdPeMax: "",
  mcapBand: "",
};

export function useScreener(filters: ScreenerFilters) {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.sector) params.set("sector", filters.sector);
    if (filters.peMin) params.set("peMin", filters.peMin);
    if (filters.peMax) params.set("peMax", filters.peMax);
    if (filters.fwdPeMin) params.set("fwdPeMin", filters.fwdPeMin);
    if (filters.fwdPeMax) params.set("fwdPeMax", filters.fwdPeMax);
    if (filters.mcapBand) params.set("mcapBand", filters.mcapBand);

    try {
      const res = await fetch(`/api/screener?${params}`);
      const json = await res.json();
      setResults(json.results || []);
      setTotal(json.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { results, total, loading };
}
