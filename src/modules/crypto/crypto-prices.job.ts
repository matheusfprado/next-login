import { fetchTopCryptoMarkets } from "@/src/modules/crypto/coingecko.service";
import { setCryptoMarketsCache } from "@/src/modules/crypto/crypto-cache.service";
import { saveCryptoPriceHistory } from "@/src/modules/crypto/crypto-history.repository";

export async function updateCryptoPrices() {
  const markets = await fetchTopCryptoMarkets();

  await setCryptoMarketsCache(markets);
  await saveCryptoPriceHistory(markets);

  return {
    count: markets.length,
  };
}
