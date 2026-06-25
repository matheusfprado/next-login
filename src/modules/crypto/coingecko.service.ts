import { env } from "@/lib/env";
import type { CryptoMarket } from "@/src/modules/crypto/types";

export async function fetchTopCryptoMarkets(): Promise<CryptoMarket[]> {
  const url = new URL(env.coinGeckoMarketsUrl());

  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", "10");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "true");

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isCryptoMarket);
}

function isCryptoMarket(value: unknown): value is CryptoMarket {
  if (!value || typeof value !== "object") return false;

  const market = value as Partial<CryptoMarket>;

  return (
    typeof market.id === "string" &&
    typeof market.symbol === "string" &&
    typeof market.name === "string" &&
    typeof market.image === "string" &&
    typeof market.current_price === "number"
  );
}
