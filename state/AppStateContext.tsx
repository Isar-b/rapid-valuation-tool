"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { DEFAULT_ASSETS, DCF_DEFAULTS, type Asset } from "@/lib/constants";

export interface DCFInputs {
  discountRate: number;
  terminalGrowthRate: number;
  projectionYears: number;
  fcfGrowthOverride: number | null;
  fcfMarginOverride: number | null;
}

interface AppState {
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string) => void;
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (symbol: string) => void;
  peers: string[];
  addPeer: (symbol: string) => void;
  removePeer: (symbol: string) => void;
  setPeers: (symbols: string[]) => void;
  dcfInputs: DCFInputs;
  setDcfInputs: (inputs: Partial<DCFInputs>) => void;
  assetPanelTab: "my-assets" | "screener";
  setAssetPanelTab: (tab: "my-assets" | "screener") => void;
}

const AppStateContext = createContext<AppState | null>(null);

const STORAGE_KEY = "rvt-state";

function loadFromStorage(): {
  selectedSymbol: string | null;
  dcfInputs: DCFInputs;
} {
  if (typeof window === "undefined") {
    return {
      selectedSymbol: null,
      dcfInputs: { ...DCF_DEFAULTS, fcfGrowthOverride: null, fcfMarginOverride: null },
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedSymbol: parsed.selectedSymbol ?? null,
        dcfInputs: {
          ...DCF_DEFAULTS,
          fcfGrowthOverride: null,
          fcfMarginOverride: null,
          ...parsed.dcfInputs,
        },
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    selectedSymbol: null,
    dcfInputs: { ...DCF_DEFAULTS, fcfGrowthOverride: null, fcfMarginOverride: null },
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [selectedSymbol, setSelectedSymbolRaw] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [peers, setPeersRaw] = useState<string[]>([]);
  const [dcfInputs, setDcfInputsRaw] = useState<DCFInputs>({
    ...DCF_DEFAULTS,
    fcfGrowthOverride: null,
    fcfMarginOverride: null,
  });
  const [assetPanelTab, setAssetPanelTab] = useState<"my-assets" | "screener">(
    "my-assets"
  );

  // Load persisted state on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.selectedSymbol) setSelectedSymbolRaw(stored.selectedSymbol);
    setDcfInputsRaw(stored.dcfInputs);
    setInitialized(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedSymbol, dcfInputs })
      );
    } catch {
      // ignore quota errors
    }
  }, [selectedSymbol, dcfInputs, initialized]);

  const setSelectedSymbol = useCallback((symbol: string) => {
    setSelectedSymbolRaw(symbol);
    // Reset DCF overrides when changing asset
    setDcfInputsRaw((prev) => ({
      ...prev,
      fcfGrowthOverride: null,
      fcfMarginOverride: null,
    }));
  }, []);

  const addAsset = useCallback((asset: Asset) => {
    setAssets((prev) => {
      if (prev.some((a) => a.symbol === asset.symbol)) return prev;
      return [...prev, asset];
    });
  }, []);

  const removeAsset = useCallback((symbol: string) => {
    setAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const addPeer = useCallback((symbol: string) => {
    setPeersRaw((prev) => {
      if (prev.includes(symbol)) return prev;
      return [...prev, symbol];
    });
  }, []);

  const removePeer = useCallback((symbol: string) => {
    setPeersRaw((prev) => prev.filter((s) => s !== symbol));
  }, []);

  const setPeers = useCallback((symbols: string[]) => {
    setPeersRaw(symbols);
  }, []);

  const setDcfInputs = useCallback((inputs: Partial<DCFInputs>) => {
    setDcfInputsRaw((prev) => ({ ...prev, ...inputs }));
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        selectedSymbol,
        setSelectedSymbol,
        assets,
        addAsset,
        removeAsset,
        peers,
        addPeer,
        removePeer,
        setPeers,
        dcfInputs,
        setDcfInputs,
        assetPanelTab,
        setAssetPanelTab,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
