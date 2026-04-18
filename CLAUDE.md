# Rapid Valuation Tool

Equity valuation SPA: DCF, reverse DCF, PE comparisons, P/B analysis, AI synthesis.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Recharts
- yahoo-finance2 for financial data (must instantiate with `new YahooFinance()`)
- Anthropic SDK for AI summary (claude-sonnet-4-20250514)
- jsPDF for PDF export

## Key patterns
- All Yahoo Finance calls go through Next.js API routes in `app/api/`
- `fundamentalsTimeSeries` requires `{ validateResult: false }` module option
- State managed via React Context in `state/AppStateContext.tsx`
- Dark theme CSS vars matching market-signals project in `globals.css`
- DCF calculations are pure functions in `lib/dcf.ts`

## Not yet implemented
- Auth (NextAuth.js v5) - Phase 8
- Vercel KV persistence - Phase 8
