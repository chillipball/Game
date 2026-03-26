import { query } from "@anthropic-ai/claude-agent-sdk";
import { config } from "./config.js";
import { totalValue } from "./portfolio.js";
import type { Ticker24h } from "./market.js";
import type { Candle } from "./market.js";
import type { Portfolio } from "./portfolio.js";
import type { Indicators } from "./indicators.js";

export interface TradeDecision {
  action: "BUY" | "SELL" | "HOLD";
  amount_usdt: number;
  confidence: number;
  reasoning: string;
}

function buildPrompt(
  ticker: Ticker24h,
  candles: Candle[],
  ind: Indicators,
  portfolio: Portfolio,
): string {
  const price = ticker.price;
  const total = totalValue(portfolio, price);
  const pnlPct = ((total - portfolio.start_value) / portfolio.start_value) * 100;
  const btcValue = portfolio.btc * price;
  const trend = ind.sma20 > ind.sma50 ? "above" : "below";
  const maxPct = config.TRADE_USDT_MAX_PCT * 100;

  const candleRows = candles
    .slice(-20)
    .map(
      (c) =>
        `[${c.time},${c.open.toFixed(2)},${c.high.toFixed(2)},${c.low.toFixed(2)},${c.close.toFixed(2)},${c.volume.toFixed(2)}]`
    )
    .join("\n");

  return `You are a Bitcoin trading AI. Analyze the market data below and respond with ONLY a single valid JSON object — no markdown, no explanation outside the JSON.

=== MARKET DATA ===
Symbol: BTC/USDT
Price: $${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
24h change: ${ticker.change24h >= 0 ? "+" : ""}${ticker.change24h.toFixed(2)}%
24h volume: $${(ticker.volume24h / 1e6).toFixed(1)}M

Technical Indicators:
  RSI(14): ${ind.rsi14.toFixed(1)}  [<30=oversold, >70=overbought]
  SMA(20): $${ind.sma20.toLocaleString("en-US", { minimumFractionDigits: 2 })}
  SMA(50): $${ind.sma50.toLocaleString("en-US", { minimumFractionDigits: 2 })}
  Trend: SMA20 ${trend} SMA50

Last 20 candles (1m OHLCV, newest last):
[timestamp,open,high,low,close,volume]
${candleRows}

=== PORTFOLIO ===
USDT balance: $${portfolio.usdt.toFixed(2)}
BTC held:     ${portfolio.btc.toFixed(6)} BTC (~$${btcValue.toFixed(2)})
Total value:  $${total.toFixed(2)}
PnL:          ${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% since start

=== TRADING RULES ===
- BUY only if you have USDT available and confidence >= ${config.MIN_CONFIDENCE}
- SELL only if you hold BTC and confidence >= ${config.MIN_CONFIDENCE}
- Max spend per trade: ${maxPct}% of total portfolio value
- Default to HOLD when uncertain or signal is weak
- Prefer HOLD if the trend is ambiguous or RSI is neutral (40-60)

Respond with a single JSON object and NOTHING ELSE:
{"action":"BUY|SELL|HOLD","amount_usdt":0,"confidence":0.0,"reasoning":"one concise sentence"}`;
}

function extractJson(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find the first {...} block
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return brace[0].trim();
  return text.trim();
}

export async function getDecision(
  ticker: Ticker24h,
  candles: Candle[],
  ind: Indicators,
  portfolio: Portfolio,
): Promise<TradeDecision> {
  const prompt = buildPrompt(ticker, candles, ind, portfolio);
  let responseText = "";

  const options: Record<string, unknown> = {
    allowedTools: [],
    maxTurns: 1,
    model: config.CLAUDE_MODEL,
  };

  for await (const msg of query({ prompt, options: options as Parameters<typeof query>[0]["options"] })) {
    // Collect text from assistant message blocks
    if ((msg as { type: string }).type === "assistant") {
      const assistantMsg = msg as { type: string; message: { content: Array<{ type: string; text?: string }> } };
      for (const block of assistantMsg.message?.content ?? []) {
        if (block.type === "text" && block.text) {
          responseText += block.text;
        }
      }
    }
  }

  if (!responseText) {
    console.warn("No text in Claude response — defaulting to HOLD");
    return { action: "HOLD", amount_usdt: 0, confidence: 0, reasoning: "Empty response — defaulting to HOLD" };
  }

  try {
    const parsed = JSON.parse(extractJson(responseText)) as TradeDecision;
    // Validate action field
    if (!["BUY", "SELL", "HOLD"].includes(parsed.action)) {
      throw new Error(`Invalid action: ${parsed.action}`);
    }
    return parsed;
  } catch {
    console.warn("Failed to parse Claude response, defaulting to HOLD.\nRaw:", responseText.slice(0, 200));
    return { action: "HOLD", amount_usdt: 0, confidence: 0, reasoning: "Parse error — defaulting to HOLD" };
  }
}
