"use client";

import { type SensitivityCell } from "@/lib/dcf";
import { fmt } from "@/lib/format";

interface SensitivityTableProps {
  matrix: SensitivityCell[][];
  currentPrice: number;
}

export function SensitivityTable({ matrix, currentPrice }: SensitivityTableProps) {
  if (matrix.length === 0) return null;

  const growthRates = matrix[0].map((c) => c.growthRate);

  return (
    <div>
      <h3 className="text-sm font-medium text-text-secondary mb-2">
        Sensitivity Table (Fair Value / Share)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="py-1.5 px-2 text-left text-text-secondary font-normal border-b border-border">
                Discount \ Growth
              </th>
              {growthRates.map((g) => (
                <th
                  key={g}
                  className="py-1.5 px-2 text-right text-text-secondary font-normal border-b border-border"
                >
                  {(g * 100).toFixed(1)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="py-1.5 px-2 text-text-secondary border-b border-border/50">
                  {(row[0].discountRate * 100).toFixed(1)}%
                </td>
                {row.map((cell, j) => {
                  const isCenter = i === 1 && j === 1;
                  const upside = (cell.fairValue - currentPrice) / currentPrice;
                  const color =
                    upside > 0.15
                      ? "text-green"
                      : upside < -0.15
                        ? "text-red"
                        : "text-text-primary";
                  return (
                    <td
                      key={j}
                      className={`py-1.5 px-2 text-right border-b border-border/50 ${color} ${
                        isCenter ? "font-bold bg-bg-panel" : ""
                      }`}
                    >
                      {fmt(cell.fairValue, { currency: true })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
