import { Prisma } from "@prisma/client";

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

interface HistoryRow {
  timestamp: Date;
  priceUsd: string;
  marketCap: string | null;
  volume24h: string | null;
}

export async function findCryptoPriceHistory(params: {
  coinId: string;
  since: Date;
  bucketSeconds: number;
}) {
  const rows = await prisma.$queryRaw<HistoryRow[]>(Prisma.sql`
    SELECT
      to_timestamp(
        floor(extract(epoch FROM "createdAt") / ${params.bucketSeconds}) * ${params.bucketSeconds}
      ) AS "timestamp",
      AVG("priceUsd")::text AS "priceUsd",
      AVG("marketCap")::text AS "marketCap",
      AVG("volume24h")::text AS "volume24h"
    FROM "CryptoPriceHistory"
    WHERE "coinId" = ${params.coinId}
      AND "createdAt" >= ${params.since}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  return rows.map((row) => ({
    timestamp: row.timestamp,
    priceUsd: Number(row.priceUsd),
    marketCap: row.marketCap === null ? null : Number(row.marketCap),
    volume24h: row.volume24h === null ? null : Number(row.volume24h),
  }));
}

export async function cleanupCryptoPriceHistory(retentionDays: number) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  return prisma.cryptoPriceHistory.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
}
