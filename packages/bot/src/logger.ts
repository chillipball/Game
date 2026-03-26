import { appendFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { totalValue } from "./portfolio.js";
import type { TradeDecision } from "./brain.js";
import type { TradeResult } from "./trader.js";
import type { Portfolio } from "./portfolio.js";
import type { Indicators } from "./indicators.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dirname, "../../../logs/trades.jsonl");

export function logTrade(
  decision: TradeDecision,
  result: TradeResult,
  portfolio: Portfolio,
  ind: Indicators,
  mode: "paper" | "live",
): void {
  const total = totalValue(portfolio, result.price);
  const pnlPct = ((total - portfolio.start_value) / portfolio.start_value) * 100;

  const entry = {
    ts: new Date().toISOString(),
    mode,
    price: result.price,
    action: decision.action,
    executed: result.executed,
    amount_usdt: result.amount_usdt,
    btc_qty: result.btc_qty,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
    reason: result.reason,
    rsi: +ind.rsi14.toFixed(1),
    sma20: +ind.sma20.toFixed(2),
    sma50: +ind.sma50.toFixed(2),
    portfolio_usdt: +portfolio.usdt.toFixed(2),
    portfolio_btc: +portfolio.btc.toFixed(6),
    portfolio_total: +total.toFixed(2),
    pnl_pct: +pnlPct.toFixed(2),
  };

  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.warn("Failed to write trade log:", err);
  }

  printSummary(entry, mode);
}

function printSummary(
  e: {
    action: string;
    executed: boolean;
    price: number;
    rsi: number;
    sma20: number;
    sma50: number;
    confidence: number;
    reasoning: string;
    reason?: string;
    portfolio_total: number;
    portfolio_usdt: number;
    portfolio_btc: number;
    pnl_pct: number;
  },
  mode: string,
): void {
  const icon = e.action === "BUY" ? "🟢 BUY " : e.action === "SELL" ? "🔴 SELL" : "⚪ HOLD";
  const exec = e.executed ? "" : ` (skipped${e.reason ? `: ${e.reason}` : ""})`;
  const pnlSign = e.pnl_pct >= 0 ? "+" : "";
  const modeTag = mode === "paper" ? "[PAPER]" : "[LIVE] ";
  const time = new Date().toLocaleTimeString();

  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log(`║ ${modeTag}  BTC/USDT @ $${e.price.toLocaleString("en-US").padEnd(12)} ${time.padStart(12)} ║`);
  console.log(`║  RSI: ${e.rsi.toFixed(1).padEnd(6)} SMA20: $${Math.round(e.sma20).toLocaleString("en-US").padEnd(8)} SMA50: $${Math.round(e.sma50).toLocaleString("en-US").padEnd(10)}║`);
  console.log(`║  Decision: ${icon}${exec.padEnd(40)}║`);
  console.log(`║  Reason:   ${e.reasoning.slice(0, 48).padEnd(48)} ║`);
  console.log(`║  Confidence: ${(e.confidence * 100).toFixed(0)}%                                           ║`);
  console.log(`║  Portfolio: $${e.portfolio_total.toLocaleString("en-US", { minimumFractionDigits: 2 }).padEnd(10)} (${pnlSign}${e.pnl_pct.toFixed(2)}% overall)         ║`);
  console.log(`║  USDT: $${e.portfolio_usdt.toFixed(2).padEnd(12)} BTC: ${e.portfolio_btc.toFixed(6).padEnd(18)}      ║`);
  console.log("╚═══════════════════════════════════════════════════════════╝");
}
