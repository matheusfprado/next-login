import { createHmac } from "node:crypto";

interface BinanceBalance { asset: string; free: string; locked: string }
interface BinanceError { code?: number; msg?: string }

const BINANCE_API_BASE = "https://api.binance.com";

export async function fetchBinanceBalances(apiKey: string, apiSecret: string) {
  const timestamp = await fetchBinanceTime();
  const query = `timestamp=${timestamp}&recvWindow=10000`;
  const signature = createHmac("sha256", apiSecret).update(query).digest("hex");
  const response = await fetchWithTimeout(`${BINANCE_API_BASE}/api/v3/account?${query}&signature=${signature}`, {
    headers: { "X-MBX-APIKEY": apiKey },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = isBinanceError(data) ? data.msg : null;
    throw new Error(message ? `Binance: ${message}` : `Binance recusou a conexão (${response.status}).`);
  }
  if (!data || typeof data !== "object" || !("balances" in data) || !Array.isArray(data.balances)) return [];

  return data.balances.filter(isBalance).flatMap((balance) => {
    const amount = Number(balance.free) + Number(balance.locked);
    return Number.isFinite(amount) && amount > 0 ? [{ asset: balance.asset, amount }] : [];
  });
}

async function fetchBinanceTime() {
  try {
    const response = await fetchWithTimeout(`${BINANCE_API_BASE}/api/v3/time`);
    const data: unknown = await response.json();
    if (response.ok && data && typeof data === "object" && "serverTime" in data && typeof data.serverTime === "number") {
      return data.serverTime;
    }
  } catch {
    // The signed request still has a generous receive window when this endpoint is unavailable.
  }
  return Date.now();
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isBalance(value: unknown): value is BinanceBalance {
  if (!value || typeof value !== "object") return false;
  const balance = value as Partial<BinanceBalance>;
  return typeof balance.asset === "string" && typeof balance.free === "string" && typeof balance.locked === "string";
}

function isBinanceError(value: unknown): value is BinanceError {
  return Boolean(value && typeof value === "object" && "msg" in value && typeof value.msg === "string");
}
