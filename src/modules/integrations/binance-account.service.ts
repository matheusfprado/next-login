import { createHmac } from "node:crypto";

interface BinanceBalance { asset: string; free: string; locked: string }

export async function fetchBinanceBalances(apiKey: string, apiSecret: string) {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}&recvWindow=5000`;
  const signature = createHmac("sha256", apiSecret).update(query).digest("hex");
  const response = await fetch(`https://api.binance.com/api/v3/account?${query}&signature=${signature}`, {
    headers: { "X-MBX-APIKEY": apiKey },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Binance recusou a conexão (${response.status}).`);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("balances" in data) || !Array.isArray(data.balances)) return [];

  return data.balances.filter(isBalance).flatMap((balance) => {
    const amount = Number(balance.free) + Number(balance.locked);
    return Number.isFinite(amount) && amount > 0 ? [{ asset: balance.asset, amount }] : [];
  });
}

function isBalance(value: unknown): value is BinanceBalance {
  if (!value || typeof value !== "object") return false;
  const balance = value as Partial<BinanceBalance>;
  return typeof balance.asset === "string" && typeof balance.free === "string" && typeof balance.locked === "string";
}
