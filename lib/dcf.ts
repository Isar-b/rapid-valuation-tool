/**
 * Pure DCF calculation functions.
 * All functions are deterministic with no side effects.
 */

export interface ReverseDCFResult {
  impliedGrowthRate: number;
  converged: boolean;
  message?: string;
}

export interface ForwardDCFResult {
  fairValuePerShare: number;
  totalPV: number;
  marginOfSafety: number; // positive = undervalued, negative = overvalued
  verdict: "undervalued" | "fairly valued" | "overvalued";
}

export interface SensitivityCell {
  growthRate: number;
  discountRate: number;
  fairValue: number;
}

export interface WACCResult {
  wacc: number;
  costOfEquity: number;
  weightEquity: number;
  weightDebt: number;
}

/**
 * Calculate WACC using CAPM for cost of equity.
 * Defaults use US large-cap assumptions as of 2026.
 */
export function calculateWACC(
  marketCap: number,
  totalDebt: number,
  beta: number,
  riskFreeRate: number = 0.045,
  marketRiskPremium: number = 0.055,
  costOfDebt: number = 0.05,
  taxRate: number = 0.21
): WACCResult {
  const costOfEquity = riskFreeRate + beta * marketRiskPremium;
  const totalCapital = marketCap + (totalDebt > 0 ? totalDebt : 0);
  const weightEquity = totalCapital > 0 ? marketCap / totalCapital : 1;
  const weightDebt = totalCapital > 0 ? totalDebt / totalCapital : 0;
  const wacc =
    weightEquity * costOfEquity + weightDebt * costOfDebt * (1 - taxRate);
  return { wacc, costOfEquity, weightEquity, weightDebt };
}

/**
 * Compute NPV of projected FCFs + terminal value for a given growth rate.
 */
function computeNPV(
  trailingFCF: number,
  growthRate: number,
  discountRate: number,
  terminalGrowthRate: number,
  projectionYears: number
): number {
  let pvFCF = 0;
  let lastFCF = trailingFCF;

  for (let t = 1; t <= projectionYears; t++) {
    lastFCF *= 1 + growthRate;
    pvFCF += lastFCF / Math.pow(1 + discountRate, t);
  }

  // Terminal value using Gordon Growth Model
  const terminalValue =
    (lastFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, projectionYears);

  return pvFCF + pvTerminal;
}

/**
 * Reverse DCF: find the implied FCF growth rate that justifies the current market cap.
 * Uses binary search.
 */
export function reverseDCF(
  marketCap: number,
  trailingFCF: number,
  discountRate: number,
  terminalGrowthRate: number,
  projectionYears: number
): ReverseDCFResult {
  if (trailingFCF <= 0) {
    return {
      impliedGrowthRate: NaN,
      converged: false,
      message: "Cannot compute: negative or zero free cash flow",
    };
  }

  if (marketCap <= 0) {
    return {
      impliedGrowthRate: NaN,
      converged: false,
      message: "Cannot compute: invalid market cap",
    };
  }

  let lo = -0.3; // -30%
  let hi = 0.5; // +50%
  const tolerance = 0.001; // 0.1% of market cap
  const maxIterations = 50;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const npv = computeNPV(
      trailingFCF,
      mid,
      discountRate,
      terminalGrowthRate,
      projectionYears
    );

    if (Math.abs(npv - marketCap) / marketCap < tolerance) {
      return { impliedGrowthRate: mid, converged: true };
    }

    if (npv > marketCap) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  // Didn't converge precisely, return best estimate
  const result = (lo + hi) / 2;
  if (result <= -0.29 || result >= 0.49) {
    return {
      impliedGrowthRate: result,
      converged: false,
      message: "Implied growth rate is outside reasonable range",
    };
  }

  return { impliedGrowthRate: result, converged: true };
}

/**
 * Forward DCF: project fair value per share given assumptions.
 */
export function forwardDCF(
  trailingFCF: number,
  fcfGrowthRate: number,
  discountRate: number,
  terminalGrowthRate: number,
  projectionYears: number,
  sharesOutstanding: number,
  currentPrice: number
): ForwardDCFResult {
  const totalPV = computeNPV(
    trailingFCF,
    fcfGrowthRate,
    discountRate,
    terminalGrowthRate,
    projectionYears
  );

  const fairValuePerShare = totalPV / sharesOutstanding;
  const marginOfSafety = (fairValuePerShare - currentPrice) / currentPrice;

  let verdict: ForwardDCFResult["verdict"];
  if (marginOfSafety > 0.15) {
    verdict = "undervalued";
  } else if (marginOfSafety < -0.15) {
    verdict = "overvalued";
  } else {
    verdict = "fairly valued";
  }

  return { fairValuePerShare, totalPV, marginOfSafety, verdict };
}

/**
 * Generate 3x3 sensitivity table.
 * Rows: discount rate variations (-1%, base, +1%)
 * Columns: growth rate variations (-2%, base, +2%)
 */
export function sensitivityMatrix(
  trailingFCF: number,
  baseGrowthRate: number,
  baseDiscountRate: number,
  terminalGrowthRate: number,
  projectionYears: number,
  sharesOutstanding: number
): SensitivityCell[][] {
  const discountRates = [
    baseDiscountRate - 0.01,
    baseDiscountRate,
    baseDiscountRate + 0.01,
  ];
  const growthRates = [
    baseGrowthRate - 0.02,
    baseGrowthRate,
    baseGrowthRate + 0.02,
  ];

  return discountRates.map((dr) =>
    growthRates.map((gr) => {
      const npv = computeNPV(
        trailingFCF,
        gr,
        dr,
        terminalGrowthRate,
        projectionYears
      );
      return {
        growthRate: gr,
        discountRate: dr,
        fairValue: npv / sharesOutstanding,
      };
    })
  );
}
