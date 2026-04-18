"use client";

import { useState, type ReactNode } from "react";

interface CollapsiblePanelProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  flex?: number;
}

export function CollapsiblePanel({
  title,
  defaultExpanded = false,
  children,
  flex = 1,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="group w-10 min-w-[40px] flex-shrink-0 border-r border-border bg-bg-panel hover:bg-bg-card transition-colors flex items-start justify-center pt-4"
        title={`Expand ${title}`}
      >
        <div
          className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors whitespace-nowrap select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {title} &nbsp;&raquo;
        </div>
      </button>
    );
  }

  return (
    <div
      className="min-w-0 border-r border-border bg-bg-primary flex flex-col overflow-hidden"
      style={{ flex }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-panel">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <button
          onClick={() => setExpanded(false)}
          className="text-text-secondary hover:text-text-primary text-xs transition-colors px-2 py-0.5 rounded hover:bg-bg-card"
          title={`Collapse ${title}`}
        >
          &laquo;
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
