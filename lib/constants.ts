export const CACHE_TTL_QUOTE = 5 * 60 * 1000; // 5 minutes
export const CACHE_TTL_FUNDAMENTALS = 15 * 60 * 1000; // 15 minutes
export const CACHE_TTL_PEERS = 5 * 60 * 1000; // 5 minutes
export const CACHE_TTL_SCREENER = 15 * 60 * 1000; // 15 minutes

export const DCF_DEFAULTS = {
  discountRate: 0.09,
  terminalGrowthRate: 0.025,
  projectionYears: 10,
};

export interface Asset {
  symbol: string;
  name: string;
}

export const DEFAULT_ASSETS: Asset[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "XOM", name: "Exxon Mobil" },
];

// Sector → default peers mapping for auto-population
export const SECTOR_PEERS: Record<string, string[]> = {
  Technology: ["AAPL", "MSFT", "GOOGL", "META", "NVDA"],
  "Financial Services": ["JPM", "BAC", "GS", "MS", "WFC"],
  Healthcare: ["JNJ", "UNH", "PFE", "ABBV", "MRK"],
  "Consumer Cyclical": ["AMZN", "TSLA", "HD", "NKE", "MCD"],
  "Consumer Defensive": ["PG", "KO", "PEP", "WMT", "COST"],
  Energy: ["XOM", "CVX", "COP", "SLB", "EOG"],
  Industrials: ["CAT", "HON", "UPS", "BA", "GE"],
  "Communication Services": ["GOOGL", "META", "DIS", "NFLX", "CMCSA"],
  "Basic Materials": ["LIN", "APD", "ECL", "SHW", "NEM"],
  "Real Estate": ["PLD", "AMT", "CCI", "EQIX", "SPG"],
  Utilities: ["NEE", "DUK", "SO", "D", "AEP"],
};
