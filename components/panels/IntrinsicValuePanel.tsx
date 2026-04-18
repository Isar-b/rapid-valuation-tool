"use client";

import { useState, useMemo } from "react";
import { useAppState } from "@/state/AppStateContext";
import { useQuote } from "@/hooks/useQuote";
import { useFundamentals } from "@/hooks/useFundamentals";
import { reverseDCF, forwardDCF, sensitivityMatrix, calculateWACC } from "@/lib/dcf";
import { SensitivityTable } from "@/components/SensitivityTable";
import { fmt } from "@/lib/format";

export function IntrinsicValuePanel() {
  const { selectedSymbol, dcfInputs, setDcfInputs } = useAppState();
  const { data: quote, loading: quoteLoading } = useQuote(selectedSymbol);
  const { data: fundamentals, loading: fundLoading } = useFundamentals(selectedSymbol);
  const [mode, setMode] = useState<"reverse" | "forward">("reverse");

  const loading = quoteLoading || fundLoading;

  // Compute derived values
  const marketCap = quote?.marketCap ?? null;
  const currentPrice = quote?.currentPrice ?? null;
  const sharesOutstanding = quote?.sharesOutstanding ?? fundamentals?.ordinarySharesNumber ?? null;
  const trailingFCF = fundamentals?.trailingFCF ?? null;
  const trailingRevenue = fundamentals?.trailingRevenue ?? null;
  const fcfMargin =
    trailingFCF != null && trailingRevenue != null && trailingRevenue > 0
      ? trailingFCF / trailingRevenue
      : null;

  // Historical FCF CAGR
  const historicalGrowth = useMemo(() => {
    const fcfHistory = fundamentals?.annualFCF;
    if (!fcfHistory || fcfHistory.length < 2) return null;
    const first = fcfHistory[0].freeCashFlow;
    const last = fcfHistory[fcfHistory.length - 1].freeCashFlow;
    if (first <= 0 || last <= 0) return null;
    const years = fcfHistory.length - 1;
    return Math.pow(last / first, 1 / years) - 1;
  }, [fundamentals?.annualFCF]);

  // 3-year earnings (net income) CAGR
  const earningsGrowth3Y = useMemo(() => {
    const history = fundamentals?.annualNetIncome;
    if (!history || history.length < 2) return null;
    // Use the 4 most recent points (3 growth periods)
    const recent = history.slice(-4);
    if (recent.length < 2) return null;
    const first = recent[0].netIncome;
    const last = recent[recent.length - 1].netIncome;
    if (first <= 0 || last <= 0) return null;
    const years = recent.length - 1;
    return Math.pow(last / first, 1 / years) - 1;
  }, [fundamentals?.annualNetIncome]);

  // WACC
  const waccResult = useMemo(() => {
    if (
      quote?.marketCap == null ||
      quote?.beta == null ||
      fundamentals?.totalDebt == null
    )
      return null;
    return calculateWACC(
      quote.marketCap,
      fundamentals.totalDebt,
      quote.beta
    );
  }, [quote?.marketCap, quote?.beta, fundamentals?.totalDebt]);

  // Reverse DCF result
  const reverseResult = useMemo(() => {
    if (marketCap == null || trailingFCF == null) return null;
    return reverseDCF(
      marketCap,
      trailingFCF,
      dcfInputs.discountRate,
      dcfInputs.terminalGrowthRate,
      dcfInputs.projectionYears
    );
  }, [marketCap, trailingFCF, dcfInputs.discountRate, dcfInputs.terminalGrowthRate, dcfInputs.projectionYears]);

  // Growth rate to use in forward DCF (from reverse, override, or historical)
  const effectiveGrowthRate =
    dcfInputs.fcfGrowthOverride ??
    (reverseResult?.converged ? reverseResult.impliedGrowthRate : null) ??
    historicalGrowth ??
    0.05;

  // Forward DCF result
  const forwardResult = useMemo(() => {
    if (trailingFCF == null || sharesOutstanding == null || currentPrice == null) return null;
    return forwardDCF(
      trailingFCF,
      effectiveGrowthRate,
      dcfInputs.discountRate,
      dcfInputs.terminalGrowthRate,
      dcfInputs.projectionYears,
      sharesOutstanding,
      currentPrice
    );
  }, [trailingFCF, effectiveGrowthRate, dcfInputs, sharesOutstanding, currentPrice]);

  // Sensitivity matrix
  const matrix = useMemo(() => {
    if (trailingFCF == null || sharesOutstanding == null) return [];
    return sensitivityMatrix(
      trailingFCF,
      effectiveGrowthRate,
      dcfInputs.discountRate,
      dcfInputs.terminalGrowthRate,
      dcfInputs.projectionYears,
      sharesOutstanding
    );
  }, [trailingFCF, effectiveGrowthRate, dcfInputs, sharesOutstanding]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-border rounded w-48 mb-4" />
        <div className="h-20 bg-border rounded mb-3" />
        <div className="h-32 bg-border rounded" />
      </div>
    );
  }

  const canCompute = trailingFCF != null && trailingFCF > 0;

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex bg-bg-card rounded border border-border">
          <button
            onClick={() => setMode("reverse")}
            className={`px-3 py-1 text-xs font-medium rounded-l transition-colors ${
              mode === "reverse"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Reverse DCF
          </button>
          <button
            onClick={() => setMode("forward")}
            className={`px-3 py-1 text-xs font-medium rounded-r transition-colors ${
              mode === "forward"
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            DCF
          </button>
        </div>
      </div>

      {!canCompute ? (
        <div className="text-text-secondary text-sm bg-bg-card rounded p-4 border border-border">
          {trailingFCF != null && trailingFCF <= 0
            ? "Cannot compute DCF: company has negative free cash flow"
            : "Loading financial data..."}
        </div>
      ) : mode === "reverse" ? (
        /* Reverse DCF Mode */
        <div className="space-y-4">
          {/* Main result */}
          <div className="bg-bg-card rounded p-4 border border-border">
            <div className="text-text-secondary text-xs mb-1">
              Implied FCF Growth Rate
            </div>
            <div className="text-3xl font-bold">
              {reverseResult?.converged
                ? fmt(reverseResult.impliedGrowthRate, { pct: true })
                : reverseResult?.message || "--"}
            </div>
            {reverseResult?.converged && historicalGrowth != null && (
              <div className="text-sm text-text-secondary mt-1">
                vs {fmt(historicalGrowth, { pct: true })} historical FCF CAGR
              </div>
            )}
          </div>

          {/* Editable inputs */}
          <div className="grid grid-cols-3 gap-3">
            <InputField
              label="Discount Rate"
              value={dcfInputs.discountRate * 100}
              suffix="%"
              onChange={(v) => setDcfInputs({ discountRate: v / 100 })}
            />
            <InputField
              label="Terminal Growth"
              value={dcfInputs.terminalGrowthRate * 100}
              suffix="%"
              onChange={(v) => setDcfInputs({ terminalGrowthRate: v / 100 })}
            />
            <InputField
              label="Projection Years"
              value={dcfInputs.projectionYears}
              onChange={(v) => setDcfInputs({ projectionYears: Math.round(v) })}
            />
          </div>

          {/* Key assumptions */}
          <ReferenceGrid
            trailingFCF={trailingFCF}
            secondLabel="Market Cap"
            secondValue={fmt(marketCap, { compact: true })}
            fcfMargin={fcfMargin}
            earningsGrowth3Y={earningsGrowth3Y}
            projectedEarningsGrowth={
              quote?.projectedEarningsGrowth5Y ??
              quote?.projectedEarningsGrowthNextYear ??
              null
            }
            wacc={waccResult?.wacc ?? null}
          />

          {/* Sensitivity table */}
          {matrix.length > 0 && currentPrice != null && (
            <SensitivityTable matrix={matrix} currentPrice={currentPrice} />
          )}
        </div>
      ) : (
        /* Forward DCF Mode */
        <div className="space-y-4">
          {/* Main result */}
          {forwardResult && (
            <div className="bg-bg-card rounded p-4 border border-border">
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-text-secondary text-xs mb-1">
                    Fair Value / Share
                  </div>
                  <div className="text-3xl font-bold">
                    {fmt(forwardResult.fairValuePerShare, { currency: true })}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-xs mb-1">
                    Margin of Safety
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      forwardResult.marginOfSafety > 0
                        ? "text-green"
                        : "text-red"
                    }`}
                  >
                    {forwardResult.marginOfSafety > 0 ? "+" : ""}
                    {fmt(forwardResult.marginOfSafety, { pct: true })}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-xs mb-1">Verdict</div>
                  <div
                    className={`text-sm font-semibold px-2 py-0.5 rounded ${
                      forwardResult.verdict === "undervalued"
                        ? "bg-green/20 text-green"
                        : forwardResult.verdict === "overvalued"
                          ? "bg-red/20 text-red"
                          : "bg-border text-text-primary"
                    }`}
                  >
                    {forwardResult.verdict}
                  </div>
                </div>
              </div>
              <div className="text-xs text-text-secondary mt-2">
                Current price: {fmt(currentPrice, { currency: true })}
              </div>
            </div>
          )}

          {/* Editable inputs */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="FCF Growth Rate"
              value={effectiveGrowthRate * 100}
              suffix="%"
              onChange={(v) => setDcfInputs({ fcfGrowthOverride: v / 100 })}
            />
            <InputField
              label="Discount Rate"
              value={dcfInputs.discountRate * 100}
              suffix="%"
              onChange={(v) => setDcfInputs({ discountRate: v / 100 })}
            />
            <InputField
              label="Terminal Growth"
              value={dcfInputs.terminalGrowthRate * 100}
              suffix="%"
              onChange={(v) => setDcfInputs({ terminalGrowthRate: v / 100 })}
            />
            <InputField
              label="Projection Years"
              value={dcfInputs.projectionYears}
              onChange={(v) => setDcfInputs({ projectionYears: Math.round(v) })}
            />
          </div>

          {/* Key assumptions */}
          <ReferenceGrid
            trailingFCF={trailingFCF}
            secondLabel="Shares Out"
            secondValue={fmt(sharesOutstanding, { compact: true })}
            fcfMargin={fcfMargin}
            earningsGrowth3Y={earningsGrowth3Y}
            projectedEarningsGrowth={
              quote?.projectedEarningsGrowth5Y ??
              quote?.projectedEarningsGrowthNextYear ??
              null
            }
            wacc={waccResult?.wacc ?? null}
          />

          {/* Sensitivity table */}
          {matrix.length > 0 && currentPrice != null && (
            <SensitivityTable matrix={matrix} currentPrice={currentPrice} />
          )}
        </div>
      )}
    </div>
  );
}

function ReferenceGrid({
  trailingFCF,
  secondLabel,
  secondValue,
  fcfMargin,
  earningsGrowth3Y,
  projectedEarningsGrowth,
  wacc,
}: {
  trailingFCF: number | null;
  secondLabel: string;
  secondValue: string;
  fcfMargin: number | null;
  earningsGrowth3Y: number | null;
  projectedEarningsGrowth: number | null;
  wacc: number | null;
}) {
  const items: { label: string; value: string }[] = [
    { label: "Trailing FCF", value: fmt(trailingFCF, { compact: true }) },
    { label: secondLabel, value: secondValue },
    { label: "FCF Margin", value: fmt(fcfMargin, { pct: true }) },
    { label: "3Y EPS Growth", value: fmt(earningsGrowth3Y, { pct: true }) },
    { label: "Analyst EPS Growth", value: fmt(projectedEarningsGrowth, { pct: true }) },
    { label: "WACC", value: fmt(wacc, { pct: true }) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 text-xs text-text-secondary border-t border-border pt-3">
      {items.map((item) => (
        <div key={item.label}>
          <span className="opacity-60">{item.label}</span>
          <div className="text-text-primary">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function InputField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary block mb-1">{label}</label>
      <div className="flex items-center bg-bg-card border border-border rounded">
        <input
          type="number"
          value={value.toFixed(1)}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step="0.5"
          className="w-full px-2 py-1.5 bg-transparent text-sm text-text-primary focus:outline-none"
        />
        {suffix && (
          <span className="pr-2 text-xs text-text-secondary">{suffix}</span>
        )}
      </div>
    </div>
  );
}
