import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, "../../../.env") });

export const config = {
  PAPER_MODE: process.env.PAPER_MODE !== "false",
  BINANCE_API_KEY: process.env.BINANCE_API_KEY ?? "",
  BINANCE_SECRET: process.env.BINANCE_SECRET ?? "",
  TRADE_USDT_MAX_PCT: Number(process.env.TRADE_USDT_MAX_PCT ?? "20") / 100,
  CLAUDE_MODEL: process.env.CLAUDE_MODEL ?? "claude-opus-4-6",
  BINANCE_BASE: "https://api.binance.com",
  SYMBOL: "BTCUSDT",
  MIN_ORDER_USDT: 10,
  MIN_CONFIDENCE: 0.65,
  COOLDOWN_MS: 10 * 60 * 1000, // 10 minutes between trades
  EMERGENCY_HALT_PCT: 0.20,    // halt if portfolio drops 20% from start
};

export function validateConfig(): void {
  if (!config.PAPER_MODE) {
    if (!config.BINANCE_API_KEY || !config.BINANCE_SECRET) {
      throw new Error(
        "PAPER_MODE=false requires BINANCE_API_KEY and BINANCE_SECRET in .env"
      );
    }
    console.log("⚠️  LIVE MODE — real money will be traded on Binance!");
  } else {
    console.log("📝 Paper trading mode — no real money at risk.");
  }
}
