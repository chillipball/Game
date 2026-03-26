import cron from "node-cron";
import { validateConfig, config } from "./config.js";
import { fetchCandles, fetchTicker } from "./market.js";
import { computeIndicators } from "./indicators.js";
import { load as loadPortfolio, save as savePortfolio, totalValue } from "./portfolio.js";
import { getDecision } from "./brain.js";
import { executePaper, executeLive } from "./trader.js";
import { logTrade } from "./logger.js";

const MODE = config.PAPER_MODE ? "paper" : "live";

async function runCycle(): Promise<void> {
  try {
    // Fetch market data in parallel
    const [candles, ticker] = await Promise.all([fetchCandles(50), fetchTicker()]);
    const ind = computeIndicators(candles);
    const portfolio = loadPortfolio();

    // Emergency halt: stop if we've lost too much
    const total = totalValue(portfolio, ticker.price);
    const drawdown = (portfolio.start_value - total) / portfolio.start_value;
    if (drawdown >= config.EMERGENCY_HALT_PCT) {
      console.error(
        `\n⛔ EMERGENCY HALT: portfolio is down ${(drawdown * 100).toFixed(1)}% from start ($${portfolio.start_value}).`,
        "\nReview your strategy before restarting with live mode."
      );
      process.exit(1);
    }

    // Cool-down: skip Claude call if we traded recently
    if (portfolio.last_trade_at) {
      const elapsed = Date.now() - new Date(portfolio.last_trade_at).getTime();
      if (elapsed < config.COOLDOWN_MS) {
        const remaining = Math.ceil((config.COOLDOWN_MS - elapsed) / 60_000);
        console.log(
          `\n⏳ [${new Date().toLocaleTimeString()}] Cool-down active — ${remaining}m remaining. BTC @ $${ticker.price.toLocaleString("en-US")}`
        );
        return;
      }
    }

    // Ask Claude for a trading decision
    console.log(`\n🧠 [${new Date().toLocaleTimeString()}] Asking Claude... BTC @ $${ticker.price.toLocaleString("en-US")}`);
    const decision = await getDecision(ticker, candles, ind, portfolio);

    // Apply confidence threshold
    if (decision.action !== "HOLD" && decision.confidence < config.MIN_CONFIDENCE) {
      decision.action = "HOLD";
      decision.reasoning = `Confidence ${(decision.confidence * 100).toFixed(0)}% below threshold — defaulting to HOLD`;
    }

    let result;
    let updatedPortfolio = portfolio;

    if (config.PAPER_MODE) {
      const { portfolio: next, result: r } = executePaper(decision, portfolio, ticker.price);
      result = r;
      updatedPortfolio = next;
      savePortfolio(updatedPortfolio);
    } else {
      result = await executeLive(decision, portfolio, ticker.price);
    }

    logTrade(decision, result, updatedPortfolio, ind, MODE);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ [${new Date().toLocaleTimeString()}] Cycle error: ${msg}`);
  }
}

async function main(): Promise<void> {
  validateConfig();

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log(`║  🤖 Bitcoin Trading Bot                                   ║`);
  console.log(`║  Mode:    ${MODE.toUpperCase().padEnd(7)}  |  Pair: BTC/USDT              ║`);
  console.log(`║  Brain:   Claude (${config.CLAUDE_MODEL.padEnd(20)})     ║`);
  console.log(`║  Cycle:   every 5 minutes                                 ║`);
  console.log("╠═══════════════════════════════════════════════════════════╣");
  console.log("║  ⚠️  WARNING: Trading bots can lose money. DYOR.          ║");
  console.log("║  Start: paper mode | Switch: PAPER_MODE=false in .env    ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  // Run one cycle immediately on start
  await runCycle();

  // Then every 5 minutes
  cron.schedule("*/5 * * * *", runCycle);
  console.log("\n⏰ Scheduler running — next cycle in 5 minutes. Ctrl+C to stop.\n");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Bot stopped.");
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
