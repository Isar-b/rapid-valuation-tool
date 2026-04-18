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

export interface Scenario {
  name: string;
  inputs: DCFInputs;
  savedAt: number;
}

export const DEFAULT_DCF_INPUTS: DCFInputs = {
  ...DCF_DEFAULTS,
  fcfGrowthOverride: null,
  fcfMarginOverride: null,
};

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
  resetDcfInputs: () => void;
  scenarios: Record<string, Scenario[]>;
  saveScenario: (symbol: string, name: string) => void;
  loadScenario: (symbol: string, name: string) => void;
  deleteScenario: (symbol: string, name: string) => void;
  assetPanelTab: "my-assets" | "screener";
  setAssetPanelTab: (tab: "my-assets" | "screener") => void;
}

const AppStateContext = createContext<AppState | null>(null);

const STORAGE_KEY = "rvt-state";

interface PersistedState {
  selectedSymbol: string | null;
  dcfInputs: DCFInputs;
  scenarios: Record<string, Scenario[]>;
}

function loadFromStorage(): PersistedState {
  const fallback: PersistedState = {
    selectedSymbol: null,
    dcfInputs: DEFAULT_DCF_INPUTS,
    scenarios: {},
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        selectedSymbol: parsed.selectedSymbol ?? null,
        dcfInputs: { ...DEFAULT_DCF_INPUTS, ...parsed.dcfInputs },
        scenarios: parsed.scenarios ?? {},
      };
    }
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [selectedSymbol, setSelectedSymbolRaw] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [peers, setPeersRaw] = useState<string[]>([]);
  const [dcfInputs, setDcfInputsRaw] = useState<DCFInputs>(DEFAULT_DCF_INPUTS);
  const [scenarios, setScenarios] = useState<Record<string, Scenario[]>>({});
  const [assetPanelTab, setAssetPanelTab] = useState<"my-assets" | "screener">(
    "my-assets"
  );

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored.selectedSymbol) setSelectedSymbolRaw(stored.selectedSymbol);
    setDcfInputsRaw(stored.dcfInputs);
    setScenarios(stored.scenarios);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ selectedSymbol, dcfInputs, scenarios })
      );
    } catch {
      // ignore quota errors
    }
  }, [selectedSymbol, dcfInputs, scenarios, initialized]);

  const setSelectedSymbol = useCallback((symbol: string) => {
    setSelectedSymbolRaw(symbol);
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

  const resetDcfInputs = useCallback(() => {
    setDcfInputsRaw(DEFAULT_DCF_INPUTS);
  }, []);

  const saveScenario = useCallback(
    (symbol: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setScenarios((prev) => {
        const existing = prev[symbol] || [];
        const withoutDupe = existing.filter((s) => s.name !== trimmed);
        return {
          ...prev,
          [symbol]: [
            ...withoutDupe,
            { name: trimmed, inputs: dcfInputs, savedAt: Date.now() },
          ],
        };
      });
    },
    [dcfInputs]
  );

  const loadScenario = useCallback(
    (symbol: string, name: string) => {
      const list = scenarios[symbol] || [];
      const match = list.find((s) => s.name === name);
      if (match) {
        setDcfInputsRaw(match.inputs);
      }
    },
    [scenarios]
  );

  const deleteScenario = useCallback((symbol: string, name: string) => {
    setScenarios((prev) => {
      const existing = prev[symbol] || [];
      return {
        ...prev,
        [symbol]: existing.filter((s) => s.name !== name),
      };
    });
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
        resetDcfInputs,
        scenarios,
        saveScenario,
        loadScenario,
        deleteScenario,
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
