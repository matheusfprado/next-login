import type { CryptoCandle } from "@/src/modules/crypto/coingecko.service";

const DOLLAR_HISTORY_BASE_URL = "https://economia.awesomeapi.com.br/json/daily/USD-BRL";

interface DollarQuote {
  high: string;
  low: string;
  bid: string;
  timestamp: string;
}

export interface DollarRatePoint {
  timestamp: string;
  rate: number;
}

export async function fetchDollarCandles(days = 90): Promise<CryptoCandle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${DOLLAR_HISTORY_BASE_URL}/${Math.min(days, 360)}`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Dollar history failed with status ${response.status}`);
    return parseDollarCandles(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDollarRateHistory(days: number): Promise<DollarRatePoint[]> {
  if (days <= 360) {
    return (await fetchDollarCandles(days)).map((candle) => ({
      timestamp: candle.timestamp,
      rate: candle.close,
    }));
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const url = new URL(`/${toDate(start)}..${toDate(end)}`, "https://api.frankfurter.app");
  url.searchParams.set("from", "USD");
  url.searchParams.set("to", "BRL");

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Dollar long history failed with status ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("rates" in data)) return [];
  const rates = data.rates;
  if (!rates || typeof rates !== "object") return [];

  return Object.entries(rates).flatMap(([date, value]) => {
    if (!value || typeof value !== "object" || !("BRL" in value)) return [];
    const rate = value.BRL;
    return typeof rate === "number" && Number.isFinite(rate)
      ? [{ timestamp: new Date(`${date}T00:00:00.000Z`).toISOString(), rate }]
      : [];
  });
}

export function parseDollarCandles(data: unknown): CryptoCandle[] {
  if (!Array.isArray(data)) return [];

  const quotes = data.filter(isDollarQuote).map((quote) => ({
    timestamp: normalizeTimestamp(Number(quote.timestamp)),
    high: Number(quote.high),
    low: Number(quote.low),
    close: Number(quote.bid),
  })).sort((a, b) => a.timestamp - b.timestamp);

  return quotes.map((quote, index) => {
    const open = index === 0 ? quote.close : quotes[index - 1].close;
    return {
      timestamp: new Date(quote.timestamp).toISOString(),
      open,
      high: Math.max(quote.high, open, quote.close),
      low: Math.min(quote.low, open, quote.close),
      close: quote.close,
      volume: 0,
    };
  });
}

function isDollarQuote(value: unknown): value is DollarQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<DollarQuote>;
  return [quote.high, quote.low, quote.bid, quote.timestamp].every(
    (field) => typeof field === "string" && Number.isFinite(Number(field))
  );
}

function normalizeTimestamp(timestamp: number) {
  return timestamp < 10_000_000_000 ? timestamp * 1_000 : timestamp;
}

function toDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
