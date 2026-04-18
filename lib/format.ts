interface FormatOptions {
  pct?: boolean;
  ratio?: boolean;
  currency?: boolean;
  compact?: boolean;
  decimals?: number;
}

export function fmt(
  n: number | null | undefined,
  opts: FormatOptions = {}
): string {
  if (n == null || isNaN(n)) return "--";

  if (opts.pct) {
    return `${(n * 100).toFixed(opts.decimals ?? 1)}%`;
  }
  if (opts.ratio) {
    return `${n.toFixed(opts.decimals ?? 1)}x`;
  }
  if (opts.compact) {
    if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  }
  if (opts.currency) {
    return `$${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return n.toLocaleString("en-US", {
    maximumFractionDigits: opts.decimals ?? 2,
  });
}
