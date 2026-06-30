import type { CryptoMarket } from "@/src/modules/crypto/types";
import { env } from "@/lib/env";

const BINANCE_API_BASE = "https://api.binance.com";
const TICKER_TIMEOUT_MS = 5_000;
const SPARKLINE_TIMEOUT_MS = 3_000;

const TRACKED_MARKETS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", pair: "BTCUSDT" },
  { id: "ethereum", symbol: "eth", name: "Ethereum", pair: "ETHUSDT" },
  { id: "binancecoin", symbol: "bnb", name: "BNB", pair: "BNBUSDT" },
  { id: "solana", symbol: "sol", name: "Solana", pair: "SOLUSDT" },
  { id: "ripple", symbol: "xrp", name: "XRP", pair: "XRPUSDT" },
  { id: "cardano", symbol: "ada", name: "Cardano", pair: "ADAUSDT" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", pair: "DOGEUSDT" },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche", pair: "AVAXUSDT" },
  { id: "chainlink", symbol: "link", name: "Chainlink", pair: "LINKUSDT" },
  { id: "tron", symbol: "trx", name: "TRON", pair: "TRXUSDT" },
] as const;

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

export async function fetchTopCryptoMarkets(): Promise<CryptoMarket[]> {
  try {
    return await fetchBinanceMarkets();
  } catch (error) {
    console.warn("Falha na Binance; usando CoinGecko:", error);
    return fetchCoinGeckoMarkets();
  }
}

async function fetchBinanceMarkets(): Promise<CryptoMarket[]> {
  const tickers = await fetchBinanceTickers();

  const markets = await Promise.all(
    TRACKED_MARKETS.map(async (market): Promise<CryptoMarket | null> => {
      const ticker = tickers.get(market.pair);
      if (!ticker) return null;

      const currentPrice = Number(ticker.lastPrice);
      if (!Number.isFinite(currentPrice)) return null;

      return {
        id: market.id,
        symbol: market.symbol,
        name: market.name,
        image: `https://assets.coincap.io/assets/icons/${market.symbol}@2x.png`,
        current_price: currentPrice,
        total_volume: toFiniteNumber(ticker.quoteVolume),
        price_change_percentage_24h: toFiniteNumber(ticker.priceChangePercent),
        sparkline_in_7d: {
          price: await fetchSparkline(market.pair),
        },
      } satisfies CryptoMarket;
    })
  );

  return markets.filter((market): market is CryptoMarket => market !== null);
}

async function fetchCoinGeckoMarkets(): Promise<CryptoMarket[]> {
  const url = new URL(env.coinGeckoMarketsUrl());
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", TRACKED_MARKETS.map((market) => market.id).join(","));
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const response = await fetchWithTimeout(url, TICKER_TIMEOUT_MS, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko markets failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map(toCryptoMarket)
    .filter((market): market is CryptoMarket => market !== null);
}

async function fetchBinanceTickers() {
  const url = new URL("/api/v3/ticker/24hr", BINANCE_API_BASE);
  url.searchParams.set(
    "symbols",
    JSON.stringify(TRACKED_MARKETS.map((market) => market.pair))
  );

  const response = await fetchWithTimeout(url, TICKER_TIMEOUT_MS, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Binance ticker failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return new Map<string, BinanceTicker>();

  return new Map(
    data
      .filter(isBinanceTicker)
      .map((ticker) => [ticker.symbol, ticker] as const)
  );
}

async function fetchSparkline(pair: string) {
  const url = new URL("/api/v3/klines", BINANCE_API_BASE);
  url.searchParams.set("symbol", pair);
  url.searchParams.set("interval", "4h");
  url.searchParams.set("limit", "42");

  try {
    const response = await fetchWithTimeout(url, SPARKLINE_TIMEOUT_MS, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.filter(isBinanceKline).map((kline) => Number(kline[4]));
  } catch {
    return [];
  }
}

function isBinanceTicker(value: unknown): value is BinanceTicker {
  if (!value || typeof value !== "object") return false;

  const ticker = value as Partial<BinanceTicker>;

  return (
    typeof ticker.symbol === "string" &&
    typeof ticker.lastPrice === "string" &&
    typeof ticker.priceChangePercent === "string" &&
    typeof ticker.quoteVolume === "string"
  );
}

function isBinanceKline(value: unknown): value is BinanceKline {
  return Array.isArray(value) && typeof value[4] === "string";
}

function toCryptoMarket(value: unknown): CryptoMarket | null {
  if (!value || typeof value !== "object") return null;

  const market = value as Record<string, unknown>;
  const currentPrice = toFiniteNumber(market.current_price);

  if (
    typeof market.id !== "string" ||
    typeof market.symbol !== "string" ||
    typeof market.name !== "string" ||
    typeof market.image !== "string" ||
    currentPrice === undefined
  ) {
    return null;
  }

  const sparkline = market.sparkline_in_7d;
  const prices =
    sparkline && typeof sparkline === "object"
      ? (sparkline as Record<string, unknown>).price
      : undefined;

  return {
    id: market.id,
    symbol: market.symbol,
    name: market.name,
    image: market.image,
    current_price: currentPrice,
    market_cap: toFiniteNumber(market.market_cap),
    total_volume: toFiniteNumber(market.total_volume),
    price_change_percentage_24h: toFiniteNumber(
      market.price_change_percentage_24h
    ),
    sparkline_in_7d: {
      price: Array.isArray(prices)
        ? prices.flatMap((price) => {
            const parsed = toFiniteNumber(price);
            return parsed === undefined ? [] : [parsed];
          })
        : [],
    },
  };
}

function toFiniteNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

async function fetchWithTimeout(
  input: URL,
  timeoutMs: number,
  init?: RequestInit
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
