import { config } from "./config.js";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker24h {
  price: number;
  change24h: number;
  volume24h: number;
}

export async function fetchCandles(limit = 50): Promise<Candle[]> {
  const url = `${config.BINANCE_BASE}/api/v3/klines?symbol=${config.SYMBOL}&interval=1m&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance klines error ${res.status}: ${await res.text()}`);
  const raw = (await res.json()) as [number, string, string, string, string, string][];
  return raw.map(([time, open, high, low, close, volume]) => ({
    time,
    open: +open,
    high: +high,
    low: +low,
    close: +close,
    volume: +volume,
  }));
}

export async function fetchTicker(): Promise<Ticker24h> {
  const url = `${config.BINANCE_BASE}/api/v3/ticker/24hr?symbol=${config.SYMBOL}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance ticker error ${res.status}: ${await res.text()}`);
  const d = (await res.json()) as Record<string, string>;
  return {
    price: +d.lastPrice,
    change24h: +d.priceChangePercent,
    volume24h: +d.quoteVolume,
  };
}
