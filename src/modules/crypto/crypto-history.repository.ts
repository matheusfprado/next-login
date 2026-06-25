import { prisma } from "@/lib/prisma";
import type { CryptoMarket } from "@/src/modules/crypto/types";

export async function saveCryptoPriceHistory(markets: CryptoMarket[]) {
  if (markets.length === 0) return;

  await prisma.cryptoPriceHistory.createMany({
    data: markets.map((market) => ({
      coinId: market.id,
      coinName: market.name,
      symbol: market.symbol,
      priceUsd: market.current_price,
      marketCap: market.market_cap,
      volume24h: market.total_volume,
      change24h: market.price_change_percentage_24h,
    })),
  });
}
