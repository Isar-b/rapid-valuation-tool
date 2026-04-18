"use client";

import { useState, useEffect } from "react";

export interface FundamentalsData {
  symbol: string;
  annualFCF: {
    date: string;
    freeCashFlow: number;
    operatingCashFlow: number | null;
    capitalExpenditure: number | null;
  }[];
  trailingFCF: number | null;
  trailingRevenue: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  stockholdersEquity: number | null;
  tangibleBookValue: number | null;
  totalDebt: number | null;
  cashAndEquivalents: number | null;
  ordinarySharesNumber: number | null;
}

export function useFundamentals(symbol: string | null) {
  const [data, setData] = useState<FundamentalsData | null>(null);
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

    fetch(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch fundamentals");
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
