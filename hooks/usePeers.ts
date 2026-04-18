"use client";

import { useState, useEffect } from "react";

export interface PeerData {
  symbol: string;
  name: string;
  currentPrice: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  sector: string | null;
}

export function usePeers(symbols: string[]) {
  const [data, setData] = useState<PeerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (symbols.length === 0) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/peers?symbols=${symbols.join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch peers");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.peers || []);
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
  }, [symbols.join(",")]);

  return { data, loading, error };
}
