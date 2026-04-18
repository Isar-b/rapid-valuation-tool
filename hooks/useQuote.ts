"use client";

import { useState, useEffect } from "react";

export interface QuoteData {
  symbol: string;
  name: string;
  currency: string;
  currentPrice: number | null;
  previousClose: number | null;
  marketCap: number | null;
  sharesOutstanding: number | null;
  sector: string | null;
  industry: string | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dividendYield: number | null;
  epsTrailing: number | null;
  epsForward: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  projectedEarningsGrowth5Y: number | null;
  projectedEarningsGrowthNextYear: number | null;
  targetMeanPrice: number | null;
  recommendationKey: string | null;
  analystCount: number | null;
}

export function useQuote(symbol: string | null) {
  const [data, setData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch quote");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return { data, loading, error };
}
