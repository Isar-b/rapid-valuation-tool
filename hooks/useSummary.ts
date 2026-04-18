"use client";

import { useState, useCallback } from "react";

interface SummaryPayload {
  symbol: string;
  name: string;
  currentPrice: number | null;
  marketCap: number | null;
  sector: string | null;
  reverseDCF: {
    impliedGrowthRate: number | null;
    converged: boolean;
  } | null;
  forwardDCF: {
    fairValuePerShare: number | null;
    marginOfSafety: number | null;
    verdict: string | null;
  } | null;
  peComparisons: {
    symbol: string;
    trailingPE: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
  }[];
  pbComparisons: {
    symbol: string;
    priceToBook: number | null;
    bookValue: number | null;
  }[];
}

export function useSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (payload: SummaryPayload) => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.error) {
        setError(json.detail || json.error);
      } else {
        setSummary(json.summary);
      }
      setDisclaimer(json.disclaimer || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, disclaimer, loading, error, generate };
}
