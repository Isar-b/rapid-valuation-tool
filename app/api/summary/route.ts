import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const DISCLAIMER =
  "This is not financial advice. All outputs are generated from public data and model assumptions and should not be relied on as the sole basis for any investment decision.";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured", disclaimer: DISCLAIMER },
      { status: 500 }
    );
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const dataContext = JSON.stringify(
      {
        symbol: body.symbol,
        name: body.name,
        currentPrice: body.currentPrice,
        marketCap: body.marketCap,
        sector: body.sector,
        reverseDCF: body.reverseDCF,
        forwardDCF: body.forwardDCF,
        peComparisons: body.peComparisons,
        pbComparisons: body.pbComparisons,
      },
      null,
      2
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      temperature: 0.3,
      system:
        "You are a senior equity research analyst. Given valuation data for a stock, produce a structured investment summary. Use an analytical, professional tone. Structure your response with these exact section headings:\n\n**Market Pricing** - What growth rate the market is pricing in (from reverse DCF) and whether this seems reasonable.\n**Intrinsic Value** - How the stock ranks on DCF fair value vs current price, margin of safety.\n**Earnings Multiples** - How PE/PEG compare to peers, whether cheap or expensive on relative basis.\n**Asset Value** - P/B comparison to peers, any notable points.\n**Recommendation** - A directional view (Buy / Hold / Avoid) with a one-sentence rationale.\n\nBe concise. Each section should be 1-2 sentences. Do not hedge excessively.",
      messages: [
        {
          role: "user",
          content: `Produce a valuation summary for the following stock data:\n\n${dataContext}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ summary: text, disclaimer: DISCLAIMER });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Summary error:", message);
    return Response.json(
      { error: "Failed to generate summary", detail: message, disclaimer: DISCLAIMER },
      { status: 500 }
    );
  }
}
