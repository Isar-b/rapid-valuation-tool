"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fmt } from "@/lib/format";

interface PeerBarChartProps {
  data: { symbol: string; value: number | null }[];
  selectedSymbol: string;
  label: string;
}

export function PeerBarChart({ data, selectedSymbol, label }: PeerBarChartProps) {
  const chartData = data
    .filter((d) => d.value != null)
    .map((d) => ({ ...d, value: d.value as number }));

  if (chartData.length === 0) {
    return (
      <div className="text-text-secondary text-xs text-center py-4">
        No data available for chart
      </div>
    );
  }

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 10, top: 5, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis
            type="category"
            dataKey="symbol"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#232740",
              border: "1px solid #2a2e45",
              borderRadius: "4px",
              fontSize: "12px",
              color: "#e2e8f0",
            }}
            formatter={(value) => [fmt(value as number, { ratio: true }), label]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.symbol}
                fill={
                  entry.symbol === selectedSymbol ? "#6366f1" : "#2a2e45"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
