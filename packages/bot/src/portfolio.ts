import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/portfolio.json");

export interface Portfolio {
  usdt: number;
  btc: number;
  entry_price: number | null;
  start_value: number;
  total_trades: number;
  last_trade_at: string | null;
}

const DEFAULT: Portfolio = {
  usdt: 1000,
  btc: 0,
  entry_price: null,
  start_value: 1000,
  total_trades: 0,
  last_trade_at: null,
};

export function load(): Portfolio {
  if (!existsSync(DATA_PATH)) {
    mkdirSync(dirname(DATA_PATH), { recursive: true });
    save(DEFAULT);
    return { ...DEFAULT };
  }
  return JSON.parse(readFileSync(DATA_PATH, "utf8")) as Portfolio;
}

export function save(p: Portfolio): void {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(p, null, 2));
}

export function totalValue(p: Portfolio, price: number): number {
  return p.usdt + p.btc * price;
}
