"use client";

import { AppStateProvider } from "@/state/AppStateContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
