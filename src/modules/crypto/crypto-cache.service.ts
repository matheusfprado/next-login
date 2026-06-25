import { getRedis } from "@/lib/redis";
import type { CryptoMarket } from "@/src/modules/crypto/types";

const MARKETS_CACHE_KEY = "crypto:markets:usd:top10";
const MARKET_PRICE_KEY_PREFIX = "crypto:price:usd:";
const MARKETS_TTL_SECONDS = 60;

export async function setCryptoMarketsCache(markets: CryptoMarket[]) {
  const redis = await getRedis();
  const pipeline = redis.multi();

  pipeline.set(MARKETS_CACHE_KEY, JSON.stringify(markets), {
    EX: MARKETS_TTL_SECONDS,
  });

  for (const market of markets) {
    pipeline.set(`${MARKET_PRICE_KEY_PREFIX}${market.id}`, String(market.current_price), {
      EX: MARKETS_TTL_SECONDS * 5,
    });
  }

  await pipeline.exec();
}

export async function getCryptoMarketsCache(): Promise<CryptoMarket[] | null> {
  const redis = await getRedis();
  const cached = await redis.get(MARKETS_CACHE_KEY);

  if (!cached) return null;

  return JSON.parse(cached) as CryptoMarket[];
}

export async function getCachedCoinPrice(coinId: string): Promise<number | null> {
  const redis = await getRedis();
  const cached = await redis.get(`${MARKET_PRICE_KEY_PREFIX}${coinId}`);

  if (!cached) return null;

  const price = Number(cached);
  return Number.isFinite(price) ? price : null;
}
