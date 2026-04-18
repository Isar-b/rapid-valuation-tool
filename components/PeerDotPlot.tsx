"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { fmt } from "@/lib/format";

interface PeerDotPlotProps {
  data: { symbol: string; value: number | null }[];
  selectedSymbol: string;
  label: string;
}

export function PeerDotPlot({ data, selectedSymbol, label }: PeerDotPlotProps) {
  const chartData = data
    .filter((d) => d.value != null)
    .map((d, i) => ({
      symbol: d.symbol,
      x: d.value as number,
      y: i,
    }));

  if (chartData.length === 0) {
    return (
      <div className="text-text-secondary text-xs text-center py-4">
        No data available for chart
      </div>
    );
  }

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ left: 50, right: 10, top: 10, bottom: 10 }}>
          <XAxis
            type="number"
            dataKey="x"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            name={label}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={false}
            tickLine={false}
            axisLine={false}
            width={0}
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
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.symbol || ""
            }
          />
          <Scatter data={chartData} fill="#2a2e45">
            {chartData.map((entry) => (
              <Cell
                key={entry.symbol}
                fill={entry.symbol === selectedSymbol ? "#6366f1" : "#94a3b8"}
                r={entry.symbol === selectedSymbol ? 8 : 6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
