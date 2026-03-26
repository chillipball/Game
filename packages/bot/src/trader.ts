import { createHmac } from "crypto";
import { config } from "./config.js";
import type { Portfolio } from "./portfolio.js";
import type { TradeDecision } from "./brain.js";

export interface TradeResult {
  executed: boolean;
  action: string;
  amount_usdt: number;
  btc_qty: number;
  price: number;
  reason?: string;
}

// ── Paper trading ──────────────────────────────────────────────────────────

export function executePaper(
  decision: TradeDecision,
  portfolio: Portfolio,
  price: number,
): { portfolio: Portfolio; result: TradeResult } {
  const total = portfolio.usdt + portfolio.btc * price;
  const maxSpend = total * config.TRADE_USDT_MAX_PCT;
  const spendUsdt = Math.min(decision.amount_usdt || maxSpend, maxSpend);

  if (decision.action === "BUY" && portfolio.usdt >= config.MIN_ORDER_USDT) {
    const spend = Math.min(spendUsdt, portfolio.usdt);
    if (spend < config.MIN_ORDER_USDT) {
      return {
        portfolio,
        result: { executed: false, action: "BUY", amount_usdt: 0, btc_qty: 0, price, reason: "Insufficient USDT" },
      };
    }
    const btcQty = spend / price;
    return {
      portfolio: {
        ...portfolio,
        usdt: portfolio.usdt - spend,
        btc: portfolio.btc + btcQty,
        entry_price: price,
        total_trades: portfolio.total_trades + 1,
        last_trade_at: new Date().toISOString(),
      },
      result: { executed: true, action: "BUY", amount_usdt: spend, btc_qty: btcQty, price },
    };
  }

  if (decision.action === "SELL" && portfolio.btc > 0) {
    const proceeds = portfolio.btc * price;
    if (proceeds < config.MIN_ORDER_USDT) {
      return {
        portfolio,
        result: { executed: false, action: "SELL", amount_usdt: 0, btc_qty: 0, price, reason: "Proceeds below minimum" },
      };
    }
    return {
      portfolio: {
        ...portfolio,
        usdt: portfolio.usdt + proceeds,
        btc: 0,
        entry_price: null,
        total_trades: portfolio.total_trades + 1,
        last_trade_at: new Date().toISOString(),
      },
      result: { executed: true, action: "SELL", amount_usdt: proceeds, btc_qty: portfolio.btc, price },
    };
  }

  return {
    portfolio,
    result: {
      executed: false,
      action: decision.action,
      amount_usdt: 0,
      btc_qty: 0,
      price,
      reason: decision.action === "HOLD" ? "HOLD decision" : "Insufficient balance",
    },
  };
}

// ── Live trading (Binance REST + HMAC-SHA256) ──────────────────────────────

async function binanceSignedPost(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const timestamp = Date.now().toString();
  const queryObj = { ...params, timestamp, recvWindow: "5000" };
  const queryString = new URLSearchParams(queryObj).toString();
  const signature = createHmac("sha256", config.BINANCE_SECRET)
    .update(queryString)
    .digest("hex");

  const url = `${config.BINANCE_BASE}${path}?${queryString}&signature=${signature}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-MBX-APIKEY": config.BINANCE_API_KEY },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Binance API error: ${JSON.stringify(body)}`);
  return body;
}

export async function executeLive(
  decision: TradeDecision,
  portfolio: Portfolio,
  price: number,
): Promise<TradeResult> {
  if (decision.action === "HOLD") {
    return { executed: false, action: "HOLD", amount_usdt: 0, btc_qty: 0, price };
  }

  const total = portfolio.usdt + portfolio.btc * price;
  const maxSpend = total * config.TRADE_USDT_MAX_PCT;
  const spendUsdt = Math.min(decision.amount_usdt || maxSpend, maxSpend);

  if (decision.action === "BUY") {
    if (spendUsdt < config.MIN_ORDER_USDT) {
      return { executed: false, action: "BUY", amount_usdt: 0, btc_qty: 0, price, reason: "Below minimum order" };
    }
    const btcQty = (spendUsdt / price).toFixed(6);
    await binanceSignedPost("/api/v3/order", {
      symbol: config.SYMBOL,
      side: "BUY",
      type: "MARKET",
      quantity: btcQty,
    });
    return { executed: true, action: "BUY", amount_usdt: spendUsdt, btc_qty: +btcQty, price };
  }

  if (decision.action === "SELL") {
    if (portfolio.btc <= 0) {
      return { executed: false, action: "SELL", amount_usdt: 0, btc_qty: 0, price, reason: "No BTC to sell" };
    }
    const btcQty = portfolio.btc.toFixed(6);
    await binanceSignedPost("/api/v3/order", {
      symbol: config.SYMBOL,
      side: "SELL",
      type: "MARKET",
      quantity: btcQty,
    });
    const proceeds = portfolio.btc * price;
    return { executed: true, action: "SELL", amount_usdt: proceeds, btc_qty: portfolio.btc, price };
  }

  return { executed: false, action: "HOLD", amount_usdt: 0, btc_qty: 0, price };
}
